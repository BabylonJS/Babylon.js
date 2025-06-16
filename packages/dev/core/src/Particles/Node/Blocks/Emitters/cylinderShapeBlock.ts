import { RandomRange } from "core/Maths/math.scalar.functions";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import type { Particle } from "core/Particles/particle";
import { Vector3 } from "core/Maths/math.vector";

/**
 * Block used to provide a flow of particles emitted from a cylinder shape.
 */
export class CylinderShapeBlock extends NodeParticleBlock {
    private _tempVector = Vector3.Zero();
    /**
     * Create a new CylinderShapeBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.Particle);
        this.registerInput("radius", NodeParticleBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("height", NodeParticleBlockConnectionPointTypes.Float, true, 1, 0);
        this.registerInput("radiusRange", NodeParticleBlockConnectionPointTypes.Float, true, 1, 0, 1);
        this.registerInput("directionRandomizer", NodeParticleBlockConnectionPointTypes.Float, true, 0, 0, 1);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.Particle);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "CylinderShapeBlock";
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
     * Gets the height input component
     */
    public get height(): NodeParticleConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the radiusRange input component
     */
    public get radiusRange(): NodeParticleConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the directionRandomizer input component
     */
    public get directionRandomizer(): NodeParticleConnectionPoint {
        return this._inputs[4];
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
            particle.position.subtractToRef(state.emitterPosition!, this._tempVector);

            this._tempVector.normalize();

            if (state.isEmitterTransformNode) {
                Vector3.TransformNormalToRef(this._tempVector, state.emitterInverseWorldMatrix!, this._tempVector);
            }

            const randY = RandomRange(-directionRandomizer / 2, directionRandomizer / 2);

            let angle = Math.atan2(this._tempVector.x, this._tempVector.z);
            angle += RandomRange(-Math.PI / 2, Math.PI / 2) * directionRandomizer;

            this._tempVector.y = randY; // set direction y to rand y to mirror normal of cylinder surface
            this._tempVector.x = Math.sin(angle);
            this._tempVector.z = Math.cos(angle);
            this._tempVector.normalize();

            if (state.isEmitterTransformNode) {
                Vector3.TransformNormalFromFloatsToRef(this._tempVector.x, this._tempVector.y, this._tempVector.z, state.emitterWorldMatrix!, particle.direction);
            } else {
                particle.direction.copyFrom(this._tempVector);
            }
        };

        system._positionCreation.process = (particle: Particle) => {
            state.particleContext = particle;
            state.systemContext = system;

            const height = this.height.getConnectedValue(state);
            const radiusRange = this.radiusRange.getConnectedValue(state);
            const radius = this.radius.getConnectedValue(state);
            const yPos = RandomRange(-height / 2, height / 2);
            const angle = RandomRange(0, 2 * Math.PI);

            const radiusDistribution = RandomRange((1 - radiusRange) * (1 - radiusRange), 1);
            const positionRadius = Math.sqrt(radiusDistribution) * radius;
            const xPos = positionRadius * Math.cos(angle);
            const zPos = positionRadius * Math.sin(angle);

            if (state.isEmitterTransformNode) {
                Vector3.TransformCoordinatesFromFloatsToRef(xPos, yPos, zPos, state.emitterWorldMatrix!, particle.position);
            } else {
                particle.position.copyFromFloats(xPos, yPos, zPos);
                particle.position.addInPlace(state.emitterPosition!);
            }
        };

        this.output._storedValue = system;
    }
}

RegisterClass("BABYLON.CylinderShapeBlock", CylinderShapeBlock);
