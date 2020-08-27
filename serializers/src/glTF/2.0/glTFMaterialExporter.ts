import { ITextureInfo, ImageMimeType, IMaterial, IMaterialPbrMetallicRoughness, MaterialAlphaMode, IMaterialOcclusionTextureInfo, ISampler, TextureMagFilter, TextureMinFilter, TextureWrapMode, ITexture, IImage } from "babylonjs-gltf2interface";

import { Nullable } from "babylonjs/types";
import { Vector2 } from "babylonjs/Maths/math.vector";
import { Color3 } from "babylonjs/Maths/math.color";
import { Scalar } from "babylonjs/Maths/math.scalar";
import { Tools } from "babylonjs/Misc/tools";
import { TextureTools } from "babylonjs/Misc/textureTools";
import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { RawTexture } from "babylonjs/Materials/Textures/rawTexture";
import { Material } from "babylonjs/Materials/material";
import { StandardMaterial } from "babylonjs/Materials/standardMaterial";
import { PBRMaterial } from "babylonjs/Materials/PBR/pbrMaterial";
import { PBRMetallicRoughnessMaterial } from "babylonjs/Materials/PBR/pbrMetallicRoughnessMaterial";
import { PostProcess } from "babylonjs/PostProcesses/postProcess";
import { Scene } from "babylonjs/scene";

import { _Exporter } from "./glTFExporter";
import { Constants } from 'babylonjs/Engines/constants';

/**
 * Interface for storing specular glossiness factors
 * @hidden
 */
interface _IPBRSpecularGlossiness {
    /**
     * Represents the linear diffuse factors of the material
    */
    diffuseColor: Color3;
    /**
     * Represents the linear specular factors of the material
    */
    specularColor: Color3;
    /**
     * Represents the smoothness of the material
    */
    glossiness: number;
}

/**
 * Interface for storing metallic roughness factors
 * @hidden
 */
interface _IPBRMetallicRoughness {
    /**
     * Represents the albedo color of the material
    */
    baseColor: Color3;
    /**
     * Represents the metallness of the material
    */
    metallic: Nullable<number>;
    /**
     * Represents the roughness of the material
    */
    roughness: Nullable<number>;
    /**
     * The metallic roughness texture as a base64 string
    */
    metallicRoughnessTextureBase64?: Nullable<string>;
    /**
     * The base color texture as a base64 string
    */
    baseColorTextureBase64?: Nullable<string>;
}

/**
 * Utility methods for working with glTF material conversion properties.  This class should only be used internally
 * @hidden
 */
export class _GLTFMaterialExporter {
    /**
     * Represents the dielectric specular values for R, G and B
     */
    private static readonly _DielectricSpecular: Color3 = new Color3(0.04, 0.04, 0.04);

    /**
     * Allows the maximum specular power to be defined for material calculations
     */
    private static readonly _MaxSpecularPower = 1024;

    /**
     * Mapping to store textures
     */
    private _textureMap: { [textureId: string]: ITextureInfo } = {};

    /**
     * Numeric tolerance value
     */
    private static readonly _Epsilon = 1e-6;

    /**
     * Reference to the glTF Exporter
     */
    private _exporter: _Exporter;

    constructor(exporter: _Exporter) {
        this._textureMap = {};
        this._exporter = exporter;
    }

    /**
     * Specifies if two colors are approximately equal in value
     * @param color1 first color to compare to
     * @param color2 second color to compare to
     * @param epsilon threshold value
     */
    private static FuzzyEquals(color1: Color3, color2: Color3, epsilon: number): boolean {
        return Scalar.WithinEpsilon(color1.r, color2.r, epsilon) &&
            Scalar.WithinEpsilon(color1.g, color2.g, epsilon) &&
            Scalar.WithinEpsilon(color1.b, color2.b, epsilon);
    }

    /**
     * Gets the materials from a Babylon scene and converts them to glTF materials
     * @param scene babylonjs scene
     * @param mimeType texture mime type
     * @param images array of images
     * @param textures array of textures
     * @param materials array of materials
     * @param imageData mapping of texture names to base64 textures
     * @param hasTextureCoords specifies if texture coordinates are present on the material
     */
    public _convertMaterialsToGLTFAsync(babylonMaterials: Material[], mimeType: ImageMimeType, hasTextureCoords: boolean) {
        let promises: Promise<IMaterial>[] = [];
        for (let babylonMaterial of babylonMaterials) {
            if (babylonMaterial instanceof StandardMaterial) {
                promises.push(this._convertStandardMaterialAsync(babylonMaterial, mimeType, hasTextureCoords));
            }
            else if (babylonMaterial instanceof PBRMetallicRoughnessMaterial) {
                promises.push(this._convertPBRMetallicRoughnessMaterialAsync(babylonMaterial, mimeType, hasTextureCoords));
            }
            else if (babylonMaterial instanceof PBRMaterial) {
                promises.push(this._convertPBRMaterialAsync(babylonMaterial, mimeType, hasTextureCoords));
            }
            else {
                Tools.Warn(`Unsupported material type: ${babylonMaterial.name}`);
            }
        }

        return Promise.all(promises).then(() => { /* do nothing */ });
    }

    /**
     * Makes a copy of the glTF material without the texture parameters
     * @param originalMaterial original glTF material
     * @returns glTF material without texture parameters
     */
    public _stripTexturesFromMaterial(originalMaterial: IMaterial): IMaterial {
        let newMaterial: IMaterial = {};
        if (originalMaterial) {
            newMaterial.name = originalMaterial.name;
            newMaterial.doubleSided = originalMaterial.doubleSided;
            newMaterial.alphaMode = originalMaterial.alphaMode;
            newMaterial.alphaCutoff = originalMaterial.alphaCutoff;
            newMaterial.emissiveFactor = originalMaterial.emissiveFactor;
            const originalPBRMetallicRoughness = originalMaterial.pbrMetallicRoughness;
            if (originalPBRMetallicRoughness) {
                newMaterial.pbrMetallicRoughness = {};
                newMaterial.pbrMetallicRoughness.baseColorFactor = originalPBRMetallicRoughness.baseColorFactor;
                newMaterial.pbrMetallicRoughness.metallicFactor = originalPBRMetallicRoughness.metallicFactor;
                newMaterial.pbrMetallicRoughness.roughnessFactor = originalPBRMetallicRoughness.roughnessFactor;
            }
        }
        return newMaterial;
    }

