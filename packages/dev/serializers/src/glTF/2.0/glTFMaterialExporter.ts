/* eslint-disable babylonjs/available */

import type { ITextureInfo, IMaterial, IMaterialPbrMetallicRoughness, IMaterialOcclusionTextureInfo, ISampler } from "babylonjs-gltf2interface";
import { ImageMimeType, MaterialAlphaMode, TextureMagFilter, TextureMinFilter, TextureWrapMode } from "babylonjs-gltf2interface";

import type { Nullable } from "core/types";
import { Vector2 } from "core/Maths/math.vector";
import { Color3 } from "core/Maths/math.color";
import { Scalar } from "core/Maths/math.scalar";
import { Tools } from "core/Misc/tools";
import { TextureTools } from "core/Misc/textureTools";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { Texture } from "core/Materials/Textures/texture";
import { RawTexture } from "core/Materials/Textures/rawTexture";

import type { Scene } from "core/scene";

import type { GLTFExporter } from "./glTFExporter";
import { Constants } from "core/Engines/constants";
import { DumpTools } from "core/Misc/dumpTools";

import type { Material } from "core/Materials/material";
import type { StandardMaterial } from "core/Materials/standardMaterial";
import type { PBRBaseMaterial } from "core/Materials/PBR/pbrBaseMaterial";

const epsilon = 1e-6;
const dielectricSpecular = new Color3(0.04, 0.04, 0.04);
const maxSpecularPower = 1024;
const white = Color3.White();
const black = Color3.Black();

/**
 * Interface for storing specular glossiness factors
 * @internal
 */
interface IPBRSpecularGlossiness {
    /**
     * Represents the linear diffuse factors of the material
     */
    diffuseColor: Color3;
    specularColor: Color3;
    glossiness: number;
}

interface IPBRMetallicRoughness {
    baseColor: Color3;
    metallic: Nullable<number>;
    roughness: Nullable<number>;
    metallicRoughnessTextureData?: Nullable<ArrayBuffer>;
    baseColorTextureData?: Nullable<ArrayBuffer>;
}

function GetFileExtensionFromMimeType(mimeType: ImageMimeType): string {
    switch (mimeType) {
        case ImageMimeType.JPEG:
            return ".jpg";
        case ImageMimeType.PNG:
            return ".png";
        case ImageMimeType.WEBP:
            return ".webp";
        case ImageMimeType.AVIF:
            return ".avif";
    }
}

/**
 * Computes the metallic factor from specular glossiness values.
 * @param diffuse diffused value
 * @param specular specular value
 * @param oneMinusSpecularStrength one minus the specular strength
 * @returns metallic value
 * @internal
 */
export function _SolveMetallic(diffuse: number, specular: number, oneMinusSpecularStrength: number): number {
    if (specular < dielectricSpecular.r) {
        dielectricSpecular;
        return 0;
    }

    const a = dielectricSpecular.r;
    const b = (diffuse * oneMinusSpecularStrength) / (1.0 - dielectricSpecular.r) + specular - 2.0 * dielectricSpecular.r;
    const c = dielectricSpecular.r - specular;
    const d = b * b - 4.0 * a * c;
    return Scalar.Clamp((-b + Math.sqrt(d)) / (2.0 * a), 0, 1);
}

/**
 * Computes the metallic/roughness factors from a Standard Material.
 * @internal
 */
export function _ConvertToGLTFPBRMetallicRoughness(babylonStandardMaterial: StandardMaterial): IMaterialPbrMetallicRoughness {
    // Defines a cubic bezier curve where x is specular power and y is roughness
    const P0 = new Vector2(0, 1);
    const P1 = new Vector2(0, 0.1);
    const P2 = new Vector2(0, 0.1);
    const P3 = new Vector2(1300, 0.1);

    /**
     * Given the control points, solve for x based on a given t for a cubic bezier curve
     * @param t a value between 0 and 1
     * @param p0 first control point
     * @param p1 second control point
     * @param p2 third control point
     * @param p3 fourth control point
     * @returns number result of cubic bezier curve at the specified t
     */
    function cubicBezierCurve(t: number, p0: number, p1: number, p2: number, p3: number): number {
        return (1 - t) * (1 - t) * (1 - t) * p0 + 3 * (1 - t) * (1 - t) * t * p1 + 3 * (1 - t) * t * t * p2 + t * t * t * p3;
    }

    /**
     * Evaluates a specified specular power value to determine the appropriate roughness value,
     * based on a pre-defined cubic bezier curve with specular on the abscissa axis (x-axis)
     * and roughness on the ordinant axis (y-axis)
     * @param specularPower specular power of standard material
     * @returns Number representing the roughness value
     */
    function solveForRoughness(specularPower: number): number {
        // Given P0.x = 0, P1.x = 0, P2.x = 0
        //   x = t * t * t * P3.x
        //   t = (x / P3.x)^(1/3)
        const t = Math.pow(specularPower / P3.x, 0.333333);
        return cubicBezierCurve(t, P0.y, P1.y, P2.y, P3.y);
    }

    const diffuse = babylonStandardMaterial.diffuseColor.toLinearSpace(babylonStandardMaterial.getScene().getEngine().useExactSrgbConversions).scale(0.5);
    const opacity = babylonStandardMaterial.alpha;
    const specularPower = Scalar.Clamp(babylonStandardMaterial.specularPower, 0, maxSpecularPower);

    const roughness = solveForRoughness(specularPower);

    const glTFPbrMetallicRoughness: IMaterialPbrMetallicRoughness = {
        baseColorFactor: [diffuse.r, diffuse.g, diffuse.b, opacity],
        metallicFactor: 0,
        roughnessFactor: roughness,
    };

    return glTFPbrMetallicRoughness;
}

