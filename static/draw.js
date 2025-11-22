import { Event, DrawingEventType } from "./events.js";


export const mobileCheck = () => {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

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
const canvas = document.getElementById('Canva');
const ctx = canvas.getContext('2d');
modeBtn.addEventListener('click', toggleMode);

// --- Mode Logic ---
function toggleMode() {
    if (state.mode === 'drawing') {
        state.mode = 'view';
        body.classList.remove('mode-drawing');
        body.classList.add('mode-view');
        statusBar.innerText = "View Mode: Drag to move, Scroll to zoom";
    } else {
        state.mode = 'drawing';
        body.classList.remove('mode-view');
        body.classList.add('mode-drawing');
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
    constructor(canvaId) {
        this.PreviousPointsDict = {};//dictionary with key = clientId , value = points array object
        this.canvas = document.getElementById(canvaId)
        console.log(canvaId, this.canvas)
        this.ctx = this.canvas.getContext("2d")
        this.client_id = Math.random().toString(36).substring(2, 15);

    }
    HandleEvent(event) {
 
         if (event.type === DrawingEventType.START) {
             //reset PreviousPointsDict for this clientId
             this.PreviousPointsDict[event.clientId] = [];
            this.drawEventsOnCanva(event);
         }
         else if (event.type === DrawingEventType.END) {
             //clear PreviousPointsDict for this clientId
             delete this.PreviousPointsDict[event.clientId];
         }
         else if (event.type === DrawingEventType.DRAW) {
            this.drawEventsOnCanva(event);
         }
 
    }

    drawEventsOnCanva(event) {
        // console.log("Drawing a DrawingEvent:");
        // console.log(event);
        // console.log(this.PreviousPointsDict)

        const user_id = event.clientId;

        this.ctx.beginPath();
        this.ctx.arc(event.x, event.y, 3, 0, 2 * Math.PI, false);
        this.ctx.fillStyle = '#000000ff';
        this.ctx.fill();
        this.ctx.lineWidth = 1;

        //if already points for user_id in PreviousPointsDict, create a line between last point and current point
        if (user_id in this.PreviousPointsDict) {
            const pointsArray = this.PreviousPointsDict[user_id];
            if (pointsArray.length > 0) {
                const lastPoint = pointsArray[pointsArray.length - 1];
                this.ctx.beginPath();
                this.ctx.moveTo(lastPoint.x, lastPoint.y);
                this.ctx.lineTo(event.x, event.y);
                this.ctx.strokeStyle = '#000000ff';
                this.ctx.lineWidth = 2 * 3;
                this.ctx.stroke();
            }
        }


        //store point in PreviousPointsDict
        if (!(user_id in this.PreviousPointsDict)) {
            this.PreviousPointsDict[user_id] = [];
        }
        this.PreviousPointsDict[user_id].push(new Point(event.x, event.y));

    }
    listen(send_data) {
        // local state variables
        let flag = false;//reprensents if mouse is pressed
        let currX = 0;
        let currY = 0;

        // handle mouse events
        const findxy = (res, e) => {
            if (state.mode != "drawing") {
                return
            }
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
                ev.clientId = this.client_id;
                send_data(ev.serialize())
                //self.HandleEvent(canvaId, ev);


            }

            if (res === 'up' || res === 'out') {
                flag = false;
                //create object event of type "end" : 
                const ev = new Event();
                ev.type = DrawingEventType.END;
                ev.x = currX;
                ev.y = currY;
                ev.clientId = this.client_id;
                send_data(ev.serialize())
                
                //self.HandleEvent(canvaId, ev);
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
                    ev.clientId = this.client_id;
                    send_data(ev.serialize())

                    //self.HandleEvent(canvaId, ev);
                }
            }
        }

        // attach listeners
        this.canvas.addEventListener("mousemove", (e) => {
            findxy('move', e);
        });
        this.canvas.addEventListener("mousedown", (e) => {
            findxy('down', e);
        });
        this.canvas.addEventListener("mouseup", (e) => {
            findxy('up', e);
        });
        this.canvas.addEventListener("mouseout", (e) => {
            findxy('out', e);
        });
    }
}



