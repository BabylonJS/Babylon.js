import { serialize, serializeAsTexture } from "../Misc/decorators";
import { Nullable } from "../types";
import { Scene } from "../scene";
import { Matrix, Vector3 } from "../Maths/math.vector";
import { Node } from "../node";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Effect } from "../Materials/effect";
import { BaseTexture } from "../Materials/Textures/baseTexture";
import { Light } from "./light";
import { ShadowLight } from "./shadowLight";
import { Texture } from '../Materials/Textures/texture';

Node.AddNodeConstructor("Light_Type_2", (name, scene) => {
    return () => new SpotLight(name, Vector3.Zero(), Vector3.Zero(), 0, 0, scene);
});

/**
 * A spot light is defined by a position, a direction, an angle, and an exponent.
 * These values define a cone of light starting from the position, emitting toward the direction.
 * The angle, in radians, defines the size (field of illumination) of the spotlight's conical beam,
 * and the exponent defines the speed of the decay of the light with distance (reach).
 * Documentation: https://doc.babylonjs.com/babylon101/lights
 */
export class SpotLight extends ShadowLight {
    /*
        upVector , rightVector and direction will form the coordinate system for this spot light.
        These three vectors will be used as projection matrix when doing texture projection.

        Also we have the following rules always holds:
        direction cross up   = right
        right cross direction = up
        up cross right       = forward

        light_near and light_far will control the range of the texture projection. If a plane is
        out of the range in spot light space, there is no texture projection.
    */

    private _angle: number;
    private _innerAngle: number = 0;
    private _cosHalfAngle: number;

    private _lightAngleScale: number;
    private _lightAngleOffset: number;

    /**
     * Gets the cone angle of the spot light in Radians.
     */
    @serialize()
    public get angle(): number {
        return this._angle;
    }
    /**
     * Sets the cone angle of the spot light in Radians.
     */
    public set angle(value: number) {
        this._angle = value;
        this._cosHalfAngle = Math.cos(value * 0.5);
        this._projectionTextureProjectionLightDirty = true;
        this.forceProjectionMatrixCompute();
        this._computeAngleValues();
    }

    /**
     * Only used in gltf falloff mode, this defines the angle where
     * the directional falloff will start before cutting at angle which could be seen
     * as outer angle.
     */
    @serialize()
    public get innerAngle(): number {
        return this._innerAngle;
    }
    /**
     * Only used in gltf falloff mode, this defines the angle where
     * the directional falloff will start before cutting at angle which could be seen
     * as outer angle.
     */
    public set innerAngle(value: number) {
        this._innerAngle = value;
        this._computeAngleValues();
    }

    private _shadowAngleScale: number;
    /**
     * Allows scaling the angle of the light for shadow generation only.
     */
    @serialize()
    public get shadowAngleScale(): number {
        return this._shadowAngleScale;
    }
    /**
     * Allows scaling the angle of the light for shadow generation only.
     */
    public set shadowAngleScale(value: number) {
        this._shadowAngleScale = value;
        this.forceProjectionMatrixCompute();
    }

    /**
     * The light decay speed with the distance from the emission spot.
     */
    @serialize()
    public exponent: number;

    private _projectionTextureMatrix = Matrix.Zero();
    /**
    * Allows reading the projecton texture
    */
    public get projectionTextureMatrix(): Matrix {
        return this._projectionTextureMatrix;
    }

    protected _projectionTextureLightNear: number = 1e-6;
    /**
     * Gets the near clip of the Spotlight for texture projection.
     */
    @serialize()
    public get projectionTextureLightNear(): number {
        return this._projectionTextureLightNear;
    }
    /**
     * Sets the near clip of the Spotlight for texture projection.
     */
    public set projectionTextureLightNear(value: number) {
        this._projectionTextureLightNear = value;
        this._projectionTextureProjectionLightDirty = true;
    }

    protected _projectionTextureLightFar: number = 1000.0;
    /**
     * Gets the far clip of the Spotlight for texture projection.
     */
    @serialize()
    public get projectionTextureLightFar(): number {
        return this._projectionTextureLightFar;
    }
    /**
     * Sets the far clip of the Spotlight for texture projection.
     */
    public set projectionTextureLightFar(value: number) {
        this._projectionTextureLightFar = value;
        this._projectionTextureProjectionLightDirty = true;
    }

    protected _projectionTextureUpDirection: Vector3 = Vector3.Up();
    /**
     * Gets the Up vector of the Spotlight for texture projection.
     */
    @serialize()
    public get projectionTextureUpDirection(): Vector3 {
        return this._projectionTextureUpDirection;
    }
    /**
     * Sets the Up vector of the Spotlight for texture projection.
     */
    public set projectionTextureUpDirection(value: Vector3) {
        this._projectionTextureUpDirection = value;
        this._projectionTextureProjectionLightDirty = true;
    }

    @serializeAsTexture("projectedLightTexture")
    private _projectionTexture: Nullable<BaseTexture>;

