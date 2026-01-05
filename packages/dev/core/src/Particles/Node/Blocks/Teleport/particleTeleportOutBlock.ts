import type { Nullable } from "../../../../types";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { ParticleTeleportInBlock } from "./particleTeleportInBlock";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";

/**
 * Defines a block used to receive a value from a teleport entry point
 */
export class ParticleTeleportOutBlock extends NodeParticleBlock {
    /** @internal */
    public _entryPoint: Nullable<ParticleTeleportInBlock> = null;
    /** @internal */
    public _tempEntryPointUniqueId: Nullable<number> = null;

    /**
     * Create a new ParticleTeleportOutBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this._isTeleportOut = true;

        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.BasedOnInput);
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
        return "ParticleTeleportOutBlock";
    }

    /**
     * Gets the output component
     */
    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    /** Detach from entry point */
    public detach() {
        if (!this._entryPoint) {
            return;
        }
        this._entryPoint.detachFromEndpoint(this);
    }

    public override _build() {
        // Do nothing
        // All work done by the emitter
    }

    protected override _customBuildStep(state: NodeParticleBuildState): void {
        if (this.entryPoint) {
            this.entryPoint.build(state);
        }
    }

    /**
     * Clone the current block to a new identical block
     * @returns a copy of the current block
     */
    public override clone() {
        const clone = super.clone();

        if (this.entryPoint) {
            this.entryPoint.attachToEndpoint(clone as ParticleTeleportOutBlock);
        }

        return clone;
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

RegisterClass("BABYLON.ParticleTeleportOutBlock", ParticleTeleportOutBlock);
