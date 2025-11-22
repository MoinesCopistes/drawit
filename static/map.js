import { Event, DrawingEventType } from "./events.js";

export class Map {
  constructor(mapId) {
    this.canvas = document.getElementById(mapId);
    this.ctx = this.canvas.getContext("2d");
    this.ctx.font = "800 35px Inter";
    this.ctx.strokeStyle = "black";
    this.ctx.lineWidth = 3;
    this.zones = [];
    this.drawing = false;
    this.startPoint = null;
    this.endPoint = null;

  }

  setupHandlers() {
    this.canvas.addEventListener("mousedown", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      // 1. Calculate the ratio between screen pixels and this.canvas pixels
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;

      // 2. Apply this ratio to the coordinates
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      if (window.mode != "drawing") return;
      this.drawing = true;
      this.startPoint = { x, y };
      this.endPoint = { x, y };
    });

    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      // 1. Calculate the ratio between screen pixels and this.canvas pixels
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;

      // 2. Apply this ratio to the coordinates
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      if (window.mode != "drawing") return;
      if (!this.drawing) return;
      this.endPoint = { x, y };
      this.redraw();
      this.drawRect(this.getBoundingBox(this.startPoint, this.endPoint));
    });

    this.canvas.addEventListener("mouseup", async () => {
      console.log(window.mode)
      if (window.mode != "drawing") return;
      if (!this.drawing) return;
      this.drawing = false;
      let ev = new Event();
      ev.type = DrawingEventType.ADD_ZONE;
      let name = prompt("name: ")
      if (name == "" || name == undefined) {
        this.redraw();
        return;
      };
      const box = this.getBoundingBox(this.startPoint, this.endPoint);
      ev.x = box.x;
      ev.y = box.y;
      ev.w = box.w;
      ev.h = box.h;
      ev.name = name;
      await window.socket.send(ev.serialize())
      // this.addZone(this.getBoundingBox(this.startPoint, this.endPoint));
      // this.redraw();
    });
  }

  

  getBoundingBox(p1, p2) {
    const x = Math.min(p1.x, p2.x);
    const y = Math.min(p1.y, p2.y);
    const w = Math.abs(p2.x - p1.x);
    const h = Math.abs(p2.y - p1.y);
    return { x, y, w, h };
  }

  drawRect({ x, y, w, h, name }) {
    this.ctx.beginPath();
    this.ctx.rect(x, y, w, h);
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.03)";
    this.ctx.fill();
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    const metrics = this.ctx.measureText(name)
    console.log(metrics)
    const paddingX = 30;
    const paddingY = -30;
    this.ctx.beginPath();
    // this.ctx.rect(x, y, paddingX/2 + metrics.width + paddingX/2, -metrics.actualBoundingBoxAscent - paddingY);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    this.ctx.fillText(name || "", x+paddingX/2, y + metrics.actualBoundingBoxAscent - paddingY/2)
    this.ctx.stroke();
  }

  redraw() {
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.zones.forEach(zone => this.drawRect(zone));
  }
}




