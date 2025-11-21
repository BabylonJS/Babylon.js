import { Vector3 } from "../Maths/math.vector";
import { Node } from "../node";
import { Light } from "./light";
import type { Effect } from "core/Materials/effect";
import { RegisterClass } from "core/Misc/typeStore";
import { serialize } from "../Misc/decorators";
import type { Scene } from "core/scene";
import { AreaLight } from "./areaLight";

Node.AddNodeConstructor("Light_Type_4", (name, scene) => {
    return () => new RectAreaLight(name, Vector3.Zero(), 1, 1, scene);
});

/**
 * A rectangular area light defined by an unique point in world space, a width and a height.
 * The light is emitted from the rectangular area in the -Z direction.
 */
export class RectAreaLight extends AreaLight {
    private readonly _width: Vector3;
    private readonly _height: Vector3;
    protected readonly _pointTransformedPosition: Vector3;
    protected readonly _pointTransformedWidth: Vector3;
    protected readonly _pointTransformedHeight: Vector3;

    /**
     * Rect Area Light width.
     */
    @serialize()
    public get width(): number {
        return this._width.x;
    }
    /**
     * Rect Area Light width.
     */
    public set width(value: number) {
        this._width.x = value;
    }

    /**
     * Rect Area Light height.
     */
    @serialize()
    public get height(): number {
        return this._height.y;
    }
    /**
     * Rect Area Light height.
     */
    public set height(value: number) {
        this._height.y = value;
    }

    /**
     * Creates a rectangular area light object.
     * Documentation : https://doc.babylonjs.com/features/featuresDeepDive/lights/lights_introduction
     * @param name The friendly name of the light
     * @param position The position of the area light.
     * @param width The width of the area light.
     * @param height The height of the area light.
     * @param scene The scene the light belongs to
     */
    constructor(name: string, position: Vector3, width: number, height: number, scene?: Scene) {
        super(name, position, scene);
        this._width = new Vector3(width, 0, 0);
        this._height = new Vector3(0, height, 0);
        this._pointTransformedPosition = Vector3.Zero();
        this._pointTransformedWidth = Vector3.Zero();
        this._pointTransformedHeight = Vector3.Zero();
    }

    /**
     * Returns the string "RectAreaLight"
     * @returns the class name
     */
    public override getClassName(): string {
        return "RectAreaLight";
    }

    /**
     * Returns the integer 4.
     * @returns The light Type id as a constant defines in Light.LIGHTTYPEID_x
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public override getTypeID(): number {
        return Light.LIGHTTYPEID_RECT_AREALIGHT;
    }

    protected _buildUniformLayout(): void {
        this._uniformBuffer.addUniform("vLightData", 4);
        this._uniformBuffer.addUniform("vLightDiffuse", 4);
        this._uniformBuffer.addUniform("vLightSpecular", 4);
        this._uniformBuffer.addUniform("vLightWidth", 4);
        this._uniformBuffer.addUniform("vLightHeight", 4);
        this._uniformBuffer.addUniform("shadowsInfo", 3);
        this._uniformBuffer.addUniform("depthValues", 2);
        this._uniformBuffer.create();
    }

    protected _computeTransformedInformation(): boolean {
        if (this.parent && this.parent.getWorldMatrix) {
            Vector3.TransformCoordinatesToRef(this.position, this.parent.getWorldMatrix(), this._pointTransformedPosition);
            Vector3.TransformNormalToRef(this._width, this.parent.getWorldMatrix(), this._pointTransformedWidth);
            Vector3.TransformNormalToRef(this._height, this.parent.getWorldMatrix(), this._pointTransformedHeight);
            return true;
        }

        return false;
    }

    /**
     * Sets the passed Effect "effect" with the PointLight transformed position (or position, if none) and passed name (string).
     * @param effect The effect to update
     * @param lightIndex The index of the light in the effect to update
     * @returns The point light
     */
    public transferToEffect(effect: Effect, lightIndex: string): RectAreaLight {
        const offset = this._scene.floatingOriginOffset;

        if (this._computeTransformedInformation()) {
            this._uniformBuffer.updateFloat4(
                "vLightData",
                this._pointTransformedPosition.x - offset.x,
                this._pointTransformedPosition.y - offset.y,
                this._pointTransformedPosition.z - offset.z,
                0,
                lightIndex
            );
            this._uniformBuffer.updateFloat4("vLightWidth", this._pointTransformedWidth.x / 2, this._pointTransformedWidth.y / 2, this._pointTransformedWidth.z / 2, 0, lightIndex);
            this._uniformBuffer.updateFloat4(
                "vLightHeight",
                this._pointTransformedHeight.x / 2,
                this._pointTransformedHeight.y / 2,
                this._pointTransformedHeight.z / 2,
                0,
                lightIndex
            );
        } else {
            this._uniformBuffer.updateFloat4("vLightData", this.position.x - offset.x, this.position.y - offset.y, this.position.z - offset.z, 0, lightIndex);
            this._uniformBuffer.updateFloat4("vLightWidth", this._width.x / 2, this._width.y / 2, this._width.z / 2, 0.0, lightIndex);
            this._uniformBuffer.updateFloat4("vLightHeight", this._height.x / 2, this._height.y / 2, this._height.z / 2, 0.0, lightIndex);
        }
        return this;
    }

    public transferToNodeMaterialEffect(effect: Effect, lightDataUniformName: string) {
        const offset = this._scene.floatingOriginOffset;

        if (this._computeTransformedInformation()) {
            effect.setFloat3(
                lightDataUniformName,
                this._pointTransformedPosition.x - offset.x,
                this._pointTransformedPosition.y - offset.y,
                this._pointTransformedPosition.z - offset.z
            );
        } else {
            effect.setFloat3(lightDataUniformName, this.position.x - offset.x, this.position.y - offset.y, this.position.z - offset.z);
        }
        return this;
    }
}

// Register Class Name
RegisterClass("BABYLON.RectAreaLight", RectAreaLight);
