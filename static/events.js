export const DrawingEventType = Object.freeze({
    START: 0,
    DRAW: 1,
    END: 2,
    ADD_ZONE: 3
});

class Writer {
	constructor(view) {
		this.view = view;
		this.offset = 0;
	}
	
	write(func, arg, size) {
		this.view[func](this.offset, arg, false);
		this.offset += size;
	}
}

class Reader {
	constructor(view) {
		this.view = view;
		this.offset = 0;
	}
	
	read(func,size) {
		let val = this.view[func](this.offset,false);
		this.offset += size;
		return val;
	}
}

export class Event {
    constructor() {
        this.type = 0; //1
        this.timestamp = 0; //8
        this.clientId = 0; //1
        this.x = 0; //2
        this.y = 0; //2
        this.w = 0,  //2
        this.h = 0; //2
        this.strokeId = 0; //1
    }
    
    serialize() {
    	let size;
    	switch(this.type) {
    		case DrawingEventType.START :
    			size = 10;
    			break;
    		case DrawingEventType.DRAW :
    			size = 15;
    			break;
    		case DrawingEventType.END :
    			size = 10;
    			break;
    		case DrawingEventType.ADD_ZONE :
    			size = 18;
    			break;
    	}
    	
    	const buffer = new ArrayBuffer(size);
    	const view = new DataView(buffer);
    	const w = new Writer(view);
		
		w.write("setUint8", this.type, 1); //commun à tous
		w.write("setFloat64", this.timestamp, 8);
    	w.write("setUint8", this.clientId, 1);
		
		switch(this.type) {
    		case DrawingEventType.START :
    			break;
    		case DrawingEventType.DRAW :
    			w.write("setUint16", this.x, 2);
    			w.write("setUint16", this.y, 2);
    			w.write("setUint8" , this.strokeId, 1);
    			break;
    		case DrawingEventType.END :
    			break;
    		case DrawingEventType.ADD_ZONE :
    			w.write("setUint16", this.x, 2);
    			w.write("setUint16", this.y, 2);
    			w.write("setUint16", this.w, 2);
    			w.write("setUint16", this.h, 2);
    			break;
    	}

    	return buffer;
    }
    
    static deserialize(array_buffer) {
    	const received_event = new Event();
    
    	const view = new DataView(array_buffer);
    	const r = new Reader(view);
 
 		received_event.type = r.read("getUint8", 1);
 		received_event.timestamp = r.read("getFloat64", 8);
    	received_event.clientId = r.read("getUint8", 1);
    		 
    	switch(received_event.type) {
    		case DrawingEventType.START :
    			break;
    		case DrawingEventType.DRAW :
    			received_event.x = r.read("getUint16", 2);
    			received_event.y = r.read("getUint16", 2);
    			received_event.strokeId = r.read("getUint8", 1);
    			break;
    		case DrawingEventType.END :
    			break;
    		case DrawingEventType.ADD_ZONE :
    			received_event.x = r.read("getUint16", 2);
    			received_event.y = r.read("getUint16", 2);
    			received_event.w = r.read("getUint16", 2);
    			received_event.h = r.read("getUint16", 2);
    			break;
    	}
    	
    	
    	return received_event;
    	
    }
}

export const test_event_serialization = () => {
	const jaaj = new Event();
	jaaj.type = DrawingEventType.ADD_ZONE;
	jaaj.timestamp = 1763766859065;
	jaaj.clientId = 69;
	jaaj.x = 150;
	jaaj.y = 150;
	jaaj.w = 50;
	jaaj.h = 60;
	jaaj.strokeId = 1;
	
	const soos = jaaj.serialize();
	
	const leel = Event.deserialize(soos);
	console.log(leel.type);
	console.log(leel.timestamp);
	console.log(leel.clientId);
	console.log(leel.x);
	console.log(leel.y);
	console.log(leel.w);
	console.log(leel.h);
	console.log(leel.strokeId);
	

}

// TODO: Find some nice way to serialize this into binary


