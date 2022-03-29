import { serializeAsColor3, SerializationHelper } from "core/Misc/decorators";
import { Color3 } from "core/Maths/math.color";
import type { Texture } from "core/Materials/Textures/texture";
import { ProceduralTexture } from "core/Materials/Textures/Procedurals/proceduralTexture";
import type { Scene } from "core/scene";
import { RegisterClass } from "core/Misc/typeStore";
import type { Nullable } from "core/types";
import "./roadProceduralTexture.fragment";

export class RoadProceduralTexture extends ProceduralTexture {
    private _roadColor = new Color3(0.53, 0.53, 0.53);

    constructor(name: string, size: number, scene: Nullable<Scene> = null, fallbackTexture?: Texture, generateMipMaps?: boolean) {
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
        const serializationObject = SerializationHelper.Serialize(this, super.serialize());
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
        const texture = SerializationHelper.Parse(
            () => new RoadProceduralTexture(parsedTexture.name, parsedTexture._size, scene, undefined, parsedTexture._generateMipMaps),
            parsedTexture,
            scene,
            rootUrl
        );

        return texture;
    }
}

RegisterClass("BABYLON.RoadProceduralTexture", RoadProceduralTexture);
