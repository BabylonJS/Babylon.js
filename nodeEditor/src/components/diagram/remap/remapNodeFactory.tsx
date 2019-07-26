import * as SRD from "storm-react-diagrams";
import * as React from "react";
import { GlobalState } from '../../../globalState';
import { RemapNodeModel } from './remapNodeModel';
import { RemapNodeWidget } from './remapNodeWidget';

/**
 * Node factory which creates editor nodes
 */
export class RemapNodeFactory extends SRD.AbstractNodeFactory {
    private _globalState: GlobalState;

	/**
	 * Constructs a GenericNodeFactory
	 */
    constructor(globalState: GlobalState) {
        super("remap");

        this._globalState = globalState;
    }

	/**
	 * Generates a node widget
	 * @param diagramEngine diagram engine
	 * @param node node to generate
	 * @returns node widget jsx
	 */
    generateReactWidget(diagramEngine: SRD.DiagramEngine, node: RemapNodeModel): JSX.Element {
        return <RemapNodeWidget node={node} globalState={this._globalState} />;
    }

	/**
	 * Gets a new instance of a node model
	 * @returns input node model
	 */
    getNewInstance() {
        return new RemapNodeModel();
    }
}