import { Vector3 } from "../Maths/math.vector";
import { Node } from "../node";
import { Light } from "./light";
import type { Effect } from "core/Materials/effect";
import { RegisterClass } from "core/Misc/typeStore";
import { DefaultAreaLightLTCProvider } from "core/Lights/LTC/ltcTextureTool";
import type { IAreaLightLTCProvider } from "core/Lights/LTC/ltcTextureTool";
import { serialize } from "../Misc/decorators";
import type { Scene } from "core/scene";

Node.AddNodeConstructor("Light_Type_4", (name, scene) => {
    return () => new RectAreaLight(name, Vector3.Zero(), 1, 1, scene);
});

declare module "../scene" {
    export interface Scene {
        areaLightLTCProvider: IAreaLightLTCProvider;
    }
}

function IsAreaLightsReady(scene: Scene): boolean {
    if (scene.areaLightLTCProvider.ltc1Texture && scene.areaLightLTCProvider.ltc2Texture) {
        return scene.areaLightLTCProvider.ltc1Texture.isReady() && scene.areaLightLTCProvider.ltc2Texture.isReady();
    }

    return false;
}

/**
 * A rectangular area light defined by an unique point in world space, a width and a height.
 * The light is emitted from the rectangular area in the -Z direction.
 */
export class RectAreaLight extends Light {
    protected _width: Vector3;
    protected _height: Vector3;
    protected _position: Vector3;

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
     * Rect Area Light position.
     */
    @serialize()
    public get position(): Vector3 {
        return this._position;
    }
    /**
     * Rect Area Light position.
     */
    public set position(value: Vector3) {
        this._position = value;
    }

    /**
     * Creates a area light object.
     * Documentation : https://doc.babylonjs.com/features/featuresDeepDive/lights/lights_introduction
     * @param name The friendly name of the light
     * @param position The position of the area light.
     * @param width The width of the area light.
     * @param height The height of the area light.
     * @param scene The scene the light belongs to
     */
    constructor(name: string, position: Vector3, width: number, height: number, scene?: Scene) {
        super(name, scene);
        this.position = position;
        this._width = new Vector3(width, 0, 0);
        this._height = new Vector3(0, height, 0);

        if (!this._scene.areaLightLTCProvider) {
            this._scene.areaLightLTCProvider = new DefaultAreaLightLTCProvider(this._scene);
        }
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
    public override getTypeID(): number {
        return Light.LIGHTTYPEID_AREALIGHT;
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

    protected _pointTransformedPosition: Vector3;
    protected _pointTransformedWidth: Vector3;
    protected _pointCTransformedHeight: Vector3;

    protected _computeTransformedInformation(): boolean {
        if (this.parent && this.parent.getWorldMatrix) {
            if (!this._pointTransformedPosition) {
                this._pointTransformedPosition = Vector3.Zero();
                this._pointTransformedWidth = Vector3.Zero();
                this._pointCTransformedHeight = Vector3.Zero();
            }
            Vector3.TransformCoordinatesToRef(this.position, this.parent.getWorldMatrix(), this._pointTransformedPosition);
            Vector3.TransformNormalToRef(this._width, this.parent.getWorldMatrix(), this._pointTransformedWidth);
            Vector3.TransformNormalToRef(this._height, this.parent.getWorldMatrix(), this._pointCTransformedHeight);
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
        if (this._computeTransformedInformation()) {
            this._uniformBuffer.updateFloat4("vLightData", this._pointTransformedPosition.x, this._pointTransformedPosition.y, this._pointTransformedPosition.z, 0, lightIndex);
            this._uniformBuffer.updateFloat4("vLightWidth", this._pointTransformedWidth.x, this._pointTransformedWidth.y, this._pointTransformedWidth.z, 0, lightIndex);
            this._uniformBuffer.updateFloat4("vLightHeight", this._pointCTransformedHeight.x, this._pointCTransformedHeight.y, this._pointCTransformedHeight.z, 0, lightIndex);
        } else {
            this._uniformBuffer.updateFloat4("vLightData", this.position.x, this.position.y, this.position.z, 0.0, lightIndex);
            this._uniformBuffer.updateFloat4("vLightWidth", this._width.x / 2, this._width.y / 2, this._width.z / 2, 0.0, lightIndex);
            this._uniformBuffer.updateFloat4("vLightHeight", this._height.x / 2, this._height.y / 2, this._height.z / 2, 0.0, lightIndex);
        }
        return this;
    }

    /**
     * Sets the passed Effect "effect" with the Light textures.
     * @param effect The effect to update
     * @returns The light
     */
    public override transferTexturesToEffect(effect: Effect): Light {
        effect.setTexture("areaLightsLTC1Sampler", this._scene.areaLightLTCProvider.ltc1Texture);
        effect.setTexture("areaLightsLTC2Sampler", this._scene.areaLightLTCProvider.ltc1Texture);
        return this;
    }

    public transferToNodeMaterialEffect(effect: Effect, lightDataUniformName: string) {
        // TO DO: Implement this to add support for NME.
        return this;
    }

    /**
     * Prepares the list of defines specific to the light type.
     * @param defines the list of defines
     * @param lightIndex defines the index of the light for the effect
     */
    public prepareLightSpecificDefines(defines: any, lightIndex: number): void {
        defines["AREALIGHT" + lightIndex] = IsAreaLightsReady(this._scene);
        defines["AREALIGHTUSED"] = IsAreaLightsReady(this._scene);
    }
}

// Register Class Name
RegisterClass("BABYLON.RectAreaLight", RectAreaLight);
