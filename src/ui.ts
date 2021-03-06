
export class EventMouse {
	constructor (public type: "down" | "moved" | "dragged" | "up" | "moved-global", public x: number, public y: number) {
	}

	toLocal(x: number, y: number): EventMouse {
		return new EventMouse(this.type, this.x - x, this.y - y);
	}
}

export class EventKey {

}

export class EventPan {
	constructor (public deltaX: number, public deltaY: number, public x: number, public y: number) { }
}

export class EventZoom {
	constructor (public zoom: number, public x: number, public y: number) { }
}

export type UIEvent = EventMouse | EventZoom | EventPan;

export interface UIEventListener {
	event(event: UIEvent): boolean;
}

export interface View extends UIEventListener {
	x: number, y: number, width: number, height: number;

	layout(): void;
	draw(ctx: CanvasRenderingContext2D): void;
}

export class BaseView implements View {
	constructor (public x: number, public y: number, public width: number, public height: number) {
	}

	inBounds(x: number, y: number): boolean {
		return this.x <= x &&
			this.y <= y &&
			this.x + this.width > x &&
			this.y + this.height > y;
	}

	event(event: UIEvent): boolean {
		return false;
	}

	layout() {
	}

	draw(ctx: CanvasRenderingContext2D) {
	}
}

export class BaseButton extends BaseView {
	mouseDown: boolean = false;

	constructor (x: number, y: number, width: number, height: number, public onclick: () => void = () => { }) {
		super(x, y, width, height);
	}

	event(event: UIEvent): boolean {
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
				if (this.inBounds(event.x, event.y) && this.onclick) this.onclick();
			}

			return true;
		}
		return false;
	}

	layout() { }

	draw(ctx: CanvasRenderingContext2D) {
	}
}

export class ColorButton extends BaseButton {
	protected activeColor: string;

	constructor (x: number, y: number, width: number, height: number, public color: string | { hover: string, noHover: string }, public onclick: () => void = () => { }) {
		super(x, y, width, height);
		if (typeof color === "string") this.activeColor = color;
		else this.activeColor = color.noHover;
	}

	event(ev: UIEvent): boolean {
		if (ev instanceof EventMouse) {
			if (ev.type === "moved-global" && typeof this.color !== "string") {
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

export class ImageButton extends BaseButton {
	constructor (x: number, y: number, protected image: HTMLImageElement, public onclick: () => void = () => { }) {
		super(x, y, 0, 0);
		this.setImage(image);
	}

	setImage(image: HTMLImageElement) {
		this.image = image;
		this.width = image.width;
		this.height = image.height;
	}

	draw(ctx: CanvasRenderingContext2D) {
		ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
	}
}

export class VStack extends BaseView {
	private views: Array<View> = [];

	constructor (x: number = 0, y: number = 0) {
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

export class HStack extends BaseView {
	private views: Array<View> = [];

	constructor (x: number = 0, y: number = 0) {
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

export class Spacer extends BaseView {
	constructor (width: number, height: number) {
		super(0, 0, width, height);
	}
}

type AlignmentX = "left" | "center" | "right";
type AlignmentY = "top" | "center" | "bottom";
interface Alignment { x: AlignmentX, y: AlignmentY };

class Aligner {
	constructor (private canvas: HTMLCanvasElement, private view: View, private alignment: Alignment) {
	}

	align() {
		let view = this.view;
		let canvas = this.canvas;
		switch (this.alignment.x) {
			case "left": view.x = 0; break;
			case "center": view.x = ((canvas.clientWidth / 2) | 0) - ((view.width / 2) | 0); break;
			case "right": view.x = canvas.clientWidth - view.width;
		}

		switch (this.alignment.y) {
			case "top": view.y = 0; break;
			case "center": view.y = ((canvas.clientHeight / 2) | 0) - ((view.height / 2) | 0); break;
			case "bottom": view.y = canvas.clientHeight - view.height; break;
		}
	}
}

export class UI {
	private ctx: CanvasRenderingContext2D;
	private views: Array<View> = [];
	private aligners: Array<Aligner> = [];
	private eventListeners: Array<UIEventListener> = [];

	constructor (private canvas: HTMLCanvasElement) {
		this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
		this.ctx.imageSmoothingEnabled = false;
		requestAnimationFrame(() => this.draw());

		let coords = (ev: MouseEvent) => {
			let rect = canvas.getBoundingClientRect();
			let x = ev.clientX - rect.left;
			let y = ev.clientY - rect.top;
			return { x: x, y: y };
		}

		let broadcastEvent = (ev: UIEvent) => {
			// Broadcast event in reverse view draw order.
			// The view added last will first receive the UI event.
			for (var i = this.views.length - 1; i >= 0; i--) {
				let view = this.views[i];
				if (view.event(ev)) return;
			}
		}

		var buttonDown = false;
		var lastX = 0, lastY = 0;

		canvas.addEventListener("mousedown", (ev) => {
			let { x, y } = coords(ev);
			lastX = x; lastY = y;
			buttonDown = true;
			broadcastEvent(new EventMouse("down", x, y));
		}, true);

		canvas.addEventListener("mousemove", (ev) => {
			let { x, y } = coords(ev);
			lastX = x; lastY = y;
			broadcastEvent(new EventMouse(buttonDown ? "dragged" : "moved", x, y));
			broadcastEvent(new EventMouse("moved-global", x, y));
		}, true);

		canvas.addEventListener("mouseup", (ev) => {
			let { x, y } = coords(ev);
			lastX = x; lastY = y;
			buttonDown = false;
			broadcastEvent(new EventMouse("up", x, y));
			broadcastEvent(new EventMouse("up-global", x, y));
		}, true);

		canvas.addEventListener("wheel", (ev) => {
			ev.preventDefault();
			// Everything is fucking terrible https://dev.to/danburzo/pinch-me-i-m-zooming-gestures-in-the-dom-a0e
			if (ev.ctrlKey) // <----- WTFFFFFFFFFFFFFF
				broadcastEvent(new EventZoom(ev.deltaY, lastX, lastY));
			else
				broadcastEvent(new EventPan(ev.deltaX, ev.deltaY, lastX, lastY));
		})
	}

	add(view: View, alignment?: Alignment) {
		this.views.push(view);
		if (alignment) this.aligners.push(new Aligner(this.canvas, view, alignment));
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

		for (var aligner of this.aligners) {
			aligner.align();
		}

		for (var view of this.views) {
			view.draw(ctx);
		}
		ctx.restore();
	}
}