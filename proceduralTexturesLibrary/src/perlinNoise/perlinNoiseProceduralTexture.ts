import { serialize, SerializationHelper } from "babylonjs/Misc/decorators";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { ProceduralTexture } from "babylonjs/Materials/Textures/Procedurals/proceduralTexture";
import { Scene } from "babylonjs/scene";
import { _TypeStore } from 'babylonjs/Misc/typeStore';

import "./perlinNoiseProceduralTexture.fragment";

export class PerlinNoiseProceduralTexture extends ProceduralTexture {
    @serialize()
    public time: number = 0.0;

    @serialize()
    public timeScale: number = 1.0;

    @serialize()
    public translationSpeed: number = 1.0;

    private _currentTranslation: number = 0;

    constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
        super(name, size, "perlinNoiseProceduralTexture", scene, fallbackTexture, generateMipMaps);
        this.updateShaderUniforms();
    }

    public updateShaderUniforms() {
        this.setFloat("size", this.getRenderSize() as number);

        let scene = this.getScene();

        if (!scene) {
            return;
        }
        var deltaTime = scene.getEngine().getDeltaTime();

        this.time += deltaTime;
        this.setFloat("time", this.time * this.timeScale / 1000);

        this._currentTranslation += deltaTime * this.translationSpeed / 1000.0;
        this.setFloat("translationSpeed", this._currentTranslation);
    }

    public render(useCameraPostProcess?: boolean) {
        this.updateShaderUniforms();
        super.render(useCameraPostProcess);
    }

    public resize(size: any, generateMipMaps: any): void {
        super.resize(size, generateMipMaps);
    }

    /**
     * Serializes this perlin noise procedural texture
     * @returns a serialized perlin noise procedural texture object
     */
    public serialize(): any {
        var serializationObject = SerializationHelper.Serialize(this, super.serialize());
        serializationObject.customType = "BABYLON.PerlinNoiseProceduralTexture";

        return serializationObject;
    }

    /**
     * Creates a Perlin Noise Procedural Texture from parsed perlin noise procedural texture data
     * @param parsedTexture defines parsed texture data
     * @param scene defines the current scene
     * @param rootUrl defines the root URL containing perlin noise procedural texture information
     * @returns a parsed Perlin Noise Procedural Texture
     */
    public static Parse(parsedTexture: any, scene: Scene, rootUrl: string): PerlinNoiseProceduralTexture {
        var texture = SerializationHelper.Parse(() => new PerlinNoiseProceduralTexture(parsedTexture.name, parsedTexture._size, scene, undefined, parsedTexture._generateMipMaps), parsedTexture, scene, rootUrl);

        return texture;
    }
}

_TypeStore.RegisteredTypes["BABYLON.PerlinNoiseProceduralTexture"] = PerlinNoiseProceduralTexture;