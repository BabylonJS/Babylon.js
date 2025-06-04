import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import { SphereParticleEmitter } from "core/Particles/EmitterTypes/sphereParticleEmitter";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import { BaseEmitterBlock } from "./baseEmitterBlock";

/**
 * Block used to provide a flow of particles emitted from a sphere shape.
 */
export class SphereEmitterBlock extends BaseEmitterBlock {
    /**
     * Create a new SphereEmitterBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("radius", NodeParticleBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("radiusRange", NodeParticleBlockConnectionPointTypes.Float, true, 1, 0, 1);
        this.registerInput("directionRandomizer", NodeParticleBlockConnectionPointTypes.Float, true, 0, 0, 1);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "SphereEmitterBlock";
    }

    /**
     * Gets the direction1 input component
     */
    public get radius(): NodeParticleConnectionPoint {
        return this._inputs[this._inputOffset];
    }

    /**
     * Gets the direction2 input component
     */
    public get radiusRange(): NodeParticleConnectionPoint {
        return this._inputs[this._inputOffset + 1];
    }

    /**
     * Gets the minEmitBox input component
     */
    public get directionRandomizer(): NodeParticleConnectionPoint {
        return this._inputs[this._inputOffset + 2];
    }

    /**
     * Builds the block
     * @param state defines the build state
     */
    public override async _buildAsync(state: NodeParticleBuildState) {
        const system = this._prepare(state);
        const sphereEmitter = new SphereParticleEmitter();

        sphereEmitter.radius = this.radius.getConnectedValue(state);
        sphereEmitter.radiusRange = this.radiusRange.getConnectedValue(state);
        sphereEmitter.directionRandomizer = this.directionRandomizer.getConnectedValue(state);

        system.particleEmitterType = sphereEmitter;
        this.particle._storedValue = system;
    }
}

RegisterClass("BABYLON.SphereEmitterBlock", SphereEmitterBlock);
