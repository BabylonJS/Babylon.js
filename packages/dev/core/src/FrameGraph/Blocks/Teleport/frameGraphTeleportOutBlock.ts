import type { Nullable } from "../../../types";
import { RegisterClass } from "../../../Misc/typeStore";
import { FrameGraphBlockConnectionPointTypes } from "../../Enums/frameGraphBlockConnectionPointTypes";
import { FrameGraphBlock } from "../../frameGraphBlock";
import type { FrameGraphConnectionPoint } from "../../frameGraphBlockConnectionPoint";
import type { FrameGraphTeleportInBlock } from "./frameGraphTeleportInBlock";
import type { FrameGraphBuilder } from "../../frameGraphBuilder";
import type { AbstractEngine } from "../../../Engines/abstractEngine";

/**
 * Defines a block used to receive a value from a teleport entry point
 */
export class FrameGraphTeleportOutBlock extends FrameGraphBlock {
    /** @internal */
    public _entryPoint: Nullable<FrameGraphTeleportInBlock> = null;
    /** @internal */
    public _tempEntryPointUniqueId: Nullable<number> = null;

    /**
     * Create a new FrameGraphTeleportOutBlock
     * @param name defines the block name
     * @param engine defines the hosting engine
     */
    public constructor(name: string, engine: AbstractEngine) {
        super(name, engine);

        this._isTeleportOut = true;

        this.registerOutput("output", FrameGraphBlockConnectionPointTypes.BasedOnInput);
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
        return "FrameGraphTeleportOutBlock";
    }

    /**
     * Gets the output component
     */
    public get output(): FrameGraphConnectionPoint {
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

    protected override _customBuildStep(state: FrameGraphBuilder): void {
        if (this.entryPoint) {
            this.entryPoint.build(state);
        }
    }

    public override _dumpCode(uniqueNames: string[], alreadyDumped: FrameGraphBlock[]) {
        let codeString: string = "";
        if (this.entryPoint) {
            if (alreadyDumped.indexOf(this.entryPoint) === -1) {
                codeString += this.entryPoint._dumpCode(uniqueNames, alreadyDumped);
            }
        }

        return codeString + super._dumpCode(uniqueNames, alreadyDumped);
    }

    public override _dumpCodeForOutputConnections(alreadyDumped: FrameGraphBlock[]) {
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
            this.entryPoint.attachToEndpoint(clone as FrameGraphTeleportOutBlock);
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

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this._tempEntryPointUniqueId = serializationObject.entryPoint;
    }
}

RegisterClass("BABYLON.FrameGraphTeleportOutBlock", FrameGraphTeleportOutBlock);
