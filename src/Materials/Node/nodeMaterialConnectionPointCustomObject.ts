import { NodeMaterialBlock } from './nodeMaterialBlock';
import { NodeMaterialConnectionPoint, NodeMaterialConnectionPointDirection, NodeMaterialConnectionPointCompatibilityStates } from './nodeMaterialBlockConnectionPoint';
import { Nullable } from '../../types';

/**
 * Defines a connection point to be used for points with a custom object type
 */
export class NodeMaterialConnectionPointCustomObject<T extends NodeMaterialBlock> extends NodeMaterialConnectionPoint {

    /**
     * Creates a new connection point
     * @param name defines the connection point name
     * @param ownerBlock defines the block hosting this connection point
     * @param direction defines the direction of the connection point
     */
    public constructor(name: string, ownerBlock: NodeMaterialBlock, direction: NodeMaterialConnectionPointDirection,
            private _blockType: new (...args: any[]) => T, private _blockName: string, private _nameForCheking?: string) {
        super(name, ownerBlock, direction);

        if (!this._nameForCheking) {
            this._nameForCheking = name;
        }

        this.needDualDirectionValidation = true;
    }

    /**
     * Gets a number indicating if the current point can be connected to another point
     * @param connectionPoint defines the other connection point
     * @returns a number defining the compatibility state
     */
    public checkCompatibilityState(connectionPoint: NodeMaterialConnectionPoint): NodeMaterialConnectionPointCompatibilityStates {
        return connectionPoint instanceof NodeMaterialConnectionPointCustomObject && connectionPoint.name === this._nameForCheking ?
                NodeMaterialConnectionPointCompatibilityStates.Compatible : NodeMaterialConnectionPointCompatibilityStates.TypeIncompatible;
    }

    /**
     * Creates a block suitable to be used as an input for this input point.
     * If null is returned, a block based on the point type will be created.
     * @returns The returned string parameter is the name of the output point of NodeMaterialBlock (first parameter of the returned array) that can be connected to the input
     */
    public createCustomInputBlock(): Nullable<[NodeMaterialBlock, string]> {
        return [new this._blockType(this._blockName), this.name];
    }

}
