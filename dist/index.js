(() => {
  // src/ui.ts
  async function loadImage(url) {
    return new Promise((resolve, reject) => {
      let img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }
  async function initUI(canvas, ctx) {
    loadImage("/sprite.png").then((img) => {
      alert(`${img.width}x${img.height}`);
    }).catch(() => {
      alert("Couldn't load UI assets.");
    });
  }

  // src/tinypix.ts
  function init() {
    let canvas = document.getElementById("screen");
    let ctx = canvas.getContext("2d");
    if (ctx != null)
      initUI(canvas, ctx);
  }
  init();
})();
//# sourceMappingURL=index.js.map
