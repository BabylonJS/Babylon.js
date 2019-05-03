import { LinkModel, PortModel, DefaultLinkModel } from "storm-react-diagrams";

export class TexturePortModel extends PortModel {
	position: string | "top" | "bottom" | "left" | "right";

	constructor(pos: string = "top") {
		super(pos, "texture");
		this.position = pos;
	}

	// serialize() {
	// 	return _.merge(super.serialize(), {
	// 		position: this.position
	// 	});
	// }

	// deSerialize(data: any, engine: DiagramEngine) {
	// 	super.deSerialize(data, engine);
	// 	this.position = data.position;
	// }

	createLinkModel(): LinkModel {
		return new DefaultLinkModel();
	}
}