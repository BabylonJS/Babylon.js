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

        this.registerInput("input", NodeGeometryBlockConnectionPointTypes.AutoDetect);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "TeleportInBlock";
    }

    /**
     * Gets the input component
     */
    public get input(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    public _dumpCode(uniqueNames: string[], alreadyDumped: NodeGeometryBlock[]) {
        let codeString = super._dumpCode(uniqueNames, alreadyDumped);

        for (const endpoint of this.endpoints) {
            if (alreadyDumped.indexOf(endpoint) === -1) {
                codeString += endpoint._dumpCode(uniqueNames, alreadyDumped);
            }
        }

        return codeString;
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

    protected _buildBlock() {
        for (const endpoint of this._endpoints) {
            endpoint.output._storedFunction = (state) => {
                return this.input.getConnectedValue(state);
            }
        };
    }
}

RegisterClass("BABYLON.TeleportInBlock", TeleportInBlock);
