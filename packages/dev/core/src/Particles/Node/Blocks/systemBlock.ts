import { ParticleSystem } from "core/Particles/particleSystem";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../nodeParticleBuildState";

/**
 * Block used to get a system of particles
 */
export class SystemBlock extends NodeParticleBlock {
    /**
     * Create a new SystemBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this._isSystem = true;

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.Particle);
        this.registerInput("capacity", NodeParticleBlockConnectionPointTypes.Int, true, 10);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "SystemBlock";
    }

    /**
     * Gets the particle input component
     */
    public get particle(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the capacity input component
     */
    public get capacity(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Builds the block and return a functional particle system
     * @param state defines the building state
     * @returns the built particle system
     */
    public async createSystemAsync(state: NodeParticleBuildState): Promise<ParticleSystem> {
        const capacity = this.capacity.getConnectedValue(state);
        const system = new ParticleSystem(this.name, capacity, state.scene);

        state.system = system;

        if (this.particle.isConnected) {
            // Process the tree
            await this.particle._ownerBlock.buildAsync(state);
        }

        return system;
    }
}

RegisterClass("BABYLON.SystemBlock", SystemBlock);
