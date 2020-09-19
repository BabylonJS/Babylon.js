import { serializeAsColor3, SerializationHelper } from "babylonjs/Misc/decorators";
import { Color3 } from "babylonjs/Maths/math.color";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { ProceduralTexture } from "babylonjs/Materials/Textures/Procedurals/proceduralTexture";
import { Scene } from "babylonjs/scene";
import { _TypeStore } from 'babylonjs/Misc/typeStore';

import "./roadProceduralTexture.fragment";

export class RoadProceduralTexture extends ProceduralTexture {
    private _roadColor = new Color3(0.53, 0.53, 0.53);

    constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
        super(name, size, "roadProceduralTexture", scene, fallbackTexture, generateMipMaps);
        this.updateShaderUniforms();
    }

    public updateShaderUniforms() {
        this.setColor3("roadColor", this._roadColor);
    }

    @serializeAsColor3()
    public get roadColor(): Color3 {
        return this._roadColor;
    }

    public set roadColor(value: Color3) {
        this._roadColor = value;
        this.updateShaderUniforms();
    }

    /**
     * Serializes this road procedural texture
     * @returns a serialized road procedural texture object
     */
    public serialize(): any {
        var serializationObject = SerializationHelper.Serialize(this, super.serialize());
        serializationObject.customType = "BABYLON.RoadProceduralTexture";

        return serializationObject;
    }

    /**
     * Creates a Road Procedural Texture from parsed road procedural texture data
     * @param parsedTexture defines parsed texture data
     * @param scene defines the current scene
     * @param rootUrl defines the root URL containing road procedural texture information
     * @returns a parsed Road Procedural Texture
     */
    public static Parse(parsedTexture: any, scene: Scene, rootUrl: string): RoadProceduralTexture {
        var texture = SerializationHelper.Parse(() => new RoadProceduralTexture(parsedTexture.name, parsedTexture._size, scene, undefined, parsedTexture._generateMipMaps), parsedTexture, scene, rootUrl);

        return texture;
    }
}

_TypeStore.RegisteredTypes["BABYLON.RoadProceduralTexture"] = RoadProceduralTexture;