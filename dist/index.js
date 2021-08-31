(() => {
  // src/io.ts
  function loadImage(url) {
    return new Promise((resolve, reject) => {
      let img = new Image();
      img.onload = () => resolve({ url, image: img });
      img.onerror = reject;
      img.src = url;
    });
  }

  // src/ui.ts
  var EventMouse = class {
    constructor(type, x, y) {
      this.type = type;
      this.x = x;
      this.y = y;
    }
    toLocal(x, y) {
      return new EventMouse(this.type, this.x - x, this.y - y);
    }
  };
  var EventPan = class {
    constructor(deltaX, deltaY, x, y) {
      this.deltaX = deltaX;
      this.deltaY = deltaY;
      this.x = x;
      this.y = y;
    }
  };
  var EventZoom = class {
    constructor(zoom, x, y) {
      this.zoom = zoom;
      this.x = x;
      this.y = y;
    }
  };
  var BaseView = class {
    constructor(x, y, width, height) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }
    inBounds(x, y) {
      return this.x <= x && this.y <= y && this.x + this.width > x && this.y + this.height > y;
    }
    event(event) {
      return false;
    }
    layout() {
    }
    draw(ctx) {
    }
  };
  var BaseButton = class extends BaseView {
    constructor(x, y, width, height, onclick = () => {
    }) {
      super(x, y, width, height);
      this.onclick = onclick;
      this.mouseDown = false;
    }
    event(event) {
      if (event instanceof EventMouse) {
        let inBounds = this.inBounds(event.x, event.y);
        if (!inBounds) {
          this.mouseDown = false;
          return false;
        }
        if (event.type === "down") {
          this.mouseDown = true;
        }
        if (event.type === "up" && this.mouseDown) {
          this.mouseDown = false;
          if (this.inBounds(event.x, event.y) && this.onclick)
            this.onclick();
        }
        return true;
      }
      return false;
    }
    layout() {
    }
    draw(ctx) {
    }
  };
  var ColorButton = class extends BaseButton {
    constructor(x, y, width, height, color, onclick = () => {
    }) {
      super(x, y, width, height);
      this.color = color;
      this.onclick = onclick;
      if (typeof color === "string")
        this.activeColor = color;
      else
        this.activeColor = color.noHover;
    }
    event(ev) {
      if (ev instanceof EventMouse) {
        if (ev.type === "moved-global" && typeof this.color !== "string") {
          this.activeColor = this.inBounds(ev.x, ev.y) ? this.color.hover : this.color.noHover;
        }
      }
      return super.event(ev);
    }
    draw(ctx) {
      ctx.fillStyle = this.activeColor;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  };
  var ImageButton = class extends BaseButton {
    constructor(x, y, image, onclick = () => {
    }) {
      super(x, y, 0, 0);
      this.image = image;
      this.onclick = onclick;
      this.setImage(image);
    }
    setImage(image) {
      this.image = image;
      this.width = image.width;
      this.height = image.height;
    }
    draw(ctx) {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
  };
  var VStack = class extends BaseView {
    constructor(x = 0, y = 0) {
      super(x, y, 0, 0);
      this.views = [];
    }
    add(view) {
      this.views.push(view);
      this.layout();
      return this;
    }
    event(ev) {
      if (ev instanceof EventMouse) {
        if (ev.type != "moved-global" && !this.inBounds(ev.x, ev.y))
          return false;
        ev = ev.toLocal(this.x, this.y);
      }
      for (var view of this.views) {
        if (view.event(ev))
          return true;
      }
      return false;
    }
    layout() {
      let maxWidth = 0;
      for (var view of this.views) {
        view.layout();
        maxWidth = Math.max(maxWidth, view.width);
      }
      this.width = maxWidth;
      let lastY = 0;
      this.height = 0;
      for (var view of this.views) {
        view.x = 0;
        view.y = lastY;
        lastY += view.height;
        this.height += view.height;
      }
    }
    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      for (var view of this.views)
        view.draw(ctx);
      ctx.restore();
    }
  };
  var HStack = class extends BaseView {
    constructor(x = 0, y = 0) {
      super(x, y, 0, 0);
      this.views = [];
    }
    add(view) {
      this.views.push(view);
      this.layout();
      return this;
    }
    event(ev) {
      if (ev instanceof EventMouse) {
        if (ev.type != "moved-global" && !this.inBounds(ev.x, ev.y))
          return false;
        ev = ev.toLocal(this.x, this.y);
      }
      for (var view of this.views) {
        if (view.event(ev))
          return true;
      }
      return false;
    }
    layout() {
      let maxHeight = 0;
      for (var view of this.views) {
        view.layout();
        maxHeight = Math.max(maxHeight, view.width);
      }
      this.height = maxHeight;
      let lastX = 0;
      this.width = 0;
      for (var view of this.views) {
        view.x = lastX;
        view.y = 0;
        lastX += view.width;
        this.width += view.width;
      }
    }
    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      for (var view of this.views)
        view.draw(ctx);
      ctx.restore();
    }
  };
  var Spacer = class extends BaseView {
    constructor(width, height) {
      super(0, 0, width, height);
    }
  };
  var Aligner = class {
    constructor(canvas2, view, alignment) {
      this.canvas = canvas2;
      this.view = view;
      this.alignment = alignment;
    }
    align() {
      let view = this.view;
      let canvas2 = this.canvas;
      switch (this.alignment.x) {
        case "left":
          view.x = 0;
          break;
        case "center":
          view.x = (canvas2.clientWidth / 2 | 0) - (view.width / 2 | 0);
          break;
        case "right":
          view.x = canvas2.clientWidth - view.width;
      }
      switch (this.alignment.y) {
        case "top":
          view.y = 0;
          break;
        case "center":
          view.y = (canvas2.clientHeight / 2 | 0) - (view.height / 2 | 0);
          break;
        case "bottom":
          view.y = canvas2.clientHeight - view.height;
          break;
      }
    }
  };
  var UI = class {
    constructor(canvas2) {
      this.canvas = canvas2;
      this.views = [];
      this.aligners = [];
      this.eventListeners = [];
      this.ctx = canvas2.getContext("2d");
      this.ctx.imageSmoothingEnabled = false;
      requestAnimationFrame(() => this.draw());
      let coords = (ev) => {
        let rect = canvas2.getBoundingClientRect();
        let x = ev.clientX - rect.left;
        let y = ev.clientY - rect.top;
        return { x, y };
      };
      let broadcastEvent = (ev) => {
        for (var i = this.views.length - 1; i >= 0; i--) {
          let view = this.views[i];
          if (view.event(ev))
            return;
        }
      };
      var buttonDown = false;
      var lastX = 0, lastY = 0;
      canvas2.addEventListener("mousedown", (ev) => {
        let { x, y } = coords(ev);
        lastX = x;
        lastY = y;
        buttonDown = true;
        broadcastEvent(new EventMouse("down", x, y));
      }, true);
      canvas2.addEventListener("mousemove", (ev) => {
        let { x, y } = coords(ev);
        lastX = x;
        lastY = y;
        broadcastEvent(new EventMouse(buttonDown ? "dragged" : "moved", x, y));
        broadcastEvent(new EventMouse("moved-global", x, y));
      }, true);
      canvas2.addEventListener("mouseup", (ev) => {
        let { x, y } = coords(ev);
        lastX = x;
        lastY = y;
        buttonDown = false;
        broadcastEvent(new EventMouse("up", x, y));
        broadcastEvent(new EventMouse("up-global", x, y));
      }, true);
      canvas2.addEventListener("wheel", (ev) => {
        ev.preventDefault();
        if (ev.ctrlKey)
          broadcastEvent(new EventZoom(ev.deltaY, lastX, lastY));
        else
          broadcastEvent(new EventPan(ev.deltaX, ev.deltaY, lastX, lastY));
      });
    }
    add(view, alignment) {
      this.views.push(view);
      if (alignment)
        this.aligners.push(new Aligner(this.canvas, view, alignment));
    }
    draw() {
      requestAnimationFrame(() => this.draw());
      let canvas2 = this.canvas;
      var dpr = window.devicePixelRatio || 1;
      var w = Math.round(canvas2.clientWidth * dpr);
      var h = Math.round(canvas2.clientHeight * dpr);
      if (canvas2.width != w || canvas2.height != h) {
        canvas2.width = w;
        canvas2.height = h;
      }
      let ctx = this.ctx;
      ctx.save();
      ctx.scale(dpr, dpr);
      this.ctx.imageSmoothingEnabled = false;
      for (var aligner of this.aligners) {
        aligner.align();
      }
      for (var view of this.views) {
        view.draw(ctx);
      }
      ctx.restore();
    }
  };

  // src/app.ts
  var Frame = class {
    constructor(width, height) {
      let canvas2 = this.canvas = document.createElement("canvas");
      canvas2.width = width;
      canvas2.height = height;
      let ctx = this.ctx = this.canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "red";
      ctx.fillRect(0, 0, canvas2.width, canvas2.height);
    }
  };
  var Viewport = class extends BaseView {
    constructor(canvas2, frame) {
      super(0, 0, 0, 0);
      this.canvas = canvas2;
      this.frame = frame;
    }
    event(event) {
      if (event instanceof EventMouse && event.type == "moved")
        console.log("moved");
      return false;
    }
    layout() {
    }
    draw(ctx) {
      ctx.fillStyle = "gray";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.save();
      ctx.translate(this.canvas.clientWidth / 2 | 0, this.canvas.clientHeight / 2 | 0);
      ctx.drawImage(this.frame.canvas, 0, 0);
      ctx.restore();
    }
  };
  var App = class {
    constructor(canvas2) {
      this.images = {};
      this.ui = new UI(canvas2);
      this.frame = new Frame(32, 32);
      Promise.all([loadImage("sprite.png")]).then((values) => {
        values.forEach((image) => this.images[image.url] = image.image);
        this.ui.add(new Viewport(canvas2, new Frame(32, 32)));
        let tools = new VStack();
        tools.add(new ColorButton(0, 0, 48, 48, { hover: "red", noHover: "green" }, () => alert("Clicked red.")));
        tools.add(new Spacer(0, 32));
        tools.add(new ImageButton(0, 0, this.images["sprite.png"], () => alert("Clicked image.")));
        this.ui.add(tools, { x: "left", y: "center" });
        let menu = new HStack();
        menu.add(new ColorButton(0, 0, 64, 64, "blue", () => alert("Clicked blue.")));
        menu.add(new ColorButton(0, 0, 48, 48, "yellow", () => alert("Clicked yellow.")));
        this.ui.add(menu, { x: "center", y: "top" });
      }).catch((reason) => {
        alert("Couldn't load assets.");
      });
    }
  };

  // src/tinypix.ts
  var canvas = document.getElementById("screen");
  new App(canvas);
})();
//# sourceMappingURL=index.js.map
