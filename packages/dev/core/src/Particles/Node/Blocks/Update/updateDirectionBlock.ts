import type { ThinParticleSystem } from "core/Particles/thinParticleSystem";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import type { Particle } from "core/Particles/particle";
import type { Vector3 } from "core/Maths/math.vector";
import { _ConnectAtTheEnd } from "core/Particles/Queue/executionQueue";

/**
 * Block used to update the direction of a particle
 */
export class UpdateDirectionBlock extends NodeParticleBlock {
    /**
     * Create a new UpdateDirectionBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.Particle);
        this.registerInput("direction", NodeParticleBlockConnectionPointTypes.Vector3);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.Particle);
    }

    /**
     * Gets the particle component
     */
    public get particle(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the direction input component
     */
    public get direction(): NodeParticleConnectionPoint {
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
        return "UpdateDirectionBlock";
    }

    /**
     * Builds the block
     * @param state defines the current build state
     */
    public override _build(state: NodeParticleBuildState) {
        const system = this.particle.getConnectedValue(state) as ThinParticleSystem;

        this.output._storedValue = system;

        if (!this.direction.isConnected) {
            return;
        }

        const processDirection = (particle: Particle) => {
            state.particleContext = particle;
            state.systemContext = system;
            particle.direction.copyFrom(this.direction.getConnectedValue(state) as Vector3);
        };

        const directionProcessing = {
            process: processDirection,
            previousItem: null,
            nextItem: null,
        };

        if (system._updateQueueStart) {
            _ConnectAtTheEnd(directionProcessing, system._updateQueueStart);
        } else {
            system._updateQueueStart = directionProcessing;
        }
    }
}

RegisterClass("BABYLON.UpdateDirectionBlock", UpdateDirectionBlock);
