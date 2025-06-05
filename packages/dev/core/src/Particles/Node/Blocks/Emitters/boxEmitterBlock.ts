import { BoxParticleEmitter } from "core/Particles/EmitterTypes/boxParticleEmitter";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import { Vector3 } from "core/Maths/math.vector";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import { BaseEmitterBlock } from "./baseEmitterBlock";

/**
 * Block used to provide a flow of particles emitted from a box shape.
 */
export class BoxEmitterBlock extends BaseEmitterBlock {
    /**
     * Create a new BoxEmitterBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("direction1", NodeParticleBlockConnectionPointTypes.Vector3, true, new Vector3(0, 1.0, 0));
        this.registerInput("direction2", NodeParticleBlockConnectionPointTypes.Vector3, true, new Vector3(0, 1.0, 0));
        this.registerInput("minEmitBox", NodeParticleBlockConnectionPointTypes.Vector3, true, new Vector3(-0.5, -0.5, -0.5));
        this.registerInput("maxEmitBox", NodeParticleBlockConnectionPointTypes.Vector3, true, new Vector3(0.5, 0.5, 0.5));
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "BoxEmitterBlock";
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
     * Gets the minEmitBox input component
     */
    public get minEmitBox(): NodeParticleConnectionPoint {
        return this._inputs[this._inputOffset + 2];
    }

    /**
     * Gets the maxEmitBox input component
     */
    public get maxEmitBox(): NodeParticleConnectionPoint {
        return this._inputs[this._inputOffset + 3];
    }

    /**
     * Builds the block
     * @param state defines the build state
     */
    public override _build(state: NodeParticleBuildState) {
        const system = this._prepare(state);
        const boxEmitter = new BoxParticleEmitter();

        boxEmitter.direction1 = this.direction1.getConnectedValue(state) as Vector3;
        boxEmitter.direction2 = this.direction2.getConnectedValue(state) as Vector3;
        boxEmitter.minEmitBox = this.minEmitBox.getConnectedValue(state) as Vector3;
        boxEmitter.maxEmitBox = this.maxEmitBox.getConnectedValue(state) as Vector3;

        system.particleEmitterType = boxEmitter;

        this.particle._storedValue = system;
    }
}

RegisterClass("BABYLON.BoxEmitterBlock", BoxEmitterBlock);
