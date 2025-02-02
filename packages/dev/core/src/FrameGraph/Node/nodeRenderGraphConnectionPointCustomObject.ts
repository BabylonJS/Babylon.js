// eslint-disable-next-line import/no-internal-modules
import type { NodeRenderGraphConnectionPointDirection, NodeRenderGraphBlock, Nullable } from "core/index";
import { NodeRenderGraphConnectionPoint } from "./nodeRenderGraphBlockConnectionPoint";
import { NodeRenderGraphConnectionPointCompatibilityStates } from "./Types/nodeRenderGraphTypes";

/**
 * Defines a connection point to be used for points with a custom object type
 */
export class NodeRenderGraphConnectionPointCustomObject<T extends NodeRenderGraphBlock> extends NodeRenderGraphConnectionPoint {
    /**
     * Creates a new connection point
     * @param name defines the connection point name
     * @param ownerBlock defines the block hosting this connection point
     * @param direction defines the direction of the connection point
     * @param _blockType
     * @param _blockName
     */
    public constructor(
        name: string,
        ownerBlock: NodeRenderGraphBlock,
        direction: NodeRenderGraphConnectionPointDirection,
        // @internal
        public _blockType: new (...args: any[]) => T,
        private _blockName: string
    ) {
        super(name, ownerBlock, direction);

        this.needDualDirectionValidation = true;
    }

    public override checkCompatibilityState(connectionPoint: NodeRenderGraphConnectionPoint): NodeRenderGraphConnectionPointCompatibilityStates {
        return connectionPoint instanceof NodeRenderGraphConnectionPointCustomObject && connectionPoint._blockName === this._blockName
            ? NodeRenderGraphConnectionPointCompatibilityStates.Compatible
            : NodeRenderGraphConnectionPointCompatibilityStates.TypeIncompatible;
    }

    public override createCustomInputBlock(): Nullable<[NodeRenderGraphBlock, string]> {
        return [new this._blockType(this._blockName), this.name];
    }
}
