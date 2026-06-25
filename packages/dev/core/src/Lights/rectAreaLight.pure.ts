/** This file must only contain pure code and pure imports */

import { Vector3 } from "core/Maths/math.vector.pure";
import { Light } from "core/Lights/light";
import { type Effect } from "core/Materials/effect.pure";
import { serialize } from "core/Misc/decorators";
import { type Scene } from "core/scene.pure";
import { AreaLight } from "core/Lights/areaLight.pure";
import { type Nullable } from "core/types";
import { type BaseTexture } from "core/Materials/Textures/baseTexture.pure";
import { Texture } from "core/Materials/Textures/texture.pure";
import { GenerateBase64StringFromTexture, GenerateBase64StringFromTextureAsync } from "core/Misc/copyTools";
import { Constants } from "core/Engines/constants";
import { Node } from "core/node";
import { RegisterClass } from "core/Misc/typeStore";

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
    private _emissionTextureTexture: Nullable<BaseTexture> = null;

    /**
     * Gets Rect Area Light emission texture. (Note: This texture needs pre-processing! Use AreaLightTextureTools to pre-process the texture).
     */
    public get emissionTexture(): Nullable<BaseTexture> {
        return this._emissionTextureTexture;
    }

    /**
     * Sets Rect Area Light emission texture. (Note: This texture needs pre-processing! Use AreaLightTextureTools to pre-process the texture).
     */
    public set emissionTexture(value: Nullable<BaseTexture>) {
        if (this._emissionTextureTexture === value) {
            return;
        }

        this._emissionTextureTexture = value;

        if (this._emissionTextureTexture) {
            this._emissionTextureTexture.wrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
            this._emissionTextureTexture.wrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        }

        if (this._emissionTextureTexture && RectAreaLight._IsTexture(this._emissionTextureTexture)) {
            this._emissionTextureTexture.onLoadObservable.addOnce(() => {
                this._markMeshesAsLightDirty();
            });
        }
    }

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
     * @param dontAddToScene True to not add the light to the scene
     */
    constructor(name: string, position: Vector3, width: number, height: number, scene?: Scene, dontAddToScene?: boolean) {
        super(name, position, scene, dontAddToScene);
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

    /**
     * Serializes the rect area light into a serialization object.
     * The emission texture is normally produced at runtime by AreaLightTextureTools and has no
     * source URL, so its pixels are embedded as a base64 string to keep the scene self-contained.
     * @returns the serialized object
     */
    public override serialize(): any {
        const serializationObject = super.serialize();

        if (this._emissionTextureTexture) {
            const serializedEmissionTexture = this._serializeEmissionTexture(this._emissionTextureTexture);
            if (serializedEmissionTexture) {
                serializationObject.emissionTexture = serializedEmissionTexture;
            }
        }

        return serializationObject;
    }

    private _serializeEmissionTexture(texture: BaseTexture): any {
        // A regular URL-backed texture can be serialized by reference.
        const referencedTexture = texture.serialize();
        if (referencedTexture) {
            return referencedTexture;
        }

        // The emission texture produced by AreaLightTextureTools is a runtime render-target texture
        // with no source URL, so embed its pixels as a base64 PNG.
        const internalTexture = texture.getInternalTexture();
        if (!internalTexture) {
            return null;
        }

        const invertY = internalTexture.invertY;
        const hasAlpha = texture.hasAlpha;

        // On engines with synchronous texture read (WebGL) the pixels are embedded immediately.
        if (this._scene.getEngine()._features.supportSyncTextureRead) {
            return RectAreaLight._BuildEmbeddedEmissionTexture(GenerateBase64StringFromTexture(texture), invertY, hasAlpha);
        }

        // On WebGPU/Native (no synchronous texture read) a promise for the entire texture object is
        // returned so it resolves to null (and is skipped on parse) if the pixels cannot be read.
        // SceneSerializer.SerializeAsync resolves the promise before producing the final JSON.
        return RectAreaLight._BuildEmbeddedEmissionTextureAsync(GenerateBase64StringFromTextureAsync(texture), invertY, hasAlpha);
    }

    private static async _BuildEmbeddedEmissionTextureAsync(base64Promise: Promise<Nullable<string>>, invertY: boolean, hasAlpha: boolean): Promise<any> {
        return RectAreaLight._BuildEmbeddedEmissionTexture(await base64Promise, invertY, hasAlpha);
    }

    private static _BuildEmbeddedEmissionTexture(base64String: Nullable<string>, invertY: boolean, hasAlpha: boolean): any {
        if (!base64String) {
            return null;
        }

        return {
            name: "areaLightEmissionTexture",
            base64String: base64String,
            invertY: invertY,
            hasAlpha: hasAlpha,
        };
    }

    /**
     * Restores the emission texture from the serialized data after the base light has been parsed.
     * @param parsedLight The JSON representation of the light
     * @param scene The scene the light belongs to
     * @param rootUrl The root url to use to load the emission texture when serialized by reference
     */
    protected override _onParsed(parsedLight: any, scene: Scene, rootUrl: string = ""): void {
        super._onParsed(parsedLight, scene, rootUrl);

        if (parsedLight.emissionTexture) {
            this.emissionTexture = Texture.Parse(parsedLight.emissionTexture, scene, rootUrl);
        }
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

    private static _IsTexture(texture: BaseTexture): texture is Texture {
        return (texture as Texture).onLoadObservable !== undefined;
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

    public override transferTexturesToEffect(effect: Effect, lightIndex: string): Light {
        super.transferTexturesToEffect(effect, lightIndex);

        if (this._emissionTextureTexture && this._emissionTextureTexture.isReady()) {
            effect.setTexture("rectAreaLightEmissionTexture" + lightIndex, this._emissionTextureTexture);
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

    /**
     * Prepares the list of defines specific to the light type.
     * @param defines the list of defines
     * @param lightIndex defines the index of the light for the effect
     */
    public override prepareLightSpecificDefines(defines: any, lightIndex: number): void {
        super.prepareLightSpecificDefines(defines, lightIndex);
        defines["RECTAREALIGHTEMISSIONTEXTURE" + lightIndex] = this._emissionTextureTexture && this._emissionTextureTexture.isReady() ? true : false;
    }
}

let _Registered = false;
/**
 * Register side effects for rectAreaLight.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterRectAreaLight(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    Node.AddNodeConstructor("Light_Type_4", (name, scene) => {
        return () => new RectAreaLight(name, Vector3.Zero(), 1, 1, scene);
    });

    // Register Class Name
    RegisterClass("BABYLON.RectAreaLight", RectAreaLight);
}
