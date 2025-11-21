export const DrawingEventType = Object.freeze({
    START: 0,
    DRAW: 1,
    END: 2
});

export class Event {
    constructor({ type, x, y, pressure = 1.0, strokeId, timestamp = Date.now(), clientId }) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.pressure = pressure;
        this.strokeId = strokeId;
        this.timestamp = timestamp;
        this.clientId = clientId; 
    }
    
    serialize() {
    	const buffer = new ArrayBuffer(19);
    	const view = new DataView(buffer);
    	
    	if (this.type === DrawingEventType.START || this.type == DrawingEventType.END) {
    		if(this.type === DrawingEventType.START) {	
    			view.setInt8(0, 0, false);
    		} else {
    			view.setInt8(0, 2, false);
    		}
    		view.setUint16(1, 0, false); // 2 bytes
			view.setUint16(3, 0, false); // 2 bytes 	
			view.setFloat32(5, 0.0, false); // 4 bytes
			view.setUint8(9, 0, false); //1 byte
    	} else if(this.type == DrawingEventType.DRAW) {	
    		view.setInt8(0, 1, false);
    		view.setUint16(1, this.x, false); // 2 bytes
			view.setUint16(3, this.y, false); // 2 bytes 	
			view.setFloat32(5, this.pressure, false); // 4 bytes
			view.setUint8(9, this.strokeId, false); //1 byte
    	}
    		
		view.setFloat64(10, this.timestamp, false); //8 bytes
		view.setUint8(18, this.clientId, false); //1 byte

    	return buffer;
    }
    
    static deserialize(array_buffer) {
    	const received_event = new Event({type:DrawingEventType.DRAW, x:0, y:0, pressure:0.0, strokeId:0, timestamp:0.0, clientID:0});
    
    	const view = new DataView(array_buffer);
 
 		received_event.type = view.getUint8(0, false); 	 
    	received_event.x = view.getUint16(1, false);
    	received_event.y = view.getUint16(3, false);
    	received_event.pressure = view.getFloat32(5, false);
    	received_event.strokeId = view.getUint8(9, false);
    	received_event.timestamp = view.getFloat64(10, false);
    	received_event.clientId = view.getUint8(18, false);
    	
    	return received_event;
    	
    }
}

export const test_event_serialization = () => {
	const jaaj = new Event({type:DrawingEventType.DRAW, x:150, y:150, pressure:1.0, strokeId:8, timestamp:1763766859065, clientId:2});
	
	const soos = jaaj.serialize();
	
	console.log(soos);
	
	const leel = Event.deserialize(soos);
	console.log(leel.type);
	console.log(leel.x);
	console.log(leel.y);
	console.log(leel.pressure);
	console.log(leel.strokeId);
	console.log(leel.timestamp);
	console.log(leel.clientId);

}

// TODO: Find some nice way to serialize this into binary


