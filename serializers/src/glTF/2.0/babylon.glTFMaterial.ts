/// <reference path="../../../../dist/babylon.glTF2Interface.d.ts"/>

module BABYLON.GLTF2 {
    /**
     * Utility methods for working with glTF material conversion properties.  This class should only be used internally.
     */
    export class _GLTFMaterial {
        /**
         * Represents the dielectric specular values for R, G and B.
         */
        private static readonly dielectricSpecular: Color3 = new Color3(0.04, 0.04, 0.04);

        /**
         * Allows the maximum specular power to be defined for material calculations.
         */
        private static maxSpecularPower = 1024;

        private static epsilon = 1e-6;

        /**
         * Gets the materials from a Babylon scene and converts them to glTF materials.
         * @param scene
         * @param mimeType
         * @param images
         * @param textures
         * @param materials
         * @param imageData
         * @param hasTextureCoords
         */
        public static ConvertMaterialsToGLTF(babylonMaterials: Material[], mimeType: ImageMimeType, images: IImage[], textures: ITexture[], materials: IMaterial[], imageData: { [fileName: string]: { data: Uint8Array, mimeType: ImageMimeType } }, hasTextureCoords: boolean) {
            for (let i = 0; i < babylonMaterials.length; ++i) {
                const babylonMaterial = babylonMaterials[i];
                if (babylonMaterial instanceof StandardMaterial) {
                    _GLTFMaterial.ConvertStandardMaterial(babylonMaterial, mimeType, images, textures, materials, imageData, hasTextureCoords);
                }
                else if (babylonMaterial instanceof PBRMetallicRoughnessMaterial) {
                    _GLTFMaterial.ConvertPBRMetallicRoughnessMaterial(babylonMaterial, mimeType, images, textures, materials, imageData, hasTextureCoords);
                }
                else if (babylonMaterial instanceof PBRMaterial) {
                    _GLTFMaterial.ConvertPBRMaterial(babylonMaterial, mimeType, images, textures, materials, imageData, hasTextureCoords);
                }
                else {
                    Tools.Error("Unsupported material type: " + babylonMaterial.name);
                }
            }
        }