/**
 * Sets the glTF alpha mode to a glTF material from the Babylon Material
 * @param glTFMaterial glTF material
 * @param babylonMaterial Babylon material
 */
function SetAlphaMode(glTFMaterial: IMaterial, babylonMaterial: Material & { alphaCutOff?: number }): void {
    if (babylonMaterial.needAlphaBlending()) {
        glTFMaterial.alphaMode = MaterialAlphaMode.BLEND;
    } else if (babylonMaterial.needAlphaTesting()) {
        glTFMaterial.alphaMode = MaterialAlphaMode.MASK;
        glTFMaterial.alphaCutoff = babylonMaterial.alphaCutOff;
    }
}

function CreateWhiteTexture(width: number, height: number, scene: Scene): Texture {
    const data = new Uint8Array(width * height * 4);

    for (let i = 0; i < data.length; i = i + 4) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0xff;
    }

    const rawTexture = RawTexture.CreateRGBATexture(data, width, height, scene);

    return rawTexture;
}

function ConvertPixelArrayToFloat32(pixels: ArrayBufferView): Float32Array {
    if (pixels instanceof Uint8Array) {
        const length = pixels.length;
        const buffer = new Float32Array(pixels.length);
        for (let i = 0; i < length; ++i) {
            buffer[i] = pixels[i] / 255;
        }
        return buffer;
    } else if (pixels instanceof Float32Array) {
        return pixels;
    } else {
        throw new Error("Unsupported pixel format!");
    }
}

/**
 * Utility methods for working with glTF material conversion properties.
 * @internal
 */
export class GLTFMaterialExporter {
    // Mapping to store textures
    private _textureMap = new Map<BaseTexture, ITextureInfo>();

    // Mapping of internal textures to images to avoid exporting duplicate images
    private _internalTextureToImage: { [uniqueId: number]: { [mimeType: string]: Promise<number> } } = {};

    constructor(private readonly _exporter: GLTFExporter) {}

    public getTextureInfo(babylonTexture: Nullable<BaseTexture>): Nullable<ITextureInfo> {
        return babylonTexture ? (this._textureMap.get(babylonTexture) ?? null) : null;
    }

    public async exportStandardMaterialAsync(babylonStandardMaterial: StandardMaterial, mimeType: ImageMimeType, hasUVs: boolean): Promise<number> {
        const pbrMetallicRoughness = _ConvertToGLTFPBRMetallicRoughness(babylonStandardMaterial);

        const material: IMaterial = { name: babylonStandardMaterial.name };
        if (babylonStandardMaterial.backFaceCulling != null && !babylonStandardMaterial.backFaceCulling) {
            if (!babylonStandardMaterial.twoSidedLighting) {
                Tools.Warn(babylonStandardMaterial.name + ": Back-face culling disabled and two-sided lighting disabled is not supported in glTF.");
            }
            material.doubleSided = true;
        }

        if (hasUVs) {
            const promises: Promise<void>[] = [];

            const diffuseTexture = babylonStandardMaterial.diffuseTexture;
            if (diffuseTexture) {
                promises.push(
                    this.exportTextureAsync(diffuseTexture, mimeType).then((textureInfo) => {
                        if (textureInfo) {
                            pbrMetallicRoughness.baseColorTexture = textureInfo;
                        }
                    })
                );
            }

            const bumpTexture = babylonStandardMaterial.bumpTexture;
            if (bumpTexture) {
                promises.push(
                    this.exportTextureAsync(bumpTexture, mimeType).then((textureInfo) => {
                        if (textureInfo) {
                            material.normalTexture = textureInfo;
                            if (bumpTexture.level !== 1) {
                                material.normalTexture.scale = bumpTexture.level;
                            }
                        }
                    })
                );
            }

            const emissiveTexture = babylonStandardMaterial.emissiveTexture;
            if (emissiveTexture) {
                material.emissiveFactor = [1.0, 1.0, 1.0];

                promises.push(
                    this.exportTextureAsync(emissiveTexture, mimeType).then((textureInfo) => {
                        if (textureInfo) {
                            material.emissiveTexture = textureInfo;
                        }
                    })
                );
            }

            const ambientTexture = babylonStandardMaterial.ambientTexture;
            if (ambientTexture) {
                promises.push(
                    this.exportTextureAsync(ambientTexture, mimeType).then((textureInfo) => {
                        if (textureInfo) {
                            const occlusionTexture: IMaterialOcclusionTextureInfo = {
                                index: textureInfo.index,
                            };
                            material.occlusionTexture = occlusionTexture;
                        }
                    })
                );
            }

            if (promises.length > 0) {
                this._exporter._materialNeedsUVsSet.add(babylonStandardMaterial);
                await Promise.all(promises);
            }
        }

        if (babylonStandardMaterial.alpha < 1.0 || babylonStandardMaterial.opacityTexture) {
            if (babylonStandardMaterial.alphaMode === Constants.ALPHA_COMBINE) {
                material.alphaMode = MaterialAlphaMode.BLEND;
            } else {
                Tools.Warn(babylonStandardMaterial.name + ": glTF 2.0 does not support alpha mode: " + babylonStandardMaterial.alphaMode.toString());
            }
        }

        if (babylonStandardMaterial.emissiveColor && !babylonStandardMaterial.emissiveColor.equalsWithEpsilon(black, epsilon)) {
            material.emissiveFactor = babylonStandardMaterial.emissiveColor.asArray();
        }

        material.pbrMetallicRoughness = pbrMetallicRoughness;
        SetAlphaMode(material, babylonStandardMaterial);

        await this._finishMaterialAsync(material, babylonStandardMaterial, mimeType);

        const materials = this._exporter._materials;
        materials.push(material);
        return materials.length - 1;
    }

