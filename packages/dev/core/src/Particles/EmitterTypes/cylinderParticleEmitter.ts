import type { Matrix } from "../../Maths/math.vector";
import { Vector3 } from "../../Maths/math.vector";
import { Scalar } from "../../Maths/math.scalar";
import type { Particle } from "../../Particles/particle";
import type { IParticleEmitterType } from "./IParticleEmitterType";
import { DeepCopier } from "../../Misc/deepCopier";
import type { UniformBufferEffectCommonAccessor } from "../../Materials/uniformBufferEffectCommonAccessor";
import type { UniformBuffer } from "../../Materials/uniformBuffer";
/**
 * Particle emitter emitting particles from the inside of a cylinder.
 * It emits the particles alongside the cylinder radius. The emission direction might be randomized.
 */
export class CylinderParticleEmitter implements IParticleEmitterType {
    private _tempVector = Vector3.Zero();

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
        public directionRandomizer = 0
    ) {}

    /**
     * Called by the particle System when the direction is computed for the created particle.
     * @param worldMatrix is the world matrix of the particle system
     * @param directionToUpdate is the direction vector to update with the result
     * @param particle is the particle we are computed the direction for
     * @param isLocal defines if the direction should be set in local space
     * @param inverseWorldMatrix defines the inverted world matrix to use if isLocal is false
     */
    public startDirectionFunction(worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle, isLocal: boolean, inverseWorldMatrix: Matrix): void {
        particle.position.subtractToRef(worldMatrix.getTranslation(), this._tempVector);

        this._tempVector.normalize();

        Vector3.TransformNormalToRef(this._tempVector, inverseWorldMatrix, this._tempVector);

        const randY = Scalar.RandomRange(-this.directionRandomizer / 2, this.directionRandomizer / 2);

        let angle = Math.atan2(this._tempVector.x, this._tempVector.z);
        angle += Scalar.RandomRange(-Math.PI / 2, Math.PI / 2) * this.directionRandomizer;

        this._tempVector.y = randY; // set direction y to rand y to mirror normal of cylinder surface
        this._tempVector.x = Math.sin(angle);
        this._tempVector.z = Math.cos(angle);
        this._tempVector.normalize();

        if (isLocal) {
            directionToUpdate.copyFrom(this._tempVector);
            return;
        }

        Vector3.TransformNormalFromFloatsToRef(this._tempVector.x, this._tempVector.y, this._tempVector.z, worldMatrix, directionToUpdate);
    }

    /**
     * Called by the particle System when the position is computed for the created particle.
     * @param worldMatrix is the world matrix of the particle system
     * @param positionToUpdate is the position vector to update with the result
     * @param particle is the particle we are computed the position for
     * @param isLocal defines if the position should be set in local space
     */
    public startPositionFunction(worldMatrix: Matrix, positionToUpdate: Vector3, particle: Particle, isLocal: boolean): void {
        const yPos = Scalar.RandomRange(-this.height / 2, this.height / 2);
        const angle = Scalar.RandomRange(0, 2 * Math.PI);

        // Pick a properly distributed point within the circle https://programming.guide/random-point-within-circle.html
        const radiusDistribution = Scalar.RandomRange((1 - this.radiusRange) * (1 - this.radiusRange), 1);
        const positionRadius = Math.sqrt(radiusDistribution) * this.radius;
        const xPos = positionRadius * Math.cos(angle);
        const zPos = positionRadius * Math.sin(angle);

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
        const newOne = new CylinderParticleEmitter(this.radius, this.directionRandomizer);

        DeepCopier.DeepCopy(this, newOne);

        return newOne;
    }

    /**
     * Called by the GPUParticleSystem to setup the update shader
     * @param uboOrEffect defines the update shader
     */
    public applyToShader(uboOrEffect: UniformBufferEffectCommonAccessor): void {
        uboOrEffect.setFloat("radius", this.radius);
        uboOrEffect.setFloat("height", this.height);
        uboOrEffect.setFloat("radiusRange", this.radiusRange);
        uboOrEffect.setFloat("directionRandomizer", this.directionRandomizer);
    }

    /**
     * Creates the structure of the ubo for this particle emitter
     * @param ubo ubo to create the structure for
     */
    public buildUniformLayout(ubo: UniformBuffer): void {
        ubo.addUniform("radius", 1);
        ubo.addUniform("height", 1);
        ubo.addUniform("radiusRange", 1);
        ubo.addUniform("directionRandomizer", 1);
    }

    /**
     * Returns a string to use to update the GPU particles update shader
     * @returns a string containing the defines string
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
        const serializationObject: any = {};
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
        public direction2 = new Vector3(0, 1, 0)
    ) {
        super(radius, height, radiusRange);
    }

    /**
     * Called by the particle System when the direction is computed for the created particle.
     * @param worldMatrix is the world matrix of the particle system
     * @param directionToUpdate is the direction vector to update with the result
     * @param _particle is the particle we are computed the direction for
     * @param isLocal defines if the direction should be set in local space
     */
    public startDirectionFunction(worldMatrix: Matrix, directionToUpdate: Vector3, _particle: Particle, isLocal: boolean): void {
        const randX = Scalar.RandomRange(this.direction1.x, this.direction2.x);
        const randY = Scalar.RandomRange(this.direction1.y, this.direction2.y);
        const randZ = Scalar.RandomRange(this.direction1.z, this.direction2.z);
        if (isLocal) {
            directionToUpdate.copyFromFloats(randX, randY, randZ);
            return;
        }
        Vector3.TransformNormalFromFloatsToRef(randX, randY, randZ, worldMatrix, directionToUpdate);
    }

    /**
     * Clones the current emitter and returns a copy of it
     * @returns the new emitter
     */
    public clone(): CylinderDirectedParticleEmitter {
        const newOne = new CylinderDirectedParticleEmitter(this.radius, this.height, this.radiusRange, this.direction1, this.direction2);

        DeepCopier.DeepCopy(this, newOne);

        return newOne;
    }

    /**
     * Called by the GPUParticleSystem to setup the update shader
     * @param uboOrEffect defines the update shader
     */
    public applyToShader(uboOrEffect: UniformBufferEffectCommonAccessor): void {
        uboOrEffect.setFloat("radius", this.radius);
        uboOrEffect.setFloat("height", this.height);
        uboOrEffect.setFloat("radiusRange", this.radiusRange);
        uboOrEffect.setVector3("direction1", this.direction1);
        uboOrEffect.setVector3("direction2", this.direction2);
    }

    /**
     * Creates the structure of the ubo for this particle emitter
     * @param ubo ubo to create the structure for
     */
    public buildUniformLayout(ubo: UniformBuffer): void {
        ubo.addUniform("radius", 1);
        ubo.addUniform("height", 1);
        ubo.addUniform("radiusRange", 1);
        ubo.addUniform("direction1", 3);
        ubo.addUniform("direction2", 3);
    }

    /**
     * Returns a string to use to update the GPU particles update shader
     * @returns a string containing the defines string
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
        const serializationObject = super.serialize();

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
