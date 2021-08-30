function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise<HTMLImageElement>((resolve, reject) => {
		let img = new Image();
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = url;
	});
}

class EventMouse {
	constructor (public type: "down" | "moved" | "dragged" | "up" | "moved-global", public x: number, public y: number) { }

	toLocal(x: number, y: number): EventMouse {
		return new EventMouse(this.type, this.x - x, this.y - y);
	}
}

type UIEvent = EventMouse;

interface View {
	x: number, y: number, width: number, height: number;

	event(event: UIEvent): boolean;
	layout(): void;
	draw(ctx: CanvasRenderingContext2D): void;
}

class BaseView implements View {
	constructor (public x: number, public y: number, public width: number, public height: number) {
	}

	inBounds(x: number, y: number): boolean {
		return this.x <= x &&
			this.y <= y &&
			this.x + this.width > x &&
			this.y + this.height > y;
	}

	event(event: UIEvent): boolean {
		throw new Error("Method not implemented.");
	}

	layout() {
		throw new Error("Method not implemented.");
	}

	draw(ctx: CanvasRenderingContext2D) {
		throw new Error("Method not implemented.");
	}
}

class BaseButton extends BaseView {
	constructor (x: number, y: number, width: number, height: number, public onclick: () => void = () => { }) {
		super(x, y, width, height);
	}

	event(event: UIEvent): boolean {
		if (event instanceof EventMouse) {
			if (!this.inBounds(event.x, event.y)) return false;
			if (event.type === "up" && this.onclick) {
				this.onclick();
				return true;
			}
		}
		return false;
	}

	layout() { }

	draw(ctx: CanvasRenderingContext2D) {
	}
}

class ColorButton extends BaseButton {
	activeColor: string;

	constructor (x: number, y: number, width: number, height: number, public color: string | { hover: string, noHover: string }, public onclick: () => void = () => { }) {
		super(x, y, width, height);
		if (typeof color === "string") this.activeColor = color;
		else this.activeColor = color.hover;
	}

	event(ev: UIEvent): boolean {
		if (ev instanceof EventMouse) {
			if (ev.type === "moved-global" && typeof this.color !== "string") {
				console.log(ev);
				this.activeColor = this.inBounds(ev.x, ev.y) ? this.color.hover : this.color.noHover;
			}
		}
		return super.event(ev);
	}

	draw(ctx: CanvasRenderingContext2D) {
		ctx.fillStyle = this.activeColor;
		ctx.fillRect(this.x, this.y, this.width, this.height);
	}
}

class ImageButton extends BaseButton {
	constructor (x: number, y: number, public image: HTMLImageElement, public onclick: () => void = () => { }) {
		super(x, y, image.width, image.height);
	}

	draw(ctx: CanvasRenderingContext2D) {
		ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
	}
}

class VStack extends BaseView {
	private views: Array<View> = [];

	constructor (x: number, y: number) {
		super(x, y, 0, 0);
	}

	add(view: View): VStack {
		this.views.push(view);
		this.layout();
		return this;
	}

	event(ev: UIEvent): boolean {
		if (ev instanceof EventMouse) {
			if (ev.type != "moved-global" && !this.inBounds(ev.x, ev.y)) return false;
			ev = ev.toLocal(this.x, this.y);
		}
		for (var view of this.views) {
			if (view.event(ev)) return true;
		}
		return false;
	}

	layout() {
		// layout sub-views and calculate
		// max width.
		let maxWidth = 0;
		for (var view of this.views) {
			view.layout();
			maxWidth = Math.max(maxWidth, view.width);
		}
		this.width = maxWidth;

		// position sub-views
		let lastY = 0;
		this.height = 0;
		for (var view of this.views) {
			view.x = 0;
			view.y = lastY;
			lastY += view.height;
			this.height += view.height;
		}
	}

	draw(ctx: CanvasRenderingContext2D) {
		ctx.save();
		ctx.translate(this.x, this.y);
		for (var view of this.views)
			view.draw(ctx);
		ctx.restore();
	}
}

class HStack extends BaseView {
	private views: Array<View> = [];

