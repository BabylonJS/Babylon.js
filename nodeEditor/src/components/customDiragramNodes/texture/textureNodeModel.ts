import { NodeModel } from "storm-react-diagrams";
import { TexturePortModel } from './texturePortModel';

export class TextureNodeModel extends NodeModel {
	constructor() {
		super("texture");
		this.addPort(new TexturePortModel("right"));
	}
}