    private async _finishMaterialAsync(glTFMaterial: IMaterial, babylonMaterial: Material, mimeType: ImageMimeType): Promise<void> {
        const textures = this._exporter._extensionsPostExportMaterialAdditionalTextures("exportMaterial", glTFMaterial, babylonMaterial);

        const promises: Array<Promise<Nullable<ITextureInfo>>> = [];

        for (const texture of textures) {
            promises.push(this.exportTextureAsync(texture, mimeType));
        }

        await Promise.all(promises);

        await this._exporter._extensionsPostExportMaterialAsync("exportMaterial", glTFMaterial, babylonMaterial);
    }

    private async _getImageDataAsync(buffer: Uint8Array | Float32Array, width: number, height: number, mimeType: ImageMimeType): Promise<ArrayBuffer> {
        const textureType = Constants.TEXTURETYPE_UNSIGNED_BYTE;

        const hostingScene = this._exporter._babylonScene;
        const engine = hostingScene.getEngine();

        // Create a temporary texture with the texture buffer data
        const tempTexture = engine.createRawTexture(buffer, width, height, Constants.TEXTUREFORMAT_RGBA, false, true, Texture.NEAREST_SAMPLINGMODE, null, textureType);

        engine.isWebGPU ? await import("core/ShadersWGSL/pass.fragment") : await import("core/Shaders/pass.fragment");
        await TextureTools.ApplyPostProcess("pass", tempTexture, hostingScene, textureType, Constants.TEXTURE_NEAREST_SAMPLINGMODE, Constants.TEXTUREFORMAT_RGBA);

        const data = await engine._readTexturePixels(tempTexture, width, height);

        return (await DumpTools.DumpDataAsync(width, height, data, mimeType, undefined, true, true)) as ArrayBuffer;
    }

    /**
     * Resizes the two source textures to the same dimensions.  If a texture is null, a default white texture is generated.  If both textures are null, returns null
     * @param texture1 first texture to resize
     * @param texture2 second texture to resize
     * @param scene babylonjs scene
     * @returns resized textures or null
     */
    private _resizeTexturesToSameDimensions(texture1: Nullable<BaseTexture>, texture2: Nullable<BaseTexture>, scene: Scene): { texture1: BaseTexture; texture2: BaseTexture } {
        const texture1Size = texture1 ? texture1.getSize() : { width: 0, height: 0 };
        const texture2Size = texture2 ? texture2.getSize() : { width: 0, height: 0 };
        let resizedTexture1: BaseTexture;
        let resizedTexture2: BaseTexture;

        if (texture1Size.width < texture2Size.width) {
            if (texture1 && texture1 instanceof Texture) {
                resizedTexture1 = TextureTools.CreateResizedCopy(texture1, texture2Size.width, texture2Size.height, true);
            } else {
                resizedTexture1 = CreateWhiteTexture(texture2Size.width, texture2Size.height, scene);
            }
            resizedTexture2 = texture2!;
        } else if (texture1Size.width > texture2Size.width) {
            if (texture2 && texture2 instanceof Texture) {
                resizedTexture2 = TextureTools.CreateResizedCopy(texture2, texture1Size.width, texture1Size.height, true);
            } else {
                resizedTexture2 = CreateWhiteTexture(texture1Size.width, texture1Size.height, scene);
            }
            resizedTexture1 = texture1!;
        } else {
            resizedTexture1 = texture1!;
            resizedTexture2 = texture2!;
        }

        return {
            texture1: resizedTexture1!,
            texture2: resizedTexture2!,
        };
    }

