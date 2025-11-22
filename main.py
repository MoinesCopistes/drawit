import sanic
from sanic import Sanic, Request, Websocket, response
from sanic.response import file, text, redirect
from client import Client
from buffer import EventBuffer
import asyncio

app = Sanic("MyHelloWorldApp")

app.static("/static/", "./static/", directory_view=True, name="static")
app.static("/", "./static/index.html", name="index")
app.static("/plan", "./static/draw.html", name="plan")
app.static("/draw", "./static/draw.html", name="draw")

connections = []
eventsBuffer = EventBuffer()
snapshotAskEvent = bytes([4] + [0]*9)

CONNECTED_EVENT = bytes([4, 0])
DISCONNECTED_EVENT = bytes([5, 0])
@app.route("/clear", methods=["GET"])
async def clear(request: Request):
    await eventsBuffer.clear()
    return redirect("/draw")

@app.websocket("/feed")
async def feed(request: Request, ws: Websocket):
    client_id = len(connections)
    client = Client(client_id, ws)
    connections.append(client)
    await eventsBuffer.append(CONNECTED_EVENT)

    async def send_loop():
        try:
            while True:
                batch = bytes(await eventsBuffer.get_batch(client))
                await ws.send(batch)
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
        await eventsBuffer.append(DISCONNECTED_EVENT)

@app.route("/save")
async def save(request):
    with open("static/eventdump.js", "w") as f:
        async with eventsBuffer.lock:
            flat_bytes = b''.join(eventsBuffer.buffer)
            js_values = [f"0x{byte:02x}" for byte in flat_bytes]

        injection_block = f"export const dumpBytes = new Uint8Array([{', '.join(js_values)}]);"
        f.write(injection_block)


<<<<<<< HEAD
    return text("done")
=======
    return response.text("done")
>>>>>>> 9d957f6 (conflict)

@app.route("/eventdump.js")
async def serve_file_from_disk(request):
    return await file("static/eventdump.js", mime_type="application/javascript")
