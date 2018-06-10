/// <reference path="../../../../dist/preview release/gltf2Interface/babylon.glTF2Interface.d.ts"/>

module BABYLON.GLTF2 {
    /** 
     * Interface for storing specular glossiness factors
     * @hidden
     */
    interface _IPBRSpecularGlossiness {
        /** 
         * Represents the linear diffuse factors of the material
        */
        diffuseColor: BABYLON.Color3;
        /** 
         * Represents the linear specular factors of the material
        */
        specularColor: BABYLON.Color3;
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
        baseColor: BABYLON.Color3;
        /** 
         * Represents the metallness of the material
        */
        metallic: number;
        /** 
         * Represents the roughness of the material
        */
        roughness: number;
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
    export class _GLTFMaterial {
        /**
         * Represents the dielectric specular values for R, G and B
         */
        private static readonly _dielectricSpecular: Color3 = new Color3(0.04, 0.04, 0.04);

        /**
         * Allows the maximum specular power to be defined for material calculations
         */
        private static _maxSpecularPower = 1024;

        /**
         * Numeric tolerance value
         */
        private static _epsilon = 1e-6;

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
        public static _ConvertMaterialsToGLTFAsync(babylonMaterials: Material[], mimeType: ImageMimeType, images: IImage[], textures: ITexture[], samplers: ISampler[], materials: IMaterial[], materialMap: { [materialID: number]: number }, imageData: { [fileName: string]: { data: Uint8Array, mimeType: ImageMimeType } }, hasTextureCoords: boolean) {
            let promises: Promise<void>[] = [];
            for (let babylonMaterial of babylonMaterials) {
                if (babylonMaterial instanceof StandardMaterial) {
                    promises.push(_GLTFMaterial._ConvertStandardMaterialAsync(babylonMaterial, mimeType, images, textures, samplers, materials, materialMap, imageData, hasTextureCoords));
                }
                else if (babylonMaterial instanceof PBRMetallicRoughnessMaterial) {
                    promises.push(_GLTFMaterial._ConvertPBRMetallicRoughnessMaterialAsync(babylonMaterial, mimeType, images, textures, samplers, materials, materialMap, imageData, hasTextureCoords));
                }
                else if (babylonMaterial instanceof PBRMaterial) {
                    promises.push(_GLTFMaterial._ConvertPBRMaterialAsync(babylonMaterial, mimeType, images, textures, samplers, materials, materialMap, imageData, hasTextureCoords));
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
        public static _StripTexturesFromMaterial(originalMaterial: IMaterial): IMaterial {
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
        public static _HasTexturesPresent(material: IMaterial): boolean {
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
        public static _ConvertToGLTFPBRMetallicRoughness(babylonStandardMaterial: StandardMaterial): IMaterialPbrMetallicRoughness {
            const P0 = new BABYLON.Vector2(0, 1);
            const P1 = new BABYLON.Vector2(0, 0.1);
            const P2 = new BABYLON.Vector2(0, 0.1);
            const P3 = new BABYLON.Vector2(1300, 0.1);

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
            let specularPower = Scalar.Clamp(babylonStandardMaterial.specularPower, 0, this._maxSpecularPower);

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
            if (specular < _GLTFMaterial._dielectricSpecular.r) {
                _GLTFMaterial._dielectricSpecular
                return 0;
            }

            const a = _GLTFMaterial._dielectricSpecular.r;
            const b = diffuse * oneMinusSpecularStrength / (1.0 - _GLTFMaterial._dielectricSpecular.r) + specular - 2.0 * _GLTFMaterial._dielectricSpecular.r;
            const c = _GLTFMaterial._dielectricSpecular.r - specular;
            const D = b * b - 4.0 * a * c;
            return BABYLON.Scalar.Clamp((-b + Math.sqrt(D)) / (2.0 * a), 0, 1);
        }

        /**
         * Gets the glTF alpha mode from the Babylon Material
         * @param babylonMaterial Babylon Material
         * @returns The Babylon alpha mode value
         */
        public static _GetAlphaMode(babylonMaterial: Material): MaterialAlphaMode {
            if (babylonMaterial.needAlphaBlending()) {
                return MaterialAlphaMode.BLEND;
            }
            else if (babylonMaterial.needAlphaTesting) {
                return MaterialAlphaMode.MASK;
            }
            else {
                return MaterialAlphaMode.OPAQUE;
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
        public static _ConvertStandardMaterialAsync(babylonStandardMaterial: StandardMaterial, mimeType: ImageMimeType, images: IImage[], textures: ITexture[], samplers: ISampler[], materials: IMaterial[], materialMap: { [materialID: number]: number }, imageData: { [fileName: string]: { data: Uint8Array, mimeType: ImageMimeType } }, hasTextureCoords: boolean): Promise<void> {
            const alphaMode = this._GetAlphaMode(babylonStandardMaterial);
            let useAlpha = alphaMode !== MaterialAlphaMode.OPAQUE ? true : false;
            let promises = [];
            const glTFPbrMetallicRoughness = _GLTFMaterial._ConvertToGLTFPBRMetallicRoughness(babylonStandardMaterial);

            const glTFMaterial: IMaterial = { name: babylonStandardMaterial.name };
            if (babylonStandardMaterial.backFaceCulling != null && !babylonStandardMaterial.backFaceCulling) {
                if (!babylonStandardMaterial.twoSidedLighting) {
                    Tools.Warn(babylonStandardMaterial.name + ": Back-face culling enabled and two-sided lighting disabled is not supported in glTF.");
                }
                glTFMaterial.doubleSided = true;
            }
            if (hasTextureCoords) {
                if (babylonStandardMaterial.diffuseTexture) {
                    let promise = _GLTFMaterial._ExportTextureAsync(babylonStandardMaterial.diffuseTexture, mimeType, images, textures, samplers, imageData, useAlpha).then(glTFTexture => {
                        if (glTFTexture) {
                            glTFPbrMetallicRoughness.baseColorTexture = glTFTexture;
                        }
                    });
                    promises.push(promise);
                }
                if (babylonStandardMaterial.bumpTexture) {
                    let promise = _GLTFMaterial._ExportTextureAsync(babylonStandardMaterial.bumpTexture, mimeType, images, textures, samplers, imageData, useAlpha).then(glTFTexture => {
                        if (glTFTexture) {
                            glTFMaterial.normalTexture = glTFTexture;
                            if (babylonStandardMaterial.bumpTexture != null && babylonStandardMaterial.bumpTexture.level !== 1) {
                                glTFMaterial.normalTexture.scale = babylonStandardMaterial.bumpTexture.level;
                            }
                        }
                    });
                    promises.push(promise);
                }
                if (babylonStandardMaterial.emissiveTexture) {
                    let promise = _GLTFMaterial._ExportTextureAsync(babylonStandardMaterial.emissiveTexture, mimeType, images, textures, samplers, imageData, useAlpha).then(glTFEmissiveTexture => {
                        if (glTFEmissiveTexture) {
                            glTFMaterial.emissiveTexture = glTFEmissiveTexture;
                        }
                        glTFMaterial.emissiveFactor = [1.0, 1.0, 1.0];
                    });
                    promises.push(promise);
                }
                if (babylonStandardMaterial.ambientTexture) {
                    let promise = _GLTFMaterial._ExportTextureAsync(babylonStandardMaterial.ambientTexture, mimeType, images, textures, samplers, imageData, useAlpha).then(glTFTexture => {
                        if (glTFTexture) {
                            const occlusionTexture: IMaterialOcclusionTextureInfo = {
                                index: glTFTexture.index
                            };
                            glTFMaterial.occlusionTexture = occlusionTexture;
                            occlusionTexture.strength = 1.0;
                        }
                    });
                    promises.push(promise);
                }
            }

            if (babylonStandardMaterial.alpha < 1.0 || babylonStandardMaterial.opacityTexture) {
                if (babylonStandardMaterial.alphaMode === Engine.ALPHA_COMBINE) {
                    glTFMaterial.alphaMode = GLTF2.MaterialAlphaMode.BLEND;
                }
                else {
                    Tools.Warn(babylonStandardMaterial.name + ": glTF 2.0 does not support alpha mode: " + babylonStandardMaterial.alphaMode.toString());
                }
            }
            if (babylonStandardMaterial.emissiveColor && !this.FuzzyEquals(babylonStandardMaterial.emissiveColor, Color3.Black(), this._epsilon)) {
                glTFMaterial.emissiveFactor = babylonStandardMaterial.emissiveColor.asArray();
            }

            glTFMaterial.pbrMetallicRoughness = glTFPbrMetallicRoughness;
            if (alphaMode !== MaterialAlphaMode.OPAQUE) {
                switch (alphaMode) {
                    case MaterialAlphaMode.BLEND: {
                        glTFMaterial.alphaMode = GLTF2.MaterialAlphaMode.BLEND;
                        break;
                    }
                    case MaterialAlphaMode.MASK: {
                        glTFMaterial.alphaMode = GLTF2.MaterialAlphaMode.MASK;
                        glTFMaterial.alphaCutoff = babylonStandardMaterial.alphaCutOff;
                        break;
                    }
                    default: {
                        Tools.Warn(`Unsupported alpha mode ${alphaMode}`);
                    }
                }
            }

            materials.push(glTFMaterial);
            materialMap[babylonStandardMaterial.uniqueId] = materials.length - 1;

            return Promise.all(promises).then(() => { /* do nothing */ });
        }

        /**
         * 
         * @param texture Texture with alpha to overwrite to one
         * @param useAlpha Specifies if alpha should be preserved or not
         * @returns Promise with texture
         */
        public static _SetAlphaToOneAsync(texture: BaseTexture, useAlpha: boolean): Promise<BaseTexture> {
            return new Promise((resolve, reject) => {
                if (useAlpha) {
                    resolve(texture);
                }
                else {
                    if (texture instanceof Texture) {
                        const scene = texture.getScene();
                        if (scene) {
                            const proceduralTexture = new ProceduralTexture('texture', texture.getSize(), 'setAlphaToOne', scene);

                            proceduralTexture.setTexture('textureSampler', texture);
                            proceduralTexture.onGenerated = () => {
                                resolve(proceduralTexture);
                            };
                        }
                        else {
                            reject(`Scene not available for texture ${texture.name}`);
                        }
                    }
                    else {
                        Tools.Warn(`Removing alpha for ${texture.textureType} not supported`);
                        resolve(texture);
                    }
                }
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
        public static _ConvertPBRMetallicRoughnessMaterialAsync(babylonPBRMetalRoughMaterial: PBRMetallicRoughnessMaterial, mimeType: ImageMimeType, images: IImage[], textures: ITexture[], samplers: ISampler[], materials: IMaterial[], materialMap: { [materialID: number]: number }, imageData: { [fileName: string]: { data: Uint8Array, mimeType: ImageMimeType } }, hasTextureCoords: boolean): Promise<void> {
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
            let alphaMode: Nullable<MaterialAlphaMode> = null;
            let useAlpha = false;
            if (babylonPBRMetalRoughMaterial.transparencyMode != null) {
                alphaMode = _GLTFMaterial._GetAlphaMode(babylonPBRMetalRoughMaterial);
                if (alphaMode) {
                    if (alphaMode !== MaterialAlphaMode.OPAQUE) { //glTF defaults to opaque
                        glTFMaterial.alphaMode = alphaMode;
                        if (alphaMode === MaterialAlphaMode.MASK) {
                            glTFMaterial.alphaCutoff = babylonPBRMetalRoughMaterial.alphaCutOff;
                        }
                    }
                }
            }
            if (alphaMode !== MaterialAlphaMode.OPAQUE) {
                useAlpha = true;
            }

            if (hasTextureCoords) {
                if (babylonPBRMetalRoughMaterial.baseTexture != null) {
                    let promise = _GLTFMaterial._ExportTextureAsync(babylonPBRMetalRoughMaterial.baseTexture, mimeType, images, textures, samplers, imageData, useAlpha).then(glTFTexture => {
                        if (glTFTexture) {
                            glTFPbrMetallicRoughness.baseColorTexture = glTFTexture;
                        }
                    });
                    promises.push(promise);
                }
                if (babylonPBRMetalRoughMaterial.normalTexture) {
                    let promise = _GLTFMaterial._ExportTextureAsync(babylonPBRMetalRoughMaterial.normalTexture, mimeType, images, textures, samplers, imageData, useAlpha).then(glTFTexture => {
                        if (glTFTexture) {
                            glTFMaterial.normalTexture = glTFTexture;
                            if (babylonPBRMetalRoughMaterial.normalTexture.level !== 1) {
                                glTFMaterial.normalTexture.scale = babylonPBRMetalRoughMaterial.normalTexture.level;
                            }
                        }
                    });
                    promises.push(promise);
                }
                if (babylonPBRMetalRoughMaterial.occlusionTexture) {
                    let promise = _GLTFMaterial._ExportTextureAsync(babylonPBRMetalRoughMaterial.occlusionTexture, mimeType, images, textures, samplers, imageData, useAlpha).then(glTFTexture => {
                        if (glTFTexture) {
                            glTFMaterial.occlusionTexture = glTFTexture;
                            if (babylonPBRMetalRoughMaterial.occlusionStrength != null) {
                                glTFMaterial.occlusionTexture.strength = babylonPBRMetalRoughMaterial.occlusionStrength;
                            }
                        }
                    });
                    promises.push(promise);
                }
                if (babylonPBRMetalRoughMaterial.emissiveTexture) {
                    let promise = _GLTFMaterial._ExportTextureAsync(babylonPBRMetalRoughMaterial.emissiveTexture, mimeType, images, textures, samplers, imageData, useAlpha).then(glTFTexture => {
                        if (glTFTexture) {
                            glTFMaterial.emissiveTexture = glTFTexture;
                        }
                    });
                    promises.push(promise);
                }
            }

            if (this.FuzzyEquals(babylonPBRMetalRoughMaterial.emissiveColor, Color3.Black(), this._epsilon)) {
                glTFMaterial.emissiveFactor = babylonPBRMetalRoughMaterial.emissiveColor.asArray();
            }

            glTFMaterial.pbrMetallicRoughness = glTFPbrMetallicRoughness;

            materials.push(glTFMaterial);
            materialMap[babylonPBRMetalRoughMaterial.uniqueId] = materials.length - 1;

            return Promise.all(promises).then(() => { /* do nothing */ });
        }

        /**
         * Converts an image typed array buffer to a base64 image
         * @param buffer typed array buffer
         * @param width width of the image
         * @param height height of the image
         * @param mimeType mimetype of the image
         * @returns base64 image string
         */
        private static _CreateBase64FromCanvas(buffer: Uint8ClampedArray | Float32Array, width: number, height: number, mimeType: ImageMimeType): string {
            const imageCanvas = document.createElement('canvas');
            imageCanvas.width = width;
            imageCanvas.height = height;
            imageCanvas.id = "WriteCanvas";

            const ctx = imageCanvas.getContext('2d') as CanvasRenderingContext2D;

            const imgData = ctx.createImageData(width, height);

            imgData.data.set(buffer);
            ctx.putImageData(imgData, 0, 0);

            return imageCanvas.toDataURL(mimeType);
        }

        /**
         * Generates a white texture based on the specified width and height
         * @param width width of the texture in pixels
         * @param height height of the texture in pixels
         * @param scene babylonjs scene
         * @returns white texture
         */
        private static _CreateWhiteTexture(width: number, height: number, scene: Scene): Texture {
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
        private static _ResizeTexturesToSameDimensions(texture1: BaseTexture, texture2: BaseTexture, scene: Scene): { "texture1": BaseTexture, "texture2": BaseTexture } {
            let texture1Size = texture1 ? texture1.getSize() : { width: 0, height: 0 };
            let texture2Size = texture2 ? texture2.getSize() : { width: 0, height: 0 };
            let resizedTexture1;
            let resizedTexture2;

            if (texture1Size.width < texture2Size.width) {
                if (texture1 && texture1 instanceof Texture) {
                    resizedTexture1 = TextureTools.CreateResizedCopy(texture1, texture2Size.width, texture2Size.height, true);
                }
                else {
                    resizedTexture1 = this._CreateWhiteTexture(texture2Size.width, texture2Size.height, scene);
                }
                resizedTexture2 = texture2;
            }
            else if (texture1Size.width > texture2Size.width) {
                if (texture2 && texture2 instanceof Texture) {
                    resizedTexture2 = TextureTools.CreateResizedCopy(texture2, texture1Size.width, texture1Size.height, true);
                }
                else {
                    resizedTexture2 = this._CreateWhiteTexture(texture1Size.width, texture1Size.height, scene);
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
        private static _ConvertSpecularGlossinessTexturesToMetallicRoughness(diffuseTexture: BaseTexture, specularGlossinessTexture: BaseTexture, factors: _IPBRSpecularGlossiness, mimeType: ImageMimeType): Nullable<_IPBRMetallicRoughness> {
            if (!(diffuseTexture || specularGlossinessTexture)) {
                Tools.Warn('_ConvertSpecularGlosinessTexturesToMetallicRoughness: diffuse and specular glossiness textures are not defined!');
                return null;
            }

            const scene: Nullable<Scene> = diffuseTexture ? diffuseTexture.getScene() : specularGlossinessTexture ? specularGlossinessTexture.getScene() : null;
            if (scene) {
                const resizedTextures = this._ResizeTexturesToSameDimensions(diffuseTexture, specularGlossinessTexture, scene);

                let diffuseSize = resizedTextures.texture1.getSize();

                let diffuseBuffer: Uint8Array;
                let specularGlossinessBuffer: Uint8Array;

                const width = diffuseSize.width;
                const height = diffuseSize.height;

                let pixels = (resizedTextures.texture1.readPixels());
                if (pixels instanceof Uint8Array) {
                    diffuseBuffer = (resizedTextures.texture1.readPixels()) as Uint8Array;

                    pixels = resizedTextures.texture2.readPixels();

                    if (pixels instanceof Uint8Array) {
                        specularGlossinessBuffer = (resizedTextures.texture2.readPixels()) as Uint8Array;

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

                                const diffuseColor = Color3.FromInts(diffuseBuffer[offset], diffuseBuffer[offset + 1], diffuseBuffer[offset + 2]).toLinearSpace().multiply(factors.diffuseColor);
                                const specularColor = Color3.FromInts(specularGlossinessBuffer[offset], specularGlossinessBuffer[offset + 1], specularGlossinessBuffer[offset + 2]).toLinearSpace().multiply(factors.specularColor);
                                const glossiness = (specularGlossinessBuffer[offset + 3] / 255) * factors.glossiness;

                                const specularGlossiness: _IPBRSpecularGlossiness = {
                                    diffuseColor: diffuseColor,
                                    specularColor: specularColor,
                                    glossiness: glossiness
                                };

                                const metallicRoughness = this._ConvertSpecularGlossinessToMetallicRoughness(specularGlossiness);
                                maxBaseColor.r = Math.max(maxBaseColor.r, metallicRoughness.baseColor.r);
                                maxBaseColor.g = Math.max(maxBaseColor.g, metallicRoughness.baseColor.g);
                                maxBaseColor.b = Math.max(maxBaseColor.b, metallicRoughness.baseColor.b);
                                maxMetallic = Math.max(maxMetallic, metallicRoughness.metallic);
                                maxRoughness = Math.max(maxRoughness, metallicRoughness.roughness);

                                baseColorBuffer[offset] = metallicRoughness.baseColor.r * 255;
                                baseColorBuffer[offset + 1] = metallicRoughness.baseColor.g * 255;
                                baseColorBuffer[offset + 2] = metallicRoughness.baseColor.b * 255;
                                baseColorBuffer[offset + 3] = resizedTextures.texture1.hasAlpha ? diffuseBuffer[offset + 3] : 255;

                                metallicRoughnessBuffer[offset] = 0;
                                metallicRoughnessBuffer[offset + 1] = metallicRoughness.roughness * 255;
                                metallicRoughnessBuffer[offset + 2] = metallicRoughness.metallic * 255;
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

                                baseColorBuffer[destinationOffset] /= metallicRoughnessFactors.baseColor.r > this._epsilon ? metallicRoughnessFactors.baseColor.r : 1;
                                baseColorBuffer[destinationOffset + 1] /= metallicRoughnessFactors.baseColor.g > this._epsilon ? metallicRoughnessFactors.baseColor.g : 1;
                                baseColorBuffer[destinationOffset + 2] /= metallicRoughnessFactors.baseColor.b > this._epsilon ? metallicRoughnessFactors.baseColor.b : 1;

                                const linearBaseColorPixel = Color3.FromInts(baseColorBuffer[destinationOffset], baseColorBuffer[destinationOffset + 1], baseColorBuffer[destinationOffset + 2]);
                                const sRGBBaseColorPixel = linearBaseColorPixel.toGammaSpace();
                                baseColorBuffer[destinationOffset] = sRGBBaseColorPixel.r * 255;
                                baseColorBuffer[destinationOffset + 1] = sRGBBaseColorPixel.g * 255;
                                baseColorBuffer[destinationOffset + 2] = sRGBBaseColorPixel.b * 255;

                                if (!this.FuzzyEquals(sRGBBaseColorPixel, Color3.White(), this._epsilon)) {
                                    writeOutBaseColorTexture = true;
                                }

                                metallicRoughnessBuffer[destinationOffset + 1] /= metallicRoughnessFactors.roughness > this._epsilon ? metallicRoughnessFactors.roughness : 1;
                                metallicRoughnessBuffer[destinationOffset + 2] /= metallicRoughnessFactors.metallic > this._epsilon ? metallicRoughnessFactors.metallic : 1;

                                const metallicRoughnessPixel = Color3.FromInts(255, metallicRoughnessBuffer[destinationOffset + 1], metallicRoughnessBuffer[destinationOffset + 2]);

                                if (!this.FuzzyEquals(metallicRoughnessPixel, Color3.White(), this._epsilon)) {
                                    writeOutMetallicRoughnessTexture = true;
                                }
                            }
                        }

                        if (writeOutMetallicRoughnessTexture) {
                            const metallicRoughnessBase64 = this._CreateBase64FromCanvas(metallicRoughnessBuffer, width, height, mimeType);
                            metallicRoughnessFactors.metallicRoughnessTextureBase64 = metallicRoughnessBase64;
                        }
                        if (writeOutBaseColorTexture) {
                            const baseColorBase64 = this._CreateBase64FromCanvas(baseColorBuffer, width, height, mimeType);
                            metallicRoughnessFactors.baseColorTextureBase64 = baseColorBase64;

                        }

                        return metallicRoughnessFactors;
                    }
                    else {
                        Tools.Error("_ConvertSpecularGlossinessTexturesToMetallicRoughness: Pixel array buffer type not supported for texture: " + resizedTextures.texture2.name);
                    }
                }
                else {
                    Tools.Error("_ConvertSpecularGlossinessTexturesToMetallicRoughness: Pixel array buffer type not supported for texture: " + resizedTextures.texture1.name);
                }
            }
            else {
                Tools.Error("_ConvertSpecularGlossinessTexturesToMetallicRoughness: Scene from textures is missing!");
            }

            return null;
        }

        /**
         * Converts specular glossiness material properties to metallic roughness
         * @param specularGlossiness interface with specular glossiness material properties
         * @returns interface with metallic roughness material properties
         */
        private static _ConvertSpecularGlossinessToMetallicRoughness(specularGlossiness: _IPBRSpecularGlossiness): _IPBRMetallicRoughness {
            const diffusePerceivedBrightness = _GLTFMaterial._GetPerceivedBrightness(specularGlossiness.diffuseColor);
            const specularPerceivedBrightness = _GLTFMaterial._GetPerceivedBrightness(specularGlossiness.specularColor);
            const oneMinusSpecularStrength = 1 - _GLTFMaterial._GetMaxComponent(specularGlossiness.specularColor);
            const metallic = _GLTFMaterial._SolveMetallic(diffusePerceivedBrightness, specularPerceivedBrightness, oneMinusSpecularStrength);
            const baseColorFromDiffuse = specularGlossiness.diffuseColor.scale(oneMinusSpecularStrength / (1.0 - this._dielectricSpecular.r) / Math.max(1 - metallic, this._epsilon));
            const baseColorFromSpecular = specularGlossiness.specularColor.subtract(this._dielectricSpecular.scale(1 - metallic)).scale(1 / Math.max(metallic, this._epsilon));
            let baseColor = Color3.Lerp(baseColorFromDiffuse, baseColorFromSpecular, metallic * metallic);
            baseColor = baseColor.clampToRef(0, 1, baseColor);

            const metallicRoughness: _IPBRMetallicRoughness = {
                baseColor: baseColor,
                metallic: metallic,
                roughness: 1 - specularGlossiness.glossiness
            }

            return metallicRoughness;
        }

        /**
         * Calculates the surface reflectance, independent of lighting conditions
         * @param color Color source to calculate brightness from
         * @returns number representing the perceived brightness, or zero if color is undefined
         */
        private static _GetPerceivedBrightness(color: Color3): number {
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
        private static _GetMaxComponent(color: Color3): number {
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
        private static _ConvertMetalRoughFactorsToMetallicRoughnessAsync(babylonPBRMaterial: PBRMaterial, mimeType: ImageMimeType, images: IImage[], textures: ITexture[], samplers: ISampler[], glTFPbrMetallicRoughness: IMaterialPbrMetallicRoughness, imageData: { [fileName: string]: { data: Uint8Array, mimeType: ImageMimeType } }, hasTextureCoords: boolean): Promise<_IPBRMetallicRoughness> {
            const alphaMode = this._GetAlphaMode(babylonPBRMaterial);
            const useAlpha = alphaMode !== MaterialAlphaMode.OPAQUE ? true : false;
            const promises = [];
            const metallicRoughness: _IPBRMetallicRoughness = {
                baseColor: babylonPBRMaterial.albedoColor,
                metallic: babylonPBRMaterial.metallic,
                roughness: babylonPBRMaterial.roughness
            };

            if (hasTextureCoords) {
                if (babylonPBRMaterial.albedoTexture) {
                    let promise = _GLTFMaterial._ExportTextureAsync(babylonPBRMaterial.albedoTexture, mimeType, images, textures, samplers, imageData, useAlpha).then(glTFTexture => {
                        if (glTFTexture) {
                            glTFPbrMetallicRoughness.baseColorTexture = glTFTexture;
                        }
                    });
                    promises.push(promise);

                }
                if (babylonPBRMaterial.metallicTexture) {
                    let promise = _GLTFMaterial._ExportTextureAsync(babylonPBRMaterial.metallicTexture, mimeType, images, textures, samplers, imageData, useAlpha).then(glTFTexture => {
                        if (glTFTexture) {
                            glTFPbrMetallicRoughness.metallicRoughnessTexture = glTFTexture;
                        }
                    });
                    promises.push(promise);
                }
            }
            return Promise.all(promises).then(() => {
                return metallicRoughness;
            });
        }

        private static _GetGLTFTextureSampler(texture: BaseTexture): ISampler {
            const sampler = _GLTFMaterial._GetGLTFTextureWrapModesSampler(texture);

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

        private static _GetGLTFTextureWrapMode(wrapMode: number): TextureWrapMode {
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

        private static _GetGLTFTextureWrapModesSampler(texture: BaseTexture): ISampler {
            let wrapS = _GLTFMaterial._GetGLTFTextureWrapMode(texture instanceof Texture ? texture.wrapU : Texture.WRAP_ADDRESSMODE);
            let wrapT = _GLTFMaterial._GetGLTFTextureWrapMode(texture instanceof Texture ? texture.wrapV : Texture.WRAP_ADDRESSMODE);

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
        private static _ConvertSpecGlossFactorsToMetallicRoughness(babylonPBRMaterial: PBRMaterial, mimeType: ImageMimeType, images: IImage[], textures: ITexture[], samplers: ISampler[], glTFPbrMetallicRoughness: IMaterialPbrMetallicRoughness, imageData: { [fileName: string]: { data: Uint8Array, mimeType: ImageMimeType } }, hasTextureCoords: boolean): Nullable<_IPBRMetallicRoughness> {
            const specGloss: _IPBRSpecularGlossiness = {
                diffuseColor: babylonPBRMaterial.albedoColor || Color3.White(),
                specularColor: babylonPBRMaterial.reflectivityColor || Color3.White(),
                glossiness: babylonPBRMaterial.microSurface || 1,
            };
            let samplerIndex: Nullable<number> = null;
            const sampler = this._GetGLTFTextureSampler(babylonPBRMaterial.albedoTexture);
            if (sampler.magFilter != null && sampler.minFilter != null && sampler.wrapS != null && sampler.wrapT != null) {
                samplers.push(sampler);
                samplerIndex = samplers.length - 1;
            }
            if (babylonPBRMaterial.reflectivityTexture && !babylonPBRMaterial.useMicroSurfaceFromReflectivityMapAlpha) {
                Tools.Error("_ConvertPBRMaterial: Glossiness values not included in the reflectivity texture are currently not supported");
                return null;
            }

            const metallicRoughnessFactors = this._ConvertSpecularGlossinessTexturesToMetallicRoughness(babylonPBRMaterial.albedoTexture, babylonPBRMaterial.reflectivityTexture, specGloss, mimeType);
            if (metallicRoughnessFactors) {
                if (hasTextureCoords) {
                    if (metallicRoughnessFactors.baseColorTextureBase64) {
                        const glTFBaseColorTexture = _GLTFMaterial._GetTextureInfoFromBase64(metallicRoughnessFactors.baseColorTextureBase64, "bjsBaseColorTexture", mimeType, images, textures, babylonPBRMaterial.albedoTexture ? babylonPBRMaterial.albedoTexture.coordinatesIndex : null, samplerIndex, imageData);
                        if (glTFBaseColorTexture != null) {
                            glTFPbrMetallicRoughness.baseColorTexture = glTFBaseColorTexture;
                        }
                    }
                    if (metallicRoughnessFactors.metallicRoughnessTextureBase64) {
                        const glTFMRColorTexture = _GLTFMaterial._GetTextureInfoFromBase64(metallicRoughnessFactors.metallicRoughnessTextureBase64, "bjsMetallicRoughnessTexture", mimeType, images, textures, babylonPBRMaterial.reflectivityTexture ? babylonPBRMaterial.reflectivityTexture.coordinatesIndex : null, samplerIndex, imageData);
                        if (glTFMRColorTexture != null) {
                            glTFPbrMetallicRoughness.metallicRoughnessTexture = glTFMRColorTexture;
                        }
                    }

                    return metallicRoughnessFactors;
                }
            }
            return this._ConvertSpecularGlossinessToMetallicRoughness(specGloss);

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
        public static _ConvertPBRMaterialAsync(babylonPBRMaterial: PBRMaterial, mimeType: ImageMimeType, images: IImage[], textures: ITexture[], samplers: ISampler[], materials: IMaterial[], materialMap: { [materialID: number]: number }, imageData: { [fileName: string]: { data: Uint8Array, mimeType: ImageMimeType } }, hasTextureCoords: boolean): Promise<void> {
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
                    ]
                }
                return this._ConvertMetalRoughFactorsToMetallicRoughnessAsync(babylonPBRMaterial, mimeType, images, textures, samplers, glTFPbrMetallicRoughness, imageData, hasTextureCoords).then(metallicRoughness => {
                    return _GLTFMaterial.SetMetallicRoughnessPbrMaterial(metallicRoughness, babylonPBRMaterial, glTFMaterial, glTFPbrMetallicRoughness, mimeType, images, textures, samplers, materials, materialMap, imageData, hasTextureCoords);
                });
            }
            else {
                const metallicRoughness = this._ConvertSpecGlossFactorsToMetallicRoughness(babylonPBRMaterial, mimeType, images, textures, samplers, glTFPbrMetallicRoughness, imageData, hasTextureCoords);
                return _GLTFMaterial.SetMetallicRoughnessPbrMaterial(metallicRoughness, babylonPBRMaterial, glTFMaterial, glTFPbrMetallicRoughness, mimeType, images, textures, samplers, materials, materialMap, imageData, hasTextureCoords);
            }
        }

        private static SetMetallicRoughnessPbrMaterial(metallicRoughness: Nullable<_IPBRMetallicRoughness>, babylonPBRMaterial: PBRMaterial, glTFMaterial: IMaterial, glTFPbrMetallicRoughness: IMaterialPbrMetallicRoughness, mimeType: ImageMimeType, images: IImage[], textures: ITexture[], samplers: ISampler[], materials: IMaterial[], materialMap: { [materialID: number]: number }, imageData: { [fileName: string]: { data: Uint8Array, mimeType: ImageMimeType } }, hasTextureCoords: boolean): Promise<void> {
            let promises = [];
            if (metallicRoughness) {
                let alphaMode: Nullable<MaterialAlphaMode> = null;
                let useAlpha = false;
                if (babylonPBRMaterial.transparencyMode != null) {
                    alphaMode = _GLTFMaterial._GetAlphaMode(babylonPBRMaterial);
                    if (alphaMode) {
                        if (alphaMode !== MaterialAlphaMode.OPAQUE) { //glTF defaults to opaque
                            useAlpha = true;
                            glTFMaterial.alphaMode = alphaMode;
                            if (alphaMode === MaterialAlphaMode.MASK) {
                                glTFMaterial.alphaCutoff = babylonPBRMaterial.alphaCutOff;
                            }
                        }
                    }
                }
                if (!(this.FuzzyEquals(metallicRoughness.baseColor, Color3.White(), this._epsilon) && babylonPBRMaterial.alpha >= this._epsilon)) {
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
                        let promise = _GLTFMaterial._ExportTextureAsync(babylonPBRMaterial.bumpTexture, mimeType, images, textures, samplers, imageData, useAlpha).then(glTFTexture => {
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
                        let promise = _GLTFMaterial._ExportTextureAsync(babylonPBRMaterial.ambientTexture, mimeType, images, textures, samplers, imageData, useAlpha).then(glTFTexture => {
                            if (glTFTexture) {
                                let occlusionTexture: IMaterialOcclusionTextureInfo = {
                                    index: glTFTexture.index
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
                        let promise = _GLTFMaterial._ExportTextureAsync(babylonPBRMaterial.emissiveTexture, mimeType, images, textures, samplers, imageData, useAlpha).then(glTFTexture => {
                            if (glTFTexture) {
                                glTFMaterial.emissiveTexture = glTFTexture;
                            }
                        });
                        promises.push(promise);
                    }
                }
                if (!this.FuzzyEquals(babylonPBRMaterial.emissiveColor, Color3.Black(), this._epsilon)) {
                    glTFMaterial.emissiveFactor = babylonPBRMaterial.emissiveColor.asArray();
                }

                glTFMaterial.pbrMetallicRoughness = glTFPbrMetallicRoughness;
                materials.push(glTFMaterial);
                materialMap[babylonPBRMaterial.uniqueId] = materials.length - 1;
            }
            return Promise.all(promises).then(result => { /* do nothing */ });
        }

        private static GetPixelsFromTexture(babylonTexture: BaseTexture): Uint8Array | Float32Array {
            const pixels = babylonTexture.textureType === Engine.TEXTURETYPE_UNSIGNED_INT ? babylonTexture.readPixels() as Uint8Array : babylonTexture.readPixels() as Float32Array;
            return pixels;
        }


        /**
         * Extracts a texture from a Babylon texture into file data and glTF data
         * @param babylonTexture Babylon texture to extract
         * @param mimeType Mime Type of the babylonTexture
         * @param images Array of glTF images
         * @param textures Array of glTF textures
         * @param imageData map of image file name and data
         * @return glTF texture info, or null if the texture format is not supported
         */
        private static _ExportTextureAsync(babylonTexture: BaseTexture, mimeType: ImageMimeType, images: IImage[], textures: ITexture[], samplers: ISampler[], imageData: { [fileName: string]: { data: Uint8Array, mimeType: ImageMimeType } }, useAlpha: boolean): Promise<Nullable<ITextureInfo>> {
            const sampler = _GLTFMaterial._GetGLTFTextureSampler(babylonTexture);
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
            return this._SetAlphaToOneAsync(babylonTexture, useAlpha).then((texture) => {
                const pixels = _GLTFMaterial.GetPixelsFromTexture(texture);
                const size = babylonTexture.getSize();
                const base64Data = this._CreateBase64FromCanvas(pixels, size.width, size.height, mimeType);
                const textureInfo = this._GetTextureInfoFromBase64(base64Data, babylonTexture.name, mimeType, images, textures, babylonTexture.coordinatesIndex, samplerIndex, imageData);
                return textureInfo;
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
        private static _GetTextureInfoFromBase64(base64Texture: string, baseTextureName: string, mimeType: ImageMimeType, images: IImage[], textures: ITexture[], texCoordIndex: Nullable<number>, samplerIndex: Nullable<number>, imageData: { [fileName: string]: { data: Uint8Array, mimeType: ImageMimeType } }): Nullable<ITextureInfo> {
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
            if (textureName in imageData) {
                textureName = `${baseTextureName}_${Tools.RandomId()}${extension}`;
            }

            imageData[textureName] = imageValues;
            if (mimeType === ImageMimeType.JPEG || mimeType === ImageMimeType.PNG) {
                const glTFImage: IImage = {
                    name: baseTextureName,
                    uri: textureName
                }
                let foundIndex: Nullable<number> = null;
                for (let i = 0; i < images.length; ++i) {
                    if (images[i].uri === textureName) {
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
                }
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
}