    /**
     * Specifies if the material has any texture parameters present
     * @param material glTF Material
     * @returns boolean specifying if texture parameters are present
     */
    public _hasTexturesPresent(material: IMaterial): boolean {
        if (material.emissiveTexture || material.normalTexture || material.occlusionTexture) {
            return true;
        }
        const pbrMat = material.pbrMetallicRoughness;
        if (pbrMat) {
            if (pbrMat.baseColorTexture || pbrMat.metallicRoughnessTexture) {
                return true;
            }
        }

        return false;
    }

    /**
     * Converts a Babylon StandardMaterial to a glTF Metallic Roughness Material
     * @param babylonStandardMaterial
     * @returns glTF Metallic Roughness Material representation
     */
    public _convertToGLTFPBRMetallicRoughness(babylonStandardMaterial: StandardMaterial): IMaterialPbrMetallicRoughness {
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
        function _cubicBezierCurve(t: number, p0: number, p1: number, p2: number, p3: number): number {
            return (
                (1 - t) * (1 - t) * (1 - t) * p0 +
                3 * (1 - t) * (1 - t) * t * p1 +
                3 * (1 - t) * t * t * p2 +
                t * t * t * p3
            );
        }

        /**
         * Evaluates a specified specular power value to determine the appropriate roughness value,
         * based on a pre-defined cubic bezier curve with specular on the abscissa axis (x-axis)
         * and roughness on the ordinant axis (y-axis)
         * @param specularPower specular power of standard material
         * @returns Number representing the roughness value
         */
        function _solveForRoughness(specularPower: number): number {
            var t = Math.pow(specularPower / P3.x, 0.333333);
            return _cubicBezierCurve(t, P0.y, P1.y, P2.y, P3.y);
        }

        let diffuse = babylonStandardMaterial.diffuseColor.toLinearSpace().scale(0.5);
        let opacity = babylonStandardMaterial.alpha;
        let specularPower = Scalar.Clamp(babylonStandardMaterial.specularPower, 0, _GLTFMaterialExporter._MaxSpecularPower);

        const roughness = _solveForRoughness(specularPower);

        const glTFPbrMetallicRoughness: IMaterialPbrMetallicRoughness = {
            baseColorFactor: [
                diffuse.r,
                diffuse.g,
                diffuse.b,
                opacity
            ],
            metallicFactor: 0,
            roughnessFactor: roughness,
        };

        return glTFPbrMetallicRoughness;
    }

    /**
     * Computes the metallic factor
     * @param diffuse diffused value
     * @param specular specular value
     * @param oneMinusSpecularStrength one minus the specular strength
     * @returns metallic value
     */
    public static _SolveMetallic(diffuse: number, specular: number, oneMinusSpecularStrength: number): number {
        if (specular < this._DielectricSpecular.r) {
            this._DielectricSpecular;
            return 0;
        }

        const a = this._DielectricSpecular.r;
        const b = diffuse * oneMinusSpecularStrength / (1.0 - this._DielectricSpecular.r) + specular - 2.0 * this._DielectricSpecular.r;
        const c = this._DielectricSpecular.r - specular;
        const D = b * b - 4.0 * a * c;
        return Scalar.Clamp((-b + Math.sqrt(D)) / (2.0 * a), 0, 1);
    }

    /**
     * Sets the glTF alpha mode to a glTF material from the Babylon Material
     * @param glTFMaterial glTF material
     * @param babylonMaterial Babylon material
     */
    private static _SetAlphaMode(glTFMaterial: IMaterial, babylonMaterial: Material & { alphaCutOff: number }): void {
        if (babylonMaterial.needAlphaBlending()) {
            glTFMaterial.alphaMode = MaterialAlphaMode.BLEND;
        }
        else if (babylonMaterial.needAlphaTesting()) {
            glTFMaterial.alphaMode = MaterialAlphaMode.MASK;
            glTFMaterial.alphaCutoff = babylonMaterial.alphaCutOff;
        }
    }

    /**
     * Converts a Babylon Standard Material to a glTF Material
     * @param babylonStandardMaterial BJS Standard Material
     * @param mimeType mime type to use for the textures
     * @param images array of glTF image interfaces
     * @param textures array of glTF texture interfaces
     * @param materials array of glTF material interfaces
     * @param imageData map of image file name to data
     * @param hasTextureCoords specifies if texture coordinates are present on the submesh to determine if textures should be applied
     */
    public _convertStandardMaterialAsync(babylonStandardMaterial: StandardMaterial, mimeType: ImageMimeType, hasTextureCoords: boolean): Promise<IMaterial> {
        const materialMap = this._exporter._materialMap;
        const materials = this._exporter._materials;
        const promises = [];
        const glTFPbrMetallicRoughness = this._convertToGLTFPBRMetallicRoughness(babylonStandardMaterial);

        const glTFMaterial: IMaterial = { name: babylonStandardMaterial.name };
        if (babylonStandardMaterial.backFaceCulling != null && !babylonStandardMaterial.backFaceCulling) {
            if (!babylonStandardMaterial.twoSidedLighting) {
                Tools.Warn(babylonStandardMaterial.name + ": Back-face culling enabled and two-sided lighting disabled is not supported in glTF.");
            }
            glTFMaterial.doubleSided = true;
        }
        if (hasTextureCoords) {
            if (babylonStandardMaterial.diffuseTexture) {
                promises.push(this._exportTextureAsync(babylonStandardMaterial.diffuseTexture, mimeType).then((glTFTexture) => {
                    if (glTFTexture) {
                        glTFPbrMetallicRoughness.baseColorTexture = glTFTexture;
                    }
                }));
            }
            if (babylonStandardMaterial.bumpTexture) {
                promises.push(this._exportTextureAsync(babylonStandardMaterial.bumpTexture, mimeType).then((glTFTexture) => {
                    if (glTFTexture) {
                        glTFMaterial.normalTexture = glTFTexture;
                        if (babylonStandardMaterial.bumpTexture != null && babylonStandardMaterial.bumpTexture.level !== 1) {
                            glTFMaterial.normalTexture.scale = babylonStandardMaterial.bumpTexture.level;
                        }
                    }
                }));
            }
            if (babylonStandardMaterial.emissiveTexture) {
                glTFMaterial.emissiveFactor = [1.0, 1.0, 1.0];

                promises.push(this._exportTextureAsync(babylonStandardMaterial.emissiveTexture, mimeType).then((glTFEmissiveTexture) => {
                    if (glTFEmissiveTexture) {
                        glTFMaterial.emissiveTexture = glTFEmissiveTexture;
                    }
                }));
            }
            if (babylonStandardMaterial.ambientTexture) {
                promises.push(this._exportTextureAsync(babylonStandardMaterial.ambientTexture, mimeType).then((glTFTexture) => {
                    if (glTFTexture) {
                        const occlusionTexture: IMaterialOcclusionTextureInfo = {
                            index: glTFTexture.index
                        };
                        glTFMaterial.occlusionTexture = occlusionTexture;
                        occlusionTexture.strength = 1.0;
                    }
                }));
            }
        }

        if (babylonStandardMaterial.alpha < 1.0 || babylonStandardMaterial.opacityTexture) {
            if (babylonStandardMaterial.alphaMode === Constants.ALPHA_COMBINE) {
                glTFMaterial.alphaMode = MaterialAlphaMode.BLEND;
            }
            else {
                Tools.Warn(babylonStandardMaterial.name + ": glTF 2.0 does not support alpha mode: " + babylonStandardMaterial.alphaMode.toString());
            }
        }
        if (babylonStandardMaterial.emissiveColor && !_GLTFMaterialExporter.FuzzyEquals(babylonStandardMaterial.emissiveColor, Color3.Black(), _GLTFMaterialExporter._Epsilon)) {
            glTFMaterial.emissiveFactor = babylonStandardMaterial.emissiveColor.asArray();
        }

        glTFMaterial.pbrMetallicRoughness = glTFPbrMetallicRoughness;
        _GLTFMaterialExporter._SetAlphaMode(glTFMaterial, babylonStandardMaterial);

        materials.push(glTFMaterial);
        materialMap[babylonStandardMaterial.uniqueId] = materials.length - 1;

        return this._finishMaterial(promises, glTFMaterial, babylonStandardMaterial, mimeType);
    }

