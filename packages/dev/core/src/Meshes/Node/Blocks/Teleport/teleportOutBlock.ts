import type { Nullable } from "../../../../types";
import { GetClass, RegisterClass } from "../../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import type { TeleportInBlock } from "./teleportInBlock";

/**
 * Defines a block used to receive a value from an teleport entry point
 */
export class TeleportOutBlock extends NodeGeometryBlock {
    /** @hidden */
    public _entryPoint: Nullable<TeleportInBlock> = null;
    /** @hidden */
    public _tempEntryPointUniqueId: Nullable<number> = null;

    /**
     * Create a new TeleportOutBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.BasedOnInput);
    }

    /**
     * Gets the entry point
     */
    public get entryPoint() {
        return this._entryPoint;
    }        

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "TeleportOutBlock";
    }

    /**
     * Gets the output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    /** Detach from entry point */
    public detach() {
        if (!this._entryPoint) {
            return;
        }
        
        this._entryPoint.detachFromEndpoint(this);
    }

    protected _buildBlock() {
        // Do nothing
        // All work done by the emitter
    }

    /**
     * Clone the current block to a new identical block
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @returns a copy of the current block
     */
    public clone(rootUrl: string = "") {
        const clone = super.clone(rootUrl);

        if (this.entryPoint) {
            this.entryPoint.attachToEndpoint(clone as any as TeleportOutBlock);
        }

        return clone;
    }

    protected _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();
        
        if (this.entryPoint) {
            codeString += `${this.entryPoint._codeVariableName}.attachToEndpoint(${this._codeVariableName});\r\n`;
        }
        return codeString;
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.entryPoint = this.entryPoint?.uniqueId ?? "";

        return serializationObject;
    }

    public _deserialize(serializationObject: any, rootUrl: string) {
        super._deserialize(serializationObject, rootUrl);

        this._tempEntryPointUniqueId = serializationObject.entryPoint;
    }    
}

RegisterClass("BABYLON.TeleportOutBlock", TeleportOutBlock);
