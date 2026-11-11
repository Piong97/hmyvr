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
$('#reset-camera').addEventListener('click',()=>{ model.cameraOrbit='35deg 68deg auto';model.fieldOfView='auto';model.jumpCameraToGoal(); });
loadPrayers();
// Refresh when Malaysia's calendar day changes, even if the page stays open.
setInterval(()=>{if(todayMY() !== (window.__lastPrayerDay || (window.__lastPrayerDay=todayMY()))){window.__lastPrayerDay=todayMY();loadPrayers();}},60000);

// // ============================================================
// // Model annotations
// // Hotspots are intentionally hidden until placed on your GLB.
// // Use the 'Place labels' button to pick actual points in developer mode.
// // ============================================================
// const ANNOTATIONS = {
//   entrance: {
//     title: 'Main entrance',
//     description: 'Replace this with verified information about the mosque entrance.'
//   },
//   roof: {
//     title: 'Roof details',
//     description: 'Describe the roof structure and its architectural features here.'
//   },
//   hall: {
//     title: 'Prayer hall',
//     description: 'Add information about the prayer hall and its layout here.'
//   }
// };

// const annotationPanel = document.querySelector('#annotation-detail');
// const hotspotButtons = [...document.querySelectorAll('.hotspot')];

// // Developer tool: pick a visible surface to obtain accurate model-space coordinates.
// // Click 'Place labels', then click the mosque. Copy the logged position and normal
// // into the matching hotspot in index.html, then remove its `hidden` attribute.
// let isPickingHotspot = false;
// const pickButton = document.querySelector('#pick-hotspots');

// pickButton.addEventListener('click', () => {
//   isPickingHotspot = !isPickingHotspot;
//   pickButton.setAttribute('aria-pressed', String(isPickingHotspot));
//   pickButton.textContent = isPickingHotspot ? '✓ Picking (click model)' : '⌖ Place labels';
//   model.autoRotate = !isPickingHotspot;
// });

// model.addEventListener('click', (event) => {
//   if (!isPickingHotspot || event.target.closest?.('.hotspot')) return;
//   const bounds = model.getBoundingClientRect();
//   const point = model.positionAndNormalFromPoint(
//     event.clientX - bounds.left,
//     event.clientY - bounds.top
//   );
//   if (!point) return;

//   const toMeters = (n) => `${n.toFixed(3)}m`;
//   const position = [point.position.x, point.position.y, point.position.z]
//     .map(toMeters).join(' ');
//   const normal = [point.normal.x, point.normal.y, point.normal.z]
//     .map(toMeters).join(' ');
//   console.info('Hotspot coordinates:', { position, normal });
//   window.alert(`Copy into your hotspot in index.html:\ndata-position=\"${position}\"\ndata-normal=\"${normal}\"`);
// });

// hotspotButtons.forEach((button) => {
//   button.addEventListener('click', () => {
//     const annotation = ANNOTATIONS[button.dataset.annotation];
//     if (!annotation) return;

//     document.querySelector('#annotation-title').textContent = annotation.title;
//     document.querySelector('#annotation-text').textContent = annotation.description;
//     annotationPanel.hidden = false;
//     model.autoRotate = false; // Keep the selected point in view.
//   });
// });

// document.querySelector('#close-annotation').addEventListener('click', () => {
//   annotationPanel.hidden = true;
//   model.autoRotate = true;
// });

// document.querySelector('#toggle-annotations').addEventListener('click', (event) => {
//   const button = event.currentTarget;
//   const showing = button.getAttribute('aria-pressed') === 'true';
//   hotspotButtons.forEach((hotspot) => { hotspot.hidden = showing; });
//   button.setAttribute('aria-pressed', String(!showing));
//   button.textContent = showing ? '◎ Show labels' : '◎ Hide labels';
//   if (showing) annotationPanel.hidden = true;
// });


/* =========================================================
   MODEL-VIEWER ANNOTATION PLACEMENT TOOL
   ========================================================= */

