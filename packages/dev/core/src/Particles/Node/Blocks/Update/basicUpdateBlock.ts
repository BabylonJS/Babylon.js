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
 * Block used to provide the basic update functionality for particles.
 */
export class BasicUpdateBlock extends NodeParticleBlock {
    /**
     * Create a new UpdateScaleBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("input", NodeParticleBlockConnectionPointTypes.Particle);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.Particle);
    }

    /**
     * Gets the input component
     */
    public get input(): NodeParticleConnectionPoint {
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
        return "BasicUpdateBlock";
    }

    /**
     * Builds the block
     * @param state defines the current build state
     */
    public override _build(state: NodeParticleBuildState) {
        const system = this.input.getConnectedValue(state) as ThinParticleSystem;

        const processPosition = (particle: Particle) => {
            state.particleContext = particle;
            state.systemContext = system;
            particle.direction.scaleToRef(system._directionScale, system._scaledDirection);
            particle.position.addInPlace(system._scaledDirection);
        };

        const positionProcessing = {
            process: processPosition,
            previousItem: null,
            nextItem: null,
        };

        if (system._updateQueueStart) {
            _ConnectAtTheEnd(positionProcessing, system._updateQueueStart);
        } else {
            system._updateQueueStart = positionProcessing;
        }

        this.output._storedValue = system;
    }
}

RegisterClass("BABYLON.BasicUpdateBlock", BasicUpdateBlock);
