from sanic import Sanic, Request, Websocket
from sanic.response import text

app = Sanic("MyHelloWorldApp")

app.static("/static/", "./static/", directory_view=True, name="static")
app.static("/", "./static/index.html", name="index")
app.static("/plan", "./static/plan.html", name="plan")
app.static("/draw", "./static/draw.html", name="draw")

connections = set()

@app.websocket("/feed")
async def feed(request: Request, ws: Websocket):
    connections.add(ws)
    try:
        async for msg in ws:
            # broadcast
            for client in connections:
                await client.send(msg)
    finally:
        # Removing connections when it closes
        connections.remove(ws)
