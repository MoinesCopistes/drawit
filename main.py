import sanic
from sanic import Sanic, Request, Websocket
from sanic.response import text
from client import Client
from buffer import EventBuffer
import asyncio

app = Sanic("MyHelloWorldApp")

app.static("/static/", "./static/", directory_view=True, name="static")
app.static("/", "./static/index.html", name="index")
app.static("/plan", "./static/plan.html", name="plan")
app.static("/draw", "./static/draw.html", name="draw")

connections = []
eventsBuffer = EventBuffer()
snapshotAskEvent = bytes([4] + [0]*9)

@app.websocket("/feed")
async def feed(request: Request, ws: Websocket):
    client_id = len(connections)
    client = Client(client_id, ws)
    connections.append(client)

    async def send_loop():
        try:
            while True:
                batch = await eventsBuffer.get_batch(client)
                await ws.send(bytes(batch))
        except sanic.exceptions.WebsocketClosed:
            pass

    async def recv_loop():
        try:
            async for event in ws:
                await eventsBuffer.append(event)
        except sanic.exceptions.WebsocketClosed:
            pass

    send_task = asyncio.create_task(send_loop())
    recv_task = asyncio.create_task(recv_loop())
    try:
        # Wait until one of the tasks ends (usually recv_loop on disconnect)
        done, pending = await asyncio.wait(
            [send_task, recv_task],
            return_when=asyncio.FIRST_COMPLETED
        )
        # Cancel the other task(s)
        for task in pending:
            task.cancel()
    finally:
        connections.remove(client)

