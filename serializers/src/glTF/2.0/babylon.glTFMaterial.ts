module BABYLON {
    /**
     * Utility methods for working with glTF material conversion properties
     */
    export class _GLTFMaterial {
        private static dielectricSpecular = new Color3(0.04, 0.04, 0.04);
        private static epsilon = 1e-6;

        /**
         * Converts Specular Glossiness to Metallic Roughness
         * @param  babylonSpecularGlossiness - Babylon specular glossiness parameters
         * @returns - Babylon metallic roughness values
         */
        public static ConvertToMetallicRoughness(babylonSpecularGlossiness: _IBabylonSpecularGlossiness): _IBabylonMetallicRoughness {
            const diffuse = babylonSpecularGlossiness.diffuse;
            const opacity = babylonSpecularGlossiness.opacity;
            const specular = babylonSpecularGlossiness.specular;
            const glossiness = babylonSpecularGlossiness.glossiness;
            
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

            const babylonMetallicRoughness: _IBabylonMetallicRoughness = {
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
        public static GetAlphaMode(babylonMaterial: Material): string {
            if (babylonMaterial instanceof StandardMaterial) {
                const babylonStandardMaterial = babylonMaterial as StandardMaterial;
                if ((babylonStandardMaterial.alpha != 1.0) || 
                    (babylonStandardMaterial.diffuseTexture != null && babylonStandardMaterial.diffuseTexture.hasAlpha) ||
                    (babylonStandardMaterial.opacityTexture != null)) {
                    return  _EGLTFAlphaModeEnum.BLEND;
                }
                else {
                    return _EGLTFAlphaModeEnum.OPAQUE;
                }
            }
            else if (babylonMaterial instanceof PBRMetallicRoughnessMaterial) {
                const babylonPBRMetallicRoughness = babylonMaterial as PBRMetallicRoughnessMaterial;

                switch(babylonPBRMetallicRoughness.transparencyMode) {
                    case PBRMaterial.PBRMATERIAL_OPAQUE: {
                        return _EGLTFAlphaModeEnum.OPAQUE;
                    }
                    case PBRMaterial.PBRMATERIAL_ALPHABLEND: {
                        return _EGLTFAlphaModeEnum.BLEND;
                    }
                    case PBRMaterial.PBRMATERIAL_ALPHATEST: {
                        return _EGLTFAlphaModeEnum.MASK;
                    }
                    case PBRMaterial.PBRMATERIAL_ALPHATESTANDBLEND: {
                        console.warn("GLTF Exporter | Alpha test and blend mode not supported in glTF.  Alpha blend used instead.");
                        return _EGLTFAlphaModeEnum.BLEND;
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