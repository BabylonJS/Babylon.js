import { DefaultNodeModel } from '../defaultNodeModel';
import { GlobalState } from '../../../globalState';
import { GradientBlock } from 'babylonjs/Materials/Node/Blocks/gradientBlock';

export class GradientNodeModel extends DefaultNodeModel {

    public get gradientBlock(): GradientBlock {
        return this.block as GradientBlock;
    }

	/**
	 * Constructs the node model
	 */
    constructor() {
        super("gradient");
    }

    renderProperties(globalState: GlobalState) {
        return null;
    }
}