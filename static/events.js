export const DrawingEventType = Object.freeze({
    START: "start",
    DRAW: "draw",
    END: "end"
});

export class DrawingEvent {
    constructor({ type, x, y, user_id, pressure = 1.0, strokeId, timestamp = Date.now() }) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.user_id = user_id;
        this.pressure = pressure;
        this.strokeId = strokeId;
        this.timestamp = timestamp;
    }
}

// TODO: Find some nice way to serialize this into binary
