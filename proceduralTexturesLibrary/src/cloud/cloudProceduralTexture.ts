import { serialize, serializeAsColor4, SerializationHelper } from "babylonjs/Misc/decorators";
import { Color4 } from "babylonjs/Maths/math.color";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { ProceduralTexture } from "babylonjs/Materials/Textures/Procedurals/proceduralTexture";
import { Scene } from "babylonjs/scene";
import { RegisterClass } from 'babylonjs/Misc/typeStore';

import "./cloudProceduralTexture.fragment";

export class CloudProceduralTexture extends ProceduralTexture {
    private _skyColor = new Color4(0.15, 0.68, 1.0, 1.0);
    private _cloudColor = new Color4(1, 1, 1, 1.0);
    private _amplitude = 1;
    private _numOctaves = 4;

    constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
        super(name, size, "cloudProceduralTexture", scene, fallbackTexture, generateMipMaps);
        this.updateShaderUniforms();
    }

    public updateShaderUniforms() {
        this.setColor4("skyColor", this._skyColor);
        this.setColor4("cloudColor", this._cloudColor);
        this.setFloat("amplitude", this._amplitude);
        this.setInt("numOctaves", this._numOctaves);
    }

    @serializeAsColor4()
    public get skyColor(): Color4 {
        return this._skyColor;
    }

    public set skyColor(value: Color4) {
        this._skyColor = value;
        this.updateShaderUniforms();
    }

    @serializeAsColor4()
    public get cloudColor(): Color4 {
        return this._cloudColor;
    }

    public set cloudColor(value: Color4) {
        this._cloudColor = value;
        this.updateShaderUniforms();
    }

    @serialize()
    public get amplitude(): number {
        return this._amplitude;
    }

    public set amplitude(value: number) {
        this._amplitude = value;
        this.updateShaderUniforms();
    }

    @serialize()
    public get numOctaves(): number {
        return this._numOctaves;
    }

    public set numOctaves(value: number) {
        this._numOctaves = value;
        this.updateShaderUniforms();
    }

    /**
     * Serializes this cloud procedural texture
     * @returns a serialized cloud procedural texture object
     */
    public serialize(): any {
        var serializationObject = SerializationHelper.Serialize(this, super.serialize());
        serializationObject.customType = "BABYLON.CloudProceduralTexture";

        return serializationObject;
    }

    /**
     * Creates a Cloud Procedural Texture from parsed cloud procedural texture data
     * @param parsedTexture defines parsed texture data
     * @param scene defines the current scene
     * @param rootUrl defines the root URL containing cloud procedural texture information
     * @returns a parsed Cloud Procedural Texture
     */
    public static Parse(parsedTexture: any, scene: Scene, rootUrl: string): CloudProceduralTexture {
        var texture = SerializationHelper.Parse(() => new CloudProceduralTexture(parsedTexture.name, parsedTexture._size, scene, undefined, parsedTexture._generateMipMaps), parsedTexture, scene, rootUrl);

        return texture;
    }
}

RegisterClass("BABYLON.CloudProceduralTexture", CloudProceduralTexture);