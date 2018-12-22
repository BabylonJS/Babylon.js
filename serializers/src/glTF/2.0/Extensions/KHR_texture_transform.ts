import { ImageMimeType } from "babylonjs-gltf2interface";

import { Nullable } from "babylonjs/types";
import { Vector2 } from "babylonjs/Maths/math";
import { Tools } from "babylonjs/Misc/tools";
import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { ProceduralTexture } from "babylonjs/Materials/Textures/Procedurals/proceduralTexture";
import { Scene } from "babylonjs/scene";

import { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { _Exporter } from "../glTFExporter";

const NAME = "KHR_texture_transform";

import "../shaders/textureTransform.fragment";

/**
 * Interface for handling KHR texture transform
 * @hidden
 */
interface IKHRTextureTransform {
    offset?: number[];
    rotation?: number;
    scale?: number[];
    texCoord?: number;
}

/**
 * @hidden
 */
export class KHR_texture_transform implements IGLTFExporterExtensionV2 {
    /** Name of this extension */
    public readonly name = NAME;

    /** Defines whether this extension is enabled */
    public enabled = true;

    /** Defines whether this extension is required */
    public required = false;

    /** Reference to the glTF exporter */
    private _exporter: _Exporter;

    constructor(exporter: _Exporter) {
        this._exporter = exporter;
    }

    public dispose() {
        delete this._exporter;
    }

    public preExportTextureAsync(context: string, babylonTexture: Texture, mimeType: ImageMimeType): Nullable<Promise<Texture>> {
        return new Promise((resolve, reject) => {
            const texture_transform_extension: IKHRTextureTransform = {};

            if (babylonTexture.uOffset !== 0 || babylonTexture.vOffset !== 0) {
                texture_transform_extension.offset = [babylonTexture.uOffset, babylonTexture.vOffset];
            }

            if (babylonTexture.uScale !== 1 || babylonTexture.vScale !== 1) {
                texture_transform_extension.scale = [babylonTexture.uScale, babylonTexture.vScale];
            }

            if (babylonTexture.wAng !== 0) {
                texture_transform_extension.rotation = babylonTexture.wAng;
            }

            if (!Object.keys(texture_transform_extension).length) {
                resolve(babylonTexture);
            }

            const scale = texture_transform_extension.scale ? new Vector2(texture_transform_extension.scale[0], texture_transform_extension.scale[1]) : Vector2.One();
            const rotation = texture_transform_extension.rotation != null ? texture_transform_extension.rotation : 0;
            const offset = texture_transform_extension.offset ? new Vector2(texture_transform_extension.offset[0], texture_transform_extension.offset[1]) : Vector2.Zero();
            const scene = babylonTexture.getScene();
            if (!scene) {
                reject(`${context}: "scene" is not defined for Babylon texture ${babylonTexture.name}!`);
            }
            else {
                this.textureTransformTextureAsync(babylonTexture, offset, rotation, scale, scene).then((texture) => {
                    resolve(texture as Texture);
                });
            }
        });
    }

    /**
     * Transform the babylon texture by the offset, rotation and scale parameters using a procedural texture
     * @param babylonTexture
     * @param offset
     * @param rotation
     * @param scale
     * @param scene
     */
    public textureTransformTextureAsync(babylonTexture: Texture, offset: Vector2, rotation: number, scale: Vector2, scene: Scene): Promise<BaseTexture> {
        return new Promise((resolve, reject) => {
            const proceduralTexture = new ProceduralTexture(`${babylonTexture.name}`, babylonTexture.getSize(), "textureTransform", scene);
            if (!proceduralTexture) {
                Tools.Log(`Cannot create procedural texture for ${babylonTexture.name}!`);
                resolve(babylonTexture);
            }

            proceduralTexture.setTexture("textureSampler", babylonTexture);
            proceduralTexture.setMatrix("textureTransformMat", babylonTexture.getTextureMatrix());

            // isReady trigger creation of effect if it doesnt exist yet
            if (proceduralTexture.isReady()) {
                proceduralTexture.render();
                resolve(proceduralTexture);
            } else {
                (proceduralTexture as any).getEffect().executeWhenCompiled(() => {
                    proceduralTexture.render();
                    resolve(proceduralTexture);
                });
            }
        });
    }
}

_Exporter.RegisterExtension(NAME, (exporter) => new KHR_texture_transform(exporter));