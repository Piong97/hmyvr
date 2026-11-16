'use strict';
const ZONE = 'JHR04'; // Muar / Pagoh, Johor
const API_URL = `https://api.waktusolat.app/v2/solat/${ZONE}`;
const TIMEZONE = 'Asia/Kuala_Lumpur';
const prayers = [ ['fajr','fajr'], ['dhuhr','dhuhr'], ['asr','asr'], ['maghrib','maghrib'], ['isha','isha'] ];
const $ = (selector) => document.querySelector(selector);
const todayMY = () => new Intl.DateTimeFormat('en-CA',{timeZone:TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const formatDate = () => new Intl.DateTimeFormat('en-MY',{timeZone:TIMEZONE,weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());
const formatTime = (value) => {
  if (typeof value === 'number') return new Intl.DateTimeFormat('en-GB',{timeZone:TIMEZONE,hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value * (value > 1e12 ? 1 : 1000)));
  if (typeof value === 'string') { const match = value.match(/\b(\d{1,2}):(\d{2})\b/); if(match) return `${match[1].padStart(2,'0')}:${match[2]}`; }
  return '--:--';
};
function extractToday(payload, isoDate){
  const rows = payload.prayers || payload.prayerTime || payload.prayerTimes || payload.data?.prayers || payload.data?.prayerTime || payload.data?.prayerTimes;
  if(!Array.isArray(rows)) throw new Error('Unexpected API response');
  const day = Number(isoDate.slice(-2));
  const match = rows.find(row => {
    if (typeof row.date === 'number') return row.date === day;
    if (typeof row.day === 'number') return row.day === day;
    if (typeof row.date === 'string') {
      const d = row.date;
      return d === isoDate || d.startsWith(`${isoDate.slice(0,4)}-${isoDate.slice(5,7)}-${isoDate.slice(8)}`) || d.startsWith(`${String(day).padStart(2,'0')}-`) || d.startsWith(`${String(day).padStart(2,'0')}/`);
    }
    return false;
  });
  if (!match) throw new Error('No timetable entry for today');
  return match;
}
function highlightNext(times){
  document.querySelectorAll('.prayer-card').forEach(card=>card.classList.remove('next'));
  const now = new Intl.DateTimeFormat('en-GB',{timeZone:TIMEZONE,hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());
  const nextIndex = times.findIndex(time => time !== '--:--' && time > now);
  if(nextIndex >= 0) document.querySelectorAll('.prayer-card')[nextIndex]?.classList.add('next');
}
async function loadPrayers(force=false){
  const status = $('#prayer-status'); const date = todayMY(); $('#date-label').textContent = formatDate();
  const cacheKey = `hmy-prayers-${ZONE}-${date}`;
  status.textContent = 'Fetching prayer times…';
  try {
    let row;
    if (!force) { try { row = JSON.parse(localStorage.getItem(cacheKey) || 'null'); } catch {} }
    if (!row) {
      const response = await fetch(`${API_URL}?year=${date.slice(0,4)}&month=${Number(date.slice(5,7))}`,{headers:{Accept:'application/json'},cache:'no-cache'});
      if(!response.ok) throw new Error(`API returned ${response.status}`);
      row = extractToday(await response.json(),date);
      try { localStorage.setItem(cacheKey,JSON.stringify(row)); } catch {}
    }
    const times = prayers.map(([id,key]) => {
      const aliases = {fajr:['fajr','subuh'],dhuhr:['dhuhr','zohor','zuhr'],asr:['asr','asar'],maghrib:['maghrib'],isha:['isha','isyak','isya']};
      const value = aliases[key].map(k=>row[k]).find(v=>v!=null);
      const formatted = formatTime(value);
      $(`#time-${id}`).textContent = formatted;
      return formatted;
    });
    if(times.some(time=>time==='--:--')) throw new Error('Incomplete prayer times');
    highlightNext(times);
    status.textContent = 'Source: JAKIM prayer timetable via Waktu Solat API · Malaysia Time (MYT)';
  } catch(error){
    prayers.forEach(([id]) => { $(`#time-${id}`).textContent = '--:--'; });
    status.textContent = 'Prayer times unavailable. Please try Refresh times later.';
    console.warn('Prayer times:',error);
  }
}
$('#refresh-prayers').addEventListener('click',()=>loadPrayers(true));
$('#year').textContent = new Date().getFullYear();
$('#menu-toggle').addEventListener('click',()=>{const nav=$('#primary-nav');const open=nav.classList.toggle('open');$('#menu-toggle').setAttribute('aria-expanded',String(open));});
const model=$('#mosque-model');
model.addEventListener('error',()=>{ $('#model-error').hidden=false; });
model.addEventListener('load',()=>{ $('#model-error').hidden=true; });

/* ==========================================================
   3D VIEWER CONTROLS
   Larger model, pause/play rotation, and fullscreen
   ========================================================== */

const viewerPanel = document.querySelector('.viewer-panel');
const rotationButton = document.querySelector('#toggle-rotation');
const fullscreenButton = document.querySelector('#toggle-fullscreen');

// Lower value = larger model.
// 0.82 makes the model approximately 22% closer.
const CAMERA_ZOOM_FACTOR = 0.82;

function setDefaultCamera() {
  model.cameraOrbit = '35deg 68deg auto';
  model.fieldOfView = 'auto';

  // Calculate the default distance based on the model's size.
  const dimensions = model.getDimensions();
  const maxDimension = Math.max(
    dimensions.x,
    dimensions.y,
    dimensions.z
  );

  // Set a closer camera distance.
  model.cameraOrbit =
    `35deg 68deg ${maxDimension * 1.5 * CAMERA_ZOOM_FACTOR}m`;

  model.jumpCameraToGoal();
}

model.addEventListener('load', setDefaultCamera);

document.querySelector('#reset-camera')
  .addEventListener('click', setDefaultCamera);


/* ==========================================
   ROTATION CONTROL
   ========================================== */

// User's original play/pause preference
let userWantsRotation = true;

// Whether an annotation is currently open
let annotationOpen = false;

function syncRotationState() {

  // Actual rotation:
  // Only rotate if user wants Play
  // AND no annotation is open.
  model.autoRotate = userWantsRotation && !annotationOpen;

  // Button always displays user's preference.
  if (rotationButton) {
    rotationButton.textContent = userWantsRotation
      ? '⏸ Pause rotation'
      : '▶ Play rotation';

    rotationButton.setAttribute(
      'aria-pressed',
      String(!userWantsRotation)
    );
  }
}

// Normal Play / Pause button
rotationButton?.addEventListener('click', () => {
  userWantsRotation = !userWantsRotation;
  syncRotationState();
});

// Set initial rotation
syncRotationState();


// Fullscreen viewer panel.
function updateFullscreenButton() {
  if (!fullscreenButton) return;

  const isFullscreen = document.fullscreenElement === viewerPanel;

  fullscreenButton.textContent = isFullscreen
    ? '⤢ Exit fullscreen'
    : '⛶ Fullscreen';

  fullscreenButton.setAttribute(
    'aria-pressed',
    String(isFullscreen)
  );
}

fullscreenButton?.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement === viewerPanel) {
      await document.exitFullscreen();
    } else {
      await viewerPanel.requestFullscreen();
    }
  } catch (error) {
    console.warn('Fullscreen unavailable:', error);
  }
});

