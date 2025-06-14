import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import type { ThinParticleSystem } from "core/Particles/thinParticleSystem";
import type { Particle } from "core/Particles/particle";
import { _ConnectAtTheEnd } from "core/Particles/Queue/executionQueue";
import type { Vector2 } from "core/Maths/math.vector";

/**
 * Block used to update the scale of a particle
 */
export class UpdateScaleBlock extends NodeParticleBlock {
    /**
     * Create a new UpdateScaleBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.Particle);
        this.registerInput("scale", NodeParticleBlockConnectionPointTypes.Vector2);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.Particle);
    }

    /**
     * Gets the particle component
     */
    public get particle(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the scale input component
     */
    public get scale(): NodeParticleConnectionPoint {
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
        return "UpdateScaleBlock";
    }

    /**
     * Builds the block
     * @param state defines the current build state
     */
    public override _build(state: NodeParticleBuildState) {
        const system = this.particle.getConnectedValue(state) as ThinParticleSystem;

        this.output._storedValue = system;

        if (!this.scale.isConnected) {
            return;
        }

        const processScale = (particle: Particle) => {
            state.particleContext = particle;
            state.systemContext = system;
            particle.scale.copyFrom(this.scale.getConnectedValue(state) as Vector2);
        };

        const scaleProcessing = {
            process: processScale,
            previousItem: null,
            nextItem: null,
        };

        if (system._updateQueueStart) {
            _ConnectAtTheEnd(scaleProcessing, system._updateQueueStart);
        } else {
            system._updateQueueStart = scaleProcessing;
        }
    }
}

RegisterClass("BABYLON.UpdateScaleBlock", UpdateScaleBlock);
