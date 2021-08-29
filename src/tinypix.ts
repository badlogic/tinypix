import { initUI } from "./ui";

function init() {
	let canvas = document.getElementById("screen") as HTMLCanvasElement;
	let ctx = canvas.getContext("2d");
	if (ctx != null) initUI(canvas, ctx);
}

init();