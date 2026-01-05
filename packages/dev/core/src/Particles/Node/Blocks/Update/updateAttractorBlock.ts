import type { ThinParticleSystem } from "core/Particles/thinParticleSystem";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import type { Particle } from "core/Particles/particle";
import { _ConnectAtTheEnd } from "core/Particles/Queue/executionQueue";
import { Vector3 } from "core/Maths/math.vector";

const ToAttractor: Vector3 = Vector3.Zero();
const Force: Vector3 = Vector3.Zero();
const ScaledForce: Vector3 = Vector3.Zero();

/**
 * Block used to update particle position based on an attractor
 */
export class UpdateAttractorBlock extends NodeParticleBlock {
    /**
     * Create a new UpdateAttractorBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.Particle);
        this.registerInput("attractor", NodeParticleBlockConnectionPointTypes.Vector3, true, Vector3.Zero());
        this.registerInput("strength", NodeParticleBlockConnectionPointTypes.Float, true, 1);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.Particle);
    }

    /**
     * Gets the particle component
     */
    public get particle(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the attractor input component
     */
    public get attractor(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the strength input component
     */
    public get strength(): NodeParticleConnectionPoint {
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
        return "UpdateAttractorBlock";
    }

    /**
     * Builds the block
     * @param state defines the current build state
     */
    public override _build(state: NodeParticleBuildState) {
        const system = this.particle.getConnectedValue(state) as ThinParticleSystem;

        const processAttractor = (particle: Particle) => {
            const attractorPosition = this.attractor.getConnectedValue(state) as Vector3;
            const strength = this.strength.getConnectedValue(state) as number;
            attractorPosition.subtractToRef(particle.position, ToAttractor);
            const distanceSquared = ToAttractor.lengthSquared() + 1; // Avoid going under 1.0
            ToAttractor.normalize().scaleToRef(strength / distanceSquared, Force);

            Force.scaleToRef(system._tempScaledUpdateSpeed, ScaledForce);

            particle.direction.addInPlace(ScaledForce); // Update particle velocity
        };

        const attractorProcessing = {
            process: processAttractor,
            previousItem: null,
            nextItem: null,
        };

        if (system._updateQueueStart) {
            _ConnectAtTheEnd(attractorProcessing, system._updateQueueStart);
        } else {
            system._updateQueueStart = attractorProcessing;
        }

        this.output._storedValue = system;
    }
}

RegisterClass("BABYLON.UpdateAttractorBlock", UpdateAttractorBlock);
