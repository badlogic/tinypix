(() => {
  // src/ui.ts
  function loadImage(url) {
    return new Promise((resolve, reject) => {
      let img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }
  var BaseView = class {
    constructor(x, y, width, height) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }
    event(event) {
      throw new Error("Method not implemented.");
    }
    layout() {
      throw new Error("Method not implemented.");
    }
    draw(ctx) {
      throw new Error("Method not implemented.");
    }
  };
  var Button = class extends BaseView {
    constructor(x, y, width, height, color) {
      super(x, y, width, height);
      this.color = color;
    }
    event(event) {
      return false;
    }
    layout() {
    }
    draw(ctx) {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  };
  var VStack = class extends BaseView {
    constructor(x, y) {
      super(x, y, 0, 0);
      this.views = [];
    }
    add(view) {
      this.views.push(view);
      this.layout();
      return this;
    }
    event(ev) {
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
    constructor(x, y) {
      super(x, y, 0, 0);
      this.views = [];
    }
    add(view) {
      this.views.push(view);
      this.layout();
      return this;
    }
    event(ev) {
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
  var UI = class {
    constructor(canvas2) {
      this.canvas = canvas2;
      this.views = [];
      this.ctx = canvas2.getContext("2d");
      this.ctx.imageSmoothingEnabled = false;
      let foo = loadImage("/sprite.png");
      Promise.all([foo]).then(() => {
        this.setupEventlisteners(canvas2);
        console.log("Loaded all assets");
        let views = this.views;
        let tools = new VStack(0, 48);
        tools.add(new Button(0, 0, 48, 48, "red"));
        tools.add(new Button(0, 0, 48, 48, "green"));
        views.push(tools);
        let menu = new HStack(48, 0);
        menu.add(new Button(0, 0, 64, 64, "blue"));
        menu.add(new Button(0, 0, 48, 48, "yellow"));
        views.push(menu);
        requestAnimationFrame(() => this.draw());
      });
    }
    setupEventlisteners(canvas2) {
      let coords = (ev) => {
        let rect = canvas2.getBoundingClientRect();
        let x = ev.clientX - rect.left;
        let y = ev.clientY - rect.top;
        return { x, y };
      };
      let broadcastEvent = (ev) => {
        console.log(ev);
        for (var view of this.views) {
          if (view.event(ev))
            break;
        }
      };
      var buttonDown = false;
      canvas2.addEventListener("mousedown", (ev) => {
        let { x, y } = coords(ev);
        buttonDown = true;
        broadcastEvent({ type: "down", x, y });
      }, true);
      canvas2.addEventListener("mousemove", (ev) => {
        let { x, y } = coords(ev);
        broadcastEvent({ type: buttonDown ? "dragged" : "moved", x, y });
      }, true);
      canvas2.addEventListener("mouseup", (ev) => {
        let { x, y } = coords(ev);
        buttonDown = false;
        broadcastEvent({ type: "up", x, y });
      }, true);
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
      ctx.fillStyle = "gray";
      ctx.fillRect(0, 0, canvas2.width, canvas2.height);
      for (var view of this.views) {
        view.draw(ctx);
      }
      ctx.restore();
    }
  };

  // src/tinypix.ts
  var canvas = document.getElementById("screen");
  new UI(canvas);
})();
//# sourceMappingURL=index.js.map
