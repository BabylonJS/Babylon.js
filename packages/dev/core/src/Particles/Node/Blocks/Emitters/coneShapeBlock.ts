import type { IShapeBlock } from "./IShapeBlock";
import type { NodeParticleConnectionPoint } from "core/Particles/Node/nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "core/Particles/Node/nodeParticleBuildState";
import type { Particle } from "core/Particles/particle";

import { RegisterClass } from "core/Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "core/Particles/Node/Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "core/Particles/Node/nodeParticleBlock";
import { RandomRange } from "core/Maths/math.scalar.functions";
import { TmpVectors, Vector3 } from "core/Maths/math.vector";

/**
 * Block used to provide a flow of particles emitted from a cone shape.
 */
export class ConeShapeBlock extends NodeParticleBlock implements IShapeBlock {
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
        this.registerInput("emitFromSpawnPointOnly", NodeParticleBlockConnectionPointTypes.Int, true, 0);
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
     * Gets the emitFromSpawnPointOnly input component
     */
    public get emitFromSpawnPointOnly(): NodeParticleConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the directionRandomizer input component
     */
    public get directionRandomizer(): NodeParticleConnectionPoint {
        return this._inputs[6];
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

            // Connected values
            let directionRandomizer = this.directionRandomizer.getConnectedValue(state) as number;
            directionRandomizer = Math.max(0, Math.min(directionRandomizer, 1));

            // Calculate create direction logic
            if (system.isLocal) {
                TmpVectors.Vector3[0].copyFrom(particle.position).normalize();
            } else {
                particle.position.subtractToRef(state.emitterWorldMatrix!.getTranslation(), TmpVectors.Vector3[0]).normalize();
            }

            const randX = RandomRange(0, directionRandomizer);
            const randY = RandomRange(0, directionRandomizer);
            const randZ = RandomRange(0, directionRandomizer);
            const directionToUpdate = new Vector3();
            directionToUpdate.x = TmpVectors.Vector3[0].x + randX;
            directionToUpdate.y = TmpVectors.Vector3[0].y + randY;
            directionToUpdate.z = TmpVectors.Vector3[0].z + randZ;
            directionToUpdate.normalize();

            if (system.isLocal) {
                particle.direction.copyFromFloats(directionToUpdate.x, directionToUpdate.y, directionToUpdate.z);
            } else {
                Vector3.TransformNormalFromFloatsToRef(directionToUpdate.x, directionToUpdate.y, directionToUpdate.z, state.emitterWorldMatrix!, particle.direction);
            }

            particle._initialDirection = particle.direction.clone();
        };

        system._positionCreation.process = (particle: Particle) => {
            state.particleContext = particle;
            state.systemContext = system;

            // Connected values
            const radius = this.radius.getConnectedValue(state) as number;
            const angle = this.angle.getConnectedValue(state) as number;
            let radiusRange = this.radiusRange.getConnectedValue(state) as number;
            radiusRange = Math.max(0, Math.min(radiusRange, 1));
            let heightRange = this.heightRange.getConnectedValue(state) as number;
            heightRange = Math.max(0, Math.min(heightRange, 1));
            const emitFromSpawnPointOnly = (this.emitFromSpawnPointOnly.getConnectedValue(state) as number) !== 0;

            // Calculate position creation logic
            let h: number;
            if (!emitFromSpawnPointOnly) {
                h = RandomRange(0, heightRange);
                // Better distribution in a cone at normal angles.
                h = 1 - h * h;
            } else {
                h = 0.0001;
            }

            let newRadius = radius - RandomRange(0, radius * radiusRange);
            newRadius = newRadius * h;

            const s = RandomRange(0, Math.PI * 2);
            const height = this._calculateHeight(angle, radius);

            const randX = newRadius * Math.sin(s);
            const randZ = newRadius * Math.cos(s);
            const randY = h * height;

            if (system.isLocal) {
                particle.position.copyFromFloats(randX, randY, randZ);
                particle.position.addInPlace(state.emitterPosition!);
            } else {
                Vector3.TransformCoordinatesFromFloatsToRef(randX, randY, randZ, state.emitterWorldMatrix!, particle.position);
            }
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
