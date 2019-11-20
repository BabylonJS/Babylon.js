import { DefaultNodeModel } from '../defaultNodeModel';
import { GlobalState } from '../../../globalState';
import { TrigonometryBlock } from 'babylonjs/Materials/Node/Blocks/trigonometryBlock';

/**
 * Generic node model which stores information about a node editor block
 */
export class TrigonometryNodeModel extends DefaultNodeModel {

    public get trigonometryBlock(): TrigonometryBlock {
        return this.block as TrigonometryBlock;
    }

	/**
	 * Constructs the node model
	 */
    constructor() {
        super("trigonometry");
    }

    renderProperties(globalState: GlobalState) {
        return null;
    }
}