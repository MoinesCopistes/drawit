
// --- State Management ---
const state = {
    mode: 'drawing', // 'drawing' or 'view'
    scale: 1,
    panning: false,
    pointX: 0, // Current Translate X
    pointY: 0, // Current Translate Y
    startX: 0,
    startY: 0,
    // Constraints
    minScale: 0.5,
    maxScale: 3,
    canvasWidth: 2000,
    canvasHeight: 2000
};

// --- Elements ---
const body = document.body;
const modeBtn = document.getElementById('modeSwitch');
const statusBar = document.getElementById('statusBar');
const container = document.getElementById('canvas-container');
const viewport = document.getElementById('viewport');
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');

// --- Mode Logic ---
function toggleMode() {
    if (state.mode === 'drawing') {
        state.mode = 'view';
        body.classList.remove('mode-drawing');
        body.classList.add('mode-view');
        modeBtn.innerText = "Switch to Draw";
        statusBar.innerText = "View Mode: Drag to move, Scroll to zoom";
    } else {
        state.mode = 'drawing';
        body.classList.remove('mode-view');
        body.classList.add('mode-drawing');
        modeBtn.innerText = "Switch to View";
        statusBar.innerText = "Drawing Mode";
    }
}

function updateTransform() {
    container.style.transform = `translate(${state.pointX}px, ${state.pointY}px) scale(${state.scale})`;
}

// --- View Mode: Pan & Zoom Logic ---

// Helper: Clamp values to keep canvas inside viewport
function clampPosition(x, y, scale) {
    const viewportW = viewport.clientWidth;
    const viewportH = viewport.clientHeight;

    // Calculate boundaries
    const minX = viewportW - (state.canvasWidth * scale);
    const minY = viewportH - (state.canvasHeight * scale);

    let newX = x;
    let newY = y;

    // Prevent dragging too far down/right (top-left of canvas leaves top-left of viewport)
    if (newX > 0) newX = 0;
    if (newY > 0) newY = 0;

    // Prevent dragging too far up/left
    if (newX < minX) newX = minX;
    if (newY < minY) newY = minY;

    // Center if content is smaller than viewport
    if (state.canvasWidth * scale < viewportW) newX = (viewportW - state.canvasWidth * scale) / 2;
    if (state.canvasHeight * scale < viewportH) newY = (viewportH - state.canvasHeight * scale) / 2;

    return {
        x: newX,
        y: newY
    };
}

viewport.addEventListener('mousedown', (e) => {
    if (state.mode === 'view') {
        state.panning = true;
        state.startX = e.clientX - state.pointX;
        state.startY = e.clientY - state.pointY;
    }
});

window.addEventListener('mousemove', (e) => {
    if (state.mode === 'view' && state.panning) {
        e.preventDefault();
        let rawX = e.clientX - state.startX;
        let rawY = e.clientY - state.startY;

        const clamped = clampPosition(rawX, rawY, state.scale);
        state.pointX = clamped.x;
        state.pointY = clamped.y;

        updateTransform();
    }
});

window.addEventListener('mouseup', () => {
    state.panning = false;
});

// Zoom (Wheel) - Now Centered on Cursor
viewport.addEventListener('wheel', (e) => {
    if (state.mode === 'view') {
        e.preventDefault();

        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        const oldScale = state.scale;
        let newScale = oldScale + delta;

        // Clamp Scale
        newScale = Math.min(Math.max(newScale, state.minScale), state.maxScale);

        // Zoom to Cursor Math
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
    }
}, {
    passive: false
});

// Initialize center
state.pointX = (window.innerWidth - state.canvasWidth) / 2;
state.pointY = (window.innerHeight - state.canvasHeight) / 2;
updateTransform();
