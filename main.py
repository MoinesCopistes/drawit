from sanic import Sanic, Request, Websocket
from sanic.response import text

app = Sanic("MyHelloWorldApp")

app.static("/static/", "./static/", directory_view=True, name="static")
app.static("/", "./static/index.html", name="index")
app.static("/plan", "./static/plan.html", name="plan")
app.static("/draw", "./static/draw.html", name="draw")

@app.websocket("/feed")
async def feed(request: Request, ws: Websocket):
    async for msg in ws:
        await ws.send(msg)
