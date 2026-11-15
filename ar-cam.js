
'use strict';

const $ = selector => document.querySelector(selector);

// ===== Elements =====

const choices = $('#ar-choices');
const workspace = $('#ar-workspace');
const surfaceModel = $('#ar-model');
const status = $('#ar-status');

let currentMode = null;

// ===== Footer Year =====

const year = $('#year');

if (year) {
    year.textContent = new Date().getFullYear();
}

// ===== Mobile Navigation =====

const menuToggle = $('#menu-toggle');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        const nav = $('#primary-nav');

        if (!nav) return;

        const open = nav.classList.toggle('open');

        menuToggle.setAttribute(
            'aria-expanded',
            String(open)
        );
    });
}

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

surfaceModel?.addEventListener('load', () => {
    setSurfaceCamera();
});

surfaceModel?.addEventListener('error', () => {
    if (currentMode === 'surface' && status) {
        status.textContent =
            'Could not load mosque.glb. Please check the model file.';
    }
});

// ===== Open Surface AR =====

function openSurfaceAR() {
    currentMode = 'surface';

    if (choices) choices.hidden = true;
    if (workspace) workspace.hidden = false;

    if (status) {
        status.textContent =
            'Rotate the model or select View Mosque in AR on a compatible phone.';
    }

    if (surfaceModel?.loaded) {
        setSurfaceCamera();
    }

    workspace?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// ===== Surface AR Button =====

document.querySelector(
    '[data-mode="surface"]'
)?.addEventListener('click', openSurfaceAR);

// ===== Back to Mode Selection =====

$('#ar-back')?.addEventListener('click', () => {
    currentMode = null;

    if (workspace) workspace.hidden = true;
    if (choices) choices.hidden = false;

    choices?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
});
