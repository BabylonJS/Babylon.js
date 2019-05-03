import * as SRD from "storm-react-diagrams";
import { GenericNodeWidget } from "./genericNodeWidget";
import { GenericNodeModel } from "./genericNodeModel";
import * as React from "react";

/**
 * Node factory which creates editor nodes
 */
export class GenericNodeFactory extends SRD.AbstractNodeFactory {
	/**
	 * Constructs a GenericNodeFactory
	 */
	constructor() {
		super("generic");
	}

	/**
	 * Generates a node widget
	 * @param diagramEngine diagram engine
	 * @param node node to generate
	 * @returns node widget jsx
	 */
	generateReactWidget(diagramEngine: SRD.DiagramEngine, node: GenericNodeModel): JSX.Element {
		return <GenericNodeWidget node={node} />;
	}

	/**
	 * Gets a new instance of a node model
	 * @returns generic node model
	 */
	getNewInstance() {
		return new GenericNodeModel();
	}
}