function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise<HTMLImageElement>((resolve, reject) => {
		let img = new Image();
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = url;
	});
}

interface View {
	x: number, y: number, width: number, height: number;
	layout(): void;
	draw(ctx: CanvasRenderingContext2D): void;
}

class BaseView implements View {
	constructor (public x: number, public y: number, public width: number, public height: number) {
	}

	layout() {
		throw new Error("Method not implemented.");
	}

	draw(ctx: CanvasRenderingContext2D): void {
		throw new Error("Method not implemented.");
	}

}

class Button extends BaseView {
	constructor (x: number, y: number, width: number, height: number, public color: string) {
		super(x, y, width, height);
	}

	layout() { }

	draw(ctx: CanvasRenderingContext2D): void {
		ctx.fillStyle = this.color;
		ctx.fillRect(this.x, this.y, this.width, this.height);
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

	draw(ctx: CanvasRenderingContext2D): void {
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

	draw(ctx: CanvasRenderingContext2D): void {
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
		Promise.all([foo]).then(() => {
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
		ctx.fillStyle = "gray";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		for (var view of this.views) {
			view.draw(ctx);
		}
		ctx.restore();
	}
}