import type { Nullable } from "../../../../types";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import type { TeleportInBlock } from "./teleportInBlock";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";

/**
 * Defines a block used to receive a value from a teleport entry point
 */
export class TeleportOutBlock extends NodeGeometryBlock {
    /** @internal */
    public _entryPoint: Nullable<TeleportInBlock> = null;
    /** @internal */
    public _tempEntryPointUniqueId: Nullable<number> = null;

    /**
     * Create a new TeleportOutBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this._isTeleportOut = true;

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
    public override getClassName() {
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

    protected override _buildBlock() {
        // Do nothing
        // All work done by the emitter
    }

    protected override _customBuildStep(state: NodeGeometryBuildState): void {
        if (this.entryPoint) {
            this.entryPoint.build(state);
        }
    }

    /** @internal */
    public override _dumpCode(uniqueNames: string[], alreadyDumped: NodeGeometryBlock[]) {
        let codeString: string = "";
        if (this.entryPoint) {
            if (alreadyDumped.indexOf(this.entryPoint) === -1) {
                codeString += this.entryPoint._dumpCode(uniqueNames, alreadyDumped);
            }
        }

        return codeString + super._dumpCode(uniqueNames, alreadyDumped);
    }

    /** @internal */
    public override _dumpCodeForOutputConnections(alreadyDumped: NodeGeometryBlock[]) {
        let codeString = super._dumpCodeForOutputConnections(alreadyDumped);

        if (this.entryPoint) {
            codeString += this.entryPoint._dumpCodeForOutputConnections(alreadyDumped);
        }

        return codeString;
    }

    /**
     * Clone the current block to a new identical block
     * @returns a copy of the current block
     */
    public override clone() {
        const clone = super.clone();

        if (this.entryPoint) {
            this.entryPoint.attachToEndpoint(clone as TeleportOutBlock);
        }

        return clone;
    }

    protected override _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();
        if (this.entryPoint) {
            codeString += `${this.entryPoint._codeVariableName}.attachToEndpoint(${this._codeVariableName});\n`;
        }
        return codeString;
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.entryPoint = this.entryPoint?.uniqueId ?? "";

        return serializationObject;
    }

    /** @internal */
    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this._tempEntryPointUniqueId = serializationObject.entryPoint;
    }
}

RegisterClass("BABYLON.TeleportOutBlock", TeleportOutBlock);
