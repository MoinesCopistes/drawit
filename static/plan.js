
// --- State Management ---
const state = {
    mode: 'drawing', // 'drawing' or 'view'
    scale: 1,
    pointX: 0,
    pointY: 0,
    panning: false,
    panStartX: 0,
    panStartY: 0,
    zoneStartX: 0,
    zoneStartY: 0,
    currentMouseX: 0,
    currentMouseY: 0,
    zones: [],
    minScale: 0.2,
    maxScale: 4,
    canvasWidth: 2000,
    canvasHeight: 2000
};

// --- Elements ---
const body = document.body;
const modeBtn = document.getElementById('modeSwitch');
const statusBar = document.getElementById('statusBar');
const container = document.getElementById('canvas-container');
const viewport = document.getElementById('viewport');
const canvas = document.getElementById('Canva');
const ctx = canvas.getContext('2d');
const zoneInput = document.getElementById('zoneNameInput');

// --- Initialization ---
state.pointX = (window.innerWidth - state.canvasWidth) / 2;
state.pointY = (window.innerHeight - state.canvasHeight) / 2;
updateTransform();

// --- Logic ---

function toggleMode() {
    if (state.mode === 'drawing') {
        state.mode = 'view';
        body.classList.remove('mode-drawing');
        body.classList.add('mode-view');
        modeBtn.innerText = "Switch to Create";
        statusBar.innerText = "View Mode: Click zones to see info";
        // Clear error states when switching
        zoneInput.classList.remove('input-error');
    } else {
        state.mode = 'drawing';
        body.classList.remove('mode-view');
        body.classList.add('mode-drawing');
        modeBtn.innerText = "Switch to View";
        statusBar.innerText = "Creation Mode: Enter name, then drag to create";
    }
}

function updateTransform() {
    container.style.transform = `translate(${state.pointX}px, ${state.pointY}px) scale(${state.scale})`;
}

function getCanvasCoordinates(clientX, clientY) {
    return {
        x: (clientX - state.pointX) / state.scale,
        y: (clientY - state.pointY) / state.scale
    };
}


// --- Event Listeners ---

viewport.addEventListener('mousedown', (e) => {
    const coords = getCanvasCoordinates(e.clientX, e.clientY);

    if (state.mode === 'view') {
        state.panning = true;
        state.panStartX = e.clientX - state.pointX;
        state.panStartY = e.clientY - state.pointY;
    } else if (state.mode === 'drawing') {
        // VALIDATION CHECK:
        const desc = zoneInput.value.trim();

        if (!desc) {
            // 1. Highlight the input box
            zoneInput.classList.add('input-error');
            zoneInput.focus();

            // 2. Highlight the Status Bar
            statusBar.innerText = "Error: You must enter a description first!";
            statusBar.classList.add('error');

            // 3. Reset highlights after a delay
            setTimeout(() => {
                zoneInput.classList.remove('input-error');
                statusBar.classList.remove('error');
                statusBar.innerText = "Creation Mode: Enter name, then drag to create";
            }, 1500);

            return; // STOP here, do not start dragging
        }

        // If valid, proceed
        state.isDraggingZone = true;
        state.zoneStartX = coords.x;
        state.zoneStartY = coords.y;
        state.currentMouseX = coords.x;
        state.currentMouseY = coords.y;
    }
});

window.addEventListener('mousemove', (e) => {

    if (state.mode === 'view' && state.panning) {
        e.preventDefault();
        let rawX = e.clientX - state.panStartX;
        let rawY = e.clientY - state.panStartY;
        const clamped = clampPosition(rawX, rawY, state.scale);
        state.pointX = clamped.x;
        state.pointY = clamped.y;
        updateTransform();
    } });

window.addEventListener('mouseup', (e) => {
    if (state.mode === 'view') {
        state.panning = false;
}});

viewport.addEventListener('click', (e) => {
    if (state.mode !== 'view') return;

    const coords = getCanvasCoordinates(e.clientX, e.clientY);

    const clickedZone = [...state.zones].reverse().find(z =>
        coords.x >= z.x && coords.x <= z.x + z.w &&
        coords.y >= z.y && coords.y <= z.y + z.h
    );

    if (clickedZone) {
        statusBar.innerText = `Selected Zone: ${clickedZone.desc}`;
        statusBar.classList.add('highlight');
        setTimeout(() => statusBar.classList.remove('highlight'), 300);
    } else {
        statusBar.innerText = "View Mode: Click zones to see info";
    }
});

viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    const oldScale = state.scale;
    let newScale = Math.min(Math.max(oldScale + delta, state.minScale), state.maxScale);

    const rect = viewport.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - state.pointX) / oldScale;
    const worldY = (mouseY - state.pointY) / oldScale;

    let newPointX = mouseX - (worldX * newScale);
    let newPointY = mouseY - (worldY * newScale);

    const clamped = clampPosition(newPointX, newPointY, newScale);
    state.scale = newScale;
    state.pointX = clamped.x;
    state.pointY = clamped.y;
    updateTransform();
}, {
    passive: false
});

function clampPosition(x, y, scale) {
    const viewportW = viewport.clientWidth;
    const viewportH = viewport.clientHeight;
    const minX = viewportW - (state.canvasWidth * scale);
    const minY = viewportH - (state.canvasHeight * scale);
    let newX = x;
    let newY = y;

    if (newX > 0) newX = 0;
    if (newY > 0) newY = 0;
    if (newX < minX) newX = minX;
    if (newY < minY) newY = minY;

    if (state.canvasWidth * scale < viewportW) newX = (viewportW - state.canvasWidth * scale) / 2;
    if (state.canvasHeight * scale < viewportH) newY = (viewportH - state.canvasHeight * scale) / 2;

    return {
        x: newX,
        y: newY
    };
}
