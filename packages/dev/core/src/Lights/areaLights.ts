import type { Scene } from "../scene";
import { Matrix, Vector3, Vector4 } from "../Maths/math.vector";
import { Node } from "../node";
import { Light } from "./light";
import type { Effect } from "../Materials/effect";
import { RegisterClass } from "../Misc/typeStore";

Node.AddNodeConstructor("Light_Type_4", (name, scene) => {
    return () => new AreaLight(name, Vector3.Zero(), 1, 1, scene);
});

/**
 * A point light is a light defined by an unique point in world space.
 * The light is emitted in every direction from this point.
 * A good example of a point light is a standard light bulb.
 * Documentation: https://doc.babylonjs.com/features/featuresDeepDive/lights/lights_introduction
 */
export class AreaLight extends Light {
    readonly position: Vector3;
    readonly width: number;
    readonly height: number;

    constructor(name: string, position: Vector3, width: number, height: number, scene?: Scene) {
        super(name, scene);
        this.position = position;
        this.width = width;
        this.height = height;
    }

    /**
     * Returns the string "PointLight"
     * @returns the class name
     */
    public override getClassName(): string {
        return "AreaLight";
    }

    /**
     * Returns the integer 0.
     * @returns The light Type id as a constant defines in Light.LIGHTTYPEID_x
     */
    public override getTypeID(): number {
        return Light.LIGHTTYPEID_AREALIGHT;
    }

    protected _buildUniformLayout(): void {
        this._uniformBuffer.addUniform("vLightData", 16);
        this._uniformBuffer.addUniform("vLightDiffuse", 4);
        this._uniformBuffer.addUniform("vLightSpecular", 4);
        this._uniformBuffer.create();
    }

    pointA: Vector3;
    pointB: Vector3;
    pointC: Vector3;
    pointD: Vector3;

    pointATransformedPosition: Vector3;
    pointBTransformedPosition: Vector3;
    pointCTransformedPosition: Vector3;
    pointDTransformedPosition: Vector3;

    pointsMatrix: Matrix;

    /**
     * The transformed direction. Direction of the light in world space taking parenting in account.
     */
    public transformedDirection: Vector3;

    /**
     * Computes the transformed information (transformedPosition and transformedDirection in World space) of the current light
     */
    public computeTransformedInformation(): void {
        if (!this.pointA) {
            this.pointA = Vector3.Zero();
            this.pointB = Vector3.Zero();
            this.pointC = Vector3.Zero();
            this.pointD = Vector3.Zero();
            this.pointsMatrix = Matrix.Zero();
        }

        this.position.subtractToRef(new Vector3(-this.width, -this.height, 0), this.pointA);
        this.position.subtractToRef(new Vector3(this.width, -this.height, 0), this.pointB);
        this.position.subtractToRef(new Vector3(-this.width, this.height, 0), this.pointC);
        this.position.subtractToRef(new Vector3(this.width, this.height, 0), this.pointD);

        if (this.parent && this.parent.getWorldMatrix) {
            if (!this.pointATransformedPosition) {
                this.pointBTransformedPosition = Vector3.Zero();
                this.pointCTransformedPosition = Vector3.Zero();
                this.pointCTransformedPosition = Vector3.Zero();
                this.pointDTransformedPosition = Vector3.Zero();
            }

            Vector3.TransformCoordinatesToRef(this.pointA, this.parent.getWorldMatrix(), this.pointATransformedPosition);
            Vector3.TransformCoordinatesToRef(this.pointB, this.parent.getWorldMatrix(), this.pointBTransformedPosition);
            Vector3.TransformCoordinatesToRef(this.pointC, this.parent.getWorldMatrix(), this.pointCTransformedPosition);
            Vector3.TransformCoordinatesToRef(this.pointD, this.parent.getWorldMatrix(), this.pointDTransformedPosition);

            this.pointsMatrix.setRow(0, Vector4.FromVector3(this.pointATransformedPosition));
            this.pointsMatrix.setRow(0, Vector4.FromVector3(this.pointBTransformedPosition));
            this.pointsMatrix.setRow(0, Vector4.FromVector3(this.pointCTransformedPosition));
            this.pointsMatrix.setRow(0, Vector4.FromVector3(this.pointDTransformedPosition));
        }
    }

    /**
     * Sets the passed Effect "effect" with the PointLight transformed position (or position, if none) and passed name (string).
     * @param effect The effect to update
     * @param lightIndex The index of the light in the effect to update
     * @returns The point light
     */
    public transferToEffect(effect: Effect, lightIndex: string): AreaLight {
        this.computeTransformedInformation();
        this._uniformBuffer.updateMatrix("vLightData", this.pointsMatrix);
        this._uniformBuffer.updateFloat4("vLightFalloff", this.range, this._inverseSquaredRange, 0, 0, lightIndex);
        return this;
    }

    public transferToNodeMaterialEffect(effect: Effect, lightDataUniformName: string) {
        this.computeTransformedInformation();
        effect.setMatrix(lightDataUniformName, this.pointsMatrix);
        return this;
    }

    /**
     * Prepares the list of defines specific to the light type.
     * @param defines the list of defines
     * @param lightIndex defines the index of the light for the effect
     */
    public prepareLightSpecificDefines(defines: any, lightIndex: number): void {
        defines["AREALIGHT" + lightIndex] = true;
    }
}

// Register Class Name
RegisterClass("BABYLON.AreaLight", AreaLight);
