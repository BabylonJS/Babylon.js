import { ImageMimeType } from "babylonjs-gltf2interface";

import { Nullable } from "babylonjs/types";
import { Tools } from "babylonjs/Misc/tools";
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
            const scene = babylonTexture.getScene();
            if (!scene) {
                reject(`${context}: "scene" is not defined for Babylon texture ${babylonTexture.name}!`);
                return;
            }

            // TODO: this doesn't take into account rotation center values

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
                return;
            }

            return this._textureTransformTextureAsync(babylonTexture, scene)
                .then((proceduralTexture) => {
                    resolve(proceduralTexture);
                })
                .catch((e) => {
                    reject(e);
                });
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
    private _textureTransformTextureAsync(babylonTexture: Texture, scene: Scene): Promise<Texture> {
        return new Promise((resolve) => {
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
                proceduralTexture.getEffect().executeWhenCompiled(() => {
                    proceduralTexture.render();
                    resolve(proceduralTexture);
                });
            }
        });
    }
}

_Exporter.RegisterExtension(NAME, (exporter) => new KHR_texture_transform(exporter));