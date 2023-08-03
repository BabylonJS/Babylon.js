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
     * Add an enpoint to this block
     * @param endpoint define the endpoint to attach to
     */
    public attachToEndpoint(endpoint: NodeMaterialTeleportOutBlock) {
        endpoint.detach();

        this._endpoints.push(endpoint);
        endpoint._entryPoint = this;
        endpoint._outputs[0]._typeConnectionSource = this._inputs[0];
        endpoint._tempEntryPointUniqueId = null;
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
}

RegisterClass("BABYLON.NodeMaterialTeleportInBlock", NodeMaterialTeleportInBlock);
