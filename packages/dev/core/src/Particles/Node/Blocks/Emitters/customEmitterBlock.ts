import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import { Vector3 } from "core/Maths/math.vector";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import { BaseEmitterBlock } from "./baseEmitterBlock";
import { CustomParticleEmitter } from "core/Particles/EmitterTypes";

/**
 * Block used to provide a flow of particles emitted from a custom position.
 */
export class CustomEmitterBlock extends BaseEmitterBlock {
    /**
     * Create a new CustomEmitterBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("position", NodeParticleBlockConnectionPointTypes.Vector3, true, new Vector3(0, 0, 0));
        this.registerInput("direction", NodeParticleBlockConnectionPointTypes.Vector3, true, new Vector3(0, 1.0, 0));
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "CustomEmitterBlock";
    }

    /**
     * Gets the position input component
     */
    public get position(): NodeParticleConnectionPoint {
        return this._inputs[this._inputOffset];
    }

    /**
     * Gets the direction input component
     */
    public get direction(): NodeParticleConnectionPoint {
        return this._inputs[this._inputOffset + 1];
    }

    /**
     * Builds the block
     * @param state defines the build state
     */
    public override _build(state: NodeParticleBuildState) {
        const system = this._prepare(state);
        const customEmitter = new CustomParticleEmitter();

        customEmitter.particlePositionGenerator = (index, particle, outPosition) => {
            const position = this.position.getConnectedValue(state);
            outPosition.copyFrom(position);
        };

        customEmitter.particleDirectionGenerator = (index, particle, outDestination) => {
            const direction = this.direction.getConnectedValue(state);
            outDestination.copyFrom(direction);
        };

        system.particleEmitterType = customEmitter;

        this.particle._storedValue = system;
    }
}

RegisterClass("BABYLON.CustomEmitterBlock", CustomEmitterBlock);
