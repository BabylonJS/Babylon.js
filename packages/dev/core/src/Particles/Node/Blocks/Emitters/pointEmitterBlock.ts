import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import { Vector3 } from "core/Maths/math.vector";
import { PointParticleEmitter } from "core/Particles/EmitterTypes/pointParticleEmitter";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import { BaseEmitterBlock } from "./baseEmitterBlock";

/**
 * Block used to provide a flow of particles emitted from a point.
 */
export class PointEmitterBlock extends BaseEmitterBlock {
    /**
     * Create a new PointEmitterBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("direction1", NodeParticleBlockConnectionPointTypes.Vector3, true, new Vector3(0, 1.0, 0));
        this.registerInput("direction2", NodeParticleBlockConnectionPointTypes.Vector3, true, new Vector3(0, 1.0, 0));
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "PointEmitterBlock";
    }

    /**
     * Gets the direction1 input component
     */
    public get direction1(): NodeParticleConnectionPoint {
        return this._inputs[this._inputOffset];
    }

    /**
     * Gets the direction2 input component
     */
    public get direction2(): NodeParticleConnectionPoint {
        return this._inputs[this._inputOffset + 1];
    }

    /**
     * Builds the block
     * @param state defines the build state
     */
    public override _build(state: NodeParticleBuildState) {
        const system = this._prepare(state);
        const pointEmitter = new PointParticleEmitter();

        pointEmitter.direction1 = this.direction1.getConnectedValue(state) as Vector3;
        pointEmitter.direction2 = this.direction2.getConnectedValue(state) as Vector3;

        system.particleEmitterType = pointEmitter;

        this.particle._storedValue = system;
    }
}

RegisterClass("BABYLON.PointEmitterBlock", PointEmitterBlock);
