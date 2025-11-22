import asyncio

BATCH_SIZE = 200000 # 200 000 * 10 bytes is 2Mo

class EventBuffer:
    def __init__(self):
        self.buffer = []
        self.new_event = asyncio.Event()
        self.lock = asyncio.Lock()
    async def append(self, event):
        async with self.lock:
            self.buffer.append(event)
            self.new_event.set() #notify waiting clients
            self.new_event.clear()
    async def get_batch(self, client):
        while True:
            async with self.lock:
                if client.cursor < len(self.buffer):
                    events = self.buffer[client.cursor:client.cursor + BATCH_SIZE]
                    client.cursor += len(events)
                    return [b for e in events for b in e]
                self.new_event.clear()  # only clear before waiting
            await self.new_event.wait()

