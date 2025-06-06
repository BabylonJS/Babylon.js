import type { ThinParticleSystem } from "core/Particles/thinParticleSystem";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import type { Particle } from "core/Particles/particle";
import { _ConnectAtTheEnd } from "core/Particles/Queue/executionQueue";
import type { Color4 } from "core/Maths";

/**
 * Block used to update the color of a particle
 */
export class UpdateColorBlock extends NodeParticleBlock {
    /**
     * Create a new UpdateColorBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("input", NodeParticleBlockConnectionPointTypes.Particle);
        this.registerInput("color", NodeParticleBlockConnectionPointTypes.Color4);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.Particle);
    }

    /**
     * Gets the input component
     */
    public get input(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the color input component
     */
    public get color(): NodeParticleConnectionPoint {
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
        return "UpdateColorBlock";
    }

    /**
     * Builds the block
     * @param state defines the current build state
     */
    public override _build(state: NodeParticleBuildState) {
        const system = this.input.getConnectedValue(state) as ThinParticleSystem;

        const processColor = (particle: Particle) => {
            state.particleContext = particle;
            state.systemContext = system;
            particle.color.copyFrom(this.color.getConnectedValue(state) as Color4);
        };

        const colorProcessing = {
            process: processColor,
            previousItem: null,
            nextItem: null,
        };

        if (system._updateQueueStart) {
            _ConnectAtTheEnd(colorProcessing, system._updateQueueStart);
        } else {
            system._updateQueueStart = colorProcessing;
        }

        this.output._storedValue = system;
    }
}

RegisterClass("BABYLON.UpdateColorBlock", UpdateColorBlock);
