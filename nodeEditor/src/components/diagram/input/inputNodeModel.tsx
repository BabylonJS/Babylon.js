import * as React from "react";
import { DefaultNodeModel } from '../defaultNodeModel';
import { GlobalState } from '../../../globalState';
import { InputPropertyTabComponentProps } from './inputNodePropertyComponent';
import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';
import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPointTypes';

/**
 * Generic node model which stores information about a node editor block
 */
export class InputNodeModel extends DefaultNodeModel {
    public outputType: NodeMaterialBlockConnectionPointTypes;

    public get inputBlock(): InputBlock {
        return this.block as InputBlock;
    }

	/**
	 * Constructs the node model
	 */
    constructor() {
        super("input");
    }

    renderProperties(globalState: GlobalState) {
        return (
            <InputPropertyTabComponentProps globalState={globalState} inputNode={this} />
        );
    }
}