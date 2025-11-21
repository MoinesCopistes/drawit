from sanic import Sanic, Request, Websocket
from sanic.response import text

app = Sanic("MyHelloWorldApp")

app.static("/static/", "./static/", directory_view=True, name="static")
app.static("/", "./static/index.html", name="index")
app.static("/plan", "./static/plan.html", name="plan")
app.static("/draw", "./static/draw.html", name="draw")

app.static("/index.css", "./static/index.css", name="index_css")
app.static("/draw.css", "./static/draw.css", name="draw_css")
app.static("/plan.css", "./static/plan.css", name="plan_css")

@app.websocket("/feed")
async def feed(request: Request, ws: Websocket):
    async for msg in ws:
        await ws.send(msg)
