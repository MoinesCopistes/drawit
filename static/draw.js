import { Event, DrawingEventType } from "./events.js";
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
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

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



