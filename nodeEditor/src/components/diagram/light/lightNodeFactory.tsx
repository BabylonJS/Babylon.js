import * as SRD from "storm-react-diagrams";
import { LightNodeWidget } from "./lightNodeWidget";
import { LightNodeModel } from "./lightNodeModel";
import * as React from "react";
import { GlobalState } from '../../../globalState';

/**
 * Node factory which creates editor nodes
 */
export class LightNodeFactory extends SRD.AbstractNodeFactory {
    private _globalState: GlobalState;

	/**
	 * Constructs a LightNodeFactory
	 */
    constructor(globalState: GlobalState) {
        super("light");

        this._globalState = globalState;
    }

	/**
	 * Generates a node widget
	 * @param diagramEngine diagram engine
	 * @param node node to generate
	 * @returns node widget jsx
	 */
    generateReactWidget(diagramEngine: SRD.DiagramEngine, node: LightNodeModel): JSX.Element {
        return <LightNodeWidget node={node} globalState={this._globalState} />;
    }

	/**
	 * Gets a new instance of a node model
	 * @returns light node model
	 */
    getNewInstance() {
        return new LightNodeModel();
    }
}