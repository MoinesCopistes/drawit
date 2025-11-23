import asyncio

# Augmentons le batch size pour absorber les pics
BATCH_SIZE = 1000000 

class EventBuffer:
    def __init__(self):
        self.buffer = []
        self.new_event = asyncio.Event()
        self.lock = asyncio.Lock()
        
    async def append(self, event):
        async with self.lock:
            self.buffer.append(event)
            # self.new_event.set()
            # self.new_event.clear()

    async def get_batch(self, client):
        await self.new_event.wait()
        
        async with self.lock:
            if client.cursor >= len(self.buffer):
                return b""
                
            end_cursor = len(self.buffer)
            events = self.buffer[client.cursor:end_cursor]
            client.cursor = end_cursor
            
            return b"".join(events)

    async def clear(self):
        async with self.lock:
            self.buffer.clear()
            
    async def tick_loop(self):
        while True:
            await asyncio.sleep(0.033) 
            
            if len(self.buffer) > 0:
                self.new_event.set()
                self.new_event.clear()
