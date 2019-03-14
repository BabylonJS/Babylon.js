import { Vector3, Matrix } from "../../Maths/math";
import { Effect } from "../../Materials/effect";
import { Particle } from "../../Particles/particle";
/**
 * Particle emitter represents a volume emitting particles.
 * This is the responsibility of the implementation to define the volume shape like cone/sphere/box.
 */
export interface IParticleEmitterType {
    /**
     * Called by the particle System when the direction is computed for the created particle.
     * @param worldMatrix is the world matrix of the particle system
     * @param directionToUpdate is the direction vector to update with the result
     * @param particle is the particle we are computed the direction for
     */
    startDirectionFunction(worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle): void;

    /**
     * Called by the particle System when the position is computed for the created particle.
     * @param worldMatrix is the world matrix of the particle system
     * @param positionToUpdate is the position vector to update with the result
     * @param particle is the particle we are computed the position for
     */
    startPositionFunction(worldMatrix: Matrix, positionToUpdate: Vector3, particle: Particle): void;

    /**
     * Clones the current emitter and returns a copy of it
     * @returns the new emitter
     */
    clone(): IParticleEmitterType;

    /**
     * Called by the GPUParticleSystem to setup the update shader
     * @param effect defines the update shader
     */
    applyToShader(effect: Effect): void;

    /**
     * Returns a string to use to update the GPU particles update shader
     * @returns the effect defines string
     */
    getEffectDefines(): string;

    /**
     * Returns a string representing the class name
     * @returns a string containing the class name
     */
    getClassName(): string;

    /**
     * Serializes the particle system to a JSON object.
     * @returns the JSON object
     */
    serialize(): any;

    /**
     * Parse properties from a JSON object
     * @param serializationObject defines the JSON object
     */
    parse(serializationObject: any): void;
}
