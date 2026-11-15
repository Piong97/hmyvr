
'use strict';

// AR CAM — Haji Mohammad Yassin VR
// Marker AR is isolated in an iframe to protect the website UI.

const $ = selector => document.querySelector(selector);

const choices = $('#ar-choices');
const workspace = $('#ar-workspace');
const markerStage = $('#marker-stage');
const surfaceStage = $('#surface-stage');
const status = $('#ar-status');
const surfaceModel = $('#ar-model');

let markerFrame = null;
let currentMode = null;

// ===== Header and footer =====

$('#year').textContent = new Date().getFullYear();

$('#menu-toggle').addEventListener('click', () => {
    const open = $('#primary-nav').classList.toggle('open');
    $('#menu-toggle').setAttribute('aria-expanded', String(open));
});

// ===== Marker AR document =====
// A-Frame and AR.js run inside this iframe, not the main page.

function markerDocument() {
    const modelURL = new URL('models/mosque.glb', location.href).href;

    return `<!doctype html>
<html lang="en">
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">

<style>
html, body {
    margin: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #102720;
}

a-scene {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
}

canvas, .a-canvas {
    max-width: none !important;
}

#arjs-video {
    position: absolute !important;
    z-index: 0 !important;
}

#notice {
    position: absolute;
    top: 12px;
    left: 12px;
    right: 12px;
    z-index: 20;
    padding: 9px 12px;
    border-radius: 8px;
    background: rgba(8,32,29,.8);
    color: white;
    font: 12px Arial, sans-serif;
    pointer-events: none;
}
</style>

<script src="https://aframe.io/releases/1.6.0/aframe.min.js"></script>
<script src="https://raw.githack.com/AR-js-org/AR.js/3.4.7/aframe/build/aframe-ar.js"></script>
</head>

<body>

<div id="notice">
    Allow camera access, then point at the Hiro marker.
</div>

<a-scene
    embedded
    vr-mode-ui="enabled:false"
    renderer="antialias:true;alpha:true"
    arjs="sourceType:webcam;debugUIEnabled:false;trackingMethod:best;">

    <a-marker id="hiro" preset="hiro" emitevents="true">

        <!-- Test cube to verify marker tracking -->
        <a-box
            id="test-cube"
            position="0 0.22 0"
            width="0.22"
            height="0.22"
            depth="0.22"
            color="#e1bd78">
        </a-box>

        <!-- Mosque model -->
        <a-entity
            id="mosque"
            gltf-model="url(${modelURL})">
        </a-entity>

    </a-marker>

    <a-entity camera></a-entity>

</a-scene>

<script>
const notify = (type, message) => {
    parent.postMessage(
        { source: 'hmy-marker-ar', type, message },
        location.origin
    );
};

const marker = document.getElementById('hiro');
const model = document.getElementById('mosque');
const notice = document.getElementById('notice');

marker.addEventListener('markerFound', () => {
    notice.textContent = 'Hiro marker detected';
    notify('tracking', 'Marker detected. Look for the gold cube and mosque.');
});

marker.addEventListener('markerLost', () => {
    notice.textContent = 'Point the camera at the Hiro marker';
    notify('tracking', 'Marker lost. Keep the entire marker visible.');
});

model.addEventListener('model-loaded', () => {
    const mesh = model.getObject3D('mesh');
    if (!mesh) return;

    const THREE = AFRAME.THREE;
    const bounds = new THREE.Box3().setFromObject(mesh);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());

    const maxSize = Math.max(size.x, size.y, size.z);

    if (!Number.isFinite(maxSize) || maxSize <= 0) return;

    // Fit the mosque to approximately 85% of marker width.
    const scale = 0.85 / maxSize;

    model.object3D.scale.setScalar(scale);

    // Center horizontally and place the bottom at marker level.
    model.object3D.position.set(
        -center.x * scale,
        -bounds.min.y * scale,
        -center.z * scale
    );

    document.getElementById('test-cube')
        .setAttribute('visible', false);

    notify('loaded', 'Mosque model loaded. Point at the Hiro marker.');
});

model.addEventListener('model-error', () => {
    notify(
        'error',
        'Mosque GLB failed to load. The gold cube can still test marker detection.'
    );
});

document.querySelector('a-scene').addEventListener('loaded', () => {
    notify(
        'ready',
        'AR scene ready. Allow camera access and point at the Hiro marker.'
    );
});

window.addEventListener('error', event => {
    notify('error', event.message);
});
</script>

</body>
</html>`;
}

// ===== Start and stop Marker AR =====

function stopMarker() {
    if (!markerFrame) return;

    markerFrame.remove();
    markerFrame = null;
    markerStage.replaceChildren();
}

function startMarker() {
    stopMarker();

    markerFrame = document.createElement('iframe');
    markerFrame.className = 'ar-marker-frame';
    markerFrame.title = 'Hiro marker AR camera';

    markerFrame.setAttribute('allow', 'camera; autoplay');
    markerFrame.setAttribute('allowfullscreen', '');

    markerFrame.srcdoc = markerDocument();
    markerStage.appendChild(markerFrame);

    status.textContent =
        'Starting camera… Please allow camera access.';
}

// Receive tracking messages from the iframe.

window.addEventListener('message', event => {
    if (!markerFrame) return;

    if (event.source !== markerFrame.contentWindow) return;
    if (event.origin !== location.origin) return;
    if (event.data?.source !== 'hmy-marker-ar') return;

    status.textContent = event.data.message;
});

// ===== Surface AR camera framing =====

function setSurfaceCamera() {
    if (!surfaceModel?.getDimensions) return;

    const dimensions = surfaceModel.getDimensions();

    const maxSize = Math.max(
        dimensions.x,
        dimensions.y,
        dimensions.z
    );

    if (!Number.isFinite(maxSize) || maxSize <= 0) return;

    // Smaller distance = larger 3D preview.
    surfaceModel.cameraOrbit =
        `35deg 68deg ${maxSize * 1.05}m`;

    surfaceModel.jumpCameraToGoal();
}

surfaceModel?.addEventListener('load', setSurfaceCamera);

surfaceModel?.addEventListener('error', () => {
    if (currentMode === 'surface') {
        status.textContent = 'Cannot load models/mosque.glb.';
    }
});

// ===== AR mode selection =====

function selectMode(mode) {
    if (mode !== 'marker' && mode !== 'surface') return;

    currentMode = mode;
    stopMarker();

    choices.hidden = true;
    workspace.hidden = false;

    markerStage.hidden = mode !== 'marker';
    surfaceStage.hidden = mode !== 'surface';

    $('#ar-mode-title').textContent = mode === 'marker'
        ? 'Marker AR · AR.js + A-Frame'
        : 'Surface AR · model-viewer';

    if (mode === 'marker') {
        startMarker();
    } else {
        status.textContent =
            'Rotate the 3D preview or tap View Mosque in AR on a supported phone.';

        if (surfaceModel?.loaded) {
            setSurfaceCamera();
        }
    }

    workspace.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// ===== Mode buttons =====

document.querySelectorAll('[data-mode]').forEach(button => {
    button.addEventListener('click', () => {
        selectMode(button.dataset.mode);
    });
});

// ===== Return to selection =====

$('#ar-back').addEventListener('click', () => {
    currentMode = null;
    stopMarker();

    markerStage.hidden = true;
    surfaceStage.hidden = true;

    workspace.hidden = true;
    choices.hidden = false;

    choices.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
});

// ===== Cleanup =====

window.addEventListener('pagehide', stopMarker);
