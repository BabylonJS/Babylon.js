import { Vector3, Matrix } from "../../Maths/math.vector";
import { Scalar } from "../../Maths/math.scalar";
import { Effect } from "../../Materials/effect";
import { Particle } from "../../Particles/particle";
import { IParticleEmitterType } from "./IParticleEmitterType";
import { DeepCopier } from "../../Misc/deepCopier";
/**
 * Particle emitter emitting particles from the inside of a sphere.
 * It emits the particles alongside the sphere radius. The emission direction might be randomized.
 */
export class SphereParticleEmitter implements IParticleEmitterType {
    /**
    * Creates a new instance SphereParticleEmitter
    * @param radius the radius of the emission sphere (1 by default)
    * @param radiusRange the range of the emission sphere [0-1] 0 Surface only, 1 Entire Radius (1 by default)
    * @param directionRandomizer defines how much to randomize the particle direction [0-1]
    */
    constructor(
        /**
         * The radius of the emission sphere.
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
            positionToUpdate.copyFromFloats(randX, randY, randZ);
            return;
        }

        Vector3.TransformCoordinatesFromFloatsToRef(randX, randY, randZ, worldMatrix, positionToUpdate);
    }

    /**
     * Clones the current emitter and returns a copy of it
     * @returns the new emitter
     */
    public clone(): SphereParticleEmitter {
        let newOne = new SphereParticleEmitter(this.radius, this.directionRandomizer);

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
        return "#define SPHEREEMITTER";
    }

    /**
     * Returns the string "SphereParticleEmitter"
     * @returns a string containing the class name
     */
    public getClassName(): string {
        return "SphereParticleEmitter";
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

/**
 * Particle emitter emitting particles from the inside of a sphere.
 * It emits the particles randomly between two vectors.
 */
export class SphereDirectedParticleEmitter extends SphereParticleEmitter {

    /**
     * Creates a new instance SphereDirectedParticleEmitter
     * @param radius the radius of the emission sphere (1 by default)
     * @param direction1 the min limit of the emission direction (up vector by default)
     * @param direction2 the max limit of the emission direction (up vector by default)
     */
    constructor(radius = 1,
        /**
         * The min limit of the emission direction.
         */
        public direction1 = new Vector3(0, 1, 0),
        /**
         * The max limit of the emission direction.
         */
        public direction2 = new Vector3(0, 1, 0)) {
        super(radius);
    }

    /**
     * Called by the particle System when the direction is computed for the created particle.
     * @param worldMatrix is the world matrix of the particle system
     * @param directionToUpdate is the direction vector to update with the result
     * @param particle is the particle we are computed the direction for
     */
    public startDirectionFunction(worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle): void {
        var randX = Scalar.RandomRange(this.direction1.x, this.direction2.x);
        var randY = Scalar.RandomRange(this.direction1.y, this.direction2.y);
        var randZ = Scalar.RandomRange(this.direction1.z, this.direction2.z);
        Vector3.TransformNormalFromFloatsToRef(randX, randY, randZ, worldMatrix, directionToUpdate);
    }

    /**
     * Clones the current emitter and returns a copy of it
     * @returns the new emitter
     */
    public clone(): SphereDirectedParticleEmitter {
        let newOne = new SphereDirectedParticleEmitter(this.radius, this.direction1, this.direction2);

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
        effect.setVector3("direction1", this.direction1);
        effect.setVector3("direction2", this.direction2);
    }

    /**
     * Returns a string to use to update the GPU particles update shader
     * @returns a string containng the defines string
     */
    public getEffectDefines(): string {
        return "#define SPHEREEMITTER\n#define DIRECTEDSPHEREEMITTER";
    }

    /**
     * Returns the string "SphereDirectedParticleEmitter"
     * @returns a string containing the class name
     */
    public getClassName(): string {
        return "SphereDirectedParticleEmitter";
    }

    /**
     * Serializes the particle system to a JSON object.
     * @returns the JSON object
     */
    public serialize(): any {
        var serializationObject = super.serialize();

        serializationObject.direction1 = this.direction1.asArray();
        serializationObject.direction2 = this.direction2.asArray();

        return serializationObject;
    }

    /**
     * Parse properties from a JSON object
     * @param serializationObject defines the JSON object
     */
    public parse(serializationObject: any): void {
        super.parse(serializationObject);
        this.direction1.copyFrom(serializationObject.direction1);
        this.direction2.copyFrom(serializationObject.direction2);
    }
}
