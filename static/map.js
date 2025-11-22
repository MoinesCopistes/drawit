import { Event, DrawingEventType } from "./events.js";

export class Map {
  constructor(mapId) {
    this.canvas = document.getElementById(mapId);
    this.ctx = this.canvas.getContext("2d");
    this.ctx.font = "15px serif";
    this.ctx.strokeStyle = "black";

    this.zones = [];
    this.drawing = false;
    this.startPoint = null;
    this.endPoint = null;

  }

  setupHandlers() {
    this.canvas.addEventListener("mousedown", ({ layerX: x, layerY: y }) => {
      this.drawing = true;
      this.startPoint = { x, y };
      this.endPoint = { x, y };
    });

    this.canvas.addEventListener("mousemove", ({ layerX: x, layerY: y }) => {
      if (!this.drawing) return;
      this.endPoint = { x, y };
      this.redraw();
      this.drawRect(this.getBoundingBox(this.startPoint, this.endPoint));
    });

    this.canvas.addEventListener("mouseup", async () => {
      if (!this.drawing) return;
      this.drawing = false;
      let ev = new Event();
      ev.type = DrawingEventType.ADD_ZONE;
      const box = this.getBoundingBox(this.startPoint, this.endPoint);
      ev.x = box.x;
      ev.y = box.y;
      ev.w = box.w;
      ev.h = box.h;
      await window.socket.send(ev.serialize())
      // this.addZone(this.getBoundingBox(this.startPoint, this.endPoint));
      // this.redraw();
    });
  }

  addZone({ x, y, w, h }) {
    this.zones.push({ x, y, w, h, name: ""});
    this.redraw();
  }

  getBoundingBox(p1, p2) {
    const x = Math.min(p1.x, p2.x);
    const y = Math.min(p1.y, p2.y);
    const w = Math.abs(p2.x - p1.x);
    const h = Math.abs(p2.y - p1.y);
    return { x, y, w, h };
  }

  drawRect({ x, y, w, h }) {
    this.ctx.beginPath();
    this.ctx.rect(x, y, w, h);
    this.ctx.stroke();
  }

  redraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.zones.forEach(zone => this.drawRect(zone));
  }
}




