import type { Particle } from "core/Particles/particle";
import type { ThinParticleSystem } from "core/Particles/thinParticleSystem";
import type { NodeParticleConnectionPoint } from "core/Particles/Node/nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "core/Particles/Node/nodeParticleBuildState";

import { Vector2, Vector4 } from "../../../../Maths/math.vector";
import { RegisterClass } from "core/Misc/typeStore";
import { NodeParticleBlock } from "core/Particles/Node/nodeParticleBlock";
import { NodeParticleBlockConnectionPointTypes } from "core/Particles/Node/Enums/nodeParticleBlockConnectionPointTypes";
import { _ConnectAtTheEnd } from "core/Particles/Queue/executionQueue";

/**
 * Block used to update the remap value of a particle
 */
export class UpdateRemapBlock extends NodeParticleBlock {
    /**
     * Create a new UpdateRemapBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.Particle);
        this.registerInput("remapColor", NodeParticleBlockConnectionPointTypes.Vector2, true);
        this.registerInput("remapAlpha", NodeParticleBlockConnectionPointTypes.Vector2, true);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.Particle);
    }

    /**
     * Gets the particle component
     */
    public get particle(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the remapColor input component
     */
    public get remapColor(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the remapAlpha input component
     */
    public get remapAlpha(): NodeParticleConnectionPoint {
        return this._inputs[2];
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
        return "UpdateRemapBlock";
    }

    /**
     * Builds the block
     * @param state defines the current build state
     */
    public override _build(state: NodeParticleBuildState) {
        const system = this.particle.getConnectedValue(state) as ThinParticleSystem;

        this.output._storedValue = system;

        if (!this.remapColor.isConnected && !this.remapAlpha.isConnected) {
            return;
        }

        const processRemap = (particle: Particle) => {
            state.particleContext = particle;
            state.systemContext = system;

            const colorRemap = this.remapColor.isConnected ? (this.remapColor.getConnectedValue(state) as Vector2) : new Vector2(0, 1);
            const alphaRemap = this.remapAlpha.isConnected ? (this.remapAlpha.getConnectedValue(state) as Vector2) : new Vector2(0, 1);

            if (!particle.remapData) {
                particle.remapData = new Vector4(0, 1, 0, 1);
            }

            if (colorRemap) {
                particle.remapData.x = colorRemap.x;
                particle.remapData.y = colorRemap.y;
            }

            if (alphaRemap) {
                particle.remapData.z = alphaRemap.x;
                particle.remapData.w = alphaRemap.y;
            }
        };

        const remapProcessing = {
            process: processRemap,
            previousItem: null,
            nextItem: null,
        };

        if (system._updateQueueStart) {
            _ConnectAtTheEnd(remapProcessing, system._updateQueueStart);
        } else {
            system._updateQueueStart = remapProcessing;
        }
    }
}

RegisterClass("BABYLON.UpdateRemapBlock", UpdateRemapBlock);
