import { serialize } from "../Misc/decorators";
import { Camera } from "../Cameras/camera";
import { Scene } from "../scene";
import { Matrix, Vector3 } from "../Maths/math.vector";
import { Node } from "../node";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Light } from "./light";
import { ShadowLight } from "./shadowLight";
import { Effect } from "../Materials/effect";
Node.AddNodeConstructor("Light_Type_1", (name, scene) => {
    return () => new DirectionalLight(name, Vector3.Zero(), scene);
});

/**
 * A directional light is defined by a direction (what a surprise!).
 * The light is emitted from everywhere in the specified direction, and has an infinite range.
 * An example of a directional light is when a distance planet is lit by the apparently parallel lines of light from its sun. Light in a downward direction will light the top of an object.
 * Documentation: https://doc.babylonjs.com/babylon101/lights
 */
export class DirectionalLight extends ShadowLight {

    private _shadowFrustumSize = 0;
    /**
     * Fix frustum size for the shadow generation. This is disabled if the value is 0.
     */
    @serialize()
    public get shadowFrustumSize(): number {
        return this._shadowFrustumSize;
    }
    /**
     * Specifies a fix frustum size for the shadow generation.
     */
    public set shadowFrustumSize(value: number) {
        this._shadowFrustumSize = value;
        this.forceProjectionMatrixCompute();
    }

    private _shadowOrthoScale = 0.1;
    /**
     * Gets the shadow projection scale against the optimal computed one.
     * 0.1 by default which means that the projection window is increase by 10% from the optimal size.
     * This does not impact in fixed frustum size (shadowFrustumSize being set)
     */
    @serialize()
    public get shadowOrthoScale(): number {
        return this._shadowOrthoScale;
    }
    /**
     * Sets the shadow projection scale against the optimal computed one.
     * 0.1 by default which means that the projection window is increase by 10% from the optimal size.
     * This does not impact in fixed frustum size (shadowFrustumSize being set)
     */
    public set shadowOrthoScale(value: number) {
        this._shadowOrthoScale = value;
        this.forceProjectionMatrixCompute();
    }

    /**
     * Automatically compute the projection matrix to best fit (including all the casters)
     * on each frame.
     */
    @serialize()
    public autoUpdateExtends = true;

    /**
     * Automatically compute the shadowMinZ and shadowMaxZ for the projection matrix to best fit (including all the casters)
     * on each frame. autoUpdateExtends must be set to true for this to work
     */
    @serialize()
    public autoCalcShadowZBounds = false;

    // Cache
    private _orthoLeft = Number.MAX_VALUE;
    private _orthoRight = Number.MIN_VALUE;
    private _orthoTop = Number.MIN_VALUE;
    private _orthoBottom = Number.MAX_VALUE;

    /**
     * Creates a DirectionalLight object in the scene, oriented towards the passed direction (Vector3).
     * The directional light is emitted from everywhere in the given direction.
     * It can cast shadows.
     * Documentation : https://doc.babylonjs.com/babylon101/lights
     * @param name The friendly name of the light
     * @param direction The direction of the light
     * @param scene The scene the light belongs to
     */
    constructor(name: string, direction: Vector3, scene: Scene) {
        super(name, scene);
        this.position = direction.scale(-1.0);
        this.direction = direction;
    }

    /**
     * Returns the string "DirectionalLight".
     * @return The class name
     */
    public getClassName(): string {
        return "DirectionalLight";
    }

    /**
     * Returns the integer 1.
     * @return The light Type id as a constant defines in Light.LIGHTTYPEID_x
     */
    public getTypeID(): number {
        return Light.LIGHTTYPEID_DIRECTIONALLIGHT;
    }

    /**
     * Sets the passed matrix "matrix" as projection matrix for the shadows cast by the light according to the passed view matrix.
     * Returns the DirectionalLight Shadow projection matrix.
     */
    protected _setDefaultShadowProjectionMatrix(matrix: Matrix, viewMatrix: Matrix, renderList: Array<AbstractMesh>): void {
        if (this.shadowFrustumSize > 0) {
            this._setDefaultFixedFrustumShadowProjectionMatrix(matrix);
        }
        else {
            this._setDefaultAutoExtendShadowProjectionMatrix(matrix, viewMatrix, renderList);
        }
    }

    /**
     * Sets the passed matrix "matrix" as fixed frustum projection matrix for the shadows cast by the light according to the passed view matrix.
     * Returns the DirectionalLight Shadow projection matrix.
     */
    protected _setDefaultFixedFrustumShadowProjectionMatrix(matrix: Matrix): void {
        var activeCamera = this.getScene().activeCamera;

        if (!activeCamera) {
            return;
        }

        Matrix.OrthoLHToRef(this.shadowFrustumSize, this.shadowFrustumSize,
            this.shadowMinZ !== undefined ? this.shadowMinZ : activeCamera.minZ, this.shadowMaxZ !== undefined ? this.shadowMaxZ : activeCamera.maxZ, matrix);
    }

