import { serializeAsTexture, SerializationHelper } from "core/Misc/decorators";
import type { Texture } from "core/Materials/Textures/texture";
import { ProceduralTexture } from "core/Materials/Textures/Procedurals/proceduralTexture";
import type { Scene } from "core/scene";
import { RegisterClass } from "core/Misc/typeStore";
import type { Nullable } from "core/types";
import "./normalMapProceduralTexture.fragment";

export class NormalMapProceduralTexture extends ProceduralTexture {
    private _baseTexture: Texture;

    constructor(name: string, size: number, scene: Nullable<Scene> = null, fallbackTexture?: Texture, generateMipMaps?: boolean) {
        super(name, size, "normalMapProceduralTexture", scene, fallbackTexture, generateMipMaps);
        this.updateShaderUniforms();
    }

    public updateShaderUniforms() {
        this.setTexture("baseSampler", this._baseTexture);
        this.setFloat("size", this.getRenderSize() as number);
    }

    public render(useCameraPostProcess?: boolean) {
        super.render(useCameraPostProcess);
    }

    public resize(size: any, generateMipMaps: any): void {
        super.resize(size, generateMipMaps);

        // We need to update the "size" uniform
        this.updateShaderUniforms();
    }

    public isReady(): boolean {
        if (!this._baseTexture || !this._baseTexture.isReady()) {
            return false;
        }

        return super.isReady();
    }

    @serializeAsTexture()
    public get baseTexture(): Texture {
        return this._baseTexture;
    }

    public set baseTexture(texture: Texture) {
        this._baseTexture = texture;
        this.updateShaderUniforms();
    }

    /**
     * Serializes this normal map procedural texture
     * @returns a serialized normal map procedural texture object
     */
    public serialize(): any {
        const serializationObject = SerializationHelper.Serialize(this, super.serialize());
        serializationObject.customType = "BABYLON.NormalMapProceduralTexture";

        return serializationObject;
    }

    /**
     * Creates a Normal Map Procedural Texture from parsed normal map procedural texture data
     * @param parsedTexture defines parsed texture data
     * @param scene defines the current scene
     * @param rootUrl defines the root URL containing normal map procedural texture information
     * @returns a parsed Normal Map Procedural Texture
     */
    public static Parse(parsedTexture: any, scene: Scene, rootUrl: string): NormalMapProceduralTexture {
        const texture = SerializationHelper.Parse(
            () => new NormalMapProceduralTexture(parsedTexture.name, parsedTexture._size, scene, undefined, parsedTexture._generateMipMaps),
            parsedTexture,
            scene,
            rootUrl
        );

        return texture;
    }
}

RegisterClass("BABYLON.NormalMapProceduralTexture", NormalMapProceduralTexture);