document.addEventListener(
  'fullscreenchange',
  updateFullscreenButton
);

loadPrayers();
// Refresh when Malaysia's calendar day changes, even if the page stays open.
setInterval(()=>{if(todayMY() !== (window.__lastPrayerDay || (window.__lastPrayerDay=todayMY()))){window.__lastPrayerDay=todayMY();loadPrayers();}},60000);


/* ==========================================================
   MOSQUE ANNOTATIONS
   Static hotspots with clickable descriptions
   ========================================================== */


const ANNOTATIONS = {
  dome: {
    title: "Dome",
    description:
      "The dome is a prominent architectural feature of the mosque, contributing to its distinctive silhouette. Observe its shape, proportions, and how it complements the overall structure of Haji Mohammad Yassin Mosque.",
    image: "assets/annotation/1.png",
    color: "#D4AF37" // Heritage Gold
  },

  entrance: {
    title: "Main Entrance",
    description:
      "The main entrance serves as a welcoming transition into the mosque. Explore its architectural arrangement, decorative details, and the way it connects the exterior surroundings with the interior spaces.",
    image: "assets/annotation/2.png",
    color: "#3B82F6" // Royal Blue
  },

  calligraphy: {
    title: "Calligraphy and Wall Panels",
    description:
      "Islamic calligraphy combines artistic expression with spiritual meaning. Explore the mosque's decorative wall panels, paying attention to the lettering, composition, and ornamental elements that enrich its interior.",
    image: "assets/annotation/3.png",
    color: "#A855F7" // Amethyst Purple
  },

  geometry: {
    title: "Geometric Patterns",
    description:
      "Geometric patterns are an important element of Islamic architectural design. Discover how repeating shapes, symmetry, and carefully arranged lines create visual harmony throughout the mosque's decorative features.",
    image: "assets/annotation/4.png",
    color: "#10B981" // Emerald Green
  },

  tiles: {
    title: "Tiles and Colours",
    description:
      "Tiles and colour combinations contribute to the mosque's visual character. Take a closer look at the decorative surfaces, contrasting tones, and patterns that add texture and detail to its architectural design.",
    image: "assets/annotation/5.png",
    color: "#E8794A" // Terracotta Orange
  }
};


