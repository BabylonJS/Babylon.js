import { serialize, SerializationHelper } from "core/Misc/decorators";
import { Color3 } from "core/Maths/math.color";
import type { Texture } from "core/Materials/Textures/texture";
import { ProceduralTexture } from "core/Materials/Textures/Procedurals/proceduralTexture";
import type { Scene } from "core/scene";
import { RegisterClass } from "core/Misc/typeStore";
import type { Nullable } from "core/types";

import "./marbleProceduralTexture.fragment";

export class MarbleProceduralTexture extends ProceduralTexture {
    private _numberOfTilesHeight: number = 3;
    private _numberOfTilesWidth: number = 3;
    private _amplitude: number = 9.0;
    private _jointColor = new Color3(0.72, 0.72, 0.72);

    constructor(name: string, size: number, scene: Nullable<Scene> = null, fallbackTexture?: Texture, generateMipMaps?: boolean) {
        super(name, size, "marbleProceduralTexture", scene, fallbackTexture, generateMipMaps);
        this.updateShaderUniforms();
    }

    public updateShaderUniforms() {
        this.setFloat("numberOfTilesHeight", this._numberOfTilesHeight);
        this.setFloat("numberOfTilesWidth", this._numberOfTilesWidth);
        this.setFloat("amplitude", this._amplitude);
        this.setColor3("jointColor", this._jointColor);
    }

    @serialize()
    public get numberOfTilesHeight(): number {
        return this._numberOfTilesHeight;
    }

    public set numberOfTilesHeight(value: number) {
        this._numberOfTilesHeight = value;
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
    public get numberOfTilesWidth(): number {
        return this._numberOfTilesWidth;
    }

    public set numberOfTilesWidth(value: number) {
        this._numberOfTilesWidth = value;
        this.updateShaderUniforms();
    }

    @serialize()
    public get jointColor(): Color3 {
        return this._jointColor;
    }

    public set jointColor(value: Color3) {
        this._jointColor = value;
        this.updateShaderUniforms();
    }

    /**
     * Serializes this marble procedural texture
     * @returns a serialized marble procedural texture object
     */
    public serialize(): any {
        const serializationObject = SerializationHelper.Serialize(this, super.serialize());
        serializationObject.customType = "BABYLON.MarbleProceduralTexture";

        return serializationObject;
    }

    /**
     * Creates a Marble Procedural Texture from parsed marble procedural texture data
     * @param parsedTexture defines parsed texture data
     * @param scene defines the current scene
     * @param rootUrl defines the root URL containing marble procedural texture information
     * @returns a parsed Marble Procedural Texture
     */
    public static Parse(parsedTexture: any, scene: Scene, rootUrl: string): MarbleProceduralTexture {
        const texture = SerializationHelper.Parse(
            () => new MarbleProceduralTexture(parsedTexture.name, parsedTexture._size, scene, undefined, parsedTexture._generateMipMaps),
            parsedTexture,
            scene,
            rootUrl
        );

        return texture;
    }
}

RegisterClass("BABYLON.MarbleProceduralTexture", MarbleProceduralTexture);
