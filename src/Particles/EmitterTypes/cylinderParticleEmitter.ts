import { Vector3, Matrix } from "../../Maths/math.vector";
import { Scalar } from "../../Maths/math.scalar";
import { Effect } from "../../Materials/effect";
import { Particle } from "../../Particles/particle";
import { IParticleEmitterType } from "./IParticleEmitterType";
import { DeepCopier } from "../../Misc/deepCopier";
/**
 * Particle emitter emitting particles from the inside of a cylinder.
 * It emits the particles alongside the cylinder radius. The emission direction might be randomized.
 */
export class CylinderParticleEmitter implements IParticleEmitterType {
    /**
    * Creates a new instance CylinderParticleEmitter
    * @param radius the radius of the emission cylinder (1 by default)
    * @param height the height of the emission cylinder (1 by default)
    * @param radiusRange the range of the emission cylinder [0-1] 0 Surface only, 1 Entire Radius (1 by default)
    * @param directionRandomizer defines how much to randomize the particle direction [0-1]
    */
    constructor(
        /**
         * The radius of the emission cylinder.
         */
        public radius = 1,
        /**
         * The height of the emission cylinder.
         */
        public height = 1,
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
        var randY = Scalar.RandomRange(-this.directionRandomizer / 2, this.directionRandomizer / 2);

        var angle = Math.atan2(direction.x, direction.z);
        angle += Scalar.RandomRange(-Math.PI / 2, Math.PI / 2) * this.directionRandomizer;

        direction.y = randY; // set direction y to rand y to mirror normal of cylinder surface
        direction.x = Math.sin(angle);
        direction.z = Math.cos(angle);
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
        var yPos = Scalar.RandomRange(-this.height / 2, this.height / 2);
        var angle = Scalar.RandomRange(0, 2 * Math.PI);

        // Pick a properly distributed point within the circle https://programming.guide/random-point-within-circle.html
        var radiusDistribution = Scalar.RandomRange((1 - this.radiusRange) * (1 - this.radiusRange), 1);
        var positionRadius = Math.sqrt(radiusDistribution) * this.radius;
        var xPos = positionRadius * Math.cos(angle);
        var zPos = positionRadius * Math.sin(angle);

        if (isLocal) {
            positionToUpdate.copyFromFloats(xPos, yPos, zPos);
            return;
        }

        Vector3.TransformCoordinatesFromFloatsToRef(xPos, yPos, zPos, worldMatrix, positionToUpdate);
    }

    /**
     * Clones the current emitter and returns a copy of it
     * @returns the new emitter
     */
    public clone(): CylinderParticleEmitter {
        let newOne = new CylinderParticleEmitter(this.radius, this.directionRandomizer);

        DeepCopier.DeepCopy(this, newOne);

        return newOne;
    }

    /**
     * Called by the GPUParticleSystem to setup the update shader
     * @param effect defines the update shader
     */
    public applyToShader(effect: Effect): void {
        effect.setFloat("radius", this.radius);
        effect.setFloat("height", this.height);
        effect.setFloat("radiusRange", this.radiusRange);
        effect.setFloat("directionRandomizer", this.directionRandomizer);
    }

    /**
     * Returns a string to use to update the GPU particles update shader
     * @returns a string containng the defines string
     */
    public getEffectDefines(): string {
        return "#define CYLINDEREMITTER";
    }

    /**
     * Returns the string "CylinderParticleEmitter"
     * @returns a string containing the class name
     */
    public getClassName(): string {
        return "CylinderParticleEmitter";
    }

    /**
     * Serializes the particle system to a JSON object.
     * @returns the JSON object
     */
    public serialize(): any {
        var serializationObject: any = {};
        serializationObject.type = this.getClassName();
        serializationObject.radius = this.radius;
        serializationObject.height = this.height;
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
        this.height = serializationObject.height;
        this.radiusRange = serializationObject.radiusRange;
        this.directionRandomizer = serializationObject.directionRandomizer;
    }
}

/**
 * Particle emitter emitting particles from the inside of a cylinder.
 * It emits the particles randomly between two vectors.
 */
export class CylinderDirectedParticleEmitter extends CylinderParticleEmitter {

    /**
     * Creates a new instance CylinderDirectedParticleEmitter
     * @param radius the radius of the emission cylinder (1 by default)
     * @param height the height of the emission cylinder (1 by default)
     * @param radiusRange the range of the emission cylinder [0-1] 0 Surface only, 1 Entire Radius (1 by default)
     * @param direction1 the min limit of the emission direction (up vector by default)
     * @param direction2 the max limit of the emission direction (up vector by default)
     */
    constructor(
        radius = 1,
        height = 1,
        radiusRange = 1,
        /**
         * The min limit of the emission direction.
         */
        public direction1 = new Vector3(0, 1, 0),
        /**
         * The max limit of the emission direction.
         */
        public direction2 = new Vector3(0, 1, 0)) {
        super(radius, height, radiusRange);
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
    public clone(): CylinderDirectedParticleEmitter {
        let newOne = new CylinderDirectedParticleEmitter(this.radius, this.height, this.radiusRange, this.direction1, this.direction2);

        DeepCopier.DeepCopy(this, newOne);

        return newOne;
    }

    /**
     * Called by the GPUParticleSystem to setup the update shader
     * @param effect defines the update shader
     */
    public applyToShader(effect: Effect): void {
        effect.setFloat("radius", this.radius);
        effect.setFloat("height", this.height);
        effect.setFloat("radiusRange", this.radiusRange);
        effect.setVector3("direction1", this.direction1);
        effect.setVector3("direction2", this.direction2);
    }

    /**
     * Returns a string to use to update the GPU particles update shader
     * @returns a string containng the defines string
     */
    public getEffectDefines(): string {
        return "#define CYLINDEREMITTER\n#define DIRECTEDCYLINDEREMITTER";
    }

    /**
     * Returns the string "CylinderDirectedParticleEmitter"
     * @returns a string containing the class name
     */
    public getClassName(): string {
        return "CylinderDirectedParticleEmitter";
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