        /**
         * Makes a copy of the glTF material without the texture parameters.
         * @param originalMaterial - original glTF material.
         * @returns glTF material without texture parameters
         */
        public static StripTexturesFromMaterial(originalMaterial: IMaterial): IMaterial {
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
         * Specifies if the material has any texture parameters present.
         * @param material - glTF Material.
         * @returns boolean specifying if texture parameters are present
         */
        public static HasTexturesPresent(material: IMaterial): boolean {
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
         * Converts a Babylon StandardMaterial to a glTF Metallic Roughness Material.
         * @param babylonStandardMaterial 
         * @returns - glTF Metallic Roughness Material representation
         */
        public static ConvertToGLTFPBRMetallicRoughness(babylonStandardMaterial: StandardMaterial): IMaterialPbrMetallicRoughness {
            const P0 = new BABYLON.Vector2(0, 1);
            const P1 = new BABYLON.Vector2(0, 0.1);
            const P2 = new BABYLON.Vector2(0, 0.1);
            const P3 = new BABYLON.Vector2(1300, 0.1);

            /**
             * Given the control points, solve for x based on a given t for a cubic bezier curve.
             * @param t - a value between 0 and 1.
             * @param p0 - first control point.
             * @param p1 - second control point.
             * @param p2 - third control point.
             * @param p3 - fourth control point.
             * @returns - number result of cubic bezier curve at the specified t.
             */
            function cubicBezierCurve(t: number, p0: number, p1: number, p2: number, p3: number): number {
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
             * and roughness on the ordinant axis (y-axis).
             * @param specularPower - specular power of standard material.
             * @returns - Number representing the roughness value.
             */
            function solveForRoughness(specularPower: number): number {
                var t = Math.pow(specularPower / P3.x, 0.333333);
                return cubicBezierCurve(t, P0.y, P1.y, P2.y, P3.y);
            }

            let diffuse = babylonStandardMaterial.diffuseColor.toLinearSpace().scale(0.5);
            let opacity = babylonStandardMaterial.alpha;
            let specularPower = Scalar.Clamp(babylonStandardMaterial.specularPower, 0, this.maxSpecularPower);

            const roughness = solveForRoughness(specularPower);

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
         * @param diffuse - diffused value
         * @param specular - specular value
         * @param oneMinusSpecularStrength - one minus the specular strength
         * @returns - metallic value
         */
        public static SolveMetallic(diffuse: number, specular: number, oneMinusSpecularStrength: number): number {
            if (specular < _GLTFMaterial.dielectricSpecular.r) {
                _GLTFMaterial.dielectricSpecular
                return 0;
            }

            const a = _GLTFMaterial.dielectricSpecular.r;
            const b = diffuse * oneMinusSpecularStrength / (1.0 - _GLTFMaterial.dielectricSpecular.r) + specular - 2.0 * _GLTFMaterial.dielectricSpecular.r;
            const c = _GLTFMaterial.dielectricSpecular.r - specular;
            const D = b * b - 4.0 * a * c;
            return BABYLON.Scalar.Clamp((-b + Math.sqrt(D)) / (2.0 * a), 0, 1);
        }

        /**
         * Gets the glTF alpha mode from the Babylon Material
         * @param babylonMaterial - Babylon Material
         * @returns - The Babylon alpha mode value
         */
        public static GetAlphaMode(babylonMaterial: Material): MaterialAlphaMode {
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
         * Converts a Babylon Standard Material to a glTF Material.
         * @param babylonStandardMaterial - BJS Standard Material.
         * @param mimeType - mime type to use for the textures.
         * @param images - array of glTF image interfaces.
         * @param textures - array of glTF texture interfaces.
         * @param materials - array of glTF material interfaces.
         * @param imageData - map of image file name to data.
         * @param hasTextureCoords - specifies if texture coordinates are present on the submesh to determine if textures should be applied.
         */
        public static ConvertStandardMaterial(babylonStandardMaterial: StandardMaterial, mimeType: ImageMimeType, images: IImage[], textures: ITexture[], materials: IMaterial[], imageData: { [fileName: string]: { data: Uint8Array, mimeType: ImageMimeType } }, hasTextureCoords: boolean) {
            Tools.Warn(babylonStandardMaterial.name + ": Standard Material is currently not fully supported/implemented in glTF serializer");
            const glTFPbrMetallicRoughness = _GLTFMaterial.ConvertToGLTFPBRMetallicRoughness(babylonStandardMaterial);

            const glTFMaterial: IMaterial = { name: babylonStandardMaterial.name };
            if (babylonStandardMaterial.backFaceCulling) {
                if (!babylonStandardMaterial.twoSidedLighting) {
                    Tools.Warn(babylonStandardMaterial.name + ": Back-face culling enabled and two-sided lighting disabled is not supported in glTF.");
                }
                glTFMaterial.doubleSided = true;
            }
            if (hasTextureCoords) {
                if (babylonStandardMaterial.diffuseTexture) {
                    const glTFTexture = _GLTFMaterial.ExportTexture(babylonStandardMaterial.diffuseTexture, mimeType, images, textures, imageData);
                    if (glTFTexture != null) {
                        glTFPbrMetallicRoughness.baseColorTexture = glTFTexture;
                    }
                }
                if (babylonStandardMaterial.bumpTexture) {
                    const glTFTexture = _GLTFMaterial.ExportTexture(babylonStandardMaterial.bumpTexture, mimeType, images, textures, imageData)
                    if (glTFTexture) {
                        glTFMaterial.normalTexture = glTFTexture;
                    }
                }
                if (babylonStandardMaterial.emissiveTexture) {
                    const glTFEmissiveTexture = _GLTFMaterial.ExportTexture(babylonStandardMaterial.emissiveTexture, mimeType, images, textures, imageData)
                    if (glTFEmissiveTexture) {
                        glTFMaterial.emissiveTexture = glTFEmissiveTexture;
                    }
                    glTFMaterial.emissiveFactor = [1.0, 1.0, 1.0];
                }
                if (babylonStandardMaterial.ambientTexture) {
                    const glTFTexture = _GLTFMaterial.ExportTexture(babylonStandardMaterial.ambientTexture, mimeType, images, textures, imageData);
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
            if (babylonStandardMaterial.emissiveColor) {
                glTFMaterial.emissiveFactor = babylonStandardMaterial.emissiveColor.asArray();
            }

            glTFMaterial.pbrMetallicRoughness = glTFPbrMetallicRoughness;

            materials.push(glTFMaterial);
        }

        /**
         * Converts a Babylon PBR Metallic Roughness Material to a glTF Material.
         * @param babylonPBRMetalRoughMaterial - BJS PBR Metallic Roughness Material.
         * @param mimeType - mime type to use for the textures.
         * @param images - array of glTF image interfaces.
         * @param textures - array of glTF texture interfaces.
         * @param materials - array of glTF material interfaces.
         * @param imageData - map of image file name to data.
         * @param hasTextureCoords - specifies if texture coordinates are present on the submesh to determine if textures should be applied.
         */
        public static ConvertPBRMetallicRoughnessMaterial(babylonPBRMetalRoughMaterial: PBRMetallicRoughnessMaterial, mimeType: ImageMimeType, images: IImage[], textures: ITexture[], materials: IMaterial[], imageData: { [fileName: string]: { data: Uint8Array, mimeType: ImageMimeType } }, hasTextureCoords: boolean) {
            const glTFPbrMetallicRoughness: IMaterialPbrMetallicRoughness = {};

            if (babylonPBRMetalRoughMaterial.baseColor) {
                glTFPbrMetallicRoughness.baseColorFactor = [
                    babylonPBRMetalRoughMaterial.baseColor.r,
                    babylonPBRMetalRoughMaterial.baseColor.g,
                    babylonPBRMetalRoughMaterial.baseColor.b,
                    babylonPBRMetalRoughMaterial.alpha
                ];
            }

            if (babylonPBRMetalRoughMaterial.metallic != null) {
                glTFPbrMetallicRoughness.metallicFactor = babylonPBRMetalRoughMaterial.metallic;
            }
            if (babylonPBRMetalRoughMaterial.roughness != null) {
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
                    const glTFTexture = _GLTFMaterial.ExportTexture(babylonPBRMetalRoughMaterial.baseTexture, mimeType, images, textures, imageData);
                    if (glTFTexture != null) {
                        glTFPbrMetallicRoughness.baseColorTexture = glTFTexture;
                    }
                }
                if (babylonPBRMetalRoughMaterial.normalTexture) {
                    const glTFTexture = _GLTFMaterial.ExportTexture(babylonPBRMetalRoughMaterial.normalTexture, mimeType, images, textures, imageData);
                    if (glTFTexture) {
                        glTFMaterial.normalTexture = glTFTexture;
                    }
                }
                if (babylonPBRMetalRoughMaterial.occlusionTexture) {
                    const glTFTexture = _GLTFMaterial.ExportTexture(babylonPBRMetalRoughMaterial.occlusionTexture, mimeType, images, textures, imageData);
                    if (glTFTexture) {
                        glTFMaterial.occlusionTexture = glTFTexture;
                        if (babylonPBRMetalRoughMaterial.occlusionStrength != null) {
                            glTFMaterial.occlusionTexture.strength = babylonPBRMetalRoughMaterial.occlusionStrength;
                        }
                    }
                }
                if (babylonPBRMetalRoughMaterial.emissiveTexture) {
                    const glTFTexture = _GLTFMaterial.ExportTexture(babylonPBRMetalRoughMaterial.emissiveTexture, mimeType, images, textures, imageData);
                    if (glTFTexture != null) {
                        glTFMaterial.emissiveTexture = glTFTexture;
                    }
                }
            }

            if (babylonPBRMetalRoughMaterial.emissiveColor.equalsFloats(0.0, 0.0, 0.0)) {
                glTFMaterial.emissiveFactor = babylonPBRMetalRoughMaterial.emissiveColor.asArray();
            }
            if (babylonPBRMetalRoughMaterial.transparencyMode != null) {
                const alphaMode = _GLTFMaterial.GetAlphaMode(babylonPBRMetalRoughMaterial);

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
         * See link below for info on the material conversions from PBR Metallic/Roughness and Specular/Glossiness
         * @link https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_materials_pbrSpecularGlossiness/examples/convert-between-workflows-bjs/js/babylon.pbrUtilities.js
         * @param color - Color source to calculate brightness from.
         * @returns number representing the perceived brightness, or zero if color is undefined. 
         */
        public static GetPerceivedBrightness(color: Color3): number {
            if (color) {
                return Math.sqrt(0.299 * color.r * color.r + 0.587 * color.g * color.g + 0.114 * color.b * color.b);
            }
            return 0;
        }

        /**
         * Returns the maximum color component value.
         * @param color 
         * @returns maximum color component value, or zero if color is null or undefined.
         */
        public static GetMaxComponent(color: Color3): number {
            if (color) {
                return Math.max(color.r, Math.max(color.g, color.b));
            }
            return 0;
        }

        /**
         * Converts a Babylon PBR Metallic Roughness Material to a glTF Material.
         * @param babylonPBRMaterial - BJS PBR Metallic Roughness Material.
         * @param mimeType - mime type to use for the textures.
         * @param images - array of glTF image interfaces.
         * @param textures - array of glTF texture interfaces.
         * @param materials - array of glTF material interfaces.
         * @param imageData - map of image file name to data.
         * @param hasTextureCoords - specifies if texture coordinates are present on the submesh to determine if textures should be applied.
         */
        public static ConvertPBRMaterial(babylonPBRMaterial: PBRMaterial, mimeType: ImageMimeType, images: IImage[], textures: ITexture[], materials: IMaterial[], imageData: { [fileName: string]: { data: Uint8Array, mimeType: ImageMimeType } }, hasTextureCoords: boolean) {
            const glTFPbrMetallicRoughness: IMaterialPbrMetallicRoughness = {};
            const glTFMaterial: IMaterial = {
                name: babylonPBRMaterial.name
            };
            const useMetallicRoughness = babylonPBRMaterial.isMetallicWorkflow();

            if (babylonPBRMaterial) {
                if (useMetallicRoughness) {
                    glTFPbrMetallicRoughness.baseColorFactor = [
                        babylonPBRMaterial.albedoColor.r,
                        babylonPBRMaterial.albedoColor.g,
                        babylonPBRMaterial.albedoColor.b,
                        babylonPBRMaterial.alpha
                    ];
                    if (babylonPBRMaterial.metallic != null) {
                        if (babylonPBRMaterial.metallic !== 1) {
                            glTFPbrMetallicRoughness.metallicFactor = babylonPBRMaterial.metallic;
                        }
                    }
                    if (babylonPBRMaterial.roughness != null) {
                        if (babylonPBRMaterial.roughness !== 1) {
                            glTFPbrMetallicRoughness.roughnessFactor = babylonPBRMaterial.roughness;
                        }
                    }
                }
                else {
                    const diffuseColor = babylonPBRMaterial.albedoColor || Color3.Black();
                    const specularColor = babylonPBRMaterial.reflectionColor || Color3.Black();
                    const diffusePerceivedBrightness = _GLTFMaterial.GetPerceivedBrightness(diffuseColor);
                    const specularPerceivedBrightness = _GLTFMaterial.GetPerceivedBrightness(specularColor);
                    const oneMinusSpecularStrength = 1 - _GLTFMaterial.GetMaxComponent(babylonPBRMaterial.reflectionColor);
                    const metallic = _GLTFMaterial.SolveMetallic(diffusePerceivedBrightness, specularPerceivedBrightness, oneMinusSpecularStrength);
                    const glossiness = babylonPBRMaterial.microSurface || 0;
                    const baseColorFromDiffuse = diffuseColor.scale(oneMinusSpecularStrength / (1.0 - this.dielectricSpecular.r) / Math.max(1 - metallic, this.epsilon));
                    const baseColorFromSpecular = specularColor.subtract(this.dielectricSpecular.scale(1 - metallic)).scale(1 / Math.max(metallic, this.epsilon));
                    let baseColor = Color3.Lerp(baseColorFromDiffuse, baseColorFromSpecular, metallic * metallic);
                    baseColor = baseColor.clampToRef(0, 1, baseColor);

                    glTFPbrMetallicRoughness.baseColorFactor = [
                        baseColor.r,
                        baseColor.g,
                        baseColor.b,
                        babylonPBRMaterial.alpha
                    ];
                    if (metallic !== 1) {
                        glTFPbrMetallicRoughness.metallicFactor = metallic;
                    }
                    if (glossiness) {
                        glTFPbrMetallicRoughness.roughnessFactor = 1 - glossiness;
                    }
                }
                if (babylonPBRMaterial.backFaceCulling) {
                    if (!babylonPBRMaterial.twoSidedLighting) {
                        Tools.Warn(babylonPBRMaterial.name + ": Back-face culling enabled and two-sided lighting disabled is not supported in glTF.");
                    }
                    glTFMaterial.doubleSided = true;
                }
                if (hasTextureCoords) {
                    if (babylonPBRMaterial.albedoTexture) {
                        const glTFTexture = _GLTFMaterial.ExportTexture(babylonPBRMaterial.albedoTexture, mimeType, images, textures, imageData);
                        if (glTFTexture) {
                            glTFPbrMetallicRoughness.baseColorTexture = glTFTexture;
                        }
                    }
                    if (babylonPBRMaterial.bumpTexture) {
                        const glTFTexture = _GLTFMaterial.ExportTexture(babylonPBRMaterial.bumpTexture, mimeType, images, textures, imageData);
                        if (glTFTexture) {
                            glTFMaterial.normalTexture = glTFTexture;
                        }
                    }
                    if (babylonPBRMaterial.ambientTexture) {
                        const glTFTexture = _GLTFMaterial.ExportTexture(babylonPBRMaterial.ambientTexture, mimeType, images, textures, imageData);
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
                        const glTFTexture = _GLTFMaterial.ExportTexture(babylonPBRMaterial.emissiveTexture, mimeType, images, textures, imageData);
                        if (glTFTexture != null) {
                            glTFMaterial.emissiveTexture = glTFTexture;
                        }
                    }
                    if (babylonPBRMaterial.metallicTexture) {
                        const glTFTexture = _GLTFMaterial.ExportTexture(babylonPBRMaterial.metallicTexture, mimeType, images, textures, imageData);
                        if (glTFTexture != null) {
                            glTFPbrMetallicRoughness.metallicRoughnessTexture = glTFTexture;
                        }
                    }
                }
                if (!babylonPBRMaterial.emissiveColor.equalsFloats(0.0, 0.0, 0.0)) {
                    glTFMaterial.emissiveFactor = babylonPBRMaterial.emissiveColor.asArray();
                }
                if (babylonPBRMaterial.transparencyMode != null) {
                    const alphaMode = _GLTFMaterial.GetAlphaMode(babylonPBRMaterial);

                    if (alphaMode !== MaterialAlphaMode.OPAQUE) { //glTF defaults to opaque
                        glTFMaterial.alphaMode = alphaMode;
                        if (alphaMode === MaterialAlphaMode.BLEND) {
                            glTFMaterial.alphaCutoff = babylonPBRMaterial.alphaCutOff;
                        }
                    }
                }
            }

            glTFMaterial.pbrMetallicRoughness = glTFPbrMetallicRoughness;
            materials.push(glTFMaterial);
        }

        /**
         * Extracts a texture from a Babylon texture into file data and glTF data.
         * @param babylonTexture - Babylon texture to extract.
         * @param mimeType - Mime Type of the babylonTexture.
         * @param images - Array of glTF images.
         * @param textures - Array of glTF textures.
         * @param imageData - map of image file name and data.
         * @return - glTF texture, or null if the texture format is not supported.
         */
        public static ExportTexture(babylonTexture: BaseTexture, mimeType: ImageMimeType, images: IImage[], textures: ITexture[], imageData: { [fileName: string]: { data: Uint8Array, mimeType: ImageMimeType } }): Nullable<ITextureInfo> {
            let textureInfo: Nullable<ITextureInfo> = null;

            let glTFTexture = {
                source: images.length
            };

            let textureName = "texture_" + (textures.length - 1).toString();
            let textureData = babylonTexture.getInternalTexture();

            if (textureData != null) {
                textureName = textureData.url;
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
                Tools.Error("Unsupported mime type " + mimeType);
            }
            textureName = baseFile + extension;


            const pixels = babylonTexture.readPixels() as Uint8Array;

            const imageCanvas = document.createElement('canvas');
            imageCanvas.id = "ImageCanvas";

            const ctx = <CanvasRenderingContext2D>imageCanvas.getContext('2d');
            const size = babylonTexture.getSize();
            imageCanvas.width = size.width;
            imageCanvas.height = size.height;

            const imgData = ctx.createImageData(size.width, size.height);


            imgData.data.set(pixels);
            ctx.putImageData(imgData, 0, 0);
            const base64Data = imageCanvas.toDataURL(mimeType);
            const binStr = atob(base64Data.split(',')[1]);
            const arr = new Uint8Array(binStr.length);
            for (let i = 0; i < binStr.length; ++i) {
                arr[i] = binStr.charCodeAt(i);
            }
            const imageValues = { data: arr, mimeType: mimeType };

            imageData[textureName] = imageValues;
            if (mimeType === ImageMimeType.JPEG) {
                const glTFImage: IImage = {
                    uri: textureName
                }
                let foundIndex = -1;
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