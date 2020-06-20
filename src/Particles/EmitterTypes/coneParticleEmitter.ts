import { DeepCopier } from "../../Misc/deepCopier";
import { Vector3, Matrix, TmpVectors } from "../../Maths/math.vector";
import { Scalar } from "../../Maths/math.scalar";
import { Effect } from "../../Materials/effect";
import { Particle } from "../../Particles/particle";
import { IParticleEmitterType } from "./IParticleEmitterType";
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
        }
        else {
            this._height = 1;
        }
    }

    /**
     * Creates a new instance ConeParticleEmitter
     * @param radius the radius of the emission cone (1 by default)
     * @param angle the cone base angle (PI by default)
     * @param directionRandomizer defines how much to randomize the particle direction [0-1] (default is 0)
     */
    constructor(radius = 1, angle = Math.PI,
        /** defines how much to randomize the particle direction [0-1] (default is 0) */
        public directionRandomizer = 0) {
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
        if (isLocal) {
            TmpVectors.Vector3[0].copyFrom(particle._localPosition!).normalize();
        }
        else {
            particle.position.subtractToRef(worldMatrix.getTranslation(), TmpVectors.Vector3[0]).normalize();
        }

        var randX = Scalar.RandomRange(0, this.directionRandomizer);
        var randY = Scalar.RandomRange(0, this.directionRandomizer);
        var randZ = Scalar.RandomRange(0, this.directionRandomizer);
        directionToUpdate.x = TmpVectors.Vector3[0].x + randX;
        directionToUpdate.y = TmpVectors.Vector3[0].y + randY;
        directionToUpdate.z = TmpVectors.Vector3[0].z + randZ;
        directionToUpdate.normalize();
    }

    /**
     * Called by the particle System when the position is computed for the created particle.
     * @param worldMatrix is the world matrix of the particle system
     * @param positionToUpdate is the position vector to update with the result
     * @param particle is the particle we are computed the position for
     * @param isLocal defines if the position should be set in local space
     */
    startPositionFunction(worldMatrix: Matrix, positionToUpdate: Vector3, particle: Particle, isLocal: boolean): void {
        var s = Scalar.RandomRange(0, Math.PI * 2);
        var h: number;

        if (!this.emitFromSpawnPointOnly) {
            h = Scalar.RandomRange(0, this.heightRange);
            // Better distribution in a cone at normal angles.
            h = 1 - h * h;
        } else {
            h = 0.0001;
        }
        var radius = this._radius - Scalar.RandomRange(0, this._radius * this.radiusRange);
        radius = radius * h;

        var randX = radius * Math.sin(s);
        var randZ = radius * Math.cos(s);
        var randY = h * this._height;

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
        let newOne = new ConeParticleEmitter(this._radius, this._angle, this.directionRandomizer);

        DeepCopier.DeepCopy(this, newOne);

        return newOne;
    }

    /**
     * Called by the GPUParticleSystem to setup the update shader
     * @param effect defines the update shader
     */
    public applyToShader(effect: Effect): void {
        effect.setFloat2("radius", this._radius, this.radiusRange);
        effect.setFloat("coneAngle", this._angle);
        effect.setFloat2("height", this._height, this.heightRange);
        effect.setFloat("directionRandomizer", this.directionRandomizer);
    }

    /**
     * Returns a string to use to update the GPU particles update shader
     * @returns a string containng the defines string
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
        var serializationObject: any = {};

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
        this.heightRange = serializationObject.radiusRange !== undefined ? serializationObject.heightRange : 1;
        this.emitFromSpawnPointOnly = serializationObject.emitFromSpawnPointOnly !== undefined ? serializationObject.emitFromSpawnPointOnly : false;
    }
}
