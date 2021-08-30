import { loadImage } from "./io";
import { ColorButton, HStack, ImageButton, UI, VStack } from "./ui";

export class App {
	ui: UI;
	constructor (canvas: HTMLCanvasElement) {
		this.ui = new UI(canvas);
		Promise.all([loadImage("/sprite.png")]).then((values) => {
			console.log("Loaded all assets");

			let tools = new VStack(0, 48);
			tools.add(new ColorButton(0, 0, 48, 48, { hover: "red", noHover: "green" }, () => alert("Clicked red.")));
			let img = new ImageButton(0, 0, values[0] as HTMLImageElement, () => alert("Clicked image."))
			img.width = img.width * 4;
			img.height = img.height * 4;
			tools.add(img);
			this.ui.add(tools);

			let menu = new HStack(48, 0);
			menu.add(new ColorButton(0, 0, 64, 64, "blue", () => alert("Clicked blue.")));
			menu.add(new ColorButton(0, 0, 48, 48, "yellow", () => alert("Clicked yellow.")));
			this.ui.add(menu);
		});
	}
}