	constructor (x: number, y: number) {
		super(x, y, 0, 0);
	}

	add(view: View): HStack {
		this.views.push(view);
		this.layout();
		return this;
	}

	event(ev: UIEvent): boolean {
		if (ev instanceof EventMouse) {
			if (ev.type != "moved-global" && !this.inBounds(ev.x, ev.y)) return false;
			ev = ev.toLocal(this.x, this.y);
		}
		for (var view of this.views) {
			if (view.event(ev)) return true;
		}
		return false;
	}

	layout() {
		// layout sub-views and calculate
		// max height.
		let maxHeight = 0;
		for (var view of this.views) {
			view.layout();
			maxHeight = Math.max(maxHeight, view.width);
		}
		this.height = maxHeight;

		// position sub-views
		let lastX = 0;
		this.width = 0;
		for (var view of this.views) {
			view.x = lastX;
			view.y = 0;
			lastX += view.width;
			this.width += view.width;
		}
	}

	draw(ctx: CanvasRenderingContext2D) {
		ctx.save();
		ctx.translate(this.x, this.y);
		for (var view of this.views)
			view.draw(ctx);
		ctx.restore();
	}
}

export class UI {
	readonly ctx: CanvasRenderingContext2D;
	views: Array<View> = [];

	constructor (readonly canvas: HTMLCanvasElement) {
		this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
		this.ctx.imageSmoothingEnabled = false;
		let foo = loadImage("/sprite.png");
		Promise.all([foo]).then((values) => {
			this.setupInput(canvas);

			console.log("Loaded all assets");
			let views = this.views;

			let tools = new VStack(0, 48);
			tools.add(new ColorButton(0, 0, 48, 48, { hover: "red", noHover: "green" }, () => alert("Clicked red.")));
			let img = new ImageButton(0, 0, values[0] as HTMLImageElement, () => alert("Clicked image."))
			img.width = img.width * 4;
			img.height = img.height * 4;
			tools.add(img);
			views.push(tools);

			let menu = new HStack(48, 0);
			menu.add(new ColorButton(0, 0, 64, 64, "blue", () => alert("Clicked blue.")));
			menu.add(new ColorButton(0, 0, 48, 48, "yellow", () => alert("Clicked yellow.")));
			views.push(menu);

			requestAnimationFrame(() => this.draw());
		});
	}

	setupInput(canvas: HTMLCanvasElement) {
		let coords = (ev: MouseEvent) => {
			let rect = canvas.getBoundingClientRect();
			let x = ev.clientX - rect.left;
			let y = ev.clientY - rect.top;
			return { x: x, y: y };
		}

		let broadcastEvent = (ev: UIEvent) => {
			console.log(ev);
			for (var view of this.views) {
				if (view.event(ev)) break;
			}
		}

		var buttonDown = false;

		canvas.addEventListener("mousedown", (ev) => {
			let { x, y } = coords(ev);
			buttonDown = true;
			broadcastEvent(new EventMouse("down", x, y));
		}, true);

		canvas.addEventListener("mousemove", (ev) => {
			let { x, y } = coords(ev);
			broadcastEvent(new EventMouse(buttonDown ? "dragged" : "moved", x, y));
			broadcastEvent(new EventMouse("moved-global", x, y));
		}, true);

		canvas.addEventListener("mouseup", (ev) => {
			let { x, y } = coords(ev);
			buttonDown = false;
			broadcastEvent(new EventMouse("up", x, y));
		}, true);
	}

	draw() {
		requestAnimationFrame(() => this.draw());

		let canvas = this.canvas;
		var dpr = window.devicePixelRatio || 1;
		var w = Math.round(canvas.clientWidth * dpr);
		var h = Math.round(canvas.clientHeight * dpr);
		if (canvas.width != w || canvas.height != h) {
			canvas.width = w;
			canvas.height = h;
		}

		let ctx = this.ctx;
		ctx.save();
		ctx.scale(dpr, dpr);
		this.ctx.imageSmoothingEnabled = false;
		ctx.fillStyle = "gray";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		for (var view of this.views) {
			view.draw(ctx);
		}
		ctx.restore();
	}
}