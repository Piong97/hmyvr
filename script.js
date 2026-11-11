
"use strict";

/* ==========================================================
   HAJI MOHAMMAD YASSIN – VR
   Homepage JavaScript
   ========================================================== */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const TIMEZONE = "Asia/Kuala_Lumpur";
const PRAYER_ZONE = "JHR04";
const PRAYER_API = `https://api.waktusolat.app/v2/solat/${PRAYER_ZONE}`;

const model = $("#mosque-model");

/* ==========================================================
   1. NAVIGATION
   ========================================================== */

function initializeNavigation() {
  const toggle = $("#menu-toggle");
  const nav = $("#primary-nav");

  toggle?.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
}

/* ==========================================================
   2. PRAYER TIMES
   ========================================================== */

const PRAYERS = {
  fajr: ["fajr", "subuh"],
  dhuhr: ["dhuhr", "zohor", "zuhr"],
  asr: ["asr", "asar"],
  maghrib: ["maghrib"],
  isha: ["isha", "isyak", "isya"]
};

function malaysiaDate() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const get = (type) => parts.find(p => p.type === type).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function formatPrayerTime(value) {
  if (typeof value === "number") {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(new Date(value * (value > 1e12 ? 1 : 1000)));
  }

  if (typeof value === "string") {
    const match = value.match(/(\d{1,2}):(\d{2})/);
    if (match) return `${match[1].padStart(2, "0")}:${match[2]}`;
  }

  return "--:--";
}

function extractToday(payload, date) {
  const rows =
    payload.prayers ||
    payload.prayerTime ||
    payload.prayerTimes ||
    payload.data?.prayers ||
    payload.data?.prayerTime ||
    payload.data?.prayerTimes;

  if (!Array.isArray(rows)) {
    throw new Error("Unexpected prayer API response.");
  }

  const day = Number(date.slice(-2));

  const row = rows.find(item => {
    if (typeof item.date === "number") return item.date === day;
    if (typeof item.day === "number") return item.day === day;

    if (typeof item.date === "string") {
      return (
        item.date === date ||
        item.date.startsWith(`${String(day).padStart(2, "0")}-`) ||
        item.date.startsWith(`${String(day).padStart(2, "0")}/`)
      );
    }

    return false;
  });

  if (!row) throw new Error("Today's prayer times not found.");
  return row;
}

function highlightNextPrayer(times) {
  const cards = $$(".prayer-card");
  cards.forEach(card => card.classList.remove("next"));

  const now = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date());

  const next = times.findIndex(time => time > now);

  if (next >= 0) cards[next]?.classList.add("next");
}

