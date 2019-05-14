import * as SRD from "storm-react-diagrams";
import { GenericNodeWidget } from "./genericNodeWidget";
import { GenericNodeModel } from "./genericNodeModel";
import * as React from "react";
import { GlobalState } from '../../../globalState';

/**
 * Node factory which creates editor nodes
 */
export class GenericNodeFactory extends SRD.AbstractNodeFactory {
    private _globalState: GlobalState;

	/**
	 * Constructs a GenericNodeFactory
	 */
    constructor(globalState: GlobalState) {
        super("generic");

        this._globalState = globalState;
    }

	/**
	 * Generates a node widget
	 * @param diagramEngine diagram engine
	 * @param node node to generate
	 * @returns node widget jsx
	 */
    generateReactWidget(diagramEngine: SRD.DiagramEngine, node: GenericNodeModel): JSX.Element {
        return <GenericNodeWidget node={node} globalState={this._globalState} />;
    }

	/**
	 * Gets a new instance of a node model
	 * @returns generic node model
	 */
    getNewInstance() {
        return new GenericNodeModel();
    }
}