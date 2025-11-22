export const DrawingEventType = Object.freeze({
    START: 0,
    DRAW: 1,
    END: 2,
    ADD_ZONE: 3,
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
	constructor(view, offset=0) {
		this.view = view;
		this.offset = offset;
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
        this.color = {r: 255, g: 255, b: 255};
        this.strokeId = 0; //1
    }
    
    serialize() {
     	let size;
     	switch(this.type) {
     		case DrawingEventType.START :
     			size = 14;
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
    	
    	const buffer = new ArrayBuffer(100, { maxByteLength: 100 });
    	const view = new DataView(buffer);
    	const w = new Writer(view);
		
		w.write("setUint8", this.type, 1); //commun à tous
		w.write("setFloat64", this.timestamp, 8); //commun à tous
    	w.write("setUint8", this.clientId, 1); //commun à tous
		
		switch(this.type) {
    		case DrawingEventType.START :
    			w.write("setUint16", this.x, 2);
    			w.write("setUint16", this.y, 2);
				w.write("setUint8", this.color["r"], 1);
				w.write("setUint8", this.color["g"], 1);
				w.write("setUint8", this.color["b"], 1);
    			break;
    		case DrawingEventType.DRAW :
    			w.write("setUint16", this.x, 2);
    			w.write("setUint16", this.y, 2);
    			w.write("setUint8" , this.strokeId, 1);
    			break;
    		case DrawingEventType.END :
    			break;
    		case DrawingEventType.ASK_SNAPSHOT :
    			break;
    		case DrawingEventType.ADD_ZONE :
    			w.write("setUint16", this.x, 2);
    			w.write("setUint16", this.y, 2);
    			w.write("setUint16", this.w, 2);
    			w.write("setUint16", this.h, 2);
    			break;
    	}
    	
    	buffer.resize(w.offset);
    	
    	const buffer2 = new ArrayBuffer(buffer.byteLength);
    	new Uint8Array(buffer2).set(new Uint8Array(buffer));

    	return buffer2;
    }
    
    static deserialize(array_buffer, offset=0) {
    	const received_event = new Event();
    
    	const view = new DataView(array_buffer);
    	const r = new Reader(view, offset);
 
 		received_event.type = r.read("getUint8", 1);
 		received_event.timestamp = r.read("getFloat64", 8);
    	received_event.clientId = r.read("getUint8", 1);
    		 
    	switch(received_event.type) {
    		case DrawingEventType.START :
    			received_event.x = r.read("getUint16", 2);
    			received_event.y = r.read("getUint16", 2);
    			received_event.color["r"] = r.read("getUint8", 1);
				received_event.color["g"] = r.read("getUint8", 1);
				received_event.color["b"] = r.read("getUint8", 1);
    			break;
    		case DrawingEventType.DRAW :
    			received_event.x = r.read("getUint16", 2);
    			received_event.y = r.read("getUint16", 2);
    			received_event.strokeId = r.read("getUint8", 1);
    			break;
    		case DrawingEventType.END :
    			break;
    		case DrawingEventType.ASK_SNAPSHOT :
    			break;

    		case DrawingEventType.ADD_ZONE :
    			received_event.x = r.read("getUint16", 2);
    			received_event.y = r.read("getUint16", 2);
    			received_event.w = r.read("getUint16", 2);
    			received_event.h = r.read("getUint16", 2);
    			break;
    	}
    	
    	    	
    	return {event: received_event, offset: r.offset};
    	
    }
    
    static deserialize_list(array_buffer) {
    	let events = [];
    	const buff_size = array_buffer.byteLength;
    	
    	let offset = 0;
    	let event;
    		
    		
    	while(offset < array_buffer.byteLength) {
    		({event, offset} = Event.deserialize(array_buffer, offset));
    		events.push(event);
    	}
    	
    		
    	return events;
    }
}

export const test_event_serialization = () => {
	const jaaj = new Event();
	jaaj.type = DrawingEventType.DRAW;
	jaaj.timestamp = 1763766859065;
	jaaj.clientId = 69;
	jaaj.x = 150;
	jaaj.y = 150;
	jaaj.w = 50;
	jaaj.h = 60;
	jaaj.strokeId = 1;
	
	const soos = jaaj.serialize();
	console.log(soos.byteLength);
	
	const leel = Event.deserialize(soos);
	console.log(leel.type);
	console.log(leel.timestamp);
	console.log(leel.clientId);
	console.log(leel.x);
	console.log(leel.y);
	console.log(leel.w);
	console.log(leel.h);
	console.log(leel.color["r"]);
	console.log(leel.color["b"]);
	console.log(leel.color["g"]);
	console.log(leel.strokeId);
}

export const test_event_serialization_big = () => {
	const jaaj = new Event();
	jaaj.type = DrawingEventType.DRAW;
	jaaj.timestamp = 1763766859065;
	jaaj.clientId = 69;
	jaaj.x = 150;
	jaaj.y = 150;
	jaaj.w = 50;
	jaaj.h = 60;
	jaaj.strokeId = 1;
	
	const soos = new Event();
	soos.type = DrawingEventType.START;
	soos.timestamp = 1763766859069;
	soos.clientId = 69;
	soos.x = 150;
	soos.y = 150;
	soos.w = 50;
	soos.h = 60;
	soos.strokeId = 1;
	
	const leel = new Event();
	leel.type = DrawingEventType.ADD_ZONE;
	leel.timestamp = 1763766859420;
	leel.clientId = 69;
	leel.x = 150;
	leel.y = 150;
	leel.w = 50;
	leel.h = 60;
	leel.strokeId = 1;
	
	const jaaj_ser = jaaj.serialize();
	const soos_ser = soos.serialize();
	const leel_ser = leel.serialize();
	
	const buffer = new ArrayBuffer(jaaj_ser.byteLength+soos_ser.byteLength+leel_ser.byteLength);
	new Uint8Array(buffer, 0).set(new Uint8Array(jaaj_ser));
	new Uint8Array(buffer, jaaj_ser.byteLength).set(new Uint8Array(soos_ser));
	new Uint8Array(buffer, jaaj_ser.byteLength + soos_ser.byteLength).set(new Uint8Array(leel_ser));
	
	const res = Event.deserialize_list(buffer);
	
	console.log(res[0].type);
	console.log(res[1].type);
	console.log(res[2].type);
}
