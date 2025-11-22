import { DrawingEvent, DrawingEventType } from "./events.js";
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
        this.PreviousPointsDict = {};//dictionary with key = user_id , value = points array object
    }

    HandleEvent(canva, event) {

        if (event.type === DrawingEventType.START) {
            //reset PreviousPointsDict for this user_id
            this.PreviousPointsDict[event.user_id] = [];
            this.drawEventsOnCanva(canva, event);
        }
        else if (event.type === DrawingEventType.END) {
            //clear PreviousPointsDict for this user_id
            delete this.PreviousPointsDict[event.user_id];
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

        const user_id = event.user_id;

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


    init(canvaId) {
        // canvas and context
        const user_id = Math.random().toString(36).substring(2, 15);
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
                self.HandleEvent(canvaId, new DrawingEvent({
                    type: DrawingEventType.START,
                    x: currX,
                    y: currY,
                    user_id: user_id
                }));


            }

            if (res === 'up' || res === 'out') {
                flag = false;
                //create object event of type "end" : 
                self.HandleEvent(canvaId, new DrawingEvent({
                    type: DrawingEventType.END,
                    x: currX,
                    y: currY,
                    user_id: user_id
                }));
            }

            if (res === 'move') {
                if (flag) {
                    currX = mouseX;
                    currY = mouseY;

                    //create object event and call drawEventsOnCanva
                    self.HandleEvent(canvaId, new DrawingEvent({
                        type: DrawingEventType.DRAW,
                        x: currX,
                        y: currY,
                        user_id: user_id
                    }));
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



