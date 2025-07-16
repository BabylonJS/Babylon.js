import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { Particle } from "core/Particles/particle";
import { Vector3 } from "core/Maths/math.vector";
import { RandomRange } from "core/Maths/math.scalar.functions";
import type { IShapeBlock } from "./IShapeBlock";

/**
 * Block used to provide a flow of particles emitted from a sphere shape.
 */
export class SphereShapeBlock extends NodeParticleBlock implements IShapeBlock {
    /**
     * Create a new SphereShapeBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.Particle);
        this.registerInput("radius", NodeParticleBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("radiusRange", NodeParticleBlockConnectionPointTypes.Float, true, 1, 0, 1);
        this.registerInput("directionRandomizer", NodeParticleBlockConnectionPointTypes.Float, true, 0, 0, 1);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.Particle);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "SphereShapeBlock";
    }

    /**
     * Gets the particle component
     */
    public get particle(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the radius input component
     */
    public get radius(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the radiusRange input component
     */
    public get radiusRange(): NodeParticleConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the directionRandomizer input component
     */
    public get directionRandomizer(): NodeParticleConnectionPoint {
        return this._inputs[3];
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

            const directionRandomizer = this.directionRandomizer.getConnectedValue(state);

            const direction = particle.position.subtract(state.emitterPosition!).normalize();
            const randX = RandomRange(0, directionRandomizer);
            const randY = RandomRange(0, directionRandomizer);
            const randZ = RandomRange(0, directionRandomizer);
            direction.x += randX;
            direction.y += randY;
            direction.z += randZ;
            direction.normalize();

            if (state.isEmitterTransformNode) {
                Vector3.TransformNormalFromFloatsToRef(randX, randY, randZ, state.emitterWorldMatrix!, particle.direction);
            } else {
                particle.direction.copyFromFloats(randX, randY, randZ);
            }
        };

        system._positionCreation.process = (particle: Particle) => {
            state.particleContext = particle;
            state.systemContext = system;

            const radius = this.radius.getConnectedValue(state);
            const radiusRange = this.radiusRange.getConnectedValue(state);

            const randRadius = radius - RandomRange(0, radius * radiusRange);
            const v = RandomRange(0, 1.0);
            const phi = RandomRange(0, 2 * Math.PI);
            const theta = Math.acos(2 * v - 1);
            const randX = randRadius * Math.cos(phi) * Math.sin(theta);
            const randY = randRadius * Math.cos(theta);
            const randZ = randRadius * Math.sin(phi) * Math.sin(theta);

            if (state.isEmitterTransformNode) {
                Vector3.TransformCoordinatesFromFloatsToRef(randX, randY, randZ, state.emitterWorldMatrix!, particle.position);
            } else {
                particle.position.copyFromFloats(randX, randY, randZ);
                particle.position.addInPlace(state.emitterPosition!);
            }
        };

        this.output._storedValue = system;
    }
}

RegisterClass("BABYLON.SphereShapeBlock", SphereShapeBlock);