    private _finishMaterial<T>(promises: Promise<T>[], glTFMaterial: IMaterial, babylonMaterial: Material, mimeType: ImageMimeType) {
        return Promise.all(promises).then(() => {

            const textures = this._exporter._extensionsPostExportMaterialAdditionalTextures("exportMaterial", glTFMaterial, babylonMaterial);
            let tasks: Nullable<Promise<Nullable<ITextureInfo>>[]> = null;

            for (var texture of textures) {
                if (!tasks) {
                    tasks = [];
                }
                tasks.push(this._exportTextureAsync(texture, mimeType));
            }

            if (!tasks) {
                tasks = [Promise.resolve(null)];
            }

            return Promise.all(tasks).then(() => {
                let extensionWork = this._exporter._extensionsPostExportMaterialAsync("exportMaterial", glTFMaterial, babylonMaterial);
                if (!extensionWork) {
                    return glTFMaterial;
                }
                return extensionWork.then(() => glTFMaterial);
            });
        });
    }

    /**
     * Converts a Babylon PBR Metallic Roughness Material to a glTF Material
     * @param babylonPBRMetalRoughMaterial BJS PBR Metallic Roughness Material
     * @param mimeType mime type to use for the textures
     * @param images array of glTF image interfaces
     * @param textures array of glTF texture interfaces
     * @param materials array of glTF material interfaces
     * @param imageData map of image file name to data
     * @param hasTextureCoords specifies if texture coordinates are present on the submesh to determine if textures should be applied
     */
    public _convertPBRMetallicRoughnessMaterialAsync(babylonPBRMetalRoughMaterial: PBRMetallicRoughnessMaterial, mimeType: ImageMimeType, hasTextureCoords: boolean): Promise<IMaterial> {
        const materialMap = this._exporter._materialMap;
        const materials = this._exporter._materials;
        let promises: Promise<void>[] = [];
        const glTFPbrMetallicRoughness: IMaterialPbrMetallicRoughness = {};

        if (babylonPBRMetalRoughMaterial.baseColor) {
            glTFPbrMetallicRoughness.baseColorFactor = [
                babylonPBRMetalRoughMaterial.baseColor.r,
                babylonPBRMetalRoughMaterial.baseColor.g,
                babylonPBRMetalRoughMaterial.baseColor.b,
                babylonPBRMetalRoughMaterial.alpha
            ];
        }

        if (babylonPBRMetalRoughMaterial.metallic != null && babylonPBRMetalRoughMaterial.metallic !== 1) {
            glTFPbrMetallicRoughness.metallicFactor = babylonPBRMetalRoughMaterial.metallic;
        }
        if (babylonPBRMetalRoughMaterial.roughness != null && babylonPBRMetalRoughMaterial.roughness !== 1) {
            glTFPbrMetallicRoughness.roughnessFactor = babylonPBRMetalRoughMaterial.roughness;
        }

        const glTFMaterial: IMaterial = {
            name: babylonPBRMetalRoughMaterial.name
        };
        if (babylonPBRMetalRoughMaterial.doubleSided) {
            glTFMaterial.doubleSided = babylonPBRMetalRoughMaterial.doubleSided;
        }
        _GLTFMaterialExporter._SetAlphaMode(glTFMaterial, babylonPBRMetalRoughMaterial);
        if (hasTextureCoords) {
            if (babylonPBRMetalRoughMaterial.baseTexture != null) {
                promises.push(this._exportTextureAsync(babylonPBRMetalRoughMaterial.baseTexture, mimeType).then((glTFTexture) => {
                    if (glTFTexture) {
                        glTFPbrMetallicRoughness.baseColorTexture = glTFTexture;
                    }
                }));
            }
            if (babylonPBRMetalRoughMaterial.normalTexture) {
                promises.push(this._exportTextureAsync(babylonPBRMetalRoughMaterial.normalTexture, mimeType).then((glTFTexture) => {
                    if (glTFTexture) {
                        glTFMaterial.normalTexture = glTFTexture;
                        if (babylonPBRMetalRoughMaterial.normalTexture.level !== 1) {
                            glTFMaterial.normalTexture.scale = babylonPBRMetalRoughMaterial.normalTexture.level;
                        }
                    }
                }));

            }
            if (babylonPBRMetalRoughMaterial.occlusionTexture) {
                promises.push(this._exportTextureAsync(babylonPBRMetalRoughMaterial.occlusionTexture, mimeType).then((glTFTexture) => {
                    if (glTFTexture) {
                        glTFMaterial.occlusionTexture = glTFTexture;
                        if (babylonPBRMetalRoughMaterial.occlusionStrength != null) {
                            glTFMaterial.occlusionTexture.strength = babylonPBRMetalRoughMaterial.occlusionStrength;
                        }
                    }
                }));

            }
            if (babylonPBRMetalRoughMaterial.emissiveTexture) {
                promises.push(this._exportTextureAsync(babylonPBRMetalRoughMaterial.emissiveTexture, mimeType).then((glTFTexture) => {
                    if (glTFTexture) {
                        glTFMaterial.emissiveTexture = glTFTexture;
                    }
                }));
            }

        }

        if (_GLTFMaterialExporter.FuzzyEquals(babylonPBRMetalRoughMaterial.emissiveColor, Color3.Black(), _GLTFMaterialExporter._Epsilon)) {
            glTFMaterial.emissiveFactor = babylonPBRMetalRoughMaterial.emissiveColor.asArray();
        }

        glTFMaterial.pbrMetallicRoughness = glTFPbrMetallicRoughness;

        materials.push(glTFMaterial);
        materialMap[babylonPBRMetalRoughMaterial.uniqueId] = materials.length - 1;

        return this._finishMaterial(promises, glTFMaterial, babylonPBRMetalRoughMaterial, mimeType);
    }

