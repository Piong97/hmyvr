
'use strict';

const $ = selector => document.querySelector(selector);

const choices = $('#ar-choices');
const workspace = $('#ar-workspace');
const markerStage = $('#marker-stage');
const surfaceStage = $('#surface-stage');
const status = $('#ar-status');
const surfaceModel = $('#ar-model');

let markerFrame = null;
let currentMode = null;
let launchId = 0;

// ===== Header =====

$('#year').textContent = new Date().getFullYear();

$('#menu-toggle').addEventListener('click', () => {
    const nav = $('#primary-nav');
    const open = nav.classList.toggle('open');

    $('#menu-toggle').setAttribute(
        'aria-expanded',
        String(open)
    );
});

// ===== Isolated AR.js document =====

function markerDocument() {
    const modelURL = new URL(
        'models/mosque.glb',
        location.href
    ).href;

    return `<!doctype html>
<html lang="en">
<head>
<meta name="viewport"
      content="width=device-width,initial-scale=1">

<style>
* { box-sizing: border-box; }

html, body {
    margin: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #102720;
}

a-scene,
.a-canvas {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
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
    z-index: 30;
    padding: 10px 12px;
    border-radius: 9px;
    background: rgba(8, 32, 29, .85);
    color: white;
    font: 13px Arial, sans-serif;
    text-align: center;
    pointer-events: none;
}
</style>

<script src="https://aframe.io/releases/1.6.0/aframe.min.js"></script>
<script src="https://raw.githack.com/AR-js-org/AR.js/3.4.7/aframe/build/aframe-ar.js"></script>
</head>

<body>
<div id="notice">Starting AR camera…</div>

<a-scene
    embedded
    vr-mode-ui="enabled: false"
    renderer="antialias: true; alpha: true"
    arjs="sourceType: webcam; debugUIEnabled: false;">

    <a-marker
        id="hiro"
        preset="hiro"
        emitevents="true">

        <!-- Diagnostic cube: remains visible -->
        <a-box
            position="0.48 0.10 0.35"
            width="0.15"
            height="0.20"
            depth="0.15"
            color="#e1bd78">
        </a-box>

        <a-entity
            id="mosque"
            gltf-model="url(${modelURL})">
        </a-entity>

    </a-marker>

    <a-entity camera></a-entity>
</a-scene>

<script>
const notice = document.getElementById('notice');
const marker = document.getElementById('hiro');
const model = document.getElementById('mosque');

function notify(type, message) {
    notice.textContent = message;

    parent.postMessage({
        source: 'hmy-marker-ar',
        type,
        message
    }, location.origin);
}

// Suppress AR.js's default webcam error popup.
// Report errors through the website status instead.
window.alert = message => {
    notify('error', String(message));
};

marker.addEventListener('markerFound', () => {
    notify(
        'tracking',
        'Marker detected! Look for the gold cube and mosque.'
    );
});

marker.addEventListener('markerLost', () => {
    notify(
        'tracking',
        'Marker lost. Point at the full Hiro marker.'
    );
});

model.addEventListener('model-loaded', () => {
    const mesh = model.getObject3D('mesh');

    if (!mesh) {
        notify('error', 'Model loaded without a visible mesh.');
        return;
    }

    const THREE = AFRAME.THREE;

    // Calculate bounds without the moving marker's world transform.
    const isolatedMesh = mesh.clone(true);
    isolatedMesh.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(isolatedMesh);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const largest = Math.max(size.x, size.y, size.z);

    if (!Number.isFinite(largest) || largest <= 0) {
        notify('error', 'Invalid model dimensions.');
        return;
    }

    // Fit the whole mosque within the marker.
    const scale = 1.1 / largest;

    // Use A-Frame attributes so transforms remain consistent.
    model.setAttribute(
        'scale',
        scale + ' ' + scale + ' ' + scale
    );

    model.setAttribute(
        'position',
        (-center.x * scale) + ' ' +
        (-box.min.y * scale) + ' ' +
        (-center.z * scale)
    );

    model.setAttribute('visible', true);

    notify(
        'model',
        'Mosque loaded successfully. Point at the Hiro marker.'
    );
});

model.addEventListener('model-error', event => {
    console.error('GLB loading error:', event.detail);

    notify(
        'error',
        'Mosque GLB failed to load. Check the browser console.'
    );
});

document.querySelector('a-scene')
    .addEventListener('loaded', () => {
        notify(
            'ready',
            'AR ready. Point your camera at the Hiro marker.'
        );
    });

window.addEventListener('error', event => {
    notify('error', event.message);
});
</script>

</body>
</html>`;
}