    /**
     * Convert Specular Glossiness Textures to Metallic Roughness
     * See link below for info on the material conversions from PBR Metallic/Roughness and Specular/Glossiness
     * @see https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Archived/KHR_materials_pbrSpecularGlossiness/examples/convert-between-workflows-bjs/js/babylon.pbrUtilities.js
     * @param diffuseTexture texture used to store diffuse information
     * @param specularGlossinessTexture texture used to store specular and glossiness information
     * @param factors specular glossiness material factors
     * @param mimeType the mime type to use for the texture
     * @returns pbr metallic roughness interface or null
     */
    private async _convertSpecularGlossinessTexturesToMetallicRoughnessAsync(
        diffuseTexture: Nullable<BaseTexture>,
        specularGlossinessTexture: Nullable<BaseTexture>,
        factors: IPBRSpecularGlossiness,
        mimeType: ImageMimeType
    ): Promise<IPBRMetallicRoughness> {
        const promises = new Array<Promise<void>>();
        if (!(diffuseTexture || specularGlossinessTexture)) {
            return Promise.reject("diffuse and specular glossiness textures are not defined!");
        }

        const scene: Nullable<Scene> = diffuseTexture ? diffuseTexture.getScene() : specularGlossinessTexture ? specularGlossinessTexture.getScene() : null;
        if (scene) {
            const resizedTextures = this._resizeTexturesToSameDimensions(diffuseTexture, specularGlossinessTexture, scene);

            const diffuseSize = resizedTextures.texture1?.getSize();

            let diffuseBuffer: Float32Array;
            let specularGlossinessBuffer: Float32Array;

            const width = diffuseSize.width;
            const height = diffuseSize.height;

            const diffusePixels = await resizedTextures.texture1.readPixels();
            const specularPixels = await resizedTextures.texture2.readPixels();

            if (diffusePixels) {
                diffuseBuffer = ConvertPixelArrayToFloat32(diffusePixels);
            } else {
                return Promise.reject("Failed to retrieve pixels from diffuse texture!");
            }
            if (specularPixels) {
                specularGlossinessBuffer = ConvertPixelArrayToFloat32(specularPixels);
            } else {
                return Promise.reject("Failed to retrieve pixels from specular glossiness texture!");
            }

            const byteLength = specularGlossinessBuffer.byteLength;

            const metallicRoughnessBuffer = new Uint8Array(byteLength);
            const baseColorBuffer = new Uint8Array(byteLength);

            const strideSize = 4;
            const maxBaseColor = black;
            let maxMetallic = 0;
            let maxRoughness = 0;

            for (let h = 0; h < height; ++h) {
                for (let w = 0; w < width; ++w) {
                    const offset = (width * h + w) * strideSize;

                    const diffuseColor = new Color3(diffuseBuffer[offset], diffuseBuffer[offset + 1], diffuseBuffer[offset + 2])
                        .toLinearSpace(scene.getEngine().useExactSrgbConversions)
                        .multiply(factors.diffuseColor);
                    const specularColor = new Color3(specularGlossinessBuffer[offset], specularGlossinessBuffer[offset + 1], specularGlossinessBuffer[offset + 2])
                        .toLinearSpace(scene.getEngine().useExactSrgbConversions)
                        .multiply(factors.specularColor);
                    const glossiness = specularGlossinessBuffer[offset + 3] * factors.glossiness;

                    const specularGlossiness: IPBRSpecularGlossiness = {
                        diffuseColor: diffuseColor,
                        specularColor: specularColor,
                        glossiness: glossiness,
                    };

                    const metallicRoughness = this._convertSpecularGlossinessToMetallicRoughness(specularGlossiness);
                    maxBaseColor.r = Math.max(maxBaseColor.r, metallicRoughness.baseColor.r);
                    maxBaseColor.g = Math.max(maxBaseColor.g, metallicRoughness.baseColor.g);
                    maxBaseColor.b = Math.max(maxBaseColor.b, metallicRoughness.baseColor.b);
                    maxMetallic = Math.max(maxMetallic, metallicRoughness.metallic!);
                    maxRoughness = Math.max(maxRoughness, metallicRoughness.roughness!);

                    baseColorBuffer[offset] = metallicRoughness.baseColor.r * 255;
                    baseColorBuffer[offset + 1] = metallicRoughness.baseColor.g * 255;
                    baseColorBuffer[offset + 2] = metallicRoughness.baseColor.b * 255;
                    baseColorBuffer[offset + 3] = resizedTextures.texture1.hasAlpha ? diffuseBuffer[offset + 3] * 255 : 255;

                    metallicRoughnessBuffer[offset] = 0;
                    metallicRoughnessBuffer[offset + 1] = metallicRoughness.roughness! * 255;
                    metallicRoughnessBuffer[offset + 2] = metallicRoughness.metallic! * 255;
                    metallicRoughnessBuffer[offset + 3] = 255;
                }
            }

            // Retrieves the metallic roughness factors from the maximum texture values.
            const metallicRoughnessFactors: IPBRMetallicRoughness = {
                baseColor: maxBaseColor,
                metallic: maxMetallic,
                roughness: maxRoughness,
            };

            let writeOutMetallicRoughnessTexture = false;
            let writeOutBaseColorTexture = false;

            for (let h = 0; h < height; ++h) {
                for (let w = 0; w < width; ++w) {
                    const destinationOffset = (width * h + w) * strideSize;

                    baseColorBuffer[destinationOffset] /= metallicRoughnessFactors.baseColor.r > epsilon ? metallicRoughnessFactors.baseColor.r : 1;
                    baseColorBuffer[destinationOffset + 1] /= metallicRoughnessFactors.baseColor.g > epsilon ? metallicRoughnessFactors.baseColor.g : 1;
                    baseColorBuffer[destinationOffset + 2] /= metallicRoughnessFactors.baseColor.b > epsilon ? metallicRoughnessFactors.baseColor.b : 1;

                    const linearBaseColorPixel = Color3.FromInts(
                        baseColorBuffer[destinationOffset],
                        baseColorBuffer[destinationOffset + 1],
                        baseColorBuffer[destinationOffset + 2]
                    );
                    const sRGBBaseColorPixel = linearBaseColorPixel.toGammaSpace(scene.getEngine().useExactSrgbConversions);
                    baseColorBuffer[destinationOffset] = sRGBBaseColorPixel.r * 255;
                    baseColorBuffer[destinationOffset + 1] = sRGBBaseColorPixel.g * 255;
                    baseColorBuffer[destinationOffset + 2] = sRGBBaseColorPixel.b * 255;

                    if (!sRGBBaseColorPixel.equalsWithEpsilon(white, epsilon)) {
                        writeOutBaseColorTexture = true;
                    }

                    metallicRoughnessBuffer[destinationOffset + 1] /= metallicRoughnessFactors.roughness! > epsilon ? metallicRoughnessFactors.roughness! : 1;
                    metallicRoughnessBuffer[destinationOffset + 2] /= metallicRoughnessFactors.metallic! > epsilon ? metallicRoughnessFactors.metallic! : 1;

                    const metallicRoughnessPixel = Color3.FromInts(255, metallicRoughnessBuffer[destinationOffset + 1], metallicRoughnessBuffer[destinationOffset + 2]);

                    if (!metallicRoughnessPixel.equalsWithEpsilon(white, epsilon)) {
                        writeOutMetallicRoughnessTexture = true;
                    }
                }
            }

            if (writeOutMetallicRoughnessTexture) {
                promises.push(
                    this._getImageDataAsync(metallicRoughnessBuffer, width, height, mimeType).then((data) => {
                        metallicRoughnessFactors.metallicRoughnessTextureData = data;
                    })
                );
            }
            if (writeOutBaseColorTexture) {
                promises.push(
                    this._getImageDataAsync(baseColorBuffer, width, height, mimeType).then((data) => {
                        metallicRoughnessFactors.baseColorTextureData = data;
                    })
                );
            }

            return Promise.all(promises).then(() => {
                return metallicRoughnessFactors;
            });
        } else {
            return Promise.reject("_ConvertSpecularGlossinessTexturesToMetallicRoughness: Scene from textures is missing!");
        }
    }

