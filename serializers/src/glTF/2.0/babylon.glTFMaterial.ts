/// <reference path="../../../../dist/babylon.glTF2Interface.d.ts"/>

module BABYLON.GLTF2 {
    /**
     * Represents the components used for representing a physically-based specular glossiness material
     */
    interface IBabylonPbrSpecularGlossiness {
        /**
         * The diffuse color of the model, whose color values should be 
         * normalized from 0 to 1.  
         */
        diffuse: Color3;
        /**
         * Represents the transparency of the material, from a range of 0 to 1.
         */
        opacity: number;
        /**
         * Represents how specular the material is, from a range of 0 to 1.
         */
        specular: Color3;
        /**
         * Represents how glossy the material is, from a range of 0 to 1.
         */
        glossiness: number;
    }

    /**
     * Represents the components used for representing a physically-based metallic roughness material.
     */
    interface _IBabylonPbrMetallicRoughness {
        /**
         * The albedo color of the material, whose color components should be normalized from 0 to 1.
         */
        baseColor: Color3;
        /**
         * Represents the transparency of the material, from a range of 0 (transparent) to 1 (opaque).
         */
        opacity: number;
        /**
         * Represents the "metalness" of a material, from a range of 0 (dielectric) to 1 (metal).
         */
        metallic: number;
        /**
         * Represents the "roughness" of a material, from a range of 0 (completely smooth) to 1 (completely rough).
         */
        roughness: number;
    }

    /**
     * Utility methods for working with glTF material conversion properties.  This class should only be used internally.
     */
    export class _GLTFMaterial {
        /**
         * Represents the dielectric specular values for R, G and B.
         */
        private static readonly dielectricSpecular = new Color3(0.04, 0.04, 0.04);
        /**
         * Epsilon value, used as a small tolerance value for a numeric value.
         */
        private static readonly epsilon = 1e-6;

        /**
         * Converts a Babylon StandardMaterial to a glTF Metallic Roughness Material.
         * @param babylonStandardMaterial 
         * @returns - glTF Metallic Roughness Material representation
         */
        public static ConvertToGLTFPBRMetallicRoughness(babylonStandardMaterial: StandardMaterial): IMaterialPbrMetallicRoughness {
            const babylonSpecularGlossiness: IBabylonPbrSpecularGlossiness = {
                diffuse: babylonStandardMaterial.diffuseColor,
                opacity: babylonStandardMaterial.alpha,
                specular: babylonStandardMaterial.specularColor || Color3.Black(),
                glossiness: babylonStandardMaterial.specularPower / 256
            };
            if (babylonStandardMaterial.specularTexture) {

            }
            const babylonMetallicRoughness = _GLTFMaterial._ConvertToMetallicRoughness(babylonSpecularGlossiness);

            const glTFPbrMetallicRoughness: IMaterialPbrMetallicRoughness = {
                baseColorFactor: [
                    babylonMetallicRoughness.baseColor.r,
                    babylonMetallicRoughness.baseColor.g,
                    babylonMetallicRoughness.baseColor.b,
                    babylonMetallicRoughness.opacity
                ],
                metallicFactor: babylonMetallicRoughness.metallic,
                roughnessFactor: babylonMetallicRoughness.roughness
            };

            return glTFPbrMetallicRoughness;
        }

        /**
         * Converts Specular Glossiness to Metallic Roughness.  This is based on the algorithm used in the Babylon glTF 3ds Max Exporter.
         * {@link https://github.com/BabylonJS/Exporters/blob/master/3ds%20Max/Max2Babylon/Exporter/BabylonExporter.GLTFExporter.Material.cs}
         * @param  babylonSpecularGlossiness - Babylon specular glossiness parameters
         * @returns - Babylon metallic roughness values
         */
        private static _ConvertToMetallicRoughness(babylonSpecularGlossiness: IBabylonPbrSpecularGlossiness): _IBabylonPbrMetallicRoughness {
            const diffuse = babylonSpecularGlossiness.diffuse;
            const opacity = babylonSpecularGlossiness.opacity;
            const specular = babylonSpecularGlossiness.specular;
            const glossiness = BABYLON.Scalar.Clamp(babylonSpecularGlossiness.glossiness);
            
            const oneMinusSpecularStrength = 1 - Math.max(specular.r, Math.max(specular.g, specular.b));
            const diffusePerceivedBrightness = _GLTFMaterial.PerceivedBrightness(diffuse);
            const specularPerceivedBrightness = _GLTFMaterial.PerceivedBrightness(specular);
            const metallic = _GLTFMaterial.SolveMetallic(diffusePerceivedBrightness, specularPerceivedBrightness, oneMinusSpecularStrength);
            const diffuseScaleFactor = oneMinusSpecularStrength/(1 - this.dielectricSpecular.r) / Math.max(1 - metallic, this.epsilon);
            const baseColorFromDiffuse = diffuse.scale(diffuseScaleFactor);
            const baseColorFromSpecular = specular.subtract(this.dielectricSpecular.scale(1 - metallic)).scale(1/ Math.max(metallic, this.epsilon));
            const lerpColor = Color3.Lerp(baseColorFromDiffuse, baseColorFromSpecular, metallic * metallic);
            let baseColor = new Color3();
            lerpColor.clampToRef(0, 1, baseColor);

            const babylonMetallicRoughness: _IBabylonPbrMetallicRoughness = {
                baseColor: baseColor,
                opacity: opacity,
                metallic: metallic,
                roughness: 1.0 - glossiness
            };

            return babylonMetallicRoughness;
        }

        /**
         * Returns the perceived brightness value based on the provided color
         * @param color - color used in calculating the perceived brightness
         * @returns - perceived brightness value
         */
        private static PerceivedBrightness(color: Color3): number {
            return Math.sqrt(0.299 * color.r * color.r + 0.587 * color.g * color.g + 0.114 * color.b * color.b);
        }

        /**
         * Computes the metallic factor
         * @param diffuse - diffused value
         * @param specular - specular value
         * @param oneMinusSpecularStrength - one minus the specular strength
         * @returns - metallic value
         */
        public static SolveMetallic(diffuse: number, specular: number, oneMinusSpecularStrength: number): number {
            if (specular < this.dielectricSpecular.r) {
                return 0;
            }

            const a = this.dielectricSpecular.r;
            const b = diffuse * oneMinusSpecularStrength /(1.0 - this.dielectricSpecular.r) + specular - 2.0 * this.dielectricSpecular.r;
            const c = this.dielectricSpecular.r - specular;
            const D = b * b - 4.0 * a * c;
            return BABYLON.Scalar.Clamp((-b + Math.sqrt(D))/(2.0 * a));
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
                    return  MaterialAlphaMode.BLEND;
                }
                else {
                    return MaterialAlphaMode.OPAQUE;
                }
            }
            else if (babylonMaterial instanceof PBRMetallicRoughnessMaterial) {
                const babylonPBRMetallicRoughness = babylonMaterial as PBRMetallicRoughnessMaterial;

                switch(babylonPBRMetallicRoughness.transparencyMode) {
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
                        console.warn("GLTF Exporter | Alpha test and blend mode not supported in glTF.  Alpha blend used instead.");
                        return MaterialAlphaMode.BLEND;
                    }
                    default: {
                        throw new Error("Unsupported alpha mode " + babylonPBRMetallicRoughness.transparencyMode);
                    }
                }
            }
            else {
                throw new Error("Unsupported Babylon material type");
            }   
        }
    }
}