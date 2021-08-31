export interface LoadedImage {
	url: string;
	image: HTMLImageElement;
}

export function loadImage(url: string): Promise<LoadedImage> {
	return new Promise<LoadedImage>((resolve, reject) => {
		let img = new Image();
		img.onload = () => resolve({ url: url, image: img });
		img.onerror = reject;
		img.src = url;
	});
}
