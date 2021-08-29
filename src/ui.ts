async function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise<HTMLImageElement>((resolve, reject) => {
		let img = new Image();
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = url;
	});
}

export async function initUI(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
	loadImage("/sprite.png").then((img) => {
		alert(`${img.width}x${img.height}`);
	}).catch(() => {
		alert("Couldn't load UI assets.");
	});
}