import { loadImage } from "./io";
import { UIEvent, BaseView, ColorButton, HStack, ImageButton, Spacer, UI, VStack, EventMouse } from "./ui";
import { StringMap } from "./utils";

export class Frame {
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;

	constructor (width: number, height: number) {
		let canvas = this.canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		let ctx = this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
		ctx.imageSmoothingEnabled = false;

		ctx.fillStyle = "red";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}
}

export class Viewport extends BaseView {
	canvas: HTMLCanvasElement;
	frame: Frame;

	constructor (canvas: HTMLCanvasElement, frame: Frame) {
		super(0, 0, 0, 0);
		this.canvas = canvas;
		this.frame = frame;
	}

	event(event: UIEvent): boolean {
		if (event instanceof EventMouse && event.type == "moved")
			console.log("moved");
		return false;
	}

	layout() {
	}

	draw(ctx: CanvasRenderingContext2D) {
		ctx.fillStyle = "gray";
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		ctx.save();
		ctx.translate((this.canvas.clientWidth / 2) | 0, (this.canvas.clientHeight / 2) | 0);
		ctx.drawImage(this.frame.canvas, 0, 0);
		ctx.restore();
	}
}

export class App {
	ui: UI;
	frame: Frame;
	images: StringMap<HTMLImageElement> = {};

	constructor (canvas: HTMLCanvasElement) {
		this.ui = new UI(canvas);
		this.frame = new Frame(32, 32);
		Promise.all([loadImage("sprite.png")]).then((values) => {
			values.forEach((image) => this.images[image.url] = image.image);

			this.ui.add(new Viewport(canvas, new Frame(32, 32)));

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
}