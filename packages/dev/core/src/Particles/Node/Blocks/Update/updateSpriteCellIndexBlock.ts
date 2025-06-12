import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import type { ThinParticleSystem } from "core/Particles/thinParticleSystem";
import type { Particle } from "core/Particles/particle";
import { _ConnectAtTheEnd } from "core/Particles/Queue/executionQueue";

/**
 * Block used to update the sprite cell index of a particle
 */
export class UpdateSpriteCellIndexBlock extends NodeParticleBlock {
    /**
     * Create a new UpdateSpriteCellIndexBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.Particle);
        this.registerInput("cellIndex", NodeParticleBlockConnectionPointTypes.Int);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.Particle);

        this.cellIndex.acceptedConnectionPointTypes = [NodeParticleBlockConnectionPointTypes.Float];
    }

    /**
     * Gets the particle component
     */
    public get particle(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the cellIndex input component
     */
    public get cellIndex(): NodeParticleConnectionPoint {
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
        return "UpdateSpriteCellIndexBlock";
    }

    /**
     * Builds the block
     * @param state defines the current build state
     */
    public override _build(state: NodeParticleBuildState) {
        const system = this.particle.getConnectedValue(state) as ThinParticleSystem;

        this.output._storedValue = system;

        if (!this.cellIndex.isConnected) {
            return;
        }

        const processSpriteCellIndex = (particle: Particle) => {
            state.particleContext = particle;
            state.systemContext = system;
            particle.cellIndex = Math.floor(this.cellIndex.getConnectedValue(state));
        };

        const spriteCellIndexProcessing = {
            process: processSpriteCellIndex,
            previousItem: null,
            nextItem: null,
        };

        if (system._updateQueueStart) {
            _ConnectAtTheEnd(spriteCellIndexProcessing, system._updateQueueStart);
        } else {
            system._updateQueueStart = spriteCellIndexProcessing;
        }
    }
}

RegisterClass("BABYLON.UpdateSpriteCellIndexBlock", UpdateSpriteCellIndexBlock);
