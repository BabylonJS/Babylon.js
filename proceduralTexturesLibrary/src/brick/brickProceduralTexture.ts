import { serialize, serializeAsColor3, SerializationHelper } from "babylonjs/Misc/decorators";
import { Color3 } from "babylonjs/Maths/math.color";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { ProceduralTexture } from "babylonjs/Materials/Textures/Procedurals/proceduralTexture";
import { Scene } from "babylonjs/scene";
import { _TypeStore } from 'babylonjs/Misc/typeStore';

import "./brickProceduralTexture.fragment";

export class BrickProceduralTexture extends ProceduralTexture {
    private _numberOfBricksHeight: number = 15;
    private _numberOfBricksWidth: number = 5;
    private _jointColor = new Color3(0.72, 0.72, 0.72);
    private _brickColor = new Color3(0.77, 0.47, 0.40);

    constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
        super(name, size, "brickProceduralTexture", scene, fallbackTexture, generateMipMaps);
        this.updateShaderUniforms();
    }

    public updateShaderUniforms() {
        this.setFloat("numberOfBricksHeight", this._numberOfBricksHeight);
        this.setFloat("numberOfBricksWidth", this._numberOfBricksWidth);
        this.setColor3("brickColor", this._brickColor);
        this.setColor3("jointColor", this._jointColor);
    }

    @serialize()
    public get numberOfBricksHeight(): number {
        return this._numberOfBricksHeight;
    }

    public set numberOfBricksHeight(value: number) {
        this._numberOfBricksHeight = value;
        this.updateShaderUniforms();
    }

    @serialize()
    public get numberOfBricksWidth(): number {
        return this._numberOfBricksWidth;
    }

    public set numberOfBricksWidth(value: number) {
        this._numberOfBricksWidth = value;
        this.updateShaderUniforms();
    }

    @serializeAsColor3()
    public get jointColor(): Color3 {
        return this._jointColor;
    }

    public set jointColor(value: Color3) {
        this._jointColor = value;
        this.updateShaderUniforms();
    }

    @serializeAsColor3()
    public get brickColor(): Color3 {
        return this._brickColor;
    }

    public set brickColor(value: Color3) {
        this._brickColor = value;
        this.updateShaderUniforms();
    }

    /**
     * Serializes this brick procedural texture
     * @returns a serialized brick procedural texture object
     */
    public serialize(): any {
        var serializationObject = SerializationHelper.Serialize(this, super.serialize());
        serializationObject.customType = "BABYLON.BrickProceduralTexture";

        return serializationObject;
    }

    /**
     * Creates a Brick Procedural Texture from parsed brick procedural texture data
     * @param parsedTexture defines parsed texture data
     * @param scene defines the current scene
     * @param rootUrl defines the root URL containing brick procedural texture information
     * @returns a parsed Brick Procedural Texture
     */
    public static Parse(parsedTexture: any, scene: Scene, rootUrl: string): BrickProceduralTexture {
        var texture = SerializationHelper.Parse(() => new BrickProceduralTexture(parsedTexture.name, parsedTexture._size, scene, undefined, parsedTexture._generateMipMaps), parsedTexture, scene, rootUrl);

        return texture;
    }
}

_TypeStore.RegisteredTypes["BABYLON.BrickProceduralTexture"] = BrickProceduralTexture;