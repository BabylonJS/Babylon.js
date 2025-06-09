import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import { BaseEmitterBlock } from "./baseEmitterBlock";
import { CylinderParticleEmitter } from "core/Particles/EmitterTypes/cylinderParticleEmitter";

/**
 * Block used to provide a flow of particles emitted from a cylinder shape.
 */
export class CylinderEmitterBlock extends BaseEmitterBlock {
    /**
     * Create a new CylinderEmitterBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("radius", NodeParticleBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("height", NodeParticleBlockConnectionPointTypes.Float, true, 1, 0);
        this.registerInput("radiusRange", NodeParticleBlockConnectionPointTypes.Float, true, 1, 0, 1);
        this.registerInput("directionRandomizer", NodeParticleBlockConnectionPointTypes.Float, true, 0, 0, 1);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "CylinderEmitterBlock";
    }

    /**
     * Gets the radius input component
     */
    public get radius(): NodeParticleConnectionPoint {
        return this._inputs[this._inputOffset];
    }

    /**
     * Gets the height input component
     */
    public get height(): NodeParticleConnectionPoint {
        return this._inputs[this._inputOffset + 1];
    }

    /**
     * Gets the radiusRange input component
     */
    public get radiusRange(): NodeParticleConnectionPoint {
        return this._inputs[this._inputOffset + 2];
    }

    /**
     * Gets the directionRandomizer input component
     */
    public get directionRandomizer(): NodeParticleConnectionPoint {
        return this._inputs[this._inputOffset + 3];
    }

    /**
     * Builds the block
     * @param state defines the build state
     */
    public override _build(state: NodeParticleBuildState) {
        const system = this._prepare(state);
        const sphereEmitter = new CylinderParticleEmitter();

        sphereEmitter.radius = this.radius.getConnectedValue(state);
        sphereEmitter.height = this.height.getConnectedValue(state);
        sphereEmitter.radiusRange = this.radiusRange.getConnectedValue(state);
        sphereEmitter.directionRandomizer = this.directionRandomizer.getConnectedValue(state);

        system.particleEmitterType = sphereEmitter;
        this.particle._storedValue = system;
    }
}

RegisterClass("BABYLON.CylinderEmitterBlock", CylinderEmitterBlock);
