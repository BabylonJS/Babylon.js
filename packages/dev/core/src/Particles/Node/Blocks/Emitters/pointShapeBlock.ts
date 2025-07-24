import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import { Vector3 } from "core/Maths/math.vector";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { Particle } from "core/Particles/particle";
import { RandomRange } from "core/Maths/math.scalar.functions";
import type { IShapeBlock } from "./IShapeBlock";

/**
 * Block used to provide a flow of particles emitted from a point.
 */
export class PointShapeBlock extends NodeParticleBlock implements IShapeBlock {
    /**
     * Create a new PointShapeBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.Particle);
        this.registerInput("direction1", NodeParticleBlockConnectionPointTypes.Vector3, true, new Vector3(0, 1.0, 0));
        this.registerInput("direction2", NodeParticleBlockConnectionPointTypes.Vector3, true, new Vector3(0, 1.0, 0));
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.Particle);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "PointShapeBlock";
    }

    /**
     * Gets the particle component
     */
    public get particle(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the direction1 input component
     */
    public get direction1(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the direction2 input component
     */
    public get direction2(): NodeParticleConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Builds the block
     * @param state defines the build state
     */
    public override _build(state: NodeParticleBuildState) {
        const system = this.particle.getConnectedValue(state);

        system._directionCreation.process = (particle: Particle) => {
            state.particleContext = particle;
            state.systemContext = system;

            const direction1 = this.direction1.getConnectedValue(state) as Vector3;
            const direction2 = this.direction2.getConnectedValue(state) as Vector3;

            const randX = RandomRange(direction1.x, direction2.x);
            const randY = RandomRange(direction1.y, direction2.y);
            const randZ = RandomRange(direction1.z, direction2.z);

            if (state.isEmitterTransformNode) {
                Vector3.TransformNormalFromFloatsToRef(randX, randY, randZ, state.emitterWorldMatrix!, particle.direction);
            } else {
                particle.direction.copyFromFloats(randX, randY, randZ);
            }
        };

        system._positionCreation.process = (particle: Particle) => {
            state.systemContext = system;
            if (state.isEmitterTransformNode) {
                Vector3.TransformCoordinatesFromFloatsToRef(0, 0, 0, state.emitterWorldMatrix!, particle.position);
            } else {
                particle.position.copyFrom(state.emitterPosition!);
            }
        };

        this.output._storedValue = system;
    }
}

RegisterClass("BABYLON.PointShapeBlock", PointShapeBlock);
