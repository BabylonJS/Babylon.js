import { UniqueIdGenerator } from "../../Misc/uniqueIdGenerator";
import type { NodeGeometryConnectionPoint } from "./nodeGeometryBlockConnectionPoint";

/**
 * Defines a block that can be used inside a node based geometry
 */
export class NodeGeometryBlock {
    private _name = "";

    /** @internal */
    public _inputs = new Array<NodeGeometryConnectionPoint>();
    /** @internal */
    public _outputs = new Array<NodeGeometryConnectionPoint>();

    /**
     * Gets the list of input points
     */
    public get inputs(): NodeGeometryConnectionPoint[] {
        return this._inputs;
    }

    /** Gets the list of output points */
    public get outputs(): NodeGeometryConnectionPoint[] {
        return this._outputs;
    }

    /**
     * Gets or sets the unique id of the node
     */
    public uniqueId: number;

    /**
     * Gets the name of the block
     */
    public get name(): string {
        return this._name;
    }

    /**
     * Checks if the current block is an ancestor of a given block
     * @param block defines the potential descendant block to check
     * @returns true if block is a descendant
     */
    public isAnAncestorOf(block: NodeGeometryBlock): boolean {
        for (const output of this._outputs) {
            if (!output.hasEndpoints) {
                continue;
            }

            for (const endpoint of output.endpoints) {
                if (endpoint.ownerBlock === block) {
                    return true;
                }
                if (endpoint.ownerBlock.isAnAncestorOf(block)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Creates a new NodeMaterialBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        this._name = name;
        this.uniqueId = UniqueIdGenerator.UniqueId;
    }
}
