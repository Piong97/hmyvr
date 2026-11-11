
/* ==========================================================
   AR CAM — PAGE-SPECIFIC JAVASCRIPT
   Haji Mohammad Yassin VR

   Supports:
   1. Marker AR — AR.js + A-Frame
   2. Surface AR — model-viewer

   Do not load script.js on this page.
   ========================================================== */

'use strict';

// ==========================================================
// HEADER & FOOTER
// ==========================================================

document.querySelector('#year').textContent =
    new Date().getFullYear();

document.querySelector('#menu-toggle').addEventListener('click', () => {
    const nav = document.querySelector('#primary-nav');
    const open = nav.classList.toggle('open');

    document.querySelector('#menu-toggle')
        .setAttribute('aria-expanded', String(open));
});


// ==========================================================
// AR PAGE ELEMENTS
// ==========================================================

const choices = document.querySelector('#ar-choices');
const workspace = document.querySelector('#ar-workspace');
const markerStage = document.querySelector('#marker-stage');
const surfaceStage = document.querySelector('#surface-stage');
const status = document.querySelector('#ar-status');

let markerScene = null;
let aframeReady = null;


// ==========================================================
// LOAD EXTERNAL LIBRARIES
// ==========================================================

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');

        script.src = src;
        script.onload = resolve;

        script.onerror = () => {
            reject(new Error('Unable to load ' + src));
        };

        document.head.appendChild(script);
    });
}


// ==========================================================
// PREPARE AR.JS + A-FRAME
// ==========================================================

async function prepareMarker() {
    if (!aframeReady) {
        aframeReady = (async () => {
            await loadScript(
                'https://aframe.io/releases/1.6.0/aframe.min.js'
            );

            await loadScript(
                'https://raw.githack.com/AR-js-org/AR.js/3.4.7/aframe/build/aframe-ar.js'
            );
        })();
    }

    return aframeReady;
}


// ==========================================================
// STOP MARKER AR
// ==========================================================

function stopMarker() {
    if (markerScene) {
        try {
            markerScene.pause();
            markerScene.renderer?.dispose();
        } catch (error) {
            console.warn(error);
        }

        markerScene.remove();
        markerScene = null;
    }

    markerStage.replaceChildren();

    document.querySelectorAll('video').forEach(video => {
        if (
            video.closest('#marker-stage') ||
            video.id === 'arjs-video'
        ) {
            video.srcObject?.getTracks().forEach(track => {
                track.stop();
            });

            video.remove();
        }
    });
}


// ==========================================================
// START MARKER AR
// ==========================================================

async function startMarker() {
    status.textContent =
        'Loading AR camera… Please allow camera access when prompted.';

    try {
        await prepareMarker();

        if (markerStage.hidden) return;

        // Create A-Frame scene
        markerScene = document.createElement('a-scene');

        markerScene.setAttribute('embedded', '');

        markerScene.setAttribute(
            'vr-mode-ui',
            'enabled: false'
        );

        markerScene.setAttribute(
            'renderer',
            'antialias: true; alpha: true'
        );

        markerScene.setAttribute(
            'arjs',
            'sourceType: webcam; debugUIEnabled: false; trackingMethod: best;'
        );

        // Create Hiro marker
        const marker = document.createElement('a-marker');

        marker.setAttribute('preset', 'hiro');

        // Create mosque model
        const model = document.createElement('a-entity');

        model.setAttribute(
            'gltf-model',
            'url(models/mosque.glb)'
        );

        model.setAttribute('scale', '1 1 1');

        // Automatically resize and center the mosque
        model.addEventListener('model-loaded', () => {
            const mesh = model.getObject3D('mesh');

            if (!mesh) return;

            const THREE = window.AFRAME.THREE;

            const box = new THREE.Box3().setFromObject(mesh);

            const size = box.getSize(new THREE.Vector3());

            const center = box.getCenter(new THREE.Vector3());

            const max = Math.max(
                size.x,
                size.y,
                size.z
            );

            if (max > 0) {
                const scale = 1.3 / max;

                model.setAttribute(
                    'scale',
                    `${scale} ${scale} ${scale}`
                );

                model.setAttribute(
                    'position',
                    `${-center.x * scale} ${-box.min.y * scale} ${-center.z * scale}`
                );
            }

            status.textContent =
                'Camera ready. Point at the Hiro marker and keep it fully visible.';
        });

        // Model loading error
        model.addEventListener('model-error', () => {
            status.textContent =
                'Could not load models/mosque.glb. Check the model file path.';
        });

        marker.appendChild(model);

        markerScene.appendChild(marker);

        // AR camera
        const camera = document.createElement('a-entity');

        camera.setAttribute('camera', '');

        markerScene.appendChild(camera);

        // Display scene
        markerStage.appendChild(markerScene);

    } catch (error) {
        console.error(error);

        status.textContent =
            'AR camera could not start. Check internet access, HTTPS, browser camera permissions, and the browser console.';
    }
}


// ==========================================================
// SWITCH BETWEEN AR MODES
// ==========================================================

async function selectMode(mode) {
    stopMarker();

    choices.hidden = true;
    workspace.hidden = false;

    markerStage.hidden = mode !== 'marker';
    surfaceStage.hidden = mode !== 'surface';

    document.querySelector('#ar-mode-title').textContent =
        mode === 'marker'
            ? 'Marker AR · AR.js + A-Frame'
            : 'Surface AR · model-viewer';

    if (mode === 'marker') {
        await startMarker();
    } else {
        status.textContent =
            'Rotate the preview, then tap "View Mosque in AR" on a supported mobile device. On desktop, you can explore the 3D preview.';
    }

    workspace.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}


// ==========================================================
// AR MODE BUTTONS
// ==========================================================

document.querySelectorAll('[data-mode]').forEach(button => {
    button.addEventListener('click', () => {
        selectMode(button.dataset.mode);
    });
});


// ==========================================================
// BACK TO AR MODE SELECTION
// ==========================================================

document.querySelector('#ar-back').addEventListener('click', () => {
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


// ==========================================================
// CLEAN UP CAMERA WHEN LEAVING PAGE
// ==========================================================

window.addEventListener('pagehide', stopMarker);