    /**
     * Converts specular glossiness material properties to metallic roughness
     * @param specularGlossiness interface with specular glossiness material properties
     * @returns interface with metallic roughness material properties
     */
    private _convertSpecularGlossinessToMetallicRoughness(specularGlossiness: IPBRSpecularGlossiness): IPBRMetallicRoughness {
        const diffusePerceivedBrightness = this._getPerceivedBrightness(specularGlossiness.diffuseColor);
        const specularPerceivedBrightness = this._getPerceivedBrightness(specularGlossiness.specularColor);
        const oneMinusSpecularStrength = 1 - this._getMaxComponent(specularGlossiness.specularColor);
        const metallic = _SolveMetallic(diffusePerceivedBrightness, specularPerceivedBrightness, oneMinusSpecularStrength);
        const baseColorFromDiffuse = specularGlossiness.diffuseColor.scale(oneMinusSpecularStrength / (1.0 - dielectricSpecular.r) / Math.max(1 - metallic));
        const baseColorFromSpecular = specularGlossiness.specularColor.subtract(dielectricSpecular.scale(1 - metallic)).scale(1 / Math.max(metallic));
        let baseColor = Color3.Lerp(baseColorFromDiffuse, baseColorFromSpecular, metallic * metallic);
        baseColor = baseColor.clampToRef(0, 1, baseColor);

        const metallicRoughness: IPBRMetallicRoughness = {
            baseColor: baseColor,
            metallic: metallic,
            roughness: 1 - specularGlossiness.glossiness,
        };

        return metallicRoughness;
    }

    /**
     * Calculates the surface reflectance, independent of lighting conditions
     * @param color Color source to calculate brightness from
     * @returns number representing the perceived brightness, or zero if color is undefined
     */
    private _getPerceivedBrightness(color: Color3): number {
        if (color) {
            return Math.sqrt(0.299 * color.r * color.r + 0.587 * color.g * color.g + 0.114 * color.b * color.b);
        }
        return 0;
    }

    /**
     * Returns the maximum color component value
     * @param color
     * @returns maximum color component value, or zero if color is null or undefined
     */
    private _getMaxComponent(color: Color3): number {
        if (color) {
            return Math.max(color.r, Math.max(color.g, color.b));
        }
        return 0;
    }

    /**
     * Convert a PBRMaterial (Metallic/Roughness) to Metallic Roughness factors
     * @param babylonPBRMaterial BJS PBR Metallic Roughness Material
     * @param mimeType mime type to use for the textures
     * @param glTFPbrMetallicRoughness glTF PBR Metallic Roughness interface
     * @param hasUVs specifies if texture coordinates are present on the submesh to determine if textures should be applied
     * @returns glTF PBR Metallic Roughness factors
     */
    private async _convertMetalRoughFactorsToMetallicRoughnessAsync(
        babylonPBRMaterial: PBRBaseMaterial,
        mimeType: ImageMimeType,
        glTFPbrMetallicRoughness: IMaterialPbrMetallicRoughness,
        hasUVs: boolean
    ): Promise<IPBRMetallicRoughness> {
        const promises: Promise<void>[] = [];

        const metallicRoughness: IPBRMetallicRoughness = {
            baseColor: babylonPBRMaterial._albedoColor,
            metallic: babylonPBRMaterial._metallic,
            roughness: babylonPBRMaterial._roughness,
        };

        if (hasUVs) {
            const albedoTexture = babylonPBRMaterial._albedoTexture;
            if (albedoTexture) {
                promises.push(
                    this.exportTextureAsync(babylonPBRMaterial._albedoTexture!, mimeType).then((glTFTexture) => {
                        if (glTFTexture) {
                            glTFPbrMetallicRoughness.baseColorTexture = glTFTexture;
                        }
                    })
                );
            }
            const metallicTexture = babylonPBRMaterial._metallicTexture;
            if (metallicTexture) {
                promises.push(
                    this.exportTextureAsync(metallicTexture, mimeType).then((glTFTexture) => {
                        if (glTFTexture) {
                            glTFPbrMetallicRoughness.metallicRoughnessTexture = glTFTexture;
                        }
                    })
                );
            }
        }

        if (promises.length > 0) {
            this._exporter._materialNeedsUVsSet.add(babylonPBRMaterial);
            await Promise.all(promises);
        }

        return metallicRoughness;
    }

