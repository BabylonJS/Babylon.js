import { DeepCopier } from "../../Misc/deepCopier";
import { Vector3, Matrix } from "../../Maths/math.vector";
import { Scalar } from "../../Maths/math.scalar";
import { Effect } from "../../Materials/effect";
import { Particle } from "../../Particles/particle";
import { IParticleEmitterType } from "./IParticleEmitterType";
/**
 * Particle emitter emitting particles from the inside of a hemisphere.
 * It emits the particles alongside the hemisphere radius. The emission direction might be randomized.
 */
export class HemisphericParticleEmitter implements IParticleEmitterType {
    /**
    * Creates a new instance HemisphericParticleEmitter
    * @param radius the radius of the emission hemisphere (1 by default)
    * @param radiusRange the range of the emission hemisphere [0-1] 0 Surface only, 1 Entire Radius (1 by default)
    * @param directionRandomizer defines how much to randomize the particle direction [0-1]
    */
    constructor(
        /**
         * The radius of the emission hemisphere.
         */
        public radius = 1,
        /**
         * The range of emission [0-1] 0 Surface only, 1 Entire Radius.
         */
        public radiusRange = 1,
        /**
         * How much to randomize the particle direction [0-1].
         */
        public directionRandomizer = 0) {
    }

    /**
     * Called by the particle System when the direction is computed for the created particle.
     * @param worldMatrix is the world matrix of the particle system
     * @param directionToUpdate is the direction vector to update with the result
     * @param particle is the particle we are computed the direction for
     * @param isLocal defines if the direction should be set in local space
     */
    public startDirectionFunction(worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle, isLocal: boolean): void {
        var direction = particle.position.subtract(worldMatrix.getTranslation()).normalize();
        var randX = Scalar.RandomRange(0, this.directionRandomizer);
        var randY = Scalar.RandomRange(0, this.directionRandomizer);
        var randZ = Scalar.RandomRange(0, this.directionRandomizer);
        direction.x += randX;
        direction.y += randY;
        direction.z += randZ;
        direction.normalize();

        if (isLocal) {
            directionToUpdate.copyFrom(direction);
            return;
        }

        Vector3.TransformNormalFromFloatsToRef(direction.x, direction.y, direction.z, worldMatrix, directionToUpdate);
    }

    /**
     * Called by the particle System when the position is computed for the created particle.
     * @param worldMatrix is the world matrix of the particle system
     * @param positionToUpdate is the position vector to update with the result
     * @param particle is the particle we are computed the position for
     * @param isLocal defines if the position should be set in local space
     */
    public startPositionFunction(worldMatrix: Matrix, positionToUpdate: Vector3, particle: Particle, isLocal: boolean): void {
        var randRadius = this.radius - Scalar.RandomRange(0, this.radius * this.radiusRange);
        var v = Scalar.RandomRange(0, 1.0);
        var phi = Scalar.RandomRange(0, 2 * Math.PI);
        var theta = Math.acos(2 * v - 1);
        var randX = randRadius * Math.cos(phi) * Math.sin(theta);
        var randY = randRadius * Math.cos(theta);
        var randZ = randRadius * Math.sin(phi) * Math.sin(theta);

        if (isLocal) {
            positionToUpdate.copyFromFloats(randX, Math.abs(randY), randZ);
            return;
        }

        Vector3.TransformCoordinatesFromFloatsToRef(randX, Math.abs(randY), randZ, worldMatrix, positionToUpdate);
    }

    /**
     * Clones the current emitter and returns a copy of it
     * @returns the new emitter
     */
    public clone(): HemisphericParticleEmitter {
        let newOne = new HemisphericParticleEmitter(this.radius, this.directionRandomizer);

        DeepCopier.DeepCopy(this, newOne);

        return newOne;
    }

    /**
     * Called by the GPUParticleSystem to setup the update shader
     * @param effect defines the update shader
     */
    public applyToShader(effect: Effect): void {
        effect.setFloat("radius", this.radius);
        effect.setFloat("radiusRange", this.radiusRange);
        effect.setFloat("directionRandomizer", this.directionRandomizer);
    }

    /**
     * Returns a string to use to update the GPU particles update shader
     * @returns a string containng the defines string
     */
    public getEffectDefines(): string {
        return "#define HEMISPHERICEMITTER";
    }

    /**
     * Returns the string "HemisphericParticleEmitter"
     * @returns a string containing the class name
     */
    public getClassName(): string {
        return "HemisphericParticleEmitter";
    }

    /**
     * Serializes the particle system to a JSON object.
     * @returns the JSON object
     */
    public serialize(): any {
        var serializationObject: any = {};
        serializationObject.type = this.getClassName();
        serializationObject.radius = this.radius;
        serializationObject.radiusRange = this.radiusRange;
        serializationObject.directionRandomizer = this.directionRandomizer;

        return serializationObject;
    }

    /**
     * Parse properties from a JSON object
     * @param serializationObject defines the JSON object
     */
    public parse(serializationObject: any): void {
        this.radius = serializationObject.radius;
        this.radiusRange = serializationObject.radiusRange;
        this.directionRandomizer = serializationObject.directionRandomizer;
    }
}