    /**
     * Converts an image typed array buffer to a base64 image
     * @param buffer typed array buffer
     * @param width width of the image
     * @param height height of the image
     * @param mimeType mimetype of the image
     * @returns base64 image string
     */
    private _createBase64FromCanvasAsync(buffer: Uint8Array | Float32Array, width: number, height: number, mimeType: ImageMimeType): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            let hostingScene: Scene;

            const textureType = Constants.TEXTURETYPE_UNSIGNED_INT;
            const engine = this._exporter._getLocalEngine();

            hostingScene = new Scene(engine);

            // Create a temporary texture with the texture buffer data
            const tempTexture = engine.createRawTexture(buffer, width, height, Constants.TEXTUREFORMAT_RGBA, false, true, Texture.NEAREST_SAMPLINGMODE, null, textureType);
            const postProcess = new PostProcess("pass", "pass", null, null, 1, null, Texture.NEAREST_SAMPLINGMODE, engine, false, undefined, Constants.TEXTURETYPE_UNSIGNED_INT, undefined, null, false);
            postProcess.getEffect().executeWhenCompiled(() => {
                postProcess.onApply = (effect) => {
                    effect._bindTexture("textureSampler", tempTexture);
                };

                // Set the size of the texture
                engine.setSize(width, height);
                hostingScene.postProcessManager.directRender([postProcess], null);
                postProcess.dispose();
                tempTexture.dispose();

                // Read data from WebGL
                const canvas0 = engine.getRenderingCanvas();

                let canvas: Nullable<HTMLCanvasElement> = document.createElement("canvas");

                canvas.width = canvas0?.width ?? 0;
                canvas.height = canvas0?.height ?? 0;

                var destCtx = canvas.getContext('2d');
                destCtx!.drawImage(canvas0!, 0, 0);

                if (canvas) {
                    if (!canvas.toBlob) { // fallback for browsers without "canvas.toBlob"
                        const dataURL = canvas.toDataURL();
                        resolve(dataURL);
                    }
                    else {
                        Tools.ToBlob(canvas, (blob) => {
                            canvas = null;
                            if (blob) {
                                let fileReader = new FileReader();
                                fileReader.onload = (event: any) => {
                                    let base64String = event.target.result as string;
                                    hostingScene.dispose();
                                    resolve(base64String);
                                };
                                fileReader.readAsDataURL(blob);
                            }
                            else {
                                reject("gltfMaterialExporter: Failed to get blob from image canvas!");
                            }
                        }, mimeType);
                    }
                }
                else {
                    reject("Engine is missing a canvas!");
                }
            });
        });
    }

    /**
     * Generates a white texture based on the specified width and height
     * @param width width of the texture in pixels
     * @param height height of the texture in pixels
     * @param scene babylonjs scene
     * @returns white texture
     */
    private _createWhiteTexture(width: number, height: number, scene: Scene): Texture {
        const data = new Uint8Array(width * height * 4);

        for (let i = 0; i < data.length; i = i + 4) {
            data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0xFF;
        }

        const rawTexture = RawTexture.CreateRGBATexture(data, width, height, scene);

        return rawTexture;
    }

    /**
     * Resizes the two source textures to the same dimensions.  If a texture is null, a default white texture is generated.  If both textures are null, returns null
     * @param texture1 first texture to resize
     * @param texture2 second texture to resize
     * @param scene babylonjs scene
     * @returns resized textures or null
     */
    private _resizeTexturesToSameDimensions(texture1: BaseTexture, texture2: BaseTexture, scene: Scene): { "texture1": BaseTexture, "texture2": BaseTexture } {
        let texture1Size = texture1 ? texture1.getSize() : { width: 0, height: 0 };
        let texture2Size = texture2 ? texture2.getSize() : { width: 0, height: 0 };
        let resizedTexture1;
        let resizedTexture2;

        if (texture1Size.width < texture2Size.width) {
            if (texture1 && texture1 instanceof Texture) {
                resizedTexture1 = TextureTools.CreateResizedCopy(texture1, texture2Size.width, texture2Size.height, true);
            }
            else {
                resizedTexture1 = this._createWhiteTexture(texture2Size.width, texture2Size.height, scene);
            }
            resizedTexture2 = texture2;
        }
        else if (texture1Size.width > texture2Size.width) {
            if (texture2 && texture2 instanceof Texture) {
                resizedTexture2 = TextureTools.CreateResizedCopy(texture2, texture1Size.width, texture1Size.height, true);
            }
            else {
                resizedTexture2 = this._createWhiteTexture(texture1Size.width, texture1Size.height, scene);
            }
            resizedTexture1 = texture1;
        }
        else {
            resizedTexture1 = texture1;
            resizedTexture2 = texture2;
        }

        return {
            "texture1": resizedTexture1,
            "texture2": resizedTexture2
        };
    }

    /**
     * Converts an array of pixels to a Float32Array
     * Throws an error if the pixel format is not supported
     * @param pixels - array buffer containing pixel values
     * @returns Float32 of pixels
     */
    private _convertPixelArrayToFloat32(pixels: ArrayBufferView): Float32Array {
        if (pixels instanceof Uint8Array) {
            const length = pixels.length;
            const buffer = new Float32Array(pixels.length);
            for (let i = 0; i < length; ++i) {
                buffer[i] = pixels[i] / 255;
            }
            return buffer;
        }
        else if (pixels instanceof Float32Array) {
            return pixels;
        }
        else {
            throw new Error('Unsupported pixel format!');
        }
    }

    /**
     * Convert Specular Glossiness Textures to Metallic Roughness
     * See link below for info on the material conversions from PBR Metallic/Roughness and Specular/Glossiness
     * @link https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_materials_pbrSpecularGlossiness/examples/convert-between-workflows-bjs/js/babylon.pbrUtilities.js
     * @param diffuseTexture texture used to store diffuse information
     * @param specularGlossinessTexture texture used to store specular and glossiness information
     * @param factors specular glossiness material factors
     * @param mimeType the mime type to use for the texture
     * @returns pbr metallic roughness interface or null
     */
    private _convertSpecularGlossinessTexturesToMetallicRoughnessAsync(diffuseTexture: BaseTexture, specularGlossinessTexture: BaseTexture, factors: _IPBRSpecularGlossiness, mimeType: ImageMimeType): Promise<_IPBRMetallicRoughness> {
        let promises = [];
        if (!(diffuseTexture || specularGlossinessTexture)) {
            return Promise.reject('_ConvertSpecularGlosinessTexturesToMetallicRoughness: diffuse and specular glossiness textures are not defined!');
        }

        const scene: Nullable<Scene> = diffuseTexture ? diffuseTexture.getScene() : specularGlossinessTexture ? specularGlossinessTexture.getScene() : null;
        if (scene) {
            const resizedTextures = this._resizeTexturesToSameDimensions(diffuseTexture, specularGlossinessTexture, scene);

            let diffuseSize = resizedTextures.texture1.getSize();

            let diffuseBuffer: Float32Array;
            let specularGlossinessBuffer: Float32Array;

            const width = diffuseSize.width;
            const height = diffuseSize.height;

            let diffusePixels = resizedTextures.texture1.readPixels();
            let specularPixels = resizedTextures.texture2.readPixels();

            if (diffusePixels) {
                diffuseBuffer = this._convertPixelArrayToFloat32(diffusePixels);
            }
            else {
                return Promise.reject("Failed to retrieve pixels from diffuse texture!");
            }
            if (specularPixels) {
                specularGlossinessBuffer = this._convertPixelArrayToFloat32(specularPixels);
            }
            else {
                return Promise.reject("Failed to retrieve pixels from specular glossiness texture!");
            }

            const byteLength = specularGlossinessBuffer.byteLength;

            const metallicRoughnessBuffer = new Uint8Array(byteLength);
            const baseColorBuffer = new Uint8Array(byteLength);

            const strideSize = 4;
            const maxBaseColor = Color3.Black();
            let maxMetallic = 0;
            let maxRoughness = 0;

            for (let h = 0; h < height; ++h) {
                for (let w = 0; w < width; ++w) {
                    const offset = (width * h + w) * strideSize;

                    const diffuseColor = new Color3(diffuseBuffer[offset], diffuseBuffer[offset + 1], diffuseBuffer[offset + 2]).toLinearSpace().multiply(factors.diffuseColor);
                    const specularColor = new Color3(specularGlossinessBuffer[offset], specularGlossinessBuffer[offset + 1], specularGlossinessBuffer[offset + 2]).toLinearSpace().multiply(factors.specularColor);
                    const glossiness = (specularGlossinessBuffer[offset + 3]) * factors.glossiness;

                    const specularGlossiness: _IPBRSpecularGlossiness = {
                        diffuseColor: diffuseColor,
                        specularColor: specularColor,
                        glossiness: glossiness
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
            const metallicRoughnessFactors: _IPBRMetallicRoughness = {
                baseColor: maxBaseColor,
                metallic: maxMetallic,
                roughness: maxRoughness
            };

            let writeOutMetallicRoughnessTexture = false;
            let writeOutBaseColorTexture = false;

            for (let h = 0; h < height; ++h) {
                for (let w = 0; w < width; ++w) {
                    const destinationOffset = (width * h + w) * strideSize;

                    baseColorBuffer[destinationOffset] /= metallicRoughnessFactors.baseColor.r > _GLTFMaterialExporter._Epsilon ? metallicRoughnessFactors.baseColor.r : 1;
                    baseColorBuffer[destinationOffset + 1] /= metallicRoughnessFactors.baseColor.g > _GLTFMaterialExporter._Epsilon ? metallicRoughnessFactors.baseColor.g : 1;
                    baseColorBuffer[destinationOffset + 2] /= metallicRoughnessFactors.baseColor.b > _GLTFMaterialExporter._Epsilon ? metallicRoughnessFactors.baseColor.b : 1;

                    const linearBaseColorPixel = Color3.FromInts(baseColorBuffer[destinationOffset], baseColorBuffer[destinationOffset + 1], baseColorBuffer[destinationOffset + 2]);
                    const sRGBBaseColorPixel = linearBaseColorPixel.toGammaSpace();
                    baseColorBuffer[destinationOffset] = sRGBBaseColorPixel.r * 255;
                    baseColorBuffer[destinationOffset + 1] = sRGBBaseColorPixel.g * 255;
                    baseColorBuffer[destinationOffset + 2] = sRGBBaseColorPixel.b * 255;

                    if (!_GLTFMaterialExporter.FuzzyEquals(sRGBBaseColorPixel, Color3.White(), _GLTFMaterialExporter._Epsilon)) {
                        writeOutBaseColorTexture = true;
                    }

                    metallicRoughnessBuffer[destinationOffset + 1] /= metallicRoughnessFactors.roughness! > _GLTFMaterialExporter._Epsilon ? metallicRoughnessFactors.roughness! : 1;
                    metallicRoughnessBuffer[destinationOffset + 2] /= metallicRoughnessFactors.metallic! > _GLTFMaterialExporter._Epsilon ? metallicRoughnessFactors.metallic! : 1;

                    const metallicRoughnessPixel = Color3.FromInts(255, metallicRoughnessBuffer[destinationOffset + 1], metallicRoughnessBuffer[destinationOffset + 2]);

                    if (!_GLTFMaterialExporter.FuzzyEquals(metallicRoughnessPixel, Color3.White(), _GLTFMaterialExporter._Epsilon)) {
                        writeOutMetallicRoughnessTexture = true;
                    }
                }
            }

            if (writeOutMetallicRoughnessTexture) {
                let promise = this._createBase64FromCanvasAsync(metallicRoughnessBuffer, width, height, mimeType).then((metallicRoughnessBase64) => {
                    metallicRoughnessFactors.metallicRoughnessTextureBase64 = metallicRoughnessBase64;
                });
                promises.push(promise);
            }
            if (writeOutBaseColorTexture) {
                let promise = this._createBase64FromCanvasAsync(baseColorBuffer, width, height, mimeType).then((baseColorBase64) => {
                    metallicRoughnessFactors.baseColorTextureBase64 = baseColorBase64;
                });
                promises.push(promise);
            }

            return Promise.all(promises).then(() => {
                return metallicRoughnessFactors;
            });
        }
        else {
            return Promise.reject("_ConvertSpecularGlossinessTexturesToMetallicRoughness: Scene from textures is missing!");
        }
    }

    /**
     * Converts specular glossiness material properties to metallic roughness
     * @param specularGlossiness interface with specular glossiness material properties
     * @returns interface with metallic roughness material properties
     */
    private _convertSpecularGlossinessToMetallicRoughness(specularGlossiness: _IPBRSpecularGlossiness): _IPBRMetallicRoughness {
        const diffusePerceivedBrightness = this._getPerceivedBrightness(specularGlossiness.diffuseColor);
        const specularPerceivedBrightness = this._getPerceivedBrightness(specularGlossiness.specularColor);
        const oneMinusSpecularStrength = 1 - this._getMaxComponent(specularGlossiness.specularColor);
        const metallic = _GLTFMaterialExporter._SolveMetallic(diffusePerceivedBrightness, specularPerceivedBrightness, oneMinusSpecularStrength);
        const baseColorFromDiffuse = specularGlossiness.diffuseColor.scale(oneMinusSpecularStrength / (1.0 - _GLTFMaterialExporter._DielectricSpecular.r) / Math.max(1 - metallic, _GLTFMaterialExporter._Epsilon));
        const baseColorFromSpecular = specularGlossiness.specularColor.subtract(_GLTFMaterialExporter._DielectricSpecular.scale(1 - metallic)).scale(1 / Math.max(metallic, _GLTFMaterialExporter._Epsilon));
        let baseColor = Color3.Lerp(baseColorFromDiffuse, baseColorFromSpecular, metallic * metallic);
        baseColor = baseColor.clampToRef(0, 1, baseColor);

        const metallicRoughness: _IPBRMetallicRoughness = {
            baseColor: baseColor,
            metallic: metallic,
            roughness: 1 - specularGlossiness.glossiness
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
     * @param images array of glTF image interfaces
     * @param textures array of glTF texture interfaces
     * @param glTFPbrMetallicRoughness glTF PBR Metallic Roughness interface
     * @param imageData map of image file name to data
     * @param hasTextureCoords specifies if texture coordinates are present on the submesh to determine if textures should be applied
     * @returns glTF PBR Metallic Roughness factors
     */
    private _convertMetalRoughFactorsToMetallicRoughnessAsync(babylonPBRMaterial: PBRMaterial, mimeType: ImageMimeType, glTFPbrMetallicRoughness: IMaterialPbrMetallicRoughness, hasTextureCoords: boolean): Promise<_IPBRMetallicRoughness> {
        const promises = [];
        const metallicRoughness: _IPBRMetallicRoughness = {
            baseColor: babylonPBRMaterial.albedoColor,
            metallic: babylonPBRMaterial.metallic,
            roughness: babylonPBRMaterial.roughness
        };

        if (hasTextureCoords) {
            if (babylonPBRMaterial.albedoTexture) {
                promises.push(this._exportTextureAsync(babylonPBRMaterial.albedoTexture, mimeType).then((glTFTexture) => {
                    if (glTFTexture) {
                        glTFPbrMetallicRoughness.baseColorTexture = glTFTexture;
                    }
                }));
            }
            if (babylonPBRMaterial.metallicTexture) {
                promises.push(this._exportTextureAsync(babylonPBRMaterial.metallicTexture, mimeType).then((glTFTexture) => {
                    if (glTFTexture) {
                        glTFPbrMetallicRoughness.metallicRoughnessTexture = glTFTexture;
                    }
                }));
            }
        }
        return Promise.all(promises).then(() => {
            return metallicRoughness;
        });
    }

    private _getGLTFTextureSampler(texture: BaseTexture): ISampler {
        const sampler = this._getGLTFTextureWrapModesSampler(texture);

        let samplingMode = texture instanceof Texture ? texture.samplingMode : null;
        if (samplingMode != null) {
            switch (samplingMode) {
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

    private _getGLTFTextureWrapModesSampler(texture: BaseTexture): ISampler {
        let wrapS = this._getGLTFTextureWrapMode(texture instanceof Texture ? texture.wrapU : Texture.WRAP_ADDRESSMODE);
        let wrapT = this._getGLTFTextureWrapMode(texture instanceof Texture ? texture.wrapV : Texture.WRAP_ADDRESSMODE);

        if (wrapS === TextureWrapMode.REPEAT && wrapT === TextureWrapMode.REPEAT) { // default wrapping mode in glTF, so omitting
            return {};
        }

        return { wrapS: wrapS, wrapT: wrapT };
    }

    /**
     * Convert a PBRMaterial (Specular/Glossiness) to Metallic Roughness factors
     * @param babylonPBRMaterial BJS PBR Metallic Roughness Material
     * @param mimeType mime type to use for the textures
     * @param images array of glTF image interfaces
     * @param textures array of glTF texture interfaces
     * @param glTFPbrMetallicRoughness glTF PBR Metallic Roughness interface
     * @param imageData map of image file name to data
     * @param hasTextureCoords specifies if texture coordinates are present on the submesh to determine if textures should be applied
     * @returns glTF PBR Metallic Roughness factors
     */
    private _convertSpecGlossFactorsToMetallicRoughnessAsync(babylonPBRMaterial: PBRMaterial, mimeType: ImageMimeType, glTFPbrMetallicRoughness: IMaterialPbrMetallicRoughness, hasTextureCoords: boolean): Promise<_IPBRMetallicRoughness> {
        return Promise.resolve().then(() => {
            const samplers = this._exporter._samplers;
            const textures = this._exporter._textures;
            const specGloss: _IPBRSpecularGlossiness = {
                diffuseColor: babylonPBRMaterial.albedoColor || Color3.White(),
                specularColor: babylonPBRMaterial.reflectivityColor || Color3.White(),
                glossiness: babylonPBRMaterial.microSurface || 1,
            };
            let samplerIndex: Nullable<number> = null;
            const sampler = this._getGLTFTextureSampler(babylonPBRMaterial.albedoTexture);
            if (sampler.magFilter != null && sampler.minFilter != null && sampler.wrapS != null && sampler.wrapT != null) {
                samplers.push(sampler);
                samplerIndex = samplers.length - 1;
            }
            if (babylonPBRMaterial.reflectivityTexture && !babylonPBRMaterial.useMicroSurfaceFromReflectivityMapAlpha) {
                return Promise.reject("_ConvertPBRMaterial: Glossiness values not included in the reflectivity texture are currently not supported");
            }
            if ((babylonPBRMaterial.albedoTexture || babylonPBRMaterial.reflectivityTexture) && hasTextureCoords) {
                return this._convertSpecularGlossinessTexturesToMetallicRoughnessAsync(babylonPBRMaterial.albedoTexture, babylonPBRMaterial.reflectivityTexture, specGloss, mimeType).then((metallicRoughnessFactors) => {
                    if (metallicRoughnessFactors.baseColorTextureBase64) {
                        const glTFBaseColorTexture = this._getTextureInfoFromBase64(metallicRoughnessFactors.baseColorTextureBase64, "bjsBaseColorTexture_" + (textures.length) + ".png", mimeType, babylonPBRMaterial.albedoTexture ? babylonPBRMaterial.albedoTexture.coordinatesIndex : null, samplerIndex);
                        if (glTFBaseColorTexture) {
                            glTFPbrMetallicRoughness.baseColorTexture = glTFBaseColorTexture;
                        }
                    }
                    if (metallicRoughnessFactors.metallicRoughnessTextureBase64) {
                        const glTFMRColorTexture = this._getTextureInfoFromBase64(metallicRoughnessFactors.metallicRoughnessTextureBase64, "bjsMetallicRoughnessTexture_" + (textures.length) + ".png", mimeType, babylonPBRMaterial.reflectivityTexture ? babylonPBRMaterial.reflectivityTexture.coordinatesIndex : null, samplerIndex);
                        if (glTFMRColorTexture) {
                            glTFPbrMetallicRoughness.metallicRoughnessTexture = glTFMRColorTexture;
                        }
                    }

                    return metallicRoughnessFactors;
                });
            }
            else {
                return this._convertSpecularGlossinessToMetallicRoughness(specGloss);
            }
        });
    }

    /**
     * Converts a Babylon PBR Metallic Roughness Material to a glTF Material
     * @param babylonPBRMaterial BJS PBR Metallic Roughness Material
     * @param mimeType mime type to use for the textures
     * @param images array of glTF image interfaces
     * @param textures array of glTF texture interfaces
     * @param materials array of glTF material interfaces
     * @param imageData map of image file name to data
     * @param hasTextureCoords specifies if texture coordinates are present on the submesh to determine if textures should be applied
     */
    public _convertPBRMaterialAsync(babylonPBRMaterial: PBRMaterial, mimeType: ImageMimeType, hasTextureCoords: boolean): Promise<IMaterial> {
        const glTFPbrMetallicRoughness: IMaterialPbrMetallicRoughness = {};
        const glTFMaterial: IMaterial = {
            name: babylonPBRMaterial.name
        };
        const useMetallicRoughness = babylonPBRMaterial.isMetallicWorkflow();

        if (useMetallicRoughness) {
            if (babylonPBRMaterial.albedoColor) {
                glTFPbrMetallicRoughness.baseColorFactor = [
                    babylonPBRMaterial.albedoColor.r,
                    babylonPBRMaterial.albedoColor.g,
                    babylonPBRMaterial.albedoColor.b,
                    babylonPBRMaterial.alpha
                ];
            }
            return this._convertMetalRoughFactorsToMetallicRoughnessAsync(babylonPBRMaterial, mimeType, glTFPbrMetallicRoughness, hasTextureCoords).then((metallicRoughness) => {
                return this.setMetallicRoughnessPbrMaterial(metallicRoughness, babylonPBRMaterial, glTFMaterial, glTFPbrMetallicRoughness, mimeType, hasTextureCoords);
            });
        }
        else {
            return this._convertSpecGlossFactorsToMetallicRoughnessAsync(babylonPBRMaterial, mimeType, glTFPbrMetallicRoughness, hasTextureCoords).then((metallicRoughness) => {
                return this.setMetallicRoughnessPbrMaterial(metallicRoughness, babylonPBRMaterial, glTFMaterial, glTFPbrMetallicRoughness, mimeType, hasTextureCoords);
            });
        }
    }

    private setMetallicRoughnessPbrMaterial(metallicRoughness: Nullable<_IPBRMetallicRoughness>, babylonPBRMaterial: PBRMaterial, glTFMaterial: IMaterial, glTFPbrMetallicRoughness: IMaterialPbrMetallicRoughness, mimeType: ImageMimeType, hasTextureCoords: boolean): Promise<IMaterial> {
        const materialMap = this._exporter._materialMap;
        const materials = this._exporter._materials;
        let promises = [];
        if (metallicRoughness) {
            _GLTFMaterialExporter._SetAlphaMode(glTFMaterial, babylonPBRMaterial);
            if (!(_GLTFMaterialExporter.FuzzyEquals(metallicRoughness.baseColor, Color3.White(), _GLTFMaterialExporter._Epsilon) && babylonPBRMaterial.alpha >= _GLTFMaterialExporter._Epsilon)) {
                glTFPbrMetallicRoughness.baseColorFactor = [
                    metallicRoughness.baseColor.r,
                    metallicRoughness.baseColor.g,
                    metallicRoughness.baseColor.b,
                    babylonPBRMaterial.alpha
                ];
            }

            if (metallicRoughness.metallic != null && metallicRoughness.metallic !== 1) {
                glTFPbrMetallicRoughness.metallicFactor = metallicRoughness.metallic;
            }
            if (metallicRoughness.roughness != null && metallicRoughness.roughness !== 1) {
                glTFPbrMetallicRoughness.roughnessFactor = metallicRoughness.roughness;
            }

            if (babylonPBRMaterial.backFaceCulling != null && !babylonPBRMaterial.backFaceCulling) {
                if (!babylonPBRMaterial.twoSidedLighting) {
                    Tools.Warn(babylonPBRMaterial.name + ": Back-face culling enabled and two-sided lighting disabled is not supported in glTF.");
                }
                glTFMaterial.doubleSided = true;
            }

            if (hasTextureCoords) {
                if (babylonPBRMaterial.bumpTexture) {
                    let promise = this._exportTextureAsync(babylonPBRMaterial.bumpTexture, mimeType).then((glTFTexture) => {
                        if (glTFTexture) {
                            glTFMaterial.normalTexture = glTFTexture;
                            if (babylonPBRMaterial.bumpTexture.level !== 1) {
                                glTFMaterial.normalTexture.scale = babylonPBRMaterial.bumpTexture.level;
                            }
                        }
                    }
                    );
                    promises.push(promise);

                }
                if (babylonPBRMaterial.ambientTexture) {
                    let promise = this._exportTextureAsync(babylonPBRMaterial.ambientTexture, mimeType).then((glTFTexture) => {
                        if (glTFTexture) {
                            let occlusionTexture: IMaterialOcclusionTextureInfo = {
                                index: glTFTexture.index,
                                texCoord: glTFTexture.texCoord
                            };

                            glTFMaterial.occlusionTexture = occlusionTexture;

                            if (babylonPBRMaterial.ambientTextureStrength) {
                                occlusionTexture.strength = babylonPBRMaterial.ambientTextureStrength;
                            }
                        }
                    });
                    promises.push(promise);

                }
                if (babylonPBRMaterial.emissiveTexture) {
                    let promise = this._exportTextureAsync(babylonPBRMaterial.emissiveTexture, mimeType).then((glTFTexture) => {
                        if (glTFTexture) {
                            glTFMaterial.emissiveTexture = glTFTexture;
                        }
                    });
                    promises.push(promise);
                }
            }
            if (!_GLTFMaterialExporter.FuzzyEquals(babylonPBRMaterial.emissiveColor, Color3.Black(), _GLTFMaterialExporter._Epsilon)) {
                glTFMaterial.emissiveFactor = babylonPBRMaterial.emissiveColor.asArray();
            }

            glTFMaterial.pbrMetallicRoughness = glTFPbrMetallicRoughness;
            materials.push(glTFMaterial);
            materialMap[babylonPBRMaterial.uniqueId] = materials.length - 1;
        }

        return this._finishMaterial(promises, glTFMaterial, babylonPBRMaterial, mimeType);
    }

    private getPixelsFromTexture(babylonTexture: BaseTexture): Nullable<Uint8Array | Float32Array> {
        const pixels = babylonTexture.textureType === Constants.TEXTURETYPE_UNSIGNED_INT ? babylonTexture.readPixels() as Uint8Array : babylonTexture.readPixels() as Float32Array;
        return pixels;
    }

    /**
     * Extracts a texture from a Babylon texture into file data and glTF data
     * @param babylonTexture Babylon texture to extract
     * @param mimeType Mime Type of the babylonTexture
     * @return glTF texture info, or null if the texture format is not supported
     */
    public _exportTextureAsync(babylonTexture: BaseTexture, mimeType: ImageMimeType): Promise<Nullable<ITextureInfo>> {
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

    public _exportTextureInfoAsync(babylonTexture: BaseTexture, mimeType: ImageMimeType): Promise<Nullable<ITextureInfo>> {
        return Promise.resolve().then(() => {
            const textureUid = babylonTexture.uid;
            if (textureUid in this._textureMap) {
                return this._textureMap[textureUid];
            }
            else {
                const pixels = this.getPixelsFromTexture(babylonTexture);
                if (!pixels) {
                    return null;
                }

                const samplers = this._exporter._samplers;
                const sampler = this._getGLTFTextureSampler(babylonTexture);
                let samplerIndex: Nullable<number> = null;

                //  if a pre-existing sampler with identical parameters exists, then reuse the previous sampler
                let foundSamplerIndex: Nullable<number> = null;
                for (let i = 0; i < samplers.length; ++i) {
                    let s = samplers[i];
                    if (s.minFilter === sampler.minFilter && s.magFilter === sampler.magFilter &&
                        s.wrapS === sampler.wrapS && s.wrapT === sampler.wrapT) {
                        foundSamplerIndex = i;
                        break;
                    }
                }

                if (foundSamplerIndex == null) {
                    samplers.push(sampler);
                    samplerIndex = samplers.length - 1;
                }
                else {
                    samplerIndex = foundSamplerIndex;
                }
                const size = babylonTexture.getSize();

                // Preserve texture mime type if defined
                if ((babylonTexture as Texture).mimeType) {
                    switch ((babylonTexture as Texture).mimeType) {
                        case "image/jpeg":
                            mimeType = ImageMimeType.JPEG;
                            break;
                        case "image/png":
                            mimeType = ImageMimeType.PNG;
                            break;
                    }

                }

                return this._createBase64FromCanvasAsync(pixels, size.width, size.height, mimeType).then((base64Data) => {
                    const textureInfo = this._getTextureInfoFromBase64(base64Data, babylonTexture.name.replace(/\.\/|\/|\.\\|\\/g, "_"), mimeType, babylonTexture.coordinatesIndex, samplerIndex);
                    if (textureInfo) {
                        this._textureMap[textureUid] = textureInfo;
                        this._exporter._extensionsPostExportTextures("linkTextureInfo", textureInfo, babylonTexture);
                    }

                    return textureInfo;
                });
            }
        });
    }

    /**
     * Builds a texture from base64 string
     * @param base64Texture base64 texture string
     * @param baseTextureName Name to use for the texture
     * @param mimeType image mime type for the texture
     * @param images array of images
     * @param textures array of textures
     * @param imageData map of image data
     * @returns glTF texture info, or null if the texture format is not supported
     */
    private _getTextureInfoFromBase64(base64Texture: string, baseTextureName: string, mimeType: ImageMimeType, texCoordIndex: Nullable<number>, samplerIndex: Nullable<number>): Nullable<ITextureInfo> {
        const textures = this._exporter._textures;
        const images = this._exporter._images;
        const imageData = this._exporter._imageData;
        let textureInfo: Nullable<ITextureInfo> = null;

        const glTFTexture: ITexture = {
            source: images.length,
            name: baseTextureName
        };
        if (samplerIndex != null) {
            glTFTexture.sampler = samplerIndex;
        }

        const binStr = atob(base64Texture.split(',')[1]);
        let arrBuff = new ArrayBuffer(binStr.length);
        const arr = new Uint8Array(arrBuff);
        for (let i = 0, length = binStr.length; i < length; ++i) {
            arr[i] = binStr.charCodeAt(i);
        }
        const imageValues = { data: arr, mimeType: mimeType };

        let extension = mimeType === ImageMimeType.JPEG ? '.jpeg' : '.png';
        let textureName = baseTextureName + extension;
        let originalTextureName = textureName;
        if (textureName in imageData) {
            textureName = `${baseTextureName}_${Tools.RandomId()}${extension}`;
        }

        imageData[textureName] = imageValues;
        if (mimeType === ImageMimeType.JPEG || mimeType === ImageMimeType.PNG) {
            const glTFImage: IImage = {
                name: baseTextureName,
                uri: textureName
            };
            let foundIndex: Nullable<number> = null;
            for (let i = 0; i < images.length; ++i) {
                if (images[i].uri === originalTextureName) {
                    foundIndex = i;
                    break;
                }
            }
            if (foundIndex == null) {
                images.push(glTFImage);
                glTFTexture.source = images.length - 1;
            }
            else {
                glTFTexture.source = foundIndex;

            }
            textures.push(glTFTexture);
            textureInfo = {
                index: textures.length - 1
            };
            if (texCoordIndex != null) {
                textureInfo.texCoord = texCoordIndex;
            }
        }
        else {
            Tools.Error(`Unsupported texture mime type ${mimeType}`);
        }

        return textureInfo;
    }
}