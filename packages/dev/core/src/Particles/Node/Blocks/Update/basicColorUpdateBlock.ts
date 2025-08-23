import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import type { ThinParticleSystem } from "core/Particles/thinParticleSystem";
import type { Particle } from "core/Particles/particle";
import { _ConnectAtTheEnd } from "core/Particles/Queue/executionQueue";

/**
 * Block used to provide the basic update functionality for particle colors.
 */
export class BasicColorUpdateBlock extends NodeParticleBlock {
    /**
     * Create a new UpdateScaleBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.Particle);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.Particle);
    }

    /**
     * Gets the particle component
     */
    public get particle(): NodeParticleConnectionPoint {
        return this._inputs[0];
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
        return "BasicColorUpdateBlock";
    }

    /**
     * Builds the block
     * @param state defines the current build state
     */
    public override _build(state: NodeParticleBuildState) {
        const system = this.particle.getConnectedValue(state) as ThinParticleSystem;

        const processColor = (particle: Particle) => {
            state.particleContext = particle;
            state.systemContext = system;

            particle.colorStep.scaleToRef(system._scaledUpdateSpeed, system._scaledColorStep);
            particle.color.addInPlace(system._scaledColorStep);

            if (particle.color.a < 0) {
                particle.color.a = 0;
            }
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

RegisterClass("BABYLON.BasicColorUpdateBlock", BasicColorUpdateBlock);