    /**
     * Gets the projection texture of the light.
    */
    public get projectionTexture(): Nullable<BaseTexture> {
        return this._projectionTexture;
    }
    /**
    * Sets the projection texture of the light.
    */
    public set projectionTexture(value: Nullable<BaseTexture>) {
        if (this._projectionTexture === value) {
            return;
        }
        this._projectionTexture = value;
        this._projectionTextureDirty = true;
        if (this._projectionTexture && !this._projectionTexture.isReady()) {
            let texture = this._projectionTexture as Texture;
            if (texture.onLoadObservable) {
                texture.onLoadObservable.addOnce(() => {
                    this._markMeshesAsLightDirty();
                });
            }
        }
    }

    private _projectionTextureViewLightDirty = true;
    private _projectionTextureProjectionLightDirty = true;
    private _projectionTextureDirty = true;
    private _projectionTextureViewTargetVector = Vector3.Zero();
    private _projectionTextureViewLightMatrix = Matrix.Zero();
    private _projectionTextureProjectionLightMatrix = Matrix.Zero();
    private _projectionTextureScalingMatrix = Matrix.FromValues(0.5, 0.0, 0.0, 0.0,
        0.0, 0.5, 0.0, 0.0,
        0.0, 0.0, 0.5, 0.0,
        0.5, 0.5, 0.5, 1.0);

    /**
     * Creates a SpotLight object in the scene. A spot light is a simply light oriented cone.
     * It can cast shadows.
     * Documentation : https://doc.babylonjs.com/babylon101/lights
     * @param name The light friendly name
     * @param position The position of the spot light in the scene
     * @param direction The direction of the light in the scene
     * @param angle The cone angle of the light in Radians
     * @param exponent The light decay speed with the distance from the emission spot
     * @param scene The scene the lights belongs to
     */
    constructor(name: string, position: Vector3, direction: Vector3, angle: number, exponent: number, scene: Scene) {
        super(name, scene);

        this.position = position;
        this.direction = direction;
        this.angle = angle;
        this.exponent = exponent;
    }

    /**
     * Returns the string "SpotLight".
     * @returns the class name
     */
    public getClassName(): string {
        return "SpotLight";
    }

    /**
     * Returns the integer 2.
     * @returns The light Type id as a constant defines in Light.LIGHTTYPEID_x
     */
    public getTypeID(): number {
        return Light.LIGHTTYPEID_SPOTLIGHT;
    }

    /**
     * Overrides the direction setter to recompute the projection texture view light Matrix.
     */
    protected _setDirection(value: Vector3) {
        super._setDirection(value);
        this._projectionTextureViewLightDirty = true;
    }

    /**
     * Overrides the position setter to recompute the projection texture view light Matrix.
     */
    protected _setPosition(value: Vector3) {
        super._setPosition(value);
        this._projectionTextureViewLightDirty = true;
    }

    /**
     * Sets the passed matrix "matrix" as perspective projection matrix for the shadows and the passed view matrix with the fov equal to the SpotLight angle and and aspect ratio of 1.0.
     * Returns the SpotLight.
     */
    protected _setDefaultShadowProjectionMatrix(matrix: Matrix, viewMatrix: Matrix, renderList: Array<AbstractMesh>): void {
        var activeCamera = this.getScene().activeCamera;

        if (!activeCamera) {
            return;
        }

        this._shadowAngleScale = this._shadowAngleScale || 1;
        var angle = this._shadowAngleScale * this._angle;

        Matrix.PerspectiveFovLHToRef(angle, 1.0,
            this.getDepthMinZ(activeCamera), this.getDepthMaxZ(activeCamera), matrix);
    }

    protected _computeProjectionTextureViewLightMatrix(): void {
        this._projectionTextureViewLightDirty = false;
        this._projectionTextureDirty = true;

        this.position.addToRef(this.direction, this._projectionTextureViewTargetVector);
        Matrix.LookAtLHToRef(this.position,
            this._projectionTextureViewTargetVector,
            this._projectionTextureUpDirection,
            this._projectionTextureViewLightMatrix);
    }

    protected _computeProjectionTextureProjectionLightMatrix(): void {
        this._projectionTextureProjectionLightDirty = false;
        this._projectionTextureDirty = true;

        var light_far = this.projectionTextureLightFar;
        var light_near = this.projectionTextureLightNear;

        var P = light_far / (light_far - light_near);
        var Q = - P * light_near;
        var S = 1.0 / Math.tan(this._angle / 2.0);
        var A = 1.0;

        Matrix.FromValuesToRef(S / A, 0.0, 0.0, 0.0,
            0.0, S, 0.0, 0.0,
            0.0, 0.0, P, 1.0,
            0.0, 0.0, Q, 0.0, this._projectionTextureProjectionLightMatrix);
    }

