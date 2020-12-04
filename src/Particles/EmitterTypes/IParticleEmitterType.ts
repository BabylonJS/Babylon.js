import { Vector3, Matrix } from "../../Maths/math.vector";
import { Effect } from "../../Materials/effect";
import { Particle } from "../../Particles/particle";
import { Nullable } from '../../types';

declare type Scene = import("../../scene").Scene;

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
     * @param isLocal defines if the direction should be set in local space
     */
    startDirectionFunction(worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle, isLocal: boolean): void;

    /**
     * Called by the particle System when the position is computed for the created particle.
     * @param worldMatrix is the world matrix of the particle system
     * @param positionToUpdate is the position vector to update with the result
     * @param particle is the particle we are computed the position for
     * @param isLocal defines if the position should be set in local space
     */
    startPositionFunction(worldMatrix: Matrix, positionToUpdate: Vector3, particle: Particle, isLocal: boolean): void;

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
     * @param scene defines the hosting scene
     */
    parse(serializationObject: any, scene: Nullable<Scene>): void;
}