    private _getTextureSampler(texture: Nullable<BaseTexture>): ISampler {
        const sampler: ISampler = {};
        if (!texture || !(texture instanceof Texture)) {
            return sampler;
        }

        const wrapS = this._getGLTFTextureWrapMode(texture.wrapU);
        if (wrapS !== TextureWrapMode.REPEAT) {
            sampler.wrapS = wrapS;
        }

        const wrapT = this._getGLTFTextureWrapMode(texture.wrapV);
        if (wrapT !== TextureWrapMode.REPEAT) {
            sampler.wrapT = wrapT;
        }

        switch (texture.samplingMode) {
            case Texture.LINEAR_LINEAR: {
                sampler.magFilter = TextureMagFilter.LINEAR;
                sampler.minFilter = TextureMinFilter.LINEAR;
                break;
            }
            case Texture.LINEAR_NEAREST: {
                sampler.magFilter = TextureMagFilter.LINEAR;
                sampler.minFilter = TextureMinFilter.NEAREST;
                break;
            }
            case Texture.NEAREST_LINEAR: {
                sampler.magFilter = TextureMagFilter.NEAREST;
                sampler.minFilter = TextureMinFilter.LINEAR;
                break;
            }
            case Texture.NEAREST_LINEAR_MIPLINEAR: {
                sampler.magFilter = TextureMagFilter.NEAREST;
                sampler.minFilter = TextureMinFilter.LINEAR_MIPMAP_LINEAR;
                break;
            }
            case Texture.NEAREST_NEAREST: {
                sampler.magFilter = TextureMagFilter.NEAREST;
                sampler.minFilter = TextureMinFilter.NEAREST;
                break;
            }
            case Texture.NEAREST_LINEAR_MIPNEAREST: {
                sampler.magFilter = TextureMagFilter.NEAREST;
                sampler.minFilter = TextureMinFilter.LINEAR_MIPMAP_NEAREST;
                break;
            }
            case Texture.LINEAR_NEAREST_MIPNEAREST: {
                sampler.magFilter = TextureMagFilter.LINEAR;
                sampler.minFilter = TextureMinFilter.NEAREST_MIPMAP_NEAREST;
                break;
            }
            case Texture.LINEAR_NEAREST_MIPLINEAR: {
                sampler.magFilter = TextureMagFilter.LINEAR;
                sampler.minFilter = TextureMinFilter.NEAREST_MIPMAP_LINEAR;
                break;
            }
            case Texture.NEAREST_NEAREST_MIPLINEAR: {
                sampler.magFilter = TextureMagFilter.NEAREST;
                sampler.minFilter = TextureMinFilter.NEAREST_MIPMAP_LINEAR;
                break;
            }
            case Texture.LINEAR_LINEAR_MIPLINEAR: {
                sampler.magFilter = TextureMagFilter.LINEAR;
                sampler.minFilter = TextureMinFilter.LINEAR_MIPMAP_LINEAR;
                break;
            }
            case Texture.LINEAR_LINEAR_MIPNEAREST: {
                sampler.magFilter = TextureMagFilter.LINEAR;
                sampler.minFilter = TextureMinFilter.LINEAR_MIPMAP_NEAREST;
                break;
            }
            case Texture.NEAREST_NEAREST_MIPNEAREST: {
                sampler.magFilter = TextureMagFilter.NEAREST;
                sampler.minFilter = TextureMinFilter.NEAREST_MIPMAP_NEAREST;
                break;
            }
        }

        return sampler;
    }

    private _getGLTFTextureWrapMode(wrapMode: number): TextureWrapMode {
        switch (wrapMode) {
            case Texture.WRAP_ADDRESSMODE: {
                return TextureWrapMode.REPEAT;
            }
            case Texture.CLAMP_ADDRESSMODE: {
                return TextureWrapMode.CLAMP_TO_EDGE;
            }
            case Texture.MIRROR_ADDRESSMODE: {
                return TextureWrapMode.MIRRORED_REPEAT;
            }
            default: {
                Tools.Error(`Unsupported Texture Wrap Mode ${wrapMode}!`);
                return TextureWrapMode.REPEAT;
            }
        }
    }

    /**
     * Convert a PBRMaterial (Specular/Glossiness) to Metallic Roughness factors
     * @param babylonPBRMaterial BJS PBR Metallic Roughness Material
     * @param mimeType mime type to use for the textures
     * @param pbrMetallicRoughness glTF PBR Metallic Roughness interface
     * @param hasUVs specifies if texture coordinates are present on the submesh to determine if textures should be applied
     * @returns glTF PBR Metallic Roughness factors
     */
    private async _convertSpecGlossFactorsToMetallicRoughnessAsync(
        babylonPBRMaterial: PBRBaseMaterial,
        mimeType: ImageMimeType,
        pbrMetallicRoughness: IMaterialPbrMetallicRoughness,
        hasUVs: boolean
    ): Promise<IPBRMetallicRoughness> {
        const specGloss: IPBRSpecularGlossiness = {
            diffuseColor: babylonPBRMaterial._albedoColor,
            specularColor: babylonPBRMaterial._reflectivityColor,
            glossiness: babylonPBRMaterial._microSurface,
        };

        const albedoTexture = babylonPBRMaterial._albedoTexture;
        const reflectivityTexture = babylonPBRMaterial._reflectivityTexture;
        const useMicrosurfaceFromReflectivityMapAlpha = babylonPBRMaterial._useMicroSurfaceFromReflectivityMapAlpha;
        if (reflectivityTexture && !useMicrosurfaceFromReflectivityMapAlpha) {
            return Promise.reject("_ConvertPBRMaterial: Glossiness values not included in the reflectivity texture are currently not supported");
        }

        if ((albedoTexture || reflectivityTexture) && hasUVs) {
            this._exporter._materialNeedsUVsSet.add(babylonPBRMaterial);

            const samplerIndex = this._exportTextureSampler(albedoTexture || reflectivityTexture);
            const metallicRoughnessFactors = await this._convertSpecularGlossinessTexturesToMetallicRoughnessAsync(albedoTexture, reflectivityTexture, specGloss, mimeType);

            const textures = this._exporter._textures;

            if (metallicRoughnessFactors.baseColorTextureData) {
                const imageIndex = this._exportImage(`baseColor${textures.length}`, mimeType, metallicRoughnessFactors.baseColorTextureData);
                pbrMetallicRoughness.baseColorTexture = this._exportTextureInfo(imageIndex, samplerIndex, albedoTexture?.coordinatesIndex);
            }

            if (metallicRoughnessFactors.metallicRoughnessTextureData) {
                const imageIndex = this._exportImage(`metallicRoughness${textures.length}`, mimeType, metallicRoughnessFactors.metallicRoughnessTextureData);
                pbrMetallicRoughness.metallicRoughnessTexture = this._exportTextureInfo(imageIndex, samplerIndex, reflectivityTexture?.coordinatesIndex);
            }

            return metallicRoughnessFactors;
        } else {
            return this._convertSpecularGlossinessToMetallicRoughness(specGloss);
        }
    }

