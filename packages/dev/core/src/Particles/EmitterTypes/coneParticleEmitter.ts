import type { Matrix } from "core/Maths/math.vector";
import type { Particle } from "core/Particles/particle";
import type { UniformBufferEffectCommonAccessor } from "core/Materials/uniformBufferEffectCommonAccessor";
import type { UniformBuffer } from "core/Materials/uniformBuffer";
import type { IParticleEmitterType } from "./IParticleEmitterType";

import { DeepCopier } from "core/Misc/deepCopier";
import { Vector3 } from "core/Maths/math.vector";
import { RandomRange } from "core/Maths/math.scalar.functions";

/**
 * Particle emitter emitting particles from the inside of a cone.
 * It emits the particles alongside the cone volume from the base to the particle.
 * The emission direction might be randomized.
 */
export class ConeParticleEmitter implements IParticleEmitterType {
    private _radius: number;
    private _angle: number;
    private _height: number;

    /**
     * Gets or sets a value indicating where on the radius the start position should be picked (1 = everywhere, 0 = only surface)
     */
    public radiusRange = 1;

    /**
     * Gets or sets a value indicating where on the height the start position should be picked (1 = everywhere, 0 = only surface)
     */
    public heightRange = 1;

    /**
     * Gets or sets a value indicating if all the particles should be emitted from the spawn point only (the base of the cone)
     */
    public emitFromSpawnPointOnly = false;

    /**
     * Gets or sets the radius of the emission cone
     */
    public get radius(): number {
        return this._radius;
    }

    public set radius(value: number) {
        this._radius = value;
        this._buildHeight();
    }

    /**
     * Gets or sets the angle of the emission cone
     */
    public get angle(): number {
        return this._angle;
    }

    public set angle(value: number) {
        this._angle = value;
        this._buildHeight();
    }

    private _buildHeight() {
        if (this._angle !== 0) {
            this._height = this._radius / Math.tan(this._angle / 2);
        } else {
            this._height = 1;
        }
    }

    /**
     * Creates a new instance ConeParticleEmitter
     * @param radius the radius of the emission cone (1 by default)
     * @param angle the cone base angle (PI by default)
     * @param directionRandomizer defines how much to randomize the particle direction [0-1] (default is 0)
     */
    constructor(
        radius = 1,
        angle = Math.PI,
        /** [0] defines how much to randomize the particle direction [0-1] (default is 0) */
        public directionRandomizer = 0
    ) {
        this.angle = angle;
        this.radius = radius;
    }

