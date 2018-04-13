/// <reference path="../../../../dist/babylon.glTF2Interface.d.ts"/>

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
         * @ignore
         * 
         * Gets the materials from a Babylon scene and converts them to glTF materials
         * @param scene babylonjs scene
         * @param mimeType texture mime type
         * @param images array of images
         * @param textures array of textures
         * @param materials array of materials
         * @param imageData mapping of texture names to base64 textures
         * @param hasTextureCoords specifies if texture coordinates are present on the material
         */
        public static _ConvertMaterialsToGLTF(babylonMaterials: Material[], mimeType: ImageMimeType, images: IImage[], textures: ITexture[], materials: IMaterial[], imageData: { [fileName: string]: { data: Uint8Array, mimeType: ImageMimeType } }, hasTextureCoords: boolean) {
            for (let i = 0; i < babylonMaterials.length; ++i) {
                const babylonMaterial = babylonMaterials[i];
                if (babylonMaterial instanceof StandardMaterial) {
                    _GLTFMaterial._ConvertStandardMaterial(babylonMaterial, mimeType, images, textures, materials, imageData, hasTextureCoords);
                }
                else if (babylonMaterial instanceof PBRMetallicRoughnessMaterial) {
                    _GLTFMaterial._ConvertPBRMetallicRoughnessMaterial(babylonMaterial, mimeType, images, textures, materials, imageData, hasTextureCoords);
                }
                else if (babylonMaterial instanceof PBRMaterial) {
                    _GLTFMaterial._ConvertPBRMaterial(babylonMaterial, mimeType, images, textures, materials, imageData, hasTextureCoords);
                }
                else {
                    throw new Error("Unsupported material type: " + babylonMaterial.name);
                }
            }
        }

        /**
         * @ignore
         * 
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
         * @ignore
         * 
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
         * @ignore
         * 
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
         * @ignore
         * 
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
         * @ignore
         * 
         * Gets the glTF alpha mode from the Babylon Material
         * @param babylonMaterial Babylon Material
         * @returns The Babylon alpha mode value
         */
        public static _GetAlphaMode(babylonMaterial: Material): MaterialAlphaMode {
            if (babylonMaterial instanceof StandardMaterial) {
                const babylonStandardMaterial = babylonMaterial as StandardMaterial;
                if ((babylonStandardMaterial.alpha != 1.0) ||
                    (babylonStandardMaterial.diffuseTexture != null && babylonStandardMaterial.diffuseTexture.hasAlpha) ||
                    (babylonStandardMaterial.opacityTexture != null)) {
                    return MaterialAlphaMode.BLEND;
                }
                else {
                    return MaterialAlphaMode.OPAQUE;
                }
            }
            else if (babylonMaterial instanceof PBRMetallicRoughnessMaterial) {
                const babylonPBRMetallicRoughness = babylonMaterial as PBRMetallicRoughnessMaterial;

                switch (babylonPBRMetallicRoughness.transparencyMode) {
                    case PBRMaterial.PBRMATERIAL_OPAQUE: {
                        return MaterialAlphaMode.OPAQUE;
                    }
                    case PBRMaterial.PBRMATERIAL_ALPHABLEND: {
                        return MaterialAlphaMode.BLEND;
                    }
                    case PBRMaterial.PBRMATERIAL_ALPHATEST: {
                        return MaterialAlphaMode.MASK;
                    }
                    case PBRMaterial.PBRMATERIAL_ALPHATESTANDBLEND: {
                        Tools.Warn(babylonMaterial.name + ": GLTF Exporter | Alpha test and blend mode not supported in glTF.  Alpha blend used instead.");
                        return MaterialAlphaMode.BLEND;
                    }
                    default: {
                        throw new Error("Unsupported alpha mode " + babylonPBRMetallicRoughness.transparencyMode);
                    }
                }
            }
            else if (babylonMaterial instanceof PBRMaterial) {
                const babylonPBRMaterial = babylonMaterial as PBRMaterial;

                switch (babylonPBRMaterial.transparencyMode) {
                    case PBRMaterial.PBRMATERIAL_OPAQUE: {
                        return MaterialAlphaMode.OPAQUE;
                    }
                    case PBRMaterial.PBRMATERIAL_ALPHABLEND: {
                        return MaterialAlphaMode.BLEND;
                    }
                    case PBRMaterial.PBRMATERIAL_ALPHATEST: {
                        return MaterialAlphaMode.MASK;
                    }
                    case PBRMaterial.PBRMATERIAL_ALPHATESTANDBLEND: {
                        Tools.Warn(babylonMaterial.name + ": GLTF Exporter | Alpha test and blend mode not supported in glTF.  Alpha blend used instead.");
                        return MaterialAlphaMode.BLEND;
                    }
                    default: {
                        throw new Error("Unsupported alpha mode " + babylonPBRMaterial.transparencyMode);
                    }
                }
            }
            else {
                throw new Error("Unsupported Babylon material type");
            }
        }

        /**
         * @ignore
         * 
         * Converts a Babylon Standard Material to a glTF Material
         * @param babylonStandardMaterial BJS Standard Material
         * @param mimeType mime type to use for the textures
         * @param images array of glTF image interfaces
         * @param textures array of glTF texture interfaces
         * @param materials array of glTF material interfaces
         * @param imageData map of image file name to data
         * @param hasTextureCoords specifies if texture coordinates are present on the submesh to determine if textures should be applied
         */
        public static _ConvertStandardMaterial(babylonStandardMaterial: StandardMaterial, mimeType: ImageMimeType, images: IImage[], textures: ITexture[], materials: IMaterial[], imageData: { [fileName: string]: { data: Uint8Array, mimeType: ImageMimeType } }, hasTextureCoords: boolean) {
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
                    const glTFTexture = _GLTFMaterial._ExportTexture(babylonStandardMaterial.diffuseTexture, mimeType, images, textures, imageData);
                    if (glTFTexture != null) {
                        glTFPbrMetallicRoughness.baseColorTexture = glTFTexture;
                    }
                }
                if (babylonStandardMaterial.bumpTexture) {
                    const glTFTexture = _GLTFMaterial._ExportTexture(babylonStandardMaterial.bumpTexture, mimeType, images, textures, imageData)
                    if (glTFTexture) {
                        glTFMaterial.normalTexture = glTFTexture;
                    }
                }
                if (babylonStandardMaterial.emissiveTexture) {
                    const glTFEmissiveTexture = _GLTFMaterial._ExportTexture(babylonStandardMaterial.emissiveTexture, mimeType, images, textures, imageData)
                    if (glTFEmissiveTexture) {
                        glTFMaterial.emissiveTexture = glTFEmissiveTexture;
                    }
                    glTFMaterial.emissiveFactor = [1.0, 1.0, 1.0];
                }
                if (babylonStandardMaterial.ambientTexture) {
                    const glTFTexture = _GLTFMaterial._ExportTexture(babylonStandardMaterial.ambientTexture, mimeType, images, textures, imageData);
                    if (glTFTexture) {
                        const occlusionTexture: IMaterialOcclusionTextureInfo = {
                            index: glTFTexture.index
                        };
                        glTFMaterial.occlusionTexture = occlusionTexture;
                        occlusionTexture.strength = 1.0;
                    }
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

            materials.push(glTFMaterial);
        }

        /**
         * @ignore
         * 
         * Converts a Babylon PBR Metallic Roughness Material to a glTF Material
         * @param babylonPBRMetalRoughMaterial BJS PBR Metallic Roughness Material
         * @param mimeType mime type to use for the textures
         * @param images array of glTF image interfaces
         * @param textures array of glTF texture interfaces
         * @param materials array of glTF material interfaces
         * @param imageData map of image file name to data
         * @param hasTextureCoords specifies if texture coordinates are present on the submesh to determine if textures should be applied
         */
        public static _ConvertPBRMetallicRoughnessMaterial(babylonPBRMetalRoughMaterial: PBRMetallicRoughnessMaterial, mimeType: ImageMimeType, images: IImage[], textures: ITexture[], materials: IMaterial[], imageData: { [fileName: string]: { data: Uint8Array, mimeType: ImageMimeType } }, hasTextureCoords: boolean) {
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

            if (hasTextureCoords) {
                if (babylonPBRMetalRoughMaterial.baseTexture != null) {
                    const glTFTexture = _GLTFMaterial._ExportTexture(babylonPBRMetalRoughMaterial.baseTexture, mimeType, images, textures, imageData);
                    if (glTFTexture != null) {
                        glTFPbrMetallicRoughness.baseColorTexture = glTFTexture;
                    }
                }
                if (babylonPBRMetalRoughMaterial.normalTexture) {
                    const glTFTexture = _GLTFMaterial._ExportTexture(babylonPBRMetalRoughMaterial.normalTexture, mimeType, images, textures, imageData);
                    if (glTFTexture) {
                        glTFMaterial.normalTexture = glTFTexture;
                    }
                }
                if (babylonPBRMetalRoughMaterial.occlusionTexture) {
                    const glTFTexture = _GLTFMaterial._ExportTexture(babylonPBRMetalRoughMaterial.occlusionTexture, mimeType, images, textures, imageData);
                    if (glTFTexture) {
                        glTFMaterial.occlusionTexture = glTFTexture;
                        if (babylonPBRMetalRoughMaterial.occlusionStrength != null) {
                            glTFMaterial.occlusionTexture.strength = babylonPBRMetalRoughMaterial.occlusionStrength;
                        }
                    }
                }
                if (babylonPBRMetalRoughMaterial.emissiveTexture) {
                    const glTFTexture = _GLTFMaterial._ExportTexture(babylonPBRMetalRoughMaterial.emissiveTexture, mimeType, images, textures, imageData);
                    if (glTFTexture != null) {
                        glTFMaterial.emissiveTexture = glTFTexture;
                    }
                }
            }

            if (this.FuzzyEquals(babylonPBRMetalRoughMaterial.emissiveColor, Color3.Black(), this._epsilon)) {
                glTFMaterial.emissiveFactor = babylonPBRMetalRoughMaterial.emissiveColor.asArray();
            }
            if (babylonPBRMetalRoughMaterial.transparencyMode != null) {
                const alphaMode = _GLTFMaterial._GetAlphaMode(babylonPBRMetalRoughMaterial);

                if (alphaMode !== MaterialAlphaMode.OPAQUE) { //glTF defaults to opaque
                    glTFMaterial.alphaMode = alphaMode;
                    if (alphaMode === MaterialAlphaMode.BLEND) {
                        glTFMaterial.alphaCutoff = babylonPBRMetalRoughMaterial.alphaCutOff;
                    }
                }
            }

            glTFMaterial.pbrMetallicRoughness = glTFPbrMetallicRoughness;

            materials.push(glTFMaterial);
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
            imageCanvas.id = "WriteCanvas";
            const ctx = imageCanvas.getContext('2d') as CanvasRenderingContext2D;
            imageCanvas.width = width;
            imageCanvas.height = height;

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

            for (let i = 0; i < data.length; ++i) {
                data[i] = 255;
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
                if (texture1) {
                    resizedTexture1 = TextureTools.CreateResizedCopy(texture1 as Texture, texture2Size.width, texture2Size.height, true);
                }
                else {
                    resizedTexture1 = this._CreateWhiteTexture(texture2Size.width, texture2Size.height, scene);
                }
                resizedTexture2 = texture2;
            }
            else if (texture1Size.width > texture2Size.width) {
                if (texture2) {
                    resizedTexture2 = TextureTools.CreateResizedCopy(texture2 as Texture, texture1Size.width, texture1Size.height, true);
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
                return null;
            }

            const scene = diffuseTexture ? diffuseTexture.getScene() : specularGlossinessTexture.getScene();
            if (!scene) {
                throw new Error("_ConvertSpecularGlossinessTexturesToMetallicRoughness: Scene from textures is missing!");
            }

            const resizedTextures = this._ResizeTexturesToSameDimensions(diffuseTexture, specularGlossinessTexture, scene);

            let diffuseSize = resizedTextures.texture1.getSize();

            let diffuseBuffer: Uint8Array;
            let specularGlossinessBuffer: Uint8Array;

            const width = diffuseSize.width;
            const height = diffuseSize.height;

            let pixels = (resizedTextures.texture1.readPixels());
            if (pixels instanceof Uint8Array) {
                diffuseBuffer = (resizedTextures.texture1.readPixels()) as Uint8Array;
            }
            else {
                throw new Error("_ConvertSpecularGlossinessTexturesToMetallicRoughness: Pixel array buffer type not supported for texture: " + resizedTextures.texture1.name);
            }
            pixels = resizedTextures.texture2.readPixels();

            if (pixels instanceof Uint8Array) {
                specularGlossinessBuffer = (resizedTextures.texture2.readPixels()) as Uint8Array;
            }
            else {
                throw new Error("_ConvertSpecularGlossinessTexturesToMetallicRoughness: Pixel array buffer type not supported for texture: " + resizedTextures.texture2.name);
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
        private static _ConvertMetalRoughFactorsToMetallicRoughness(babylonPBRMaterial: PBRMaterial, mimeType: ImageMimeType, images: IImage[], textures: ITexture[], glTFPbrMetallicRoughness: IMaterialPbrMetallicRoughness, imageData: { [fileName: string]: { data: Uint8Array, mimeType: ImageMimeType } }, hasTextureCoords: boolean): _IPBRMetallicRoughness {
            const metallicRoughness = {
                baseColor: babylonPBRMaterial.albedoColor,
                metallic: babylonPBRMaterial.metallic,
                roughness: babylonPBRMaterial.roughness
            };

            if (hasTextureCoords) {
                if (babylonPBRMaterial.albedoTexture) {
                    const glTFTexture = _GLTFMaterial._ExportTexture(babylonPBRMaterial.albedoTexture, mimeType, images, textures, imageData);
                    if (glTFTexture) {
                        glTFPbrMetallicRoughness.baseColorTexture = glTFTexture;
                    }
                }
                if (babylonPBRMaterial.metallicTexture) {
                    const glTFTexture = _GLTFMaterial._ExportTexture(babylonPBRMaterial.metallicTexture, mimeType, images, textures, imageData);
                    if (glTFTexture != null) {
                        glTFPbrMetallicRoughness.metallicRoughnessTexture = glTFTexture;
                    }
                }
            }
            return metallicRoughness;
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
        private static _ConvertSpecGlossFactorsToMetallicRoughness(babylonPBRMaterial: PBRMaterial, mimeType: ImageMimeType, images: IImage[], textures: ITexture[], glTFPbrMetallicRoughness: IMaterialPbrMetallicRoughness, imageData: { [fileName: string]: { data: Uint8Array, mimeType: ImageMimeType } }, hasTextureCoords: boolean): _IPBRMetallicRoughness {
            const specGloss: _IPBRSpecularGlossiness = {
                diffuseColor: babylonPBRMaterial.albedoColor || Color3.White(),
                specularColor: babylonPBRMaterial.reflectivityColor || Color3.White(),
                glossiness: babylonPBRMaterial.microSurface || 1,
            };
            if (babylonPBRMaterial.reflectivityTexture && !babylonPBRMaterial.useMicroSurfaceFromReflectivityMapAlpha) {
                throw new Error("_ConvertPBRMaterial: Glossiness values not included in the reflectivity texture currently not supported");
            }

            let metallicRoughnessFactors = this._ConvertSpecularGlossinessTexturesToMetallicRoughness(babylonPBRMaterial.albedoTexture, babylonPBRMaterial.reflectivityTexture, specGloss, mimeType);

            if (!metallicRoughnessFactors) {
                metallicRoughnessFactors = this._ConvertSpecularGlossinessToMetallicRoughness(specGloss);
            }
            else {
                if (hasTextureCoords) {
                    if (metallicRoughnessFactors.baseColorTextureBase64) {
                        const glTFBaseColorTexture = _GLTFMaterial._GetTextureInfoFromBase64(metallicRoughnessFactors.baseColorTextureBase64, "bjsBaseColorTexture_" + (textures.length) + ".png", mimeType, images, textures, imageData);
                        if (glTFBaseColorTexture != null) {
                            glTFPbrMetallicRoughness.baseColorTexture = glTFBaseColorTexture;
                        }
                    }
                    if (metallicRoughnessFactors.metallicRoughnessTextureBase64) {
                        const glTFMRColorTexture = _GLTFMaterial._GetTextureInfoFromBase64(metallicRoughnessFactors.metallicRoughnessTextureBase64, "bjsMetallicRoughnessTexture_" + (textures.length) + ".png", mimeType, images, textures, imageData);
                        if (glTFMRColorTexture != null) {
                            glTFPbrMetallicRoughness.metallicRoughnessTexture = glTFMRColorTexture;
                        }
                    }
                }
            }
            return metallicRoughnessFactors
        }

        /**
         * @ignore
         * 
         * Converts a Babylon PBR Metallic Roughness Material to a glTF Material
         * @param babylonPBRMaterial BJS PBR Metallic Roughness Material
         * @param mimeType mime type to use for the textures
         * @param images array of glTF image interfaces
         * @param textures array of glTF texture interfaces
         * @param materials array of glTF material interfaces
         * @param imageData map of image file name to data
         * @param hasTextureCoords specifies if texture coordinates are present on the submesh to determine if textures should be applied
         */
        public static _ConvertPBRMaterial(babylonPBRMaterial: PBRMaterial, mimeType: ImageMimeType, images: IImage[], textures: ITexture[], materials: IMaterial[], imageData: { [fileName: string]: { data: Uint8Array, mimeType: ImageMimeType } }, hasTextureCoords: boolean) {
            const glTFPbrMetallicRoughness: IMaterialPbrMetallicRoughness = {};
            let metallicRoughness: Nullable<_IPBRMetallicRoughness>;
            const glTFMaterial: IMaterial = {
                name: babylonPBRMaterial.name
            };
            const useMetallicRoughness = babylonPBRMaterial.isMetallicWorkflow();

            if (useMetallicRoughness) {
                metallicRoughness = this._ConvertMetalRoughFactorsToMetallicRoughness(babylonPBRMaterial, mimeType, images, textures, glTFPbrMetallicRoughness, imageData, hasTextureCoords);
            }
            else {
                metallicRoughness = this._ConvertSpecGlossFactorsToMetallicRoughness(babylonPBRMaterial, mimeType, images, textures, glTFPbrMetallicRoughness, imageData, hasTextureCoords);
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
                    const glTFTexture = _GLTFMaterial._ExportTexture(babylonPBRMaterial.bumpTexture, mimeType, images, textures, imageData);
                    if (glTFTexture) {
                        glTFMaterial.normalTexture = glTFTexture;
                    }
                }
                if (babylonPBRMaterial.ambientTexture) {
                    const glTFTexture = _GLTFMaterial._ExportTexture(babylonPBRMaterial.ambientTexture, mimeType, images, textures, imageData);
                    if (glTFTexture) {
                        let occlusionTexture: IMaterialOcclusionTextureInfo = {
                            index: glTFTexture.index
                        };

                        glTFMaterial.occlusionTexture = occlusionTexture;

                        if (babylonPBRMaterial.ambientTextureStrength) {
                            occlusionTexture.strength = babylonPBRMaterial.ambientTextureStrength;
                        }
                    }
                }
                if (babylonPBRMaterial.emissiveTexture) {
                    const glTFTexture = _GLTFMaterial._ExportTexture(babylonPBRMaterial.emissiveTexture, mimeType, images, textures, imageData);
                    if (glTFTexture != null) {
                        glTFMaterial.emissiveTexture = glTFTexture;
                    }
                }       
            }
            if (!this.FuzzyEquals(babylonPBRMaterial.emissiveColor, Color3.Black(), this._epsilon)) {
                glTFMaterial.emissiveFactor = babylonPBRMaterial.emissiveColor.asArray();
            }
            if (babylonPBRMaterial.transparencyMode != null) {
                const alphaMode = _GLTFMaterial._GetAlphaMode(babylonPBRMaterial);

                if (alphaMode !== MaterialAlphaMode.OPAQUE) { //glTF defaults to opaque
                    glTFMaterial.alphaMode = alphaMode;
                    if (alphaMode === MaterialAlphaMode.BLEND) {
                        glTFMaterial.alphaCutoff = babylonPBRMaterial.alphaCutOff;
                    }
                }
            }

            glTFMaterial.pbrMetallicRoughness = glTFPbrMetallicRoughness;
            materials.push(glTFMaterial);
        }

        private static GetPixelsFromTexture(babylonTexture: Texture): Uint8Array | Float32Array {
            let pixels = babylonTexture.textureType === Engine.TEXTURETYPE_UNSIGNED_INT ? babylonTexture.readPixels() as Uint8Array : babylonTexture.readPixels() as Float32Array;
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
        private static _ExportTexture(babylonTexture: BaseTexture, mimeType: ImageMimeType, images: IImage[], textures: ITexture[], imageData: { [fileName: string]: { data: Uint8Array, mimeType: ImageMimeType } }): Nullable<ITextureInfo> {
            let textureName = "texture_" + (textures.length - 1).toString();
            let textureData = babylonTexture.getInternalTexture();

            if (textureData != null) {
                textureName = textureData.url || textureName;
            }

            textureName = Tools.GetFilename(textureName);
            const baseFile = textureName.split('.')[0];
            let extension = "";


            if (mimeType === ImageMimeType.JPEG) {
                extension = ".jpg";
            }
            else if (mimeType === ImageMimeType.PNG) {
                extension = ".png";
            }
            else {
                throw new Error("Unsupported mime type " + mimeType);
            }
            textureName = baseFile + extension;


            const pixels = _GLTFMaterial.GetPixelsFromTexture(babylonTexture as Texture);

            const size = babylonTexture.getSize();

            const base64Data = this._CreateBase64FromCanvas(pixels, size.width, size.height, mimeType);
   
            return this._GetTextureInfoFromBase64(base64Data, textureName, mimeType, images, textures, imageData);
        }

        /**
         * Builds a texture from base64 string
         * @param base64Texture base64 texture string
         * @param textureName Name to use for the texture
         * @param mimeType image mime type for the texture
         * @param images array of images
         * @param textures array of textures
         * @param imageData map of image data
         * @returns glTF texture info, or null if the texture format is not supported
         */
        private static _GetTextureInfoFromBase64(base64Texture: string, textureName: string, mimeType: ImageMimeType, images: IImage[], textures: ITexture[], imageData: { [fileName: string]: { data: Uint8Array, mimeType: ImageMimeType } }): Nullable<ITextureInfo> {
            let textureInfo: Nullable<ITextureInfo> = null;

            const glTFTexture = {
                source: images.length
            };

            const binStr = atob(base64Texture.split(',')[1]);
            let arrBuff = new ArrayBuffer(binStr.length);
            const arr = new Uint8Array(arrBuff);
            for (let i = 0, length = binStr.length; i < length; ++i) {
                arr[i] = binStr.charCodeAt(i);
            }
            const imageValues = { data: arr, mimeType: mimeType };

            imageData[textureName] = imageValues;
            if (mimeType === ImageMimeType.JPEG || mimeType === ImageMimeType.PNG) {
                const glTFImage: IImage = {
                    uri: textureName
                }
                let foundIndex: number = -1;
                for (let i = 0; i < images.length; ++i) {
                    if (images[i].uri === textureName) {
                        foundIndex = i;
                        break;
                    }
                }
                if (foundIndex === -1) {
                    images.push(glTFImage);
                    glTFTexture.source = images.length - 1;
                    textures.push({
                        source: images.length - 1
                    });

                    textureInfo = {
                        index: images.length - 1
                    }
                }
                else {
                    glTFTexture.source = foundIndex;

                    textureInfo = {
                        index: foundIndex
                    }
                }
            }

            return textureInfo;
        }
    }
}