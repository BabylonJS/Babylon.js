import { DeepCopier } from "../../Misc/deepCopier";
import { Vector3, Matrix } from "../../Maths/math.vector";
import { Scalar } from "../../Maths/math.scalar";
import { Effect } from "../../Materials/effect";
import { Particle } from "../../Particles/particle";
import { IParticleEmitterType } from "./IParticleEmitterType";
/**
 * Particle emitter emitting particles from the inside of a box.
 * It emits the particles randomly between 2 given directions.
 */
export class BoxParticleEmitter implements IParticleEmitterType {

    /**
     * Random direction of each particle after it has been emitted, between direction1 and direction2 vectors.
     */
    public direction1 = new Vector3(0, 1.0, 0);
    /**
     * Random direction of each particle after it has been emitted, between direction1 and direction2 vectors.
     */
    public direction2 = new Vector3(0, 1.0, 0);

    /**
     * Minimum box point around our emitter. Our emitter is the center of particles source, but if you want your particles to emit from more than one point, then you can tell it to do so.
     */
    public minEmitBox = new Vector3(-0.5, -0.5, -0.5);
    /**
     * Maximum box point around our emitter. Our emitter is the center of particles source, but if you want your particles to emit from more than one point, then you can tell it to do so.
     */
    public maxEmitBox = new Vector3(0.5, 0.5, 0.5);

    /**
     * Creates a new instance BoxParticleEmitter
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
        var randX = Scalar.RandomRange(this.direction1.x, this.direction2.x);
        var randY = Scalar.RandomRange(this.direction1.y, this.direction2.y);
        var randZ = Scalar.RandomRange(this.direction1.z, this.direction2.z);

        if (isLocal) {
            directionToUpdate.x = randX;
            directionToUpdate.y = randY;
            directionToUpdate.z = randZ;
            return;
        }

        Vector3.TransformNormalFromFloatsToRef(randX, randY, randZ, worldMatrix, directionToUpdate);
    }

    /**
     * Called by the particle System when the position is computed for the created particle.
     * @param worldMatrix is the world matrix of the particle system
     * @param positionToUpdate is the position vector to update with the result
     * @param particle is the particle we are computed the position for
     * @param isLocal defines if the position should be set in local space
     */
    public startPositionFunction(worldMatrix: Matrix, positionToUpdate: Vector3, particle: Particle, isLocal: boolean): void {
        var randX = Scalar.RandomRange(this.minEmitBox.x, this.maxEmitBox.x);
        var randY = Scalar.RandomRange(this.minEmitBox.y, this.maxEmitBox.y);
        var randZ = Scalar.RandomRange(this.minEmitBox.z, this.maxEmitBox.z);

        if (isLocal) {
            positionToUpdate.x = randX;
            positionToUpdate.y = randY;
            positionToUpdate.z = randZ;
            return;
        }

        Vector3.TransformCoordinatesFromFloatsToRef(randX, randY, randZ, worldMatrix, positionToUpdate);
    }

    /**
     * Clones the current emitter and returns a copy of it
     * @returns the new emitter
     */
    public clone(): BoxParticleEmitter {
        let newOne = new BoxParticleEmitter();

        DeepCopier.DeepCopy(this, newOne);

        return newOne;
    }

    /**
     * Called by the GPUParticleSystem to setup the update shader
     * @param effect defines the update shader
     */
    public applyToShader(effect: Effect): void {
        effect.setVector3("direction1", this.direction1);
        effect.setVector3("direction2", this.direction2);
        effect.setVector3("minEmitBox", this.minEmitBox);
        effect.setVector3("maxEmitBox", this.maxEmitBox);
    }

    /**
     * Returns a string to use to update the GPU particles update shader
     * @returns a string containng the defines string
     */
    public getEffectDefines(): string {
        return "#define BOXEMITTER";
    }

    /**
     * Returns the string "BoxParticleEmitter"
     * @returns a string containing the class name
     */
    public getClassName(): string {
        return "BoxParticleEmitter";
    }

    /**
     * Serializes the particle system to a JSON object.
     * @returns the JSON object
     */
    public serialize(): any {
        var serializationObject: any = {};

        serializationObject.type = this.getClassName();
        serializationObject.direction1 = this.direction1.asArray();
        serializationObject.direction2 = this.direction2.asArray();
        serializationObject.minEmitBox = this.minEmitBox.asArray();
        serializationObject.maxEmitBox = this.maxEmitBox.asArray();

        return serializationObject;
    }

    /**
     * Parse properties from a JSON object
     * @param serializationObject defines the JSON object
     */
    public parse(serializationObject: any): void {
        Vector3.FromArrayToRef(serializationObject.direction1, 0, this.direction1);
        Vector3.FromArrayToRef(serializationObject.direction2, 0, this.direction2);
        Vector3.FromArrayToRef(serializationObject.minEmitBox, 0, this.minEmitBox);
        Vector3.FromArrayToRef(serializationObject.maxEmitBox, 0, this.maxEmitBox);
    }
}