async function loadPrayerTimes(force = false) {
  const status = $("#prayer-status");
  const date = malaysiaDate();
  const cacheKey = `hmy-prayers-${PRAYER_ZONE}-${date}`;

  const dateLabel = $("#date-label");
  if (dateLabel) {
    dateLabel.textContent = new Intl.DateTimeFormat("en-MY", {
      timeZone: TIMEZONE,
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(new Date());
  }

  if (status) status.textContent = "Fetching prayer times…";

  try {
    let row = null;

    if (!force) {
      try {
        row = JSON.parse(localStorage.getItem(cacheKey) || "null");
      } catch {
        // Storage may be unavailable.
      }
    }

    if (!row) {
      const response = await fetch(
        `${PRAYER_API}?year=${date.slice(0, 4)}&month=${Number(date.slice(5, 7))}`,
        { cache: "no-cache" }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      row = extractToday(await response.json(), date);

      try {
        localStorage.setItem(cacheKey, JSON.stringify(row));
      } catch {
        // Continue without caching.
      }
    }

    const times = Object.entries(PRAYERS).map(([id, aliases]) => {
      const value = aliases.map(key => row[key]).find(v => v != null);
      const time = formatPrayerTime(value);

      const element = $(`#time-${id}`);
      if (element) element.textContent = time;

      return time;
    });

    if (times.includes("--:--")) {
      throw new Error("Incomplete prayer timetable.");
    }

    highlightNextPrayer(times);

    if (status) {
      status.textContent =
        "Source: Waktu Solat API · Malaysia Time (MYT)";
    }
  } catch (error) {
    console.error("Prayer times:", error);

    Object.keys(PRAYERS).forEach(id => {
      const element = $(`#time-${id}`);
      if (element) element.textContent = "--:--";
    });

    if (status) {
      status.textContent =
        "Prayer times unavailable. Please refresh later.";
    }
  }
}

function initializePrayerTimes() {
  loadPrayerTimes();

  $("#refresh-prayers")?.addEventListener("click", () => {
    loadPrayerTimes(true);
  });

  let lastDate = malaysiaDate();

  setInterval(() => {
    const today = malaysiaDate();

    if (today !== lastDate) {
      lastDate = today;
      loadPrayerTimes();
    }
  }, 60000);
}

/* ==========================================================
   3. MODEL VIEWER
   ========================================================== */

function initializeModelViewer() {
  if (!model) {
    console.warn("Model viewer #mosque-model not found.");
    return;
  }

  model.addEventListener("load", () => {
    const error = $("#model-error");
    if (error) error.hidden = true;
  });

  model.addEventListener("error", () => {
    const error = $("#model-error");
    if (error) error.hidden = false;
  });

  $("#reset-camera")?.addEventListener("click", () => {
    model.cameraOrbit = "35deg 68deg auto";
    model.fieldOfView = "auto";
    model.jumpCameraToGoal();
  });
}

/* ==========================================================
   4. ANNOTATION CONTENT
   ========================================================== */

const ANNOTATIONS = {
  entrance: {
    title: "Main Entrance",
    description: "Information about the mosque's main entrance."
  },

  roof: {
    title: "Roof and Dome",
    description: "Information about the mosque's architectural design."
  },

  hall: {
    title: "Prayer Hall",
    description: "Information about the main prayer hall."
  },

  minaret: {
    title: "Minaret",
    description: "Information about the mosque's minaret."
  }
};

/* ==========================================================
   5. ANNOTATION PLACEMENT EDITOR
   ========================================================== */

function initializeAnnotations() {
  if (!model) return;

  const pickButton = $("#pick-hotspots");
  const toggleLabelsButton = $("#toggle-annotations");
  const detailPanel = $("#annotation-detail");

  let isPicking = false;
  let preview = null;
  let selectedHTML = "";
  let pointerStart = null;

  const originalControls = model.hasAttribute("camera-controls");
  const originalRotation = model.autoRotate;

  // Create an editor panel automatically.
  const editor = document.createElement("div");
  editor.id = "annotation-editor";
  editor.hidden = true;

  editor.style.cssText = `
    margin-top: 16px;
    padding: 20px;
    border: 1px solid #b99a65;
    border-radius: 14px;
    background: #14372f;
    color: #ffffff;
  `;

  editor.innerHTML = `
    <strong>Annotation Placement</strong>
    <p id="editor-message">
      Click a surface on the 3D mosque.
    </p>

    <label for="editor-position">Position</label>
    <input id="editor-position" readonly
      style="width:100%;padding:10px;margin:8px 0 12px">

    <label for="editor-normal">Normal</label>
    <input id="editor-normal" readonly
      style="width:100%;padding:10px;margin:8px 0 12px">

    <button type="button" id="editor-copy"
      style="padding:10px 18px;cursor:pointer">
      Copy Hotspot HTML
    </button>
  `;

  // Place the editor below the model controls.
  (pickButton?.parentElement || model).insertAdjacentElement(
    "afterend",
    editor
  );

  const positionInput = editor.querySelector("#editor-position");
  const normalInput = editor.querySelector("#editor-normal");
  const message = editor.querySelector("#editor-message");
  const copyButton = editor.querySelector("#editor-copy");

  function formatVector(vector, units = true) {
    return [vector.x, vector.y, vector.z]
      .map(value => `${value.toFixed(4)}${units ? "m" : ""}`)
      .join(" ");
  }

  function createPreview() {
    const button = document.createElement("button");

    button.type = "button";
    button.slot = "hotspot-preview";
    button.className = "preview-hotspot";
    button.textContent = "+";
    button.setAttribute("aria-label", "Annotation preview");

    button.style.cssText = `
      width: 34px;
      height: 34px;
      border: none;
      border-radius: 50%;
      background: #e6bc70;
      color: #12362c;
      font-size: 24px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 0 0 6px rgba(230,188,112,.2);
    `;

    model.appendChild(button);
    return button;
  }

  function setPicking(enabled) {
    isPicking = enabled;

    if (pickButton) {
      pickButton.textContent = enabled
        ? "✕ Exit Placement"
        : "⌖ Place labels";

      pickButton.setAttribute("aria-pressed", String(enabled));
    }

    editor.hidden = !enabled;
    model.style.cursor = enabled ? "crosshair" : "";

    if (enabled) {
      model.autoRotate = false;
      model.removeAttribute("camera-controls");
    } else {
      model.autoRotate = originalRotation;
      model.toggleAttribute("camera-controls", originalControls);

      pointerStart = null;

      preview?.remove();
      preview = null;
    }
  }

  pickButton?.addEventListener("click", () => {
    setPicking(!isPicking);
  });

  model.addEventListener("pointerdown", event => {
    if (!isPicking || event.button !== 0) return;

    pointerStart = {
      x: event.clientX,
      y: event.clientY
    };
  });

  model.addEventListener("pointerup", event => {
    if (!isPicking || !pointerStart) return;

    const distance = Math.hypot(
      event.clientX - pointerStart.x,
      event.clientY - pointerStart.y
    );

    pointerStart = null;
    if (distance > 6) return;

    if (!model.loaded) {
      message.textContent = "Wait for the model to load.";
      return;
    }

    if (typeof model.positionAndNormalFromPoint !== "function") {
      message.textContent = "Raycasting is unavailable.";
      console.error("model-viewer raycasting API missing.");
      return;
    }

    const rect = model.getBoundingClientRect();

    const hit = model.positionAndNormalFromPoint(
      event.clientX - rect.left,
      event.clientY - rect.top
    );

    if (!hit) {
      message.textContent = "No surface detected. Try another point.";
      return;
    }

    const position = formatVector(hit.position);
    const normal = formatVector(hit.normal, false);

    positionInput.value = position;
    normalInput.value = normal;

    if (!preview) preview = createPreview();

    preview.dataset.position = position;
    preview.dataset.normal = normal;

    selectedHTML = [
      '<button',
      '  class="hotspot"',
      '  slot="hotspot-custom"',
      `  data-position="${position}"`,
      `  data-normal="${normal}"`,
      '  data-annotation="custom"',
      '>',
      '  <span class="hotspot-pin">+</span>',
      '  <span class="hotspot-label">New annotation</span>',
      '</button>'
    ].join("\n");

    message.textContent =
      "Surface selected. Copy the HTML to save this annotation.";

    console.log("Annotation selected:", { position, normal });
  });

  copyButton.addEventListener("click", async () => {
    if (!selectedHTML) {
      message.textContent = "Select a surface first.";
      return;
    }

    try {
      await navigator.clipboard.writeText(selectedHTML);
      message.textContent = "Hotspot HTML copied!";
    } catch (error) {
      console.error("Clipboard error:", error);
      message.textContent =
        "Copy failed. Use localhost or HTTPS for clipboard access.";
    }
  });

  // Permanent annotation interaction.
  const hotspots = $$(".hotspot");

  hotspots.forEach(hotspot => {
    hotspot.addEventListener("click", event => {
      if (isPicking) return;

      event.stopPropagation();

      const data = ANNOTATIONS[hotspot.dataset.annotation];
      if (!data || !detailPanel) return;

      const title = $("#annotation-title");
      const description = $("#annotation-text");

      if (title) title.textContent = data.title;
      if (description) description.textContent = data.description;

      detailPanel.hidden = false;
      model.autoRotate = false;
    });
  });

  $("#close-annotation")?.addEventListener("click", () => {
    if (detailPanel) detailPanel.hidden = true;
    if (!isPicking) model.autoRotate = originalRotation;
  });

  toggleLabelsButton?.addEventListener("click", () => {
    const currentlyVisible =
      toggleLabelsButton.getAttribute("aria-pressed") === "true";

    hotspots.forEach(hotspot => {
      hotspot.hidden = currentlyVisible;
    });

    toggleLabelsButton.setAttribute(
      "aria-pressed",
      String(!currentlyVisible)
    );

    toggleLabelsButton.textContent = currentlyVisible
      ? "◎ Show labels"
      : "◎ Hide labels";

    if (currentlyVisible && detailPanel) {
      detailPanel.hidden = true;
    }
  });
}

/* ==========================================================
   6. MOSQUE PHOTO CAROUSEL
   ========================================================== */

function initializePhotoCarousel() {
  const carousel = $(".photo-carousel");
  const photos = $$(".mosque-photo");

  if (!carousel || !photos.length) return;

  let currentIndex = 0;

  function availablePhotos() {
    return photos.filter(photo =>
      photo.complete && photo.naturalWidth > 0
    );
  }

  function showPhoto(index) {
    const available = availablePhotos();

    photos.forEach(photo => photo.classList.remove("active"));

    if (!available.length) {
      carousel.classList.remove("has-photo");

      const count = $("#photo-count");
      if (count) count.textContent = "00 / 00";
      return;
    }

    currentIndex =
      ((index % available.length) + available.length) %
      available.length;

    available[currentIndex].classList.add("active");
    carousel.classList.add("has-photo");

    const count = $("#photo-count");
    if (count) {
      count.textContent =
        `${String(currentIndex + 1).padStart(2, "0")} / ` +
        `${String(available.length).padStart(2, "0")}`;
    }
  }

  photos.forEach(photo => {
    photo.addEventListener("load", () => showPhoto(currentIndex));
    photo.addEventListener("error", () => showPhoto(currentIndex));
  });

  $("#photo-prev")?.addEventListener("click", () => {
    showPhoto(currentIndex - 1);
  });

  $("#photo-next")?.addEventListener("click", () => {
    showPhoto(currentIndex + 1);
  });

  showPhoto(0);
}

/* ==========================================================
   7. INITIALIZATION
   ========================================================== */

function initializeApp() {
  initializeNavigation();
  initializePrayerTimes();
  initializeModelViewer();
  initializeAnnotations();
  initializePhotoCarousel();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
