class Client:
    def __init__(self, client_id, socket):
        self.client_id = client_id
        self.queue = []
        self.socket = socket
        self.syncing = True
        self.cursor = 0

    # TODO: Make this send events per-batch
    async def send(self, event):
        if self.syncing:
            self.queue.append(event)
        else:
            await self.socket.send(event)        
    

    
