import { DeepCopier } from "../../Misc/deepCopier";
import { Vector3, Matrix, TmpVectors } from "../../Maths/math.vector";
import { Effect } from "../../Materials/effect";
import { Particle } from "../particle";
import { IParticleEmitterType } from "./IParticleEmitterType";
import { Nullable } from '../../types';
/**
 * Particle emitter emitting particles from a custom list of positions.
 */
export class CustomParticleEmitter implements IParticleEmitterType {

    /**
     * Gets or sets the position generator that will create the inital position of each particle.
     * Index will be provided when used with GPU particle. Particle will be provided when used with CPU particles
     */
    public particlePositionGenerator: (index: number, particle: Nullable<Particle>, outPosition: Vector3) => void = () => {};

    /**
     * Gets or sets the destination generator that will create the final destination of each particle.
     *  * Index will be provided when used with GPU particle. Particle will be provided when used with CPU particles
     */
    public particleDestinationGenerator: (index: number, particle: Nullable<Particle>, outDestination: Vector3) => void = () => {};

    /**
     * Creates a new instance CustomParticleEmitter
     */
    constructor() {

    }

    /**
     * Called by the particle System when the direction is computed for the created particle.
     * @param worldMatrix is the world matrix of the particle system
     * @param directionToUpdate is the direction vector to update with the result
     * @param particle is the particle we are computed the direction for
     * @param isLocal defines if the direction should be set in local space
     */
    public startDirectionFunction(worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle, isLocal: boolean): void {
        let tmpVector = TmpVectors.Vector3[0];

        if (this.particleDestinationGenerator) {
            this.particleDestinationGenerator(-1, particle, tmpVector);

            // Get direction
            let diffVector = TmpVectors.Vector3[1];
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
        let tmpVector = TmpVectors.Vector3[0];

        if (this.particlePositionGenerator) {
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
        let newOne = new CustomParticleEmitter();

        DeepCopier.DeepCopy(this, newOne);

        return newOne;
    }

    /**
     * Called by the GPUParticleSystem to setup the update shader
     * @param effect defines the update shader
     */
    public applyToShader(effect: Effect): void {
    }

    /**
     * Returns a string to use to update the GPU particles update shader
     * @returns a string containng the defines string
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
        var serializationObject: any = {};

        serializationObject.type = this.getClassName();

        return serializationObject;
    }

    /**
     * Parse properties from a JSON object
     * @param serializationObject defines the JSON object
     */
    public parse(serializationObject: any): void {
    }
}
