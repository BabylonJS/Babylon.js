import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import type { NodeMaterialTeleportOutBlock } from "./teleportOutBlock";

/**
 * Defines a block used to teleport a value to an endpoint
 */
export class NodeMaterialTeleportInBlock extends NodeMaterialBlock {
    private _endpoints: NodeMaterialTeleportOutBlock[] = [];

    /** Gets the list of attached endpoints */
    public get endpoints() {
        return this._endpoints;
    }

    /**
     * Gets or sets the target of the block
     */
    public get target() {
        const input = this._inputs[0];
        if (input.isConnected) {
            const block = input.connectedPoint!.ownerBlock;
            if (block.target !== NodeMaterialBlockTargets.VertexAndFragment) {
                return block.target;
            }

            if (input.connectedPoint!.target !== NodeMaterialBlockTargets.VertexAndFragment) {
                return input.connectedPoint!.target;
            }
        }

        return this._target;
    }

    public set target(value: NodeMaterialBlockTargets) {
        if ((this._target & value) !== 0) {
            return;
        }
        this._target = value;
    }

    /**
     * Create a new NodeMaterialTeleportInBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.AutoDetect);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "NodeMaterialTeleportInBlock";
    }

    /**
     * Gets the input component
     */
    public get input(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * @returns a boolean indicating that this connection will be used in the fragment shader
     */
    public isConnectedInFragmentShader() {
        return this.endpoints.some((e) => e.output.isConnectedInFragmentShader);
    }

    public _dumpCode(uniqueNames: string[], alreadyDumped: NodeMaterialBlock[]) {
        let codeString = super._dumpCode(uniqueNames, alreadyDumped);

        for (const endpoint of this.endpoints) {
            if (alreadyDumped.indexOf(endpoint) === -1) {
                codeString += endpoint._dumpCode(uniqueNames, alreadyDumped);
            }
        }

        return codeString;
    }

    /**
     * Checks if the current block is an ancestor of a given block
     * @param block defines the potential descendant block to check
     * @returns true if block is a descendant
     */
    public isAnAncestorOf(block: NodeMaterialBlock): boolean {
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
     * Add an enpoint to this block
     * @param endpoint define the endpoint to attach to
     */
    public attachToEndpoint(endpoint: NodeMaterialTeleportOutBlock) {
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
    public detachFromEndpoint(endpoint: NodeMaterialTeleportOutBlock) {
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
    public dispose() {
        super.dispose();

        for (const endpoint of this._endpoints) {
            this.detachFromEndpoint(endpoint);
        }

        this._endpoints = [];
    }
}

RegisterClass("BABYLON.NodeMaterialTeleportInBlock", NodeMaterialTeleportInBlock);
