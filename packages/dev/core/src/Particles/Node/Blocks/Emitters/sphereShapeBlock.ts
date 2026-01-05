import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import type { Particle } from "core/Particles/particle";
import type { IShapeBlock } from "./IShapeBlock";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import { Vector3 } from "core/Maths/math.vector";
import { RandomRange } from "core/Maths/math.scalar.functions";
import { _CreateLocalPositionData } from "./emitters.functions";
import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";

/**
 * Block used to provide a flow of particles emitted from a sphere shape.
 * DirectionRandomizer will be used for the particles initial direction unless both direction1 and direction2 are connected.
 */
export class SphereShapeBlock extends NodeParticleBlock implements IShapeBlock {
    /**
     * Gets or sets a boolean indicating whether to emit in a hemispheric mode (top half of the sphere) or not
     */
    @editableInPropertyPage("Is hemispheric", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public isHemispheric = false;

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
        this.registerInput("direction1", NodeParticleBlockConnectionPointTypes.Vector3, true);
        this.registerInput("direction2", NodeParticleBlockConnectionPointTypes.Vector3, true);
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
     * Gets the direction1 input component
     */
    public get direction1(): NodeParticleConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the direction2 input component
     */
    public get direction2(): NodeParticleConnectionPoint {
        return this._inputs[5];
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

            // We always use directionRandomizer unless both directions are connected
            if (this.direction1.isConnected === false || this.direction2.isConnected === false) {
                const directionRandomizer = this.directionRandomizer.getConnectedValue(state) as number;

                const direction = particle.position.subtract(state.emitterPosition!).normalize();
                const randX = RandomRange(0, directionRandomizer);
                const randY = RandomRange(0, directionRandomizer);
                const randZ = RandomRange(0, directionRandomizer);
                direction.x += randX;
                direction.y += randY;
                direction.z += randZ;
                direction.normalize();

                if (system.isLocal) {
                    particle.direction.copyFromFloats(direction.x, direction.y, direction.z);
                } else {
                    Vector3.TransformNormalFromFloatsToRef(direction.x, direction.y, direction.z, state.emitterWorldMatrix!, particle.direction);
                }
            } else {
                const direction1 = this.direction1.getConnectedValue(state) as Vector3;
                const direction2 = this.direction2.getConnectedValue(state) as Vector3;

                const randX = RandomRange(direction1.x, direction2.x);
                const randY = RandomRange(direction1.y, direction2.y);
                const randZ = RandomRange(direction1.z, direction2.z);

                if (system.isLocal) {
                    particle.direction.copyFromFloats(randX, randY, randZ);
                } else {
                    Vector3.TransformNormalFromFloatsToRef(randX, randY, randZ, state.emitterWorldMatrix!, particle.direction);
                }
            }

            particle._initialDirection = particle.direction.clone();
        };

        system._positionCreation.process = (particle: Particle) => {
            state.particleContext = particle;
            state.systemContext = system;

            const radius = this.radius.getConnectedValue(state) as number;
            const radiusRange = this.radiusRange.getConnectedValue(state) as number;

            const randRadius = radius - RandomRange(0, radius * radiusRange);
            const v = RandomRange(0, 1.0);
            const phi = RandomRange(0, 2 * Math.PI);
            const theta = Math.acos(2 * v - 1);
            const randX = randRadius * Math.cos(phi) * Math.sin(theta);
            let randY = randRadius * Math.cos(theta);
            const randZ = randRadius * Math.sin(phi) * Math.sin(theta);

            if (this.isHemispheric) {
                randY = Math.abs(randY);
            }

            if (system.isLocal) {
                particle.position.copyFromFloats(randX, randY, randZ);
            } else {
                Vector3.TransformCoordinatesFromFloatsToRef(randX, randY, randZ, state.emitterWorldMatrix!, particle.position);
            }

            _CreateLocalPositionData(particle);
        };

        this.output._storedValue = system;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.isHemispheric = this.isHemispheric;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.isHemispheric = serializationObject.isHemispheric;
    }
}

RegisterClass("BABYLON.SphereShapeBlock", SphereShapeBlock);
