import type { IShapeBlock } from "./IShapeBlock";
import type { NodeParticleConnectionPoint } from "core/Particles/Node/nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "core/Particles/Node/nodeParticleBuildState";
import type { Particle } from "core/Particles/particle";

import { RegisterClass } from "core/Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "core/Particles/Node/Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "core/Particles/Node/nodeParticleBlock";
import { RandomRange } from "core/Maths/math.scalar.functions";
import { Vector3 } from "core/Maths/math.vector";
import { _CreateLocalPositionData } from "./emitters.functions";
import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";

/**
 * Block used to provide a flow of particles emitted from a cone shape.
 */
export class ConeShapeBlock extends NodeParticleBlock implements IShapeBlock {
    /**
     * Gets or sets a boolean indicating if the system should emit only from the spawn point
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
}

RegisterClass("BABYLON.ConeShapeBlock", ConeShapeBlock);
