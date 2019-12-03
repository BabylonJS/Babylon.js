import { ImageMimeType, ITextureInfo } from "babylonjs-gltf2interface";
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
    private _recordedTextures: ProceduralTexture[] = [];

    /** Name of this extension */
    public readonly name = NAME;

    /** Defines whether this extension is enabled */
    public enabled = true;

    /** Defines whether this extension is required */
    public required = false;

    /** Reference to the glTF exporter */
    private _wasUsed = false;

    constructor(exporter: _Exporter) {
    }

    public dispose() {
        for (var texture of this._recordedTextures) {
            texture.dispose();
        }
    }

    /** @hidden */
    public get wasUsed() {
        return this._wasUsed;
    }

    public postExportTexture?(context: string, textureInfo: ITextureInfo, babylonTexture: Texture): void {
        if (babylonTexture && babylonTexture.uRotationCenter === 0 && babylonTexture.vRotationCenter === 0) {
            let textureTransform: IKHRTextureTransform = {};
            let transformIsRequired = false;

            if (babylonTexture.uOffset !== 0 || babylonTexture.vOffset !== 0) {
                textureTransform.offset = [babylonTexture.uOffset, babylonTexture.vOffset];
                transformIsRequired = true;
            }

            if (babylonTexture.uScale !== 1 || babylonTexture.vScale !== 1) {
                textureTransform.scale = [babylonTexture.uScale, babylonTexture.vScale];
                transformIsRequired = true;
            }

            if (babylonTexture.wAng !== 0) {
                textureTransform.rotation = babylonTexture.wAng;
                transformIsRequired = true;
            }

            if (babylonTexture.coordinatesIndex !== 0) {
                textureTransform.texCoord = babylonTexture.coordinatesIndex;
                transformIsRequired = true;
            }

            if (!transformIsRequired) {
                return;
            }

            this._wasUsed = true;
            if (!textureInfo.extensions) {
                textureInfo.extensions = {};
            }
            textureInfo.extensions[NAME] = textureTransform;
        }
    }

    public preExportTextureAsync(context: string, babylonTexture: Texture, mimeType: ImageMimeType): Promise<Texture> {
        return new Promise((resolve, reject) => {
            const scene = babylonTexture.getScene();
            if (!scene) {
                reject(`${context}: "scene" is not defined for Babylon texture ${babylonTexture.name}!`);
                return;
            }

            let transformIsRequired = false;

            if (babylonTexture.uOffset !== 0 || babylonTexture.vOffset !== 0) {
                transformIsRequired = true;
            }

            if (babylonTexture.uScale !== 1 || babylonTexture.vScale !== 1) {
                transformIsRequired = true;
            }

            if (babylonTexture.wAng !== 0) {
                transformIsRequired = true;
            }

            if (!transformIsRequired) {
                resolve(babylonTexture);
                return;
            }

            // Do we need to flatten the transform?
            if (babylonTexture.uRotationCenter === 0 && babylonTexture.vRotationCenter === 0) {
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

            proceduralTexture.reservedDataStore = {
                hidden: true,
                source: babylonTexture
            };

            this._recordedTextures.push(proceduralTexture);

            proceduralTexture.coordinatesIndex = babylonTexture.coordinatesIndex;
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