function initializeAnnotationPlacement() {
  const model = document.querySelector("#mosqueModel");
  const toggleButton = document.querySelector("#togglePlacement");
  const output = document.querySelector("#placementOutput");
  const positionInput = document.querySelector("#annotationPosition");
  const normalInput = document.querySelector("#annotationNormal");
  const copyButton = document.querySelector("#copyAnnotation");

  if (!model || !toggleButton || !output) {
    console.warn("Annotation placement elements not found.");
    return;
  }

  let isPlacementMode = false;
  let latestAnnotationHTML = "";
  let previewHotspot = null;

  // Convert a model-viewer Vector3 into a hotspot string.
  function formatVector(vector) {
    return `${vector.x.toFixed(4)}m ${vector.y.toFixed(4)}m ${vector.z.toFixed(4)}m`;
  }

  // Create a temporary hotspot inside model-viewer.
  function createPreviewHotspot() {
    const hotspot = document.createElement("button");

    hotspot.type = "button";
    hotspot.slot = "hotspot-preview";
    hotspot.className = "hotspot preview-hotspot";
    hotspot.setAttribute("aria-label", "Annotation preview");

    hotspot.innerHTML = `
      <span class="hotspot-pin">+</span>
      <span class="hotspot-label">New annotation</span>
    `;

    model.appendChild(hotspot);
    return hotspot;
  }

  // Enable or disable annotation placement.
  function setPlacementMode(enabled) {
    isPlacementMode = enabled;

    toggleButton.classList.toggle("active", enabled);
    toggleButton.setAttribute("aria-pressed", String(enabled));
    toggleButton.textContent = enabled
      ? "✕ Exit Placement"
      : "📍 Place Labels";

    model.classList.toggle("placement-mode", enabled);

    // Stop model rotation while selecting geometry.
    if (enabled) {
      model.autoRotate = false;
      model.removeAttribute("camera-controls");
      output.hidden = false;
    } else {
      model.autoRotate = true;
      model.setAttribute("camera-controls", "");
      output.hidden = true;

      if (previewHotspot) {
        previewHotspot.remove();
        previewHotspot = null;
      }
    }
  }

  toggleButton.addEventListener("click", () => {
    setPlacementMode(!isPlacementMode);
  });

  // Raycast against the GLB when the user clicks.
  model.addEventListener("click", (event) => {
    if (!isPlacementMode) return;

    // Ignore clicks on existing hotspots.
    if (event.target.closest?.("[slot^='hotspot-']")) {
      return;
    }

    if (!model.loaded) {
      console.warn("The 3D model has not finished loading.");
      return;
    }

    const rect = model.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const hit = model.positionAndNormalFromPoint(x, y);

    if (!hit) {
      console.info("No mesh was detected at this position.");
      return;
    }

    const position = formatVector(hit.position);
    const normal = formatVector(hit.normal);

    positionInput.value = position;
    normalInput.value = normal;

    if (!previewHotspot) {
      previewHotspot = createPreviewHotspot();
    }

    previewHotspot.dataset.position = position;
    previewHotspot.dataset.normal = normal;

    latestAnnotationHTML = `
<button
  class="hotspot"
  slot="hotspot-custom"
  data-position="${position}"
  data-normal="${normal}"
  data-annotation="custom"
>
  <span class="hotspot-pin">+</span>
  <span class="hotspot-label">New annotation</span>
</button>`.trim();

    console.log("Annotation position:", position);
    console.log("Annotation normal:", normal);
  });

  // Copy generated hotspot HTML.
  copyButton.addEventListener("click", async () => {
    if (!latestAnnotationHTML) {
      alert("Click a part of the mosque first.");
      return;
    }

    try {
      await navigator.clipboard.writeText(latestAnnotationHTML);

      const previousText = copyButton.textContent;
      copyButton.textContent = "✓ Copied!";

      setTimeout(() => {
        copyButton.textContent = previousText;
      }, 1500);
    } catch (error) {
      console.error("Clipboard failed:", error);
      alert("Unable to copy. Check clipboard permissions.");
    }
  });
}

// Initialize once the HTML document is ready.
if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeAnnotationPlacement
  );
} else {
  initializeAnnotationPlacement();
}



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
