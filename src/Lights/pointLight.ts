import { serialize } from "../Misc/decorators";
import { Scene } from "../scene";
import { Matrix, Vector3 } from "../Maths/math.vector";
import { Node } from "../node";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Light } from "./light";
import { ShadowLight } from "./shadowLight";
import { Effect } from "../Materials/effect";

Node.AddNodeConstructor("Light_Type_0", (name, scene) => {
    return () => new PointLight(name, Vector3.Zero(), scene);
});

/**
 * A point light is a light defined by an unique point in world space.
 * The light is emitted in every direction from this point.
 * A good example of a point light is a standard light bulb.
 * Documentation: https://doc.babylonjs.com/babylon101/lights
 */
export class PointLight extends ShadowLight {

    private _shadowAngle = Math.PI / 2;
    /**
     * Getter: In case of direction provided, the shadow will not use a cube texture but simulate a spot shadow as a fallback
     * This specifies what angle the shadow will use to be created.
     *
     * It default to 90 degrees to work nicely with the cube texture generation for point lights shadow maps.
     */
    @serialize()
    public get shadowAngle(): number {
        return this._shadowAngle;
    }
    /**
     * Setter: In case of direction provided, the shadow will not use a cube texture but simulate a spot shadow as a fallback
     * This specifies what angle the shadow will use to be created.
     *
     * It default to 90 degrees to work nicely with the cube texture generation for point lights shadow maps.
     */
    public set shadowAngle(value: number) {
        this._shadowAngle = value;
        this.forceProjectionMatrixCompute();
    }

    /**
     * Gets the direction if it has been set.
     * In case of direction provided, the shadow will not use a cube texture but simulate a spot shadow as a fallback
     */
    public get direction(): Vector3 {
        return this._direction;
    }

    /**
     * In case of direction provided, the shadow will not use a cube texture but simulate a spot shadow as a fallback
     */
    public set direction(value: Vector3) {
        var previousNeedCube = this.needCube();
        this._direction = value;
        if (this.needCube() !== previousNeedCube && this._shadowGenerator) {
            this._shadowGenerator.recreateShadowMap();
        }
    }

    /**
     * Creates a PointLight object from the passed name and position (Vector3) and adds it in the scene.
     * A PointLight emits the light in every direction.
     * It can cast shadows.
     * If the scene camera is already defined and you want to set your PointLight at the camera position, just set it :
     * ```javascript
     * var pointLight = new PointLight("pl", camera.position, scene);
     * ```
     * Documentation : https://doc.babylonjs.com/babylon101/lights
     * @param name The light friendly name
     * @param position The position of the point light in the scene
     * @param scene The scene the lights belongs to
     */
    constructor(name: string, position: Vector3, scene: Scene) {
        super(name, scene);
        this.position = position;
    }

    /**
     * Returns the string "PointLight"
     * @returns the class name
     */
    public getClassName(): string {
        return "PointLight";
    }

    /**
     * Returns the integer 0.
     * @returns The light Type id as a constant defines in Light.LIGHTTYPEID_x
     */
    public getTypeID(): number {
        return Light.LIGHTTYPEID_POINTLIGHT;
    }

    /**
     * Specifies wether or not the shadowmap should be a cube texture.
     * @returns true if the shadowmap needs to be a cube texture.
     */
    public needCube(): boolean {
        return !this.direction;
    }

    /**
     * Returns a new Vector3 aligned with the PointLight cube system according to the passed cube face index (integer).
     * @param faceIndex The index of the face we are computed the direction to generate shadow
     * @returns The set direction in 2d mode otherwise the direction to the cubemap face if needCube() is true
     */
    public getShadowDirection(faceIndex?: number): Vector3 {
        if (this.direction) {
            return super.getShadowDirection(faceIndex);
        }
        else {
            switch (faceIndex) {
                case 0:
                    return new Vector3(1.0, 0.0, 0.0);
                case 1:
                    return new Vector3(-1.0, 0.0, 0.0);
                case 2:
                    return new Vector3(0.0, -1.0, 0.0);
                case 3:
                    return new Vector3(0.0, 1.0, 0.0);
                case 4:
                    return new Vector3(0.0, 0.0, 1.0);
                case 5:
                    return new Vector3(0.0, 0.0, -1.0);
            }
        }

        return Vector3.Zero();
    }

    /**
     * Sets the passed matrix "matrix" as a left-handed perspective projection matrix with the following settings :
     * - fov = PI / 2
     * - aspect ratio : 1.0
     * - z-near and far equal to the active camera minZ and maxZ.
     * Returns the PointLight.
     */
    protected _setDefaultShadowProjectionMatrix(matrix: Matrix, viewMatrix: Matrix, renderList: Array<AbstractMesh>): void {
        var activeCamera = this.getScene().activeCamera;

        if (!activeCamera) {
            return;
        }

        Matrix.PerspectiveFovLHToRef(this.shadowAngle, 1.0,
            this.getDepthMinZ(activeCamera), this.getDepthMaxZ(activeCamera), matrix);
    }

    protected _buildUniformLayout(): void {
        this._uniformBuffer.addUniform("vLightData", 4);
        this._uniformBuffer.addUniform("vLightDiffuse", 4);
        this._uniformBuffer.addUniform("vLightSpecular", 4);
        this._uniformBuffer.addUniform("vLightFalloff", 4);
        this._uniformBuffer.addUniform("shadowsInfo", 3);
        this._uniformBuffer.addUniform("depthValues", 2);
        this._uniformBuffer.create();
    }

    /**
     * Sets the passed Effect "effect" with the PointLight transformed position (or position, if none) and passed name (string).
     * @param effect The effect to update
     * @param lightIndex The index of the light in the effect to update
     * @returns The point light
     */
    public transferToEffect(effect: Effect, lightIndex: string): PointLight {
        if (this.computeTransformedInformation()) {
            this._uniformBuffer.updateFloat4("vLightData",
                this.transformedPosition.x,
                this.transformedPosition.y,
                this.transformedPosition.z,
                0.0,
                lightIndex);
        }
        else {
            this._uniformBuffer.updateFloat4("vLightData", this.position.x, this.position.y, this.position.z, 0, lightIndex);
        }

        this._uniformBuffer.updateFloat4("vLightFalloff",
            this.range,
            this._inverseSquaredRange,
            0,
            0,
            lightIndex
        );
        return this;
    }

    public transferToNodeMaterialEffect(effect: Effect, lightDataUniformName: string) {
        if (this.computeTransformedInformation()) {
            effect.setFloat3(lightDataUniformName, this.transformedPosition.x, this.transformedPosition.y, this.transformedPosition.z);
        }
        else {
            effect.setFloat3(lightDataUniformName, this.position.x, this.position.y, this.position.z);
        }

        return this;
    }

    /**
     * Prepares the list of defines specific to the light type.
     * @param defines the list of defines
     * @param lightIndex defines the index of the light for the effect
     */
    public prepareLightSpecificDefines(defines: any, lightIndex: number): void {
        defines["POINTLIGHT" + lightIndex] = true;
    }
}
