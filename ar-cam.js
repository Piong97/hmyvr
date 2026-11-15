
'use strict';

const $ = selector => document.querySelector(selector);

// ===== Elements =====

const choices = $('#ar-choices');
const workspace = $('#ar-workspace');
const surfaceModel = $('#ar-model');
const status = $('#ar-status');

let currentMode = null;

// ===== Footer Year =====

$('#year').textContent = new Date().getFullYear();

// ===== Mobile Navigation =====

$('#menu-toggle').addEventListener('click', () => {
    const nav = $('#primary-nav');
    const open = nav.classList.toggle('open');

    $('#menu-toggle').setAttribute(
        'aria-expanded',
        String(open)
    );
});

// ===== Surface AR Camera Framing =====

function setSurfaceCamera() {
    if (!surfaceModel?.getDimensions) return;

    const dimensions = surfaceModel.getDimensions();

    const maxSize = Math.max(
        dimensions.x,
        dimensions.y,
        dimensions.z
    );

    if (!Number.isFinite(maxSize) || maxSize <= 0) {
        return;
    }

    surfaceModel.cameraOrbit =
        `35deg 68deg ${maxSize * 1.05}m`;

    surfaceModel.jumpCameraToGoal();
}

// ===== Surface Model Events =====

surfaceModel.addEventListener('load', () => {
    setSurfaceCamera();
});

surfaceModel.addEventListener('error', () => {
    if (currentMode === 'surface') {
        status.textContent =
            'Could not load mosque.glb. Please check the model file.';
    }
});

// ===== Open Surface AR =====

function openSurfaceAR() {
    currentMode = 'surface';

    choices.hidden = true;
    workspace.hidden = false;

    status.textContent =
        'Rotate the model or select View Mosque in AR on a compatible phone.';

    if (surfaceModel.loaded) {
        setSurfaceCamera();
    }

    workspace.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// ===== Surface AR Button =====

document.querySelector(
    '[data-mode="surface"]'
).addEventListener('click', openSurfaceAR);

// ===== Back to Mode Selection =====

$('#ar-back').addEventListener('click', () => {
    currentMode = null;

    workspace.hidden = true;
    choices.hidden = false;

    choices.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
});
