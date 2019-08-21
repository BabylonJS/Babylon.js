import * as React from "react";
import { DefaultNodeModel } from '../defaultNodeModel';
import { GlobalState } from '../../../globalState';
import { ClampBlock } from 'babylonjs/Materials/Node/Blocks/clampBlock';
import { ClampPropertyTabComponentProps } from './clampNodePropertyComponent';

export class ClampNodeModel extends DefaultNodeModel {

    public get clampBlock(): ClampBlock {
        return this.block as ClampBlock;
    }

	/**
	 * Constructs the node model
	 */
    constructor() {
        super("clamp");
    }

    renderProperties(globalState: GlobalState) {
        return (
            <ClampPropertyTabComponentProps globalState={globalState} remapNode={this} />
        );
    }
}