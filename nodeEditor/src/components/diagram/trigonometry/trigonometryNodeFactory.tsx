import * as SRD from "storm-react-diagrams";
import * as React from "react";
import { GlobalState } from '../../../globalState';
import { TrigonometryNodeModel } from './trigonometryNodeModel';
import { TrigonometryNodeWidget } from './trigonometryNodeWidget';

/**
 * Node factory which creates editor nodes
 */
export class TrigonometryNodeFactory extends SRD.AbstractNodeFactory {
    private _globalState: GlobalState;

	/**
	 * Constructs a GenericNodeFactory
	 */
    constructor(globalState: GlobalState) {
        super("trigonometry");

        this._globalState = globalState;
    }

	/**
	 * Generates a node widget
	 * @param diagramEngine diagram engine
	 * @param node node to generate
	 * @returns node widget jsx
	 */
    generateReactWidget(diagramEngine: SRD.DiagramEngine, node: TrigonometryNodeModel): JSX.Element {
        return <TrigonometryNodeWidget node={node} globalState={this._globalState} />;
    }

	/**
	 * Gets a new instance of a node model
	 * @returns input node model
	 */
    getNewInstance() {
        return new TrigonometryNodeModel();
    }
}