    public async exportPBRMaterialAsync(babylonPBRMaterial: PBRBaseMaterial, mimeType: ImageMimeType, hasUVs: boolean): Promise<number> {
        const glTFPbrMetallicRoughness: IMaterialPbrMetallicRoughness = {};

        const glTFMaterial: IMaterial = {
            name: babylonPBRMaterial.name,
        };

        const useMetallicRoughness = babylonPBRMaterial.isMetallicWorkflow();

        if (useMetallicRoughness) {
            const albedoColor = babylonPBRMaterial._albedoColor;
            const alpha = babylonPBRMaterial.alpha;
            if (albedoColor) {
                glTFPbrMetallicRoughness.baseColorFactor = [albedoColor.r, albedoColor.g, albedoColor.b, alpha];
            }
        }

        const metallicRoughness = useMetallicRoughness
            ? await this._convertMetalRoughFactorsToMetallicRoughnessAsync(babylonPBRMaterial, mimeType, glTFPbrMetallicRoughness, hasUVs)
            : await this._convertSpecGlossFactorsToMetallicRoughnessAsync(babylonPBRMaterial, mimeType, glTFPbrMetallicRoughness, hasUVs);

        await this._setMetallicRoughnessPbrMaterialAsync(metallicRoughness, babylonPBRMaterial, glTFMaterial, glTFPbrMetallicRoughness, mimeType, hasUVs);
        await this._finishMaterialAsync(glTFMaterial, babylonPBRMaterial, mimeType);

        const materials = this._exporter._materials;
        materials.push(glTFMaterial);
        return materials.length - 1;
    }

    private async _setMetallicRoughnessPbrMaterialAsync(
        metallicRoughness: IPBRMetallicRoughness,
        babylonPBRMaterial: PBRBaseMaterial,
        glTFMaterial: IMaterial,
        glTFPbrMetallicRoughness: IMaterialPbrMetallicRoughness,
        mimeType: ImageMimeType,
        hasUVs: boolean
    ): Promise<void> {
        SetAlphaMode(glTFMaterial, babylonPBRMaterial);

        if (!metallicRoughness.baseColor.equalsWithEpsilon(white, epsilon) || !Scalar.WithinEpsilon(babylonPBRMaterial.alpha, 1, epsilon)) {
            glTFPbrMetallicRoughness.baseColorFactor = [metallicRoughness.baseColor.r, metallicRoughness.baseColor.g, metallicRoughness.baseColor.b, babylonPBRMaterial.alpha];
        }

        if (metallicRoughness.metallic != null && metallicRoughness.metallic !== 1) {
            glTFPbrMetallicRoughness.metallicFactor = metallicRoughness.metallic;
        }
        if (metallicRoughness.roughness != null && metallicRoughness.roughness !== 1) {
            glTFPbrMetallicRoughness.roughnessFactor = metallicRoughness.roughness;
        }

        if (babylonPBRMaterial.backFaceCulling != null && !babylonPBRMaterial.backFaceCulling) {
            if (!babylonPBRMaterial._twoSidedLighting) {
                Tools.Warn(babylonPBRMaterial.name + ": Back-face culling disabled and two-sided lighting disabled is not supported in glTF.");
            }
            glTFMaterial.doubleSided = true;
        }

        if (hasUVs) {
            const promises: Promise<void>[] = [];

            const bumpTexture = babylonPBRMaterial._bumpTexture;
            if (bumpTexture) {
                promises.push(
                    this.exportTextureAsync(bumpTexture, mimeType).then((glTFTexture) => {
                        if (glTFTexture) {
                            glTFMaterial.normalTexture = glTFTexture;
                            if (bumpTexture.level !== 1) {
                                glTFMaterial.normalTexture.scale = bumpTexture.level;
                            }
                        }
                    })
                );
            }

            const ambientTexture = babylonPBRMaterial._ambientTexture;
            if (ambientTexture) {
                promises.push(
                    this.exportTextureAsync(ambientTexture, mimeType).then((glTFTexture) => {
                        if (glTFTexture) {
                            const occlusionTexture: IMaterialOcclusionTextureInfo = {
                                index: glTFTexture.index,
                                texCoord: glTFTexture.texCoord,
                                extensions: glTFTexture.extensions,
                            };

                            glTFMaterial.occlusionTexture = occlusionTexture;
                            const ambientTextureStrength = babylonPBRMaterial._ambientTextureStrength;
                            if (ambientTextureStrength) {
                                occlusionTexture.strength = ambientTextureStrength;
                            }
                        }
                    })
                );
            }

            const emissiveTexture = babylonPBRMaterial._emissiveTexture;
            if (emissiveTexture) {
                promises.push(
                    this.exportTextureAsync(emissiveTexture, mimeType).then((glTFTexture) => {
                        if (glTFTexture) {
                            glTFMaterial.emissiveTexture = glTFTexture;
                        }
                    })
                );
            }

            if (promises.length > 0) {
                this._exporter._materialNeedsUVsSet.add(babylonPBRMaterial);
                await Promise.all(promises);
            }
        }

        const emissiveColor = babylonPBRMaterial._emissiveColor;
        if (!emissiveColor.equalsWithEpsilon(black, epsilon)) {
            glTFMaterial.emissiveFactor = emissiveColor.asArray();
        }

        glTFMaterial.pbrMetallicRoughness = glTFPbrMetallicRoughness;
    }