    /**
     * Called by the particle System when the direction is computed for the created particle.
     * @param worldMatrix is the world matrix of the particle system
     * @param directionToUpdate is the direction vector to update with the result
     * @param particle is the particle we are computed the direction for
     * @param isLocal defines if the direction should be set in local space
     */
    public startDirectionFunction(worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle, isLocal: boolean): void {
        const direction = particle.position.subtract(worldMatrix.getTranslation()).normalize();
        const randX = RandomRange(0, this.directionRandomizer);
        const randY = RandomRange(0, this.directionRandomizer);
        const randZ = RandomRange(0, this.directionRandomizer);
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
    startPositionFunction(worldMatrix: Matrix, positionToUpdate: Vector3, particle: Particle, isLocal: boolean): void {
        const s = RandomRange(0, Math.PI * 2);
        let h: number;

        if (!this.emitFromSpawnPointOnly) {
            h = RandomRange(0, this.heightRange);
            // Better distribution in a cone at normal angles.
            h = 1 - h * h;
        } else {
            h = 0.0001;
        }
        let radius = this._radius - RandomRange(0, this._radius * this.radiusRange);
        radius = radius * h;

        const randX = radius * Math.sin(s);
        const randZ = radius * Math.cos(s);
        const randY = h * this._height;

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
    public clone(): ConeParticleEmitter {
        const newOne = new ConeParticleEmitter(this._radius, this._angle, this.directionRandomizer);

        DeepCopier.DeepCopy(this, newOne);

        return newOne;
    }

    /**
     * Called by the GPUParticleSystem to setup the update shader
     * @param uboOrEffect defines the update shader
     */
    public applyToShader(uboOrEffect: UniformBufferEffectCommonAccessor): void {
        uboOrEffect.setFloat2("radius", this._radius, this.radiusRange);
        uboOrEffect.setFloat("coneAngle", this._angle);
        uboOrEffect.setFloat2("height", this._height, this.heightRange);
        uboOrEffect.setFloat("directionRandomizer", this.directionRandomizer);
    }

    /**
     * Creates the structure of the ubo for this particle emitter
     * @param ubo ubo to create the structure for
     */
    public buildUniformLayout(ubo: UniformBuffer): void {
        ubo.addUniform("radius", 2);
        ubo.addUniform("coneAngle", 1);
        ubo.addUniform("height", 2);
        ubo.addUniform("directionRandomizer", 1);
    }

    /**
     * Returns a string to use to update the GPU particles update shader
     * @returns a string containing the defines string
     */
    public getEffectDefines(): string {
        let defines = "#define CONEEMITTER";

        if (this.emitFromSpawnPointOnly) {
            defines += "\n#define CONEEMITTERSPAWNPOINT";
        }

        return defines;
    }

    /**
     * Returns the string "ConeParticleEmitter"
     * @returns a string containing the class name
     */
    public getClassName(): string {
        return "ConeParticleEmitter";
    }

    /**
     * Serializes the particle system to a JSON object.
     * @returns the JSON object
     */
    public serialize(): any {
        const serializationObject: any = {};

        serializationObject.type = this.getClassName();
        serializationObject.radius = this._radius;
        serializationObject.angle = this._angle;
        serializationObject.directionRandomizer = this.directionRandomizer;
        serializationObject.radiusRange = this.radiusRange;
        serializationObject.heightRange = this.heightRange;
        serializationObject.emitFromSpawnPointOnly = this.emitFromSpawnPointOnly;

        return serializationObject;
    }

    /**
     * Parse properties from a JSON object
     * @param serializationObject defines the JSON object
     */
    public parse(serializationObject: any): void {
        this.radius = serializationObject.radius;
        this.angle = serializationObject.angle;
        this.directionRandomizer = serializationObject.directionRandomizer;

        this.radiusRange = serializationObject.radiusRange !== undefined ? serializationObject.radiusRange : 1;
        this.heightRange = serializationObject.heightRange !== undefined ? serializationObject.heightRange : 1;
        this.emitFromSpawnPointOnly = serializationObject.emitFromSpawnPointOnly !== undefined ? serializationObject.emitFromSpawnPointOnly : false;
    }
}
export class ConeDirectedParticleEmitter extends ConeParticleEmitter {
    constructor(
        radius = 1,
        angle = Math.PI,
        /**
         * [Up vector] The min limit of the emission direction.
         */
        public direction1 = new Vector3(0, 1, 0),
        /**
         * [Up vector] The max limit of the emission direction.
         */
        public direction2 = new Vector3(0, 1, 0)
    ) {
        super(radius, angle);
    }

    /**
     * Called by the particle System when the direction is computed for the created particle.
     * @param worldMatrix is the world matrix of the particle system
     * @param directionToUpdate is the direction vector to update with the result
     * @param particle is the particle we are computed the position for
     * @param isLocal defines if the direction should be set in local space
     */
    public override startDirectionFunction(worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle, isLocal: boolean): void {
        const randX = RandomRange(this.direction1.x, this.direction2.x);
        const randY = RandomRange(this.direction1.y, this.direction2.y);
        const randZ = RandomRange(this.direction1.z, this.direction2.z);

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
    public override clone(): ConeDirectedParticleEmitter {
        const newOne = new ConeDirectedParticleEmitter(this.radius, this.angle, this.direction1, this.direction2);

        DeepCopier.DeepCopy(this, newOne);

        return newOne;
    }

    /**
     * Called by the GPUParticleSystem to setup the update shader
     * @param uboOrEffect defines the update shader
     */
    public override applyToShader(uboOrEffect: UniformBufferEffectCommonAccessor): void {
        uboOrEffect.setFloat("radius", this.radius);
        uboOrEffect.setFloat("radiusRange", this.radiusRange);
        uboOrEffect.setVector3("direction1", this.direction1);
        uboOrEffect.setVector3("direction2", this.direction2);
    }

    /**
     * Creates the structure of the ubo for this particle emitter
     * @param ubo ubo to create the structure for
     */
    public override buildUniformLayout(ubo: UniformBuffer): void {
        ubo.addUniform("radius", 1);
        ubo.addUniform("radiusRange", 1);
        ubo.addUniform("direction1", 3);
        ubo.addUniform("direction2", 3);
    }

    /**
     * Returns a string to use to update the GPU particles update shader
     * @returns a string containing the defines string
     */
    public override getEffectDefines(): string {
        return "#define CONEEMITTER\n#define DIRECTEDCONEEMITTER";
    }

    /**
     * Returns the string "ConeDirectedParticleEmitter"
     * @returns a string containing the class name
     */
    public override getClassName(): string {
        return "ConeDirectedParticleEmitter";
    }

    /**
     * Serializes the particle system to a JSON object.
     * @returns the JSON object
     */
    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.direction1 = this.direction1.asArray();
        serializationObject.direction2 = this.direction2.asArray();

        return serializationObject;
    }

    /**
     * Parse properties from a JSON object
     * @param serializationObject defines the JSON object
     */
    public override parse(serializationObject: any): void {
        super.parse(serializationObject);
        Vector3.FromArrayToRef(serializationObject.direction1, 0, this.direction1);
        Vector3.FromArrayToRef(serializationObject.direction2, 0, this.direction2);
    }
}
