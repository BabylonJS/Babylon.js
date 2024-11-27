// eslint-disable-next-line import/no-internal-modules
import type { NodeRenderGraphConnectionPoint, Scene, Nullable, FrameGraph, NodeRenderGraphTeleportOutBlock } from "core/index";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";

/**
 * Defines a block used to teleport a value to an endpoint
 */
export class NodeRenderGraphTeleportInBlock extends NodeRenderGraphBlock {
    private _endpoints: NodeRenderGraphTeleportOutBlock[] = [];

    /** Gets the list of attached endpoints */
    public get endpoints() {
        return this._endpoints;
    }

    /**
     * Create a new NodeRenderGraphTeleportInBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this._isTeleportIn = true;

        this.registerInput("input", NodeRenderGraphBlockConnectionPointTypes.AutoDetect);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphTeleportInBlock";
    }

    /**
     * Gets the input component
     */
    public get input(): NodeRenderGraphConnectionPoint {
        return this._inputs[0];
    }

    public override _dumpCode(uniqueNames: string[], alreadyDumped: NodeRenderGraphBlock[]) {
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
    public override isAnAncestorOf(block: NodeRenderGraphBlock): boolean {
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
    public override getDescendantOfPredicate(predicate: (block: NodeRenderGraphBlock) => boolean): Nullable<NodeRenderGraphBlock> {
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
    public attachToEndpoint(endpoint: NodeRenderGraphTeleportOutBlock) {
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
    public detachFromEndpoint(endpoint: NodeRenderGraphTeleportOutBlock) {
        const index = this._endpoints.indexOf(endpoint);

        if (index !== -1) {
            this._endpoints.splice(index, 1);
            endpoint._outputs[0]._typeConnectionSource = null;
            endpoint._entryPoint = null;
        }
    }

    /**
     * Release resources
     */
    public override dispose() {
        super.dispose();

        for (const endpoint of this._endpoints) {
            this.detachFromEndpoint(endpoint);
        }

        this._endpoints = [];
    }
}

RegisterClass("BABYLON.NodeRenderGraphTeleportInBlock", NodeRenderGraphTeleportInBlock);