function initializeAnnotations() {
  const panel = document.querySelector('#annotation-detail');
  const title = document.querySelector('#annotation-title');
  const description = document.querySelector('#annotation-text');
  const annotationImage = document.querySelector('#annotation-image');
  const closeButton = document.querySelector('#close-annotation');

  if (!model || !panel) return;

  const hotspots = model.querySelectorAll('.hotspot');

  hotspots.forEach(hotspot => {
    hotspot.hidden = false;

    const key = hotspot.dataset.annotation;
    const annotationData = ANNOTATIONS[key];

    if (annotationData?.color) {
      hotspot.style.setProperty(
        '--annotation-color',
        annotationData.color
      );
    }


    hotspot.addEventListener('click', event => {
      event.stopPropagation();

      const key = hotspot.dataset.annotation;
      const annotation = ANNOTATIONS[key];

      if (!annotation) {
        console.warn('Annotation not found:', key);
        return;
      }

      panel.style.setProperty(
        '--annotation-color',
        annotation.color
      );

      // Update title and description
      if (title) {
        title.textContent = annotation.title;
      }

      if (description) {
        description.textContent = annotation.description;
      }

      // Update image
      if (annotationImage) {
        annotationImage.hidden = !annotation.image;
        annotationImage.removeAttribute('src');

        if (annotation.image) {
          annotationImage.src = annotation.image;
          annotationImage.alt = annotation.title;
        }
      }

      // Open annotation
      panel.hidden = false;

      // Pause rotation while reading
      annotationOpen = true;
      syncRotationState();
    });
  });

  // Close annotation
  closeButton?.addEventListener('click', () => {
    panel.hidden = true;

    annotationOpen = false;
    syncRotationState();
  });
}

initializeAnnotations();


initializeAnnotations();


const toggleHotspotsBtn = document.querySelector("#toggle-hotspots");
const hotspots = document.querySelectorAll("#mosque-model .hotspot");

let hotspotsVisible = true;

toggleHotspotsBtn?.addEventListener("click", () => {
  hotspotsVisible = !hotspotsVisible;

  hotspots.forEach(hotspot => {
    hotspot.hidden = !hotspotsVisible;
  });

  document.querySelector("#hotspots-text").textContent =
    hotspotsVisible ? "Hide Hotspots" : "Show Hotspots";

  document.querySelector("#hotspots-icon").textContent =
    hotspotsVisible ? "◉" : "◎";

  toggleHotspotsBtn.setAttribute(
    "aria-pressed",
    String(hotspotsVisible)
  );
});



// ============================================================
// About section photo carousel
// Missing images are skipped. Add assets/mosque-1.jpg, etc.
// ============================================================
const photoCarousel = document.querySelector('.photo-carousel');
const photos = [...document.querySelectorAll('.mosque-photo')];
let photoIndex = 0;

function availablePhotos() {
  return photos.filter((photo) => photo.complete && photo.naturalWidth > 0);
}

function showPhoto(index) {
  const validPhotos = availablePhotos();
  photos.forEach((photo) => photo.classList.remove('active'));

  if (!validPhotos.length) {
    photoCarousel.classList.remove('has-photo');
    document.querySelector('#photo-count').textContent = '00 / 00';
    return;
  }

  photoIndex = (index + validPhotos.length) % validPhotos.length;
  validPhotos[photoIndex].classList.add('active');
  photoCarousel.classList.add('has-photo');
  document.querySelector('#photo-count').textContent =
    `${String(photoIndex + 1).padStart(2, '0')} / ${String(validPhotos.length).padStart(2, '0')}`;
}

photos.forEach((photo) => {
  photo.addEventListener('load', () => showPhoto(photoIndex));
  photo.addEventListener('error', () => showPhoto(photoIndex));
});

document.querySelector('#photo-prev').addEventListener('click', () => showPhoto(photoIndex - 1));
document.querySelector('#photo-next').addEventListener('click', () => showPhoto(photoIndex + 1));
showPhoto(0);
