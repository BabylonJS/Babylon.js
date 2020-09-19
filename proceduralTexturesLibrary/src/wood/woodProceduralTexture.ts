import { serialize, serializeAsColor3, SerializationHelper } from "babylonjs/Misc/decorators";
import { Color3 } from "babylonjs/Maths/math.color";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { ProceduralTexture } from "babylonjs/Materials/Textures/Procedurals/proceduralTexture";
import { Scene } from "babylonjs/scene";
import { _TypeStore } from 'babylonjs/Misc/typeStore';

import "./woodProceduralTexture.fragment";

export class WoodProceduralTexture extends ProceduralTexture {
    private _ampScale: number = 100.0;
    private _woodColor: Color3 = new Color3(0.32, 0.17, 0.09);

    constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
        super(name, size, "woodProceduralTexture", scene, fallbackTexture, generateMipMaps);
        this.updateShaderUniforms();
    }

    public updateShaderUniforms() {
        this.setFloat("ampScale", this._ampScale);
        this.setColor3("woodColor", this._woodColor);
    }

    @serialize()
    public get ampScale(): number {
        return this._ampScale;
    }

    public set ampScale(value: number) {
        this._ampScale = value;
        this.updateShaderUniforms();
    }

    @serializeAsColor3()
    public get woodColor(): Color3 {
        return this._woodColor;
    }

    public set woodColor(value: Color3) {
        this._woodColor = value;
        this.updateShaderUniforms();
    }

    /**
     * Serializes this wood procedural texture
     * @returns a serialized wood procedural texture object
     */
    public serialize(): any {
        var serializationObject = SerializationHelper.Serialize(this, super.serialize());
        serializationObject.customType = "BABYLON.WoodProceduralTexture";

        return serializationObject;
    }

    /**
     * Creates a Wood Procedural Texture from parsed wood procedural texture data
     * @param parsedTexture defines parsed texture data
     * @param scene defines the current scene
     * @param rootUrl defines the root URL containing wood procedural texture information
     * @returns a parsed Wood Procedural Texture
     */
    public static Parse(parsedTexture: any, scene: Scene, rootUrl: string): WoodProceduralTexture {
        var texture = SerializationHelper.Parse(() => new WoodProceduralTexture(parsedTexture.name, parsedTexture._size, scene, undefined, parsedTexture._generateMipMaps), parsedTexture, scene, rootUrl);

        return texture;
    }
}

_TypeStore.RegisteredTypes["BABYLON.WoodProceduralTexture"] = WoodProceduralTexture;