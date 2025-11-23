import { Event, DrawingEventType } from "./events.js";
const colorMenuBtn = document.getElementById('colorMenuBtn');
const colorOverlay = document.getElementById('colorOverlay');



// Toggle overlay

export function allotherthings() {
     const isDraw = window.location.pathname == "/draw"
     let element = document.getElementById("canvas-container")
     const initialZoom = window.innerWidth * (0.43/1882)
     let instance = panzoom(element, {bounds:true, boundPadding:0.5, maxZoom:1, minZoom:0.05, initialZoom: initialZoom});
     instance.moveTo(window.innerWidth/2 - (parseInt(element.style.width) * initialZoom /2 ), window.innerHeight/2 - (parseInt(element.style.height) * initialZoom/2));

    const modeBtn = document.getElementById('modeSwitch');
    const radiusSlider = document.getElementById('radiusSlider');
    const radiusValue = document.getElementById('radiusValue');
    const tools = document.getElementById('toolstop');
    const count = document.getElementById('usersCount');


    if (isDraw) {

        count.style.display = "none";
        window.mode = 'view';
        document.body.classList.add(`mode-${window.mode}`)
    } else {
        modeBtn.style.display = "none";
        tools.style.display = "none";
        window.mode = 'drawing';
        document.body.classList.add(`mode-${window.mode}`)
        instance.pause();

    }


    // Toggle overlay
    colorMenuBtn.addEventListener('click', () => {
        colorOverlay.style.display = 'flex';
    });
    radiusSlider.addEventListener('input', () => {
        radiusValue.textContent = radiusSlider.value;
    });
    radiusValue.textContent = radiusSlider.value;

    modeBtn.addEventListener('click', toggleMode);

    function toggleMode() {
        if (window.mode === 'drawing') {
            instance.resume()
            mode = 'view';
            document.body.classList.remove('mode-drawing');
            document.body.classList.add('mode-view');
        } else {
            instance.pause();
            window.mode = 'drawing';
            document.body.classList.remove('mode-view');
            document.body.classList.add('mode-drawing');
        }
    }

}
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
export class DrawingModule {
    constructor(canvaId) {
        this.PreviousPointsDict = {};//dictionary with key = clientId , value = points array object
        this.drawingcolors = {};//dictionary with key = clientId , value = color object
        this.strokeRadiuses = {};//dictionary with key = clientId , value = stroke radius
        this.canvas = document.getElementById(canvaId)
        // console.log(canvaId, this.canvas)
        this.ctx = this.canvas.getContext("2d")
        this.palette = ["#21B799", "#714B67", "#017E84", "#8F8F8F", "#E46E78", "#5B899E", "#E4A900", "#705202", "#ea2d5f", "#b83e8b", "#755095", "#3c527f", "#0067df", "#ffffff", "#000000"];
        this.currentColor = this.hexToRgbObject(this.palette[0]); // default color is black

    }
    HandleEvent(event) {
        // console.log(event);
        if (event.type === DrawingEventType.START) {
            //reset PreviousPointsDict for this clientId
            this.PreviousPointsDict[event.clientId] = [];
            this.drawingcolors[event.clientId] = event.color;
            this.strokeRadiuses[event.clientId] = event.strokeRadius;
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
        //safety check for stroke radius (dont want it to go TOO bad would we ?)
        const radius = Math.pow(20, Math.min(20, Number(this.strokeRadiuses[user_id]))/20);
        this.ctx.arc(event.x, event.y, radius, 0, 2 * Math.PI, false);
        this.ctx.fillStyle = `rgb(${this.drawingcolors[user_id].r}, ${this.drawingcolors[user_id].g}, ${this.drawingcolors[user_id].b})`;
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
                this.ctx.strokeStyle = `rgb(${this.drawingcolors[user_id].r}, ${this.drawingcolors[user_id].g}, ${this.drawingcolors[user_id].b})`;
                // console.log(event.color);
                this.ctx.lineWidth = 2 * radius;
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
            if (window.mode != "drawing") {
                return
            }
            if (res === 'up' || res === 'out') {
                flag = false;
                //create object event of type "end" : 
                const ev = new Event();
                ev.type = DrawingEventType.END;
                send_data(ev.serialize())
                return

                //self.HandleEvent(canvaId, ev);
            }

            const rect = this.canvas.getBoundingClientRect();
            // 1. Calculate the ratio between screen pixels and this.canvas pixels
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;

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
                ev.color = this.currentColor;
                //console.log("current color in draw.js:", this.currentColor);
                ev.strokeRadius = document.getElementById('radiusSlider').value;
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

        this.canvas.addEventListener("touchmove", (e) => {
            findxy('move', e.touches[0]);
        });
        this.canvas.addEventListener("touchstart", (e) => {
            findxy('down', e.touches[0]);
        });
        this.canvas.addEventListener("touchend", (e) => {
            findxy('up');
        });
    }



    hexToRgbObject(hex) {
        // Remove the '#' if it exists
        hex = hex.replace('#', '');

        // Parse r, g, b
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        return { r, g, b };
    }

    //helper functions to help count the number of requests sent by DrawingModule
    start_timer() {
        console.log("Timer started");
        state.start_timer = performance.now();
        state.start_requests = state.total_requests_sent;
        // console.log("Start requests:", state.start_requests);
        return performance.now();
    }
    end_timer() {
        const end_time = performance.now();
        // console.log("beginning of timer was " + state.start_timer/1000)
        // console.log("end time is " + end_time/1000)
        const duration = (end_time - state.start_timer) / 1000;
        const requests_sent = state.total_requests_sent - state.start_requests;
        console.log("Number of requests sent: " + requests_sent);
        console.log("Timer ended. Lasted for " + duration + "seconds.");
        console.log("Requests per second sent " + (requests_sent / duration));
    }





}
