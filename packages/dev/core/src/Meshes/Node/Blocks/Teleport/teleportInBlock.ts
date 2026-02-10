import type { Nullable } from "core/types";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import type { TeleportOutBlock } from "./teleportOutBlock";

/**
 * Defines a block used to teleport a value to an endpoint
 */
export class TeleportInBlock extends NodeGeometryBlock {
    private _endpoints: TeleportOutBlock[] = [];

    /** Gets the list of attached endpoints */
    public get endpoints() {
        return this._endpoints;
    }

    /**
     * Create a new TeleportInBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);
        this._isTeleportIn = true;

        this.registerInput("input", NodeGeometryBlockConnectionPointTypes.AutoDetect);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "TeleportInBlock";
    }

    /**
     * Gets the input component
     */
    public get input(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /** @internal */
    public override _dumpCode(uniqueNames: string[], alreadyDumped: NodeGeometryBlock[]) {
        let codeString = super._dumpCode(uniqueNames, alreadyDumped);

        for (const endpoint of this.endpoints) {
            if (alreadyDumped.indexOf(endpoint) === -1) {
                codeString += endpoint._dumpCode(uniqueNames, alreadyDumped);
            }
        }

        return codeString;
    }

    /**
     * Checks if the current block is an ancestor of a given type
     * @param type defines the potential type to check
     * @returns true if block is a descendant
     */
    public override isAnAncestorOfType(type: string): boolean {
        if (this.getClassName() === type) {
            return true;
        }

        for (const endpoint of this.endpoints) {
            if (endpoint.isAnAncestorOfType(type)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Checks if the current block is an ancestor of a given block
     * @param block defines the potential descendant block to check
     * @returns true if block is a descendant
     */
    public override isAnAncestorOf(block: NodeGeometryBlock): boolean {
        for (const endpoint of this.endpoints) {
            if (endpoint === block) {
                return true;
            }

            if (endpoint.isAnAncestorOf(block)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get the first descendant using a predicate
     * @param predicate defines the predicate to check
     * @returns descendant or null if none found
     */
    public override getDescendantOfPredicate(predicate: (block: NodeGeometryBlock) => boolean): Nullable<NodeGeometryBlock> {
        if (predicate(this)) {
            return this;
        }

        for (const endpoint of this.endpoints) {
            const descendant = endpoint.getDescendantOfPredicate(predicate);

            if (descendant) {
                return descendant;
            }
        }

        return null;
    }

    /**
     * Add an enpoint to this block
     * @param endpoint define the endpoint to attach to
     */
    public attachToEndpoint(endpoint: TeleportOutBlock) {
        endpoint.detach();

        this._endpoints.push(endpoint);
        endpoint._entryPoint = this;
        endpoint._outputs[0]._typeConnectionSource = this._inputs[0];
        endpoint._tempEntryPointUniqueId = null;
        endpoint.name = "> " + this.name;
    }

    /**
     * Remove enpoint from this block
     * @param endpoint define the endpoint to remove
     */
    public detachFromEndpoint(endpoint: TeleportOutBlock) {
        const index = this._endpoints.indexOf(endpoint);

        if (index !== -1) {
            this._endpoints.splice(index, 1);
            endpoint._outputs[0]._typeConnectionSource = null;
            endpoint._entryPoint = null;
        }
    }

    protected override _buildBlock() {
        for (const endpoint of this._endpoints) {
            endpoint.output._storedFunction = (state) => {
                return this.input.getConnectedValue(state);
            };
        }
    }
}

RegisterClass("BABYLON.TeleportInBlock", TeleportInBlock);
