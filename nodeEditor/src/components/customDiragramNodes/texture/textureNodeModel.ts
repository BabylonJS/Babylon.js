import { NodeModel } from "storm-react-diagrams";
import { TexturePortModel } from './texturePortModel';

export class TextureNodeModel extends NodeModel {
	constructor() {
		super("texture");
		this.addPort(new TexturePortModel("right"));
		// this.addPort(new DiamondPortModel("left"));
		// this.addPort(new DiamondPortModel("bottom"));
		// this.addPort(new DiamondPortModel("right"));
	}
}