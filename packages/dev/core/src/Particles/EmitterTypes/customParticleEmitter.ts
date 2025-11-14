import type { Nullable } from "core/types";
import type { Matrix } from "core/Maths/math.vector";
import type { Particle } from "core/Particles/particle";
import type { UniformBufferEffectCommonAccessor } from "core/Materials/uniformBufferEffectCommonAccessor";
import type { UniformBuffer } from "core/Materials/uniformBuffer";
import type { IParticleEmitterType } from "./IParticleEmitterType";

import { DeepCopier } from "core/Misc/deepCopier";
import { Vector3, TmpVectors } from "core/Maths/math.vector";

/** Represents and empty generator function */
export const EmptyGeneratorFunc = () => {};

/**
 * Particle emitter emitting particles from a custom list of positions.
 */
export class CustomParticleEmitter implements IParticleEmitterType {
    /**
     * Gets or sets the position generator that will create the initial position of each particle.
     * Index will be provided when used with GPU particle. Particle will be provided when used with CPU particles
     */
    public particlePositionGenerator: (index: number, particle: Nullable<Particle>, outPosition: Vector3) => void = EmptyGeneratorFunc;

    /**
     * Gets or sets the destination generator that will create the final destination of each particle.
     *  * Index will be provided when used with GPU particle. Particle will be provided when used with CPU particles
     */
    public particleDestinationGenerator: (index: number, particle: Nullable<Particle>, outDestination: Vector3) => void = EmptyGeneratorFunc;

    /**
     * Gets or sets the direction generator that will create the initial direction of each particle.
     *  * Index will be provided when used with GPU particle. Particle will be provided when used with CPU particles
     */
    public particleDirectionGenerator: (index: number, particle: Nullable<Particle>, outDestination: Vector3) => void = EmptyGeneratorFunc;

    /**
     * Creates a new instance CustomParticleEmitter
     */
    constructor() {}

    /**
     * Called by the particle System when the direction is computed for the created particle.
     * @param worldMatrix is the world matrix of the particle system
     * @param directionToUpdate is the direction vector to update with the result
     * @param particle is the particle we are computed the direction for
     * @param isLocal defines if the direction should be set in local space
     */
    public startDirectionFunction(worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle, isLocal: boolean): void {
        const tmpVector = TmpVectors.Vector3[0];

        if (this.particleDirectionGenerator && this.particleDirectionGenerator !== EmptyGeneratorFunc) {
            this.particleDirectionGenerator(-1, particle, tmpVector);
        } else if (this.particleDestinationGenerator && this.particleDestinationGenerator !== EmptyGeneratorFunc) {
            this.particleDestinationGenerator(-1, particle, tmpVector);

            // Get direction
            const diffVector = TmpVectors.Vector3[1];
            tmpVector.subtractToRef(particle.position, diffVector);

            diffVector.scaleToRef(1 / particle.lifeTime, tmpVector);
        } else {
            tmpVector.set(0, 0, 0);
        }

        if (isLocal) {
            directionToUpdate.copyFrom(tmpVector);
            return;
        }

        Vector3.TransformNormalToRef(tmpVector, worldMatrix, directionToUpdate);
    }

    /**
     * Called by the particle System when the position is computed for the created particle.
     * @param worldMatrix is the world matrix of the particle system
     * @param positionToUpdate is the position vector to update with the result
     * @param particle is the particle we are computed the position for
     * @param isLocal defines if the position should be set in local space
     */
    public startPositionFunction(worldMatrix: Matrix, positionToUpdate: Vector3, particle: Particle, isLocal: boolean): void {
        const tmpVector = TmpVectors.Vector3[0];

        if (this.particlePositionGenerator && this.particlePositionGenerator !== EmptyGeneratorFunc) {
            this.particlePositionGenerator(-1, particle, tmpVector);
        } else {
            tmpVector.set(0, 0, 0);
        }

        if (isLocal) {
            positionToUpdate.copyFrom(tmpVector);
            return;
        }

        Vector3.TransformCoordinatesToRef(tmpVector, worldMatrix, positionToUpdate);
    }

    /**
     * Clones the current emitter and returns a copy of it
     * @returns the new emitter
     */
    public clone(): CustomParticleEmitter {
        const newOne = new CustomParticleEmitter();

        DeepCopier.DeepCopy(this, newOne);

        return newOne;
    }

    /**
     * Called by the GPUParticleSystem to setup the update shader
     * @param uboOrEffect defines the update shader
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public applyToShader(uboOrEffect: UniformBufferEffectCommonAccessor): void {}

    /**
     * Creates the structure of the ubo for this particle emitter
     * @param ubo ubo to create the structure for
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public buildUniformLayout(ubo: UniformBuffer): void {}

    /**
     * Returns a string to use to update the GPU particles update shader
     * @returns a string containing the defines string
     */
    public getEffectDefines(): string {
        return "#define CUSTOMEMITTER";
    }

    /**
     * Returns the string "PointParticleEmitter"
     * @returns a string containing the class name
     */
    public getClassName(): string {
        return "CustomParticleEmitter";
    }

    /**
     * Serializes the particle system to a JSON object.
     * @returns the JSON object
     */
    public serialize(): any {
        const serializationObject: any = {};

        serializationObject.type = this.getClassName();
        serializationObject.particlePositionGenerator = this.particlePositionGenerator;
        serializationObject.particleDestinationGenerator = this.particleDestinationGenerator;

        return serializationObject;
    }

    /**
     * Parse properties from a JSON object
     * @param serializationObject defines the JSON object
     */
    public parse(serializationObject: any): void {
        if (serializationObject.particlePositionGenerator) {
            this.particlePositionGenerator = serializationObject.particlePositionGenerator;
        }

        if (serializationObject.particleDestinationGenerator) {
            this.particleDestinationGenerator = serializationObject.particleDestinationGenerator;
        }
    }
}