    /**
     * Sets the passed matrix "matrix" as auto extend projection matrix for the shadows cast by the light according to the passed view matrix.
     * Returns the DirectionalLight Shadow projection matrix.
     */
    protected _setDefaultAutoExtendShadowProjectionMatrix(matrix: Matrix, viewMatrix: Matrix, renderList: Array<AbstractMesh>): void {
        var activeCamera = this.getScene().activeCamera;

        if (!activeCamera) {
            return;
        }

        // Check extends
        if (this.autoUpdateExtends || this._orthoLeft === Number.MAX_VALUE) {
            var tempVector3 = Vector3.Zero();

            this._orthoLeft = Number.MAX_VALUE;
            this._orthoRight = Number.MIN_VALUE;
            this._orthoTop = Number.MIN_VALUE;
            this._orthoBottom = Number.MAX_VALUE;

            var shadowMinZ = Number.MAX_VALUE;
            var shadowMaxZ = Number.MIN_VALUE;

            for (var meshIndex = 0; meshIndex < renderList.length; meshIndex++) {
                var mesh = renderList[meshIndex];

                if (!mesh) {
                    continue;
                }

                var boundingInfo = mesh.getBoundingInfo();
                var boundingBox = boundingInfo.boundingBox;

                for (var index = 0; index < boundingBox.vectorsWorld.length; index++) {
                    Vector3.TransformCoordinatesToRef(boundingBox.vectorsWorld[index], viewMatrix, tempVector3);

                    if (tempVector3.x < this._orthoLeft) {
                        this._orthoLeft = tempVector3.x;
                    }
                    if (tempVector3.y < this._orthoBottom) {
                        this._orthoBottom = tempVector3.y;
                    }

                    if (tempVector3.x > this._orthoRight) {
                        this._orthoRight = tempVector3.x;
                    }
                    if (tempVector3.y > this._orthoTop) {
                        this._orthoTop = tempVector3.y;
                    }
                    if (this.autoCalcShadowZBounds) {
                        if (tempVector3.z < shadowMinZ) {
                            shadowMinZ = tempVector3.z;
                        }
                        if (tempVector3.z > shadowMaxZ) {
                            shadowMaxZ = tempVector3.z;
                        }
                    }
                }
            }

            if (this.autoCalcShadowZBounds) {
                this._shadowMinZ = shadowMinZ;
                this._shadowMaxZ = shadowMaxZ;
            }
        }

        var xOffset = this._orthoRight - this._orthoLeft;
        var yOffset = this._orthoTop - this._orthoBottom;

        Matrix.OrthoOffCenterLHToRef(this._orthoLeft - xOffset * this.shadowOrthoScale, this._orthoRight + xOffset * this.shadowOrthoScale,
            this._orthoBottom - yOffset * this.shadowOrthoScale, this._orthoTop + yOffset * this.shadowOrthoScale,
            this.shadowMinZ !== undefined ? this.shadowMinZ : activeCamera.minZ, this.shadowMaxZ !== undefined ? this.shadowMaxZ : activeCamera.maxZ, matrix);
    }

    protected _buildUniformLayout(): void {
        this._uniformBuffer.addUniform("vLightData", 4);
        this._uniformBuffer.addUniform("vLightDiffuse", 4);
        this._uniformBuffer.addUniform("vLightSpecular", 4);
        this._uniformBuffer.addUniform("shadowsInfo", 3);
        this._uniformBuffer.addUniform("depthValues", 2);
        this._uniformBuffer.create();
    }

    /**
     * Sets the passed Effect object with the DirectionalLight transformed position (or position if not parented) and the passed name.
     * @param effect The effect to update
     * @param lightIndex The index of the light in the effect to update
     * @returns The directional light
     */
    public transferToEffect(effect: Effect, lightIndex: string): DirectionalLight {
        if (this.computeTransformedInformation()) {
            this._uniformBuffer.updateFloat4("vLightData", this.transformedDirection.x, this.transformedDirection.y, this.transformedDirection.z, 1, lightIndex);
            return this;
        }
        this._uniformBuffer.updateFloat4("vLightData", this.direction.x, this.direction.y, this.direction.z, 1, lightIndex);
        return this;
    }

    public transferToNodeMaterialEffect(effect: Effect, lightDataUniformName: string): Light {
        if (this.computeTransformedInformation()) {
            effect.setFloat3(lightDataUniformName, this.transformedDirection.x, this.transformedDirection.y, this.transformedDirection.z);
            return this;
        }

        effect.setFloat3(lightDataUniformName, this.direction.x, this.direction.y, this.direction.z);
        return this;
    }

    /**
     * Gets the minZ used for shadow according to both the scene and the light.
     *
     * Values are fixed on directional lights as it relies on an ortho projection hence the need to convert being
     * -1 and 1 to 0 and 1 doing (depth + min) / (min + max) -> (depth + 1) / (1 + 1) -> (depth * 0.5) + 0.5.
     * @param activeCamera The camera we are returning the min for
     * @returns the depth min z
     */
    public getDepthMinZ(activeCamera: Camera): number {
        return 1;
    }

    /**
     * Gets the maxZ used for shadow according to both the scene and the light.
     *
     * Values are fixed on directional lights as it relies on an ortho projection hence the need to convert being
     * -1 and 1 to 0 and 1 doing (depth + min) / (min + max) -> (depth + 1) / (1 + 1) -> (depth * 0.5) + 0.5.
     * @param activeCamera The camera we are returning the max for
     * @returns the depth max z
     */
    public getDepthMaxZ(activeCamera: Camera): number {
        return 1;
    }

    /**
     * Prepares the list of defines specific to the light type.
     * @param defines the list of defines
     * @param lightIndex defines the index of the light for the effect
     */
    public prepareLightSpecificDefines(defines: any, lightIndex: number): void {
        defines["DIRLIGHT" + lightIndex] = true;
    }
}
