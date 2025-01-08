import { Scene } from "../scene";
import { Vector3 } from "../Maths/math.vector";
import { Node } from "../node";
import { Light } from "./light";
import type { Effect } from "core/Materials/effect";
import { RegisterClass } from "core/Misc/typeStore";
import { buildSceneLTCTextures } from "core/Lights/LTC/ltcTextureTool";
import { serialize } from "../Misc/decorators";

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
    protected _position: Vector3;
    protected _width: Vector3;
    protected _height: Vector3;

    /**
     * Only used in gltf falloff mode, this defines the angle where
     * the directional falloff will start before cutting at angle which could be seen
     * as outer angle.
     */
    @serialize()
    public get width(): number {
        return this._width.x;
    }
    /**
     * Only used in gltf falloff mode, this defines the angle where
     * the directional falloff will start before cutting at angle which could be seen
     * as outer angle.
     */
    public set width(value: number) {
        this._width.x = value;
    }

    /**
     * Only used in gltf falloff mode, this defines the angle where
     * the directional falloff will start before cutting at angle which could be seen
     * as outer angle.
     */
    @serialize()
    public get height(): number {
        return this._height.y;
    }
    /**
     * Only used in gltf falloff mode, this defines the angle where
     * the directional falloff will start before cutting at angle which could be seen
     * as outer angle.
     */
    public set height(value: number) {
        this._height.y = value;
    }

    /**
     * Only used in gltf falloff mode, this defines the angle where
     * the directional falloff will start before cutting at angle which could be seen
     * as outer angle.
     */
    @serialize()
    public get position(): Vector3 {
        return this._position;
    }
    /**
     * Only used in gltf falloff mode, this defines the angle where
     * the directional falloff will start before cutting at angle which could be seen
     * as outer angle.
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
        this._position = position;
        this._width = Vector3.Right().multiplyByFloats(width, width, width);
        this._height = Vector3.Up().multiplyByFloats(height, height, height);
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
            Vector3.TransformCoordinatesToRef(this._position, this.parent.getWorldMatrix(), this._pointTransformedPosition);
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
    public transferToEffect(effect: Effect, lightIndex: string): AreaLight {
        if (this._computeTransformedInformation()) {
            this._uniformBuffer.updateFloat4("vLightData", this._pointTransformedPosition.x, this._pointTransformedPosition.y, this._pointTransformedPosition.z, 0, lightIndex);
            this._uniformBuffer.updateFloat4("vLightWidth", this._pointTransformedWidth.x, this._pointTransformedWidth.y, this._pointTransformedWidth.z, 0, lightIndex);
            this._uniformBuffer.updateFloat4("vLightHeight", this._pointCTransformedHeight.x, this._pointCTransformedHeight.y, this._pointCTransformedHeight.z, 0, lightIndex);
        } else {
            this._uniformBuffer.updateFloat4("vLightData", this._position.x, this._position.y, this._position.z, 0.0, lightIndex);
            this._uniformBuffer.updateFloat4("vLightWidth", this._width.x / 2, this._width.y / 2, this._width.z / 2, 0.0, lightIndex);
            this._uniformBuffer.updateFloat4("vLightHeight", this._height.x / 2, this._height.y / 2, this._height.z / 2, 0.0, lightIndex);
        }
        return this;
    }

    /**
     * Sets the passed Effect "effect" with the Light textures.
     * @param effect The effect to update
     * @param lightIndex The index of the light in the effect to update
     * @returns The light
     */
    public override transferTexturesToEffect(effect: Effect, lightIndex: string): Light {
        return this;
    }

    public transferToNodeMaterialEffect(effect: Effect, lightDataUniformName: string) {
        return this;
    }

    /**
     * Prepares the list of defines specific to the light type.
     * @param defines the list of defines
     * @param lightIndex defines the index of the light for the effect
     */
    public prepareLightSpecificDefines(defines: any, lightIndex: number): void {
        defines["AREALIGHT" + lightIndex] = true;
        defines["AREALIGHTUSED"] = true;
    }
}

// Register Class Name
RegisterClass("BABYLON.AreaLight", AreaLight);

Scene.BindAreaLightsLTCTextures = (scene: Scene, effect: Effect) => {
    effect.setTexture("areaLightsLTC1Sampler", scene.ltc1Texture);
    effect.setTexture("areaLightsLTC2Sampler", scene.ltc2Texture);
};

Scene.LoadLTCTextures = async (scene: Scene) => {
    await buildSceneLTCTextures(scene);
};

Scene.IsAreaLightsReady = (scene: Scene): boolean => {
    if (scene.ltc1Texture && scene.ltc2Texture) {
        return scene.ltc1Texture.isReady() && scene.ltc2Texture.isReady();
    }

    return false;
};
