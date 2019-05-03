import * as SRD from "storm-react-diagrams";
import { TextureNodeWidget } from "./textureNodeWidget";
import { TextureNodeModel } from "./textureNodeModel";
import * as React from "react";

export class TextureNodeFactory extends SRD.AbstractNodeFactory {
	constructor() {
		super("texture");
	}

	generateReactWidget(diagramEngine: SRD.DiagramEngine, node: SRD.NodeModel): JSX.Element {
		return <TextureNodeWidget node={node} />;
	}

	getNewInstance() {
		return new TextureNodeModel();
	}
}