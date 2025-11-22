import { Event, DrawingEventType } from "./events.js";

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
const canvas = document.getElementById('DrawingCanva');
const ctx = canvas.getContext('2d');
modeBtn.addEventListener('click', toggleMode);

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
// This should take a canvas element and draw a list of events on it
// (events from events.js)

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
export class DrawingModule {
    constructor() {
        this.PreviousPointsDict = {};//dictionary with key = clientId , value = points array object
    }

    HandleEvent(canva, event) {
        if (state.mode == "drawing") {

            if (event.type === DrawingEventType.START) {
                //reset PreviousPointsDict for this clientId
                this.PreviousPointsDict[event.clientId] = [];
                this.drawEventsOnCanva(canva, event);
            }
            else if (event.type === DrawingEventType.END) {
                //clear PreviousPointsDict for this clientId
                delete this.PreviousPointsDict[event.clientId];
            }
            else if (event.type === DrawingEventType.DRAW) {
                this.drawEventsOnCanva(canva, event);
            }
        }
    }

    drawEventsOnCanva(canva, event) {
        //@args : 
        //          canva : id of the canvas element, a string
        //          events : list of DrawingEvent objects
        const canvas = document.getElementById(canva);
        const ctx = canvas.getContext("2d");
        console.log("Drawing a DrawingEvent:");
        console.log(event);
        console.log(this.PreviousPointsDict)

        const user_id = event.clientId;

        ctx.beginPath();
        ctx.arc(event.x, event.y, 3, 0, 2 * Math.PI, false);
        ctx.fillStyle = '#000000ff';
        ctx.fill();
        ctx.lineWidth = 1;

        //if already points for user_id in PreviousPointsDict, create a line between last point and current point
        if (user_id in this.PreviousPointsDict) {
            const pointsArray = this.PreviousPointsDict[user_id];
            if (pointsArray.length > 0) {
                const lastPoint = pointsArray[pointsArray.length - 1];
                ctx.beginPath();
                ctx.moveTo(lastPoint.x, lastPoint.y);
                ctx.lineTo(event.x, event.y);
                ctx.strokeStyle = '#000000ff';
                ctx.lineWidth = 2 * 3;
                ctx.stroke();
            }
        }


        //store point in PreviousPointsDict
        if (!(user_id in this.PreviousPointsDict)) {
            this.PreviousPointsDict[user_id] = [];
        }
        this.PreviousPointsDict[user_id].push(new Point(event.x, event.y));

    }

    init (canvaId) {
        // canvas and context
        const client_id = Math.random().toString(36).substring(2, 15);
        return client_id;
    }
    listen(canvaId, client_id) {
        // canvas and context
        const canvas = document.getElementById(canvaId);

        // local state variables
        let flag = false;//reprensents if mouse is pressed
        let currX = 0;
        let currY = 0;

        const self = this;
        // handle mouse events
        function findxy(res, e) {
            const rect = canvas.getBoundingClientRect();
            // 1. Calculate the ratio between screen pixels and canvas pixels
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;

            // 2. Apply this ratio to the coordinates
            const mouseX = (e.clientX - rect.left) * scaleX;
            const mouseY = (e.clientY - rect.top) * scaleY;

            if (res === 'down') {
                currX = mouseX;
                currY = mouseY;
                flag = true;
                //create object event of type "start" : 
                const ev = new Event();
                ev.type = DrawingEventType.START;
                ev.x = currX;
                ev.y = currY;
                ev.clientId = client_id;
                self.HandleEvent(canvaId, ev);


            }

            if (res === 'up' || res === 'out') {
                flag = false;
                //create object event of type "end" : 
                const ev = new Event();
                ev.type = DrawingEventType.END;
                ev.x = currX;
                ev.y = currY;
                ev.clientId = client_id;
                self.HandleEvent(canvaId, ev);
            }

            if (res === 'move') {
                if (flag) {
                    currX = mouseX;
                    currY = mouseY;

                    //create object event and call drawEventsOnCanva
                    const ev = new Event();
                    ev.type = DrawingEventType.DRAW;
                    ev.x = currX;
                    ev.y = currY;
                    ev.clientId = client_id;
                    self.HandleEvent(canvaId, ev);
                }
            }
        }

        // attach listeners
        canvas.addEventListener("mousemove", function (e) {
            findxy('move', e);
        });
        canvas.addEventListener("mousedown", function (e) {
            findxy('down', e);
        });
        canvas.addEventListener("mouseup", function (e) {
            findxy('up', e);
        });
        canvas.addEventListener("mouseout", function (e) {
            findxy('out', e);
        });
    }
}



