/** This file must only contain pure code and pure imports */

import { type Particle } from "core/Particles/particle";
import { type ThinParticleSystem } from "core/Particles/thinParticleSystem.pure";
import { type NodeParticleConnectionPoint } from "core/Particles/Node/nodeParticleBlockConnectionPoint";
import { type NodeParticleBuildState } from "core/Particles/Node/nodeParticleBuildState";

import { NodeParticleBlock } from "core/Particles/Node/nodeParticleBlock";
import { NodeParticleBlockConnectionPointTypes } from "core/Particles/Node/Enums/nodeParticleBlockConnectionPointTypes";
import { _ConnectAtTheEnd } from "core/Particles/Queue/executionQueue";
import { RegisterClass } from "core/Misc/typeStore";

/**
 * Block used to update the size of a particle
 */
export class UpdateSizeBlock extends NodeParticleBlock {
    /**
     * Create a new UpdateSizeBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.Particle);
        this.registerInput("size", NodeParticleBlockConnectionPointTypes.Float);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.Particle);
    }

    /**
     * Gets the particle component
     */
    public get particle(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the size input component
     */
    public get size(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "UpdateSizeBlock";
    }

    /**
     * Builds the block
     * @param state defines the current build state
     */
    public override _build(state: NodeParticleBuildState) {
        const system = this.particle.getConnectedValue(state) as ThinParticleSystem;

        this.output._storedValue = system;

        if (!this.size.isConnected) {
            return;
        }

        const processSize = (particle: Particle) => {
            state.particleContext = particle;
            state.systemContext = system;
            particle.size = this.size.getConnectedValue(state) as number;
        };

        const sizeProcessing = {
            process: processSize,
            previousItem: null,
            nextItem: null,
        };

        if (system._updateQueueStart) {
            _ConnectAtTheEnd(sizeProcessing, system._updateQueueStart);
        } else {
            system._updateQueueStart = sizeProcessing;
        }
    }
}

let _Registered = false;
/**
 * Register side effects for updateSizeBlock.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterUpdateSizeBlock(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass("BABYLON.UpdateSizeBlock", UpdateSizeBlock);
}
