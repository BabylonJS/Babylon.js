import * as React from "react";
import { DefaultNodeModel } from '../defaultNodeModel';
import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
import { GlobalState } from '../../../globalState';
import { InputPropertyTabComponentProps } from './inputNodePropertyComponent';

/**
 * Generic node model which stores information about a node editor block
 */
export class InputNodeModel extends DefaultNodeModel {
    public connection?: NodeMaterialConnectionPoint;

	/**
	 * Constructs the node model
	 */
    constructor() {
        super("input");
    }

    renderProperties(globalState: GlobalState) {
        if (!this.connection) {
            return null;
        }

        return (
            <InputPropertyTabComponentProps globalState={globalState} inputNode={this} />
        );
    }
}