// ===== Camera permission and cleanup =====

function stopMarker() {
    launchId++;

    if (markerFrame) {
        markerFrame.remove();
        markerFrame = null;
    }

    markerStage.replaceChildren();
}

async function startMarker() {
    stopMarker();

    const thisLaunch = launchId;

    status.textContent = 'Checking camera permission…';

    // Check permission before AR.js starts.
    // This prevents the default AR.js webcam error from
    // being shown when permission is denied.
    if (!navigator.mediaDevices?.getUserMedia) {
        status.textContent =
            'Camera unavailable. Use HTTPS or localhost.';
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                facingMode: { ideal: 'environment' }
            }
        });

        // Release the test stream before AR.js opens the camera.
        stream.getTracks().forEach(track => track.stop());

    } catch (error) {
        if (thisLaunch !== launchId) return;

        console.warn('Camera permission:', error);

        status.textContent =
            error.name === 'NotAllowedError'
                ? 'Camera permission denied. Enable camera access in your browser settings.'
                : 'Unable to open camera: ' + error.message;

        return;
    }

    if (
        thisLaunch !== launchId ||
        currentMode !== 'marker'
    ) return;

    markerFrame = document.createElement('iframe');

    markerFrame.className = 'ar-marker-frame';
    markerFrame.title = 'Marker AR camera';
    markerFrame.setAttribute('allow', 'camera; autoplay');

    markerFrame.srcdoc = markerDocument();

    markerStage.appendChild(markerFrame);

    status.textContent =
        'Camera allowed. Loading AR.js and the mosque model…';
}

// ===== Receive messages from AR iframe =====

window.addEventListener('message', event => {
    if (!markerFrame) return;
    if (event.source !== markerFrame.contentWindow) return;
    if (event.origin !== location.origin) return;
    if (event.data?.source !== 'hmy-marker-ar') return;

    status.textContent = event.data.message;
});

// ===== Surface AR preview =====

function setSurfaceCamera() {
    if (!surfaceModel?.getDimensions) return;

    const d = surfaceModel.getDimensions();
    const maxSize = Math.max(d.x, d.y, d.z);

    if (!Number.isFinite(maxSize) || maxSize <= 0) return;

    surfaceModel.cameraOrbit =
        `35deg 68deg ${maxSize * 1.05}m`;

    surfaceModel.jumpCameraToGoal();
}

surfaceModel?.addEventListener('load', setSurfaceCamera);

surfaceModel?.addEventListener('error', () => {
    if (currentMode === 'surface') {
        status.textContent = 'Could not load mosque.glb.';
    }
});

// ===== Mode selection =====

function selectMode(mode) {
    if (mode !== 'marker' && mode !== 'surface') return;

    stopMarker();
    currentMode = mode;

    choices.hidden = true;
    workspace.hidden = false;

    markerStage.hidden = mode !== 'marker';
    surfaceStage.hidden = mode !== 'surface';

    $('#ar-mode-title').textContent =
        mode === 'marker'
            ? 'Marker AR · AR.js + A-Frame'
            : 'Surface AR · model-viewer';

    if (mode === 'marker') {
        startMarker();
    } else {
        status.textContent =
            'Rotate the model or select View Mosque in AR on a compatible phone.';

        if (surfaceModel?.loaded) {
            setSurfaceCamera();
        }
    }

    workspace.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

document.querySelectorAll('[data-mode]').forEach(button => {
    button.addEventListener('click', () => {
        selectMode(button.dataset.mode);
    });
});

$('#ar-back').addEventListener('click', () => {
    stopMarker();
    currentMode = null;

    markerStage.hidden = true;
    surfaceStage.hidden = true;

    workspace.hidden = true;
    choices.hidden = false;
});

window.addEventListener('pagehide', stopMarker);
