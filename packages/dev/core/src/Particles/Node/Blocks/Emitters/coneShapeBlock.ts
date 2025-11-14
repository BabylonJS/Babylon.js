import type { IShapeBlock } from "./IShapeBlock";
import type { NodeParticleConnectionPoint } from "core/Particles/Node/nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "core/Particles/Node/nodeParticleBuildState";
import type { Particle } from "core/Particles/particle";

import { RegisterClass } from "core/Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "core/Particles/Node/Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "core/Particles/Node/nodeParticleBlock";
import { RandomRange } from "core/Maths/math.scalar.functions";
import { Vector3 } from "core/Maths/math.vector";
import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
import { _CreateLocalPositionData } from "./emitters.functions";

/**
 * Block used to provide a flow of particles emitted from a cone shape.
 */
export class ConeShapeBlock extends NodeParticleBlock implements IShapeBlock {
    /**
     * Gets or sets a boolean indicating if the system should emit only from the spawn point
     * DirectionRandomizer will be used for the particles initial direction unless both direction1 and direction2 are connected.
     */
    @editableInPropertyPage("Emit from spawn point only", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public emitFromSpawnPointOnly = false;

    /**
     * Create a new ConeShapeBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.Particle);
        this.registerInput("radius", NodeParticleBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("angle", NodeParticleBlockConnectionPointTypes.Float, true, Math.PI);
        this.registerInput("radiusRange", NodeParticleBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("heightRange", NodeParticleBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("directionRandomizer", NodeParticleBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("direction1", NodeParticleBlockConnectionPointTypes.Vector3, true);
        this.registerInput("direction2", NodeParticleBlockConnectionPointTypes.Vector3, true);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.Particle);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ConeShapeBlock";
    }

    /**
     * Gets the particle input component
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
     * Gets the angle input component
     */
    public get angle(): NodeParticleConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the radiusRange input component
     */
    public get radiusRange(): NodeParticleConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the heightRange input component
     */
    public get heightRange(): NodeParticleConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the directionRandomizer input component
     */
    public get directionRandomizer(): NodeParticleConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the direction1 input component
     */
    public get direction1(): NodeParticleConnectionPoint {
        return this._inputs[6];
    }

    /**
     * Gets the direction2 input component
     */
    public get direction2(): NodeParticleConnectionPoint {
        return this._inputs[7];
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

            // Connected values
            const radius = this.radius.getConnectedValue(state) as number;
            const angle = this.angle.getConnectedValue(state) as number;
            const radiusRange = this.radiusRange.getConnectedValue(state) as number;
            const heightRange = this.heightRange.getConnectedValue(state) as number;

            // Calculate position creation logic
            let h: number;
            if (!this.emitFromSpawnPointOnly) {
                h = RandomRange(0, heightRange);
                // Better distribution in a cone at normal angles.
                h = 1 - h * h;
            } else {
                h = 0.0001;
            }

            let newRadius = radius - RandomRange(0, radius * radiusRange);
            newRadius = newRadius * h;
            const s = RandomRange(0, Math.PI * 2);

            const randX = newRadius * Math.sin(s);
            const randZ = newRadius * Math.cos(s);
            const randY = h * this._calculateHeight(angle, radius);

            if (system.isLocal) {
                particle.position.copyFromFloats(randX, randY, randZ);
            } else {
                Vector3.TransformCoordinatesFromFloatsToRef(randX, randY, randZ, state.emitterWorldMatrix!, particle.position);
            }

            _CreateLocalPositionData(particle);
        };

        this.output._storedValue = system;
    }

    private _calculateHeight(angle: number, radius: number): number {
        if (angle !== 0) {
            return radius / Math.tan(angle / 2);
        } else {
            return 1;
        }
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.emitFromSpawnPointOnly = this.emitFromSpawnPointOnly;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.emitFromSpawnPointOnly = serializationObject.emitFromSpawnPointOnly;
    }
}

RegisterClass("BABYLON.ConeShapeBlock", ConeShapeBlock);