    /**
     * Main function for light texture projection matrix computing.
     */
    protected _computeProjectionTextureMatrix(): void {
        this._projectionTextureDirty = false;

        this._projectionTextureViewLightMatrix.multiplyToRef(this._projectionTextureProjectionLightMatrix, this._projectionTextureMatrix);
        if (this._projectionTexture instanceof Texture) {
            const u = this._projectionTexture.uScale / 2.0;
            const v = this._projectionTexture.vScale / 2.0;
            Matrix.FromValuesToRef(
                u,   0.0, 0.0, 0.0,
                0.0, v,   0.0, 0.0,
                0.0, 0.0, 0.5, 0.0,
                0.5, 0.5, 0.5, 1.0
            , this._projectionTextureScalingMatrix);
        }
        this._projectionTextureMatrix.multiplyToRef(this._projectionTextureScalingMatrix, this._projectionTextureMatrix);
    }

    protected _buildUniformLayout(): void {
        this._uniformBuffer.addUniform("vLightData", 4);
        this._uniformBuffer.addUniform("vLightDiffuse", 4);
        this._uniformBuffer.addUniform("vLightSpecular", 4);
        this._uniformBuffer.addUniform("vLightDirection", 3);
        this._uniformBuffer.addUniform("vLightFalloff", 4);
        this._uniformBuffer.addUniform("shadowsInfo", 3);
        this._uniformBuffer.addUniform("depthValues", 2);
        this._uniformBuffer.create();
    }

    private _computeAngleValues(): void {
        this._lightAngleScale = 1.0 / Math.max(0.001, (Math.cos(this._innerAngle * 0.5) - this._cosHalfAngle));
        this._lightAngleOffset = -this._cosHalfAngle * this._lightAngleScale;
    }

    /**
     * Sets the passed Effect "effect" with the Light textures.
     * @param effect The effect to update
     * @param lightIndex The index of the light in the effect to update
     * @returns The light
     */
    public transferTexturesToEffect(effect: Effect, lightIndex: string): Light {
        if (this.projectionTexture && this.projectionTexture.isReady()) {
            if (this._projectionTextureViewLightDirty) {
                this._computeProjectionTextureViewLightMatrix();
            }
            if (this._projectionTextureProjectionLightDirty) {
                this._computeProjectionTextureProjectionLightMatrix();
            }
            if (this._projectionTextureDirty) {
                this._computeProjectionTextureMatrix();
            }
            effect.setMatrix("textureProjectionMatrix" + lightIndex, this._projectionTextureMatrix);
            effect.setTexture("projectionLightSampler" + lightIndex, this.projectionTexture);
        }
        return this;
    }

    /**
     * Sets the passed Effect object with the SpotLight transfomed position (or position if not parented) and normalized direction.
     * @param effect The effect to update
     * @param lightIndex The index of the light in the effect to update
     * @returns The spot light
     */
    public transferToEffect(effect: Effect, lightIndex: string): SpotLight {
        var normalizeDirection;

        if (this.computeTransformedInformation()) {
            this._uniformBuffer.updateFloat4("vLightData",
                this.transformedPosition.x,
                this.transformedPosition.y,
                this.transformedPosition.z,
                this.exponent,
                lightIndex);

            normalizeDirection = Vector3.Normalize(this.transformedDirection);
        } else {
            this._uniformBuffer.updateFloat4("vLightData",
                this.position.x,
                this.position.y,
                this.position.z,
                this.exponent,
                lightIndex);

            normalizeDirection = Vector3.Normalize(this.direction);
        }

        this._uniformBuffer.updateFloat4("vLightDirection",
            normalizeDirection.x,
            normalizeDirection.y,
            normalizeDirection.z,
            this._cosHalfAngle,
            lightIndex);

        this._uniformBuffer.updateFloat4("vLightFalloff",
            this.range,
            this._inverseSquaredRange,
            this._lightAngleScale,
            this._lightAngleOffset,
            lightIndex
        );
        return this;
    }

    public transferToNodeMaterialEffect(effect: Effect, lightDataUniformName: string) {
        var normalizeDirection;

        if (this.computeTransformedInformation()) {
            normalizeDirection = Vector3.Normalize(this.transformedDirection);
        } else {
            normalizeDirection = Vector3.Normalize(this.direction);
        }

        if (this.getScene().useRightHandedSystem) {
            effect.setFloat3(lightDataUniformName, -normalizeDirection.x, -normalizeDirection.y, -normalizeDirection.z);
        } else {
            effect.setFloat3(lightDataUniformName, normalizeDirection.x, normalizeDirection.y, normalizeDirection.z);
        }

        return this;
    }

    /**
     * Disposes the light and the associated resources.
     */
    public dispose(): void {
        super.dispose();
        if (this._projectionTexture) {
            this._projectionTexture.dispose();
        }
    }

    /**
     * Prepares the list of defines specific to the light type.
     * @param defines the list of defines
     * @param lightIndex defines the index of the light for the effect
     */
    public prepareLightSpecificDefines(defines: any, lightIndex: number): void {
        defines["SPOTLIGHT" + lightIndex] = true;
        defines["PROJECTEDLIGHTTEXTURE" + lightIndex] = this.projectionTexture && this.projectionTexture.isReady() ? true : false;
    }
}