    private _getPixelsFromTexture(babylonTexture: BaseTexture): Promise<Nullable<Uint8Array | Float32Array>> {
        const pixels =
            babylonTexture.textureType === Constants.TEXTURETYPE_UNSIGNED_BYTE
                ? (babylonTexture.readPixels() as Promise<Uint8Array>)
                : (babylonTexture.readPixels() as Promise<Float32Array>);
        return pixels;
    }

    public async exportTextureAsync(babylonTexture: BaseTexture, mimeType: ImageMimeType): Promise<Nullable<ITextureInfo>> {
        const extensionPromise = this._exporter._extensionsPreExportTextureAsync("exporter", babylonTexture as Texture, mimeType);
        if (!extensionPromise) {
            return this._exportTextureInfoAsync(babylonTexture, mimeType);
        }

        return extensionPromise.then((texture) => {
            if (!texture) {
                return this._exportTextureInfoAsync(babylonTexture, mimeType);
            }
            return this._exportTextureInfoAsync(texture, mimeType);
        });
    }

    private async _exportTextureInfoAsync(babylonTexture: BaseTexture, mimeType: ImageMimeType): Promise<Nullable<ITextureInfo>> {
        let textureInfo = this._textureMap.get(babylonTexture);
        if (!textureInfo) {
            const pixels = await this._getPixelsFromTexture(babylonTexture);
            if (!pixels) {
                return null;
            }

            const samplerIndex = this._exportTextureSampler(babylonTexture);

            // Preserve texture mime type if defined
            const textureMimeType = (babylonTexture as Texture).mimeType;
            if (textureMimeType) {
                switch (textureMimeType) {
                    case "image/jpeg":
                    case "image/png":
                    case "image/webp":
                        mimeType = textureMimeType as ImageMimeType;
                        break;
                    default:
                        Tools.Warn(`Unsupported media type: ${textureMimeType}`);
                        break;
                }
            }

            const internalTextureToImage = this._internalTextureToImage;
            const internalTextureUniqueId = babylonTexture.getInternalTexture()!.uniqueId;
            internalTextureToImage[internalTextureUniqueId] ||= {};
            let imageIndexPromise = internalTextureToImage[internalTextureUniqueId][mimeType];
            if (imageIndexPromise === undefined) {
                const size = babylonTexture.getSize();
                imageIndexPromise = (async () => {
                    const data = await this._getImageDataAsync(pixels, size.width, size.height, mimeType);
                    return this._exportImage(babylonTexture.name, mimeType, data);
                })();
                internalTextureToImage[internalTextureUniqueId][mimeType] = imageIndexPromise;
            }

            textureInfo = this._exportTextureInfo(await imageIndexPromise, samplerIndex, babylonTexture.coordinatesIndex);
            this._textureMap.set(babylonTexture, textureInfo);
            this._exporter._extensionsPostExportTextures("exporter", textureInfo, babylonTexture);
        }

        return textureInfo;
    }

    private _exportImage(name: string, mimeType: ImageMimeType, data: ArrayBuffer): number {
        const imageData = this._exporter._imageData;

        const baseName = name.replace(/\.\/|\/|\.\\|\\/g, "_");
        const extension = GetFileExtensionFromMimeType(mimeType);
        let fileName = baseName + extension;
        if (fileName in imageData) {
            fileName = `${baseName}_${Tools.RandomId()}${extension}`;
        }

        imageData[fileName] = {
            data: data,
            mimeType: mimeType,
        };

        const images = this._exporter._images;
        images.push({
            name: name,
            uri: fileName,
        });

        return images.length - 1;
    }

    private _exportTextureInfo(imageIndex: number, samplerIndex: number, coordinatesIndex?: number): ITextureInfo {
        const textures = this._exporter._textures;
        let textureIndex = textures.findIndex((t) => t.sampler == samplerIndex && t.source === imageIndex);
        if (textureIndex === -1) {
            textureIndex = textures.length;
            textures.push({
                source: imageIndex,
                sampler: samplerIndex,
            });
        }

        const textureInfo: ITextureInfo = { index: textureIndex };
        if (coordinatesIndex) {
            textureInfo.texCoord = coordinatesIndex;
        }
        return textureInfo;
    }

    private _exportTextureSampler(texture: Nullable<BaseTexture>): number {
        const sampler = this._getTextureSampler(texture);

        // if a pre-existing sampler with identical parameters exists, then reuse the previous sampler
        const samplers = this._exporter._samplers;
        const samplerIndex = samplers.findIndex(
            (s) => s.minFilter === sampler.minFilter && s.magFilter === sampler.magFilter && s.wrapS === sampler.wrapS && s.wrapT === sampler.wrapT
        );
        if (samplerIndex !== -1) {
            return samplerIndex;
        }

        samplers.push(sampler);
        return samplers.length - 1;
    }
}
