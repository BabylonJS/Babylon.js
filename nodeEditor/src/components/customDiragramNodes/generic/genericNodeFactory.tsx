import * as SRD from "storm-react-diagrams";
import { GenericNodeWidget } from "./genericNodeWidget";
import { GenericNodeModel } from "./genericNodeModel";
import * as React from "react";

export class GenericNodeFactory extends SRD.AbstractNodeFactory {
	constructor() {
		super("generic");
	}

	generateReactWidget(diagramEngine: SRD.DiagramEngine, node: GenericNodeModel): JSX.Element {
		return <GenericNodeWidget node={node} />;
	}

	getNewInstance() {
		return new GenericNodeModel();
	}
}