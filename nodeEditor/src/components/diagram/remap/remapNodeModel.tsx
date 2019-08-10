import * as React from "react";
import { DefaultNodeModel } from '../defaultNodeModel';
import { GlobalState } from '../../../globalState';
import { RemapPropertyTabComponentProps } from './remapNodePropertyComponent';
import { RemapBlock } from 'babylonjs/Materials/Node/Blocks/remapBlock';

/**
 * Generic node model which stores information about a node editor block
 */
export class RemapNodeModel extends DefaultNodeModel {

    public get remapBlock(): RemapBlock {
        return this.block as RemapBlock;
    }

	/**
	 * Constructs the node model
	 */
    constructor() {
        super("remap");
    }

    renderProperties(globalState: GlobalState) {
        return (
            <RemapPropertyTabComponentProps globalState={globalState} remapNode={this} />
        );
    }
}