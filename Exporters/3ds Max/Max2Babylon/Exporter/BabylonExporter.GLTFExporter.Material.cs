using BabylonExport.Entities;
using GLTFExport.Entities;
using System;
using System.Drawing;
using System.IO;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
        private void ExportMaterial(BabylonMaterial babylonMaterial, GLTF gltf)
        {
            var name = babylonMaterial.name;
            var id = babylonMaterial.id;

            RaiseMessage("GLTFExporter.Material | Export material named: " + name, 1);

            if (babylonMaterial.GetType() == typeof(BabylonStandardMaterial))
            {
                var babylonStandardMaterial = babylonMaterial as BabylonStandardMaterial;


                // --- prints ---

                RaiseMessage("GLTFExporter.Material | babylonMaterial data", 2);
                RaiseMessage("GLTFExporter.Material | babylonMaterial.alpha=" + babylonMaterial.alpha, 3);
                RaiseMessage("GLTFExporter.Material | babylonMaterial.alphaMode=" + babylonMaterial.alphaMode, 3);
                RaiseMessage("GLTFExporter.Material | babylonMaterial.backFaceCulling=" + babylonMaterial.backFaceCulling, 3);
                RaiseMessage("GLTFExporter.Material | babylonMaterial.wireframe=" + babylonMaterial.wireframe, 3);

                // Ambient
                for (int i = 0; i < babylonStandardMaterial.ambient.Length; i++)
                {
                    RaiseMessage("GLTFExporter.Material | babylonStandardMaterial.ambient[" + i + "]=" + babylonStandardMaterial.ambient[i], 3);
                }

                // Diffuse
                RaiseMessage("GLTFExporter.Material | babylonStandardMaterial.diffuse.Length=" + babylonStandardMaterial.diffuse.Length, 3);
                for (int i = 0; i < babylonStandardMaterial.diffuse.Length; i++)
                {
                    RaiseMessage("GLTFExporter.Material | babylonStandardMaterial.diffuse[" + i + "]=" + babylonStandardMaterial.diffuse[i], 3);
                }
                if (babylonStandardMaterial.diffuseTexture == null)
                {
                    RaiseMessage("GLTFExporter.Material | babylonStandardMaterial.diffuseTexture=null", 3);
                }

                // Normal / bump
                if (babylonStandardMaterial.bumpTexture == null)
                {
                    RaiseMessage("GLTFExporter.Material | babylonStandardMaterial.bumpTexture=null", 3);
                }

                // Specular
                for (int i = 0; i < babylonStandardMaterial.specular.Length; i++)
                {
                    RaiseMessage("GLTFExporter.Material | babylonStandardMaterial.specular[" + i + "]=" + babylonStandardMaterial.specular[i], 3);
                }
                RaiseMessage("GLTFExporter.Material | babylonStandardMaterial.specularPower=" + babylonStandardMaterial.specularPower, 3);

                // Occlusion
                if (babylonStandardMaterial.ambientTexture == null)
                {
                    RaiseMessage("GLTFExporter.Material | babylonStandardMaterial.ambientTexture=null", 3);
                }

                // Emissive
                for (int i = 0; i < babylonStandardMaterial.emissive.Length; i++)
                {
                    RaiseMessage("GLTFExporter.Material | babylonStandardMaterial.emissive[" + i + "]=" + babylonStandardMaterial.emissive[i], 3);
                }
                if (babylonStandardMaterial.emissiveTexture == null)
                {
                    RaiseMessage("GLTFExporter.Material | babylonStandardMaterial.emissiveTexture=null", 3);
                }


                // --------------------------------
                // --------- gltfMaterial ---------
                // --------------------------------

                RaiseMessage("GLTFExporter.Material | create gltfMaterial", 2);
                var gltfMaterial = new GLTFMaterial
                {
                    name = name
                };
                gltfMaterial.id = babylonMaterial.id;
                gltfMaterial.index = gltf.MaterialsList.Count;
                gltf.MaterialsList.Add(gltfMaterial);

                // Alpha
                string alphaMode;
                float? alphaCutoff;
                getAlphaMode(babylonStandardMaterial, out alphaMode, out alphaCutoff);
                gltfMaterial.alphaMode = alphaMode;
                gltfMaterial.alphaCutoff = alphaCutoff;

                // DoubleSided
                gltfMaterial.doubleSided = !babylonMaterial.backFaceCulling;

                // Normal
                gltfMaterial.normalTexture = ExportTexture(babylonStandardMaterial.bumpTexture, gltf);

                // Occulison
                gltfMaterial.occlusionTexture = ExportTexture(babylonStandardMaterial.ambientTexture, gltf);

                // Emissive
                gltfMaterial.emissiveFactor = babylonStandardMaterial.emissive;
                gltfMaterial.emissiveTexture = ExportTexture(babylonStandardMaterial.emissiveTexture, gltf);


                // --------------------------------
                // --- gltfPbrMetallicRoughness ---
                // --------------------------------

                RaiseMessage("GLTFExporter.Material | create gltfPbrMetallicRoughness", 2);
                var gltfPbrMetallicRoughness = new GLTFPBRMetallicRoughness();
                gltfMaterial.pbrMetallicRoughness = gltfPbrMetallicRoughness;

                // --- Global ---

                SpecularGlossiness _specularGlossiness = new SpecularGlossiness
                {
                    diffuse = new BabylonColor3(babylonStandardMaterial.diffuse),
                    opacity = babylonMaterial.alpha,
                    specular = new BabylonColor3(babylonStandardMaterial.specular),
                    glossiness = babylonStandardMaterial.specularPower / 256
                };

                MetallicRoughness _metallicRoughness = ConvertToMetallicRoughness(_specularGlossiness, true);
                
                // Base color
                gltfPbrMetallicRoughness.baseColorFactor = new float[4]
                {
                    _metallicRoughness.baseColor.r,
                    _metallicRoughness.baseColor.g,
                    _metallicRoughness.baseColor.b,
                    _metallicRoughness.opacity
                };

                // Metallic roughness
                gltfPbrMetallicRoughness.metallicFactor = _metallicRoughness.metallic;
                gltfPbrMetallicRoughness.roughnessFactor = _metallicRoughness.roughness;


                // --- Textures ---

                if (babylonStandardMaterial.diffuseTexture != null)
                {
                    Func<string, Bitmap> loadTextureFromOutput = delegate (string textureName)
                    {
                        return LoadTexture(Path.Combine(gltf.OutputFolder, textureName));
                    };

                    Bitmap diffuseBitmap = loadTextureFromOutput(babylonStandardMaterial.diffuseTexture.name);

                    if (diffuseBitmap != null)
                    {
                        Bitmap specularBitmap = null;
                        if (babylonStandardMaterial.specularTexture != null)
                        {
                            specularBitmap = loadTextureFromOutput(babylonStandardMaterial.specularTexture.name);
                        }

                        Bitmap opacityBitmap = null;
                        if (babylonStandardMaterial.diffuseTexture.hasAlpha == false && babylonStandardMaterial.opacityTexture != null)
                        {
                            opacityBitmap = loadTextureFromOutput(babylonStandardMaterial.opacityTexture.name);
                        }

                        // Retreive dimensions
                        int width = 0;
                        int height = 0;
                        var haveSameDimensions = _getMinimalBitmapDimensions(out width, out height, diffuseBitmap, specularBitmap, opacityBitmap);
                        if (!haveSameDimensions)
                        {
                            RaiseWarning("Diffuse, specular and opacity maps should have same dimensions", 2);
                        }

                        // Create base color and metallic+roughness maps
                        Bitmap baseColorBitmap = new Bitmap(width, height);
                        Bitmap metallicRoughnessBitmap = new Bitmap(width, height);
                        var hasAlpha = false;
                        for (int x = 0; x < width; x++)
                        {
                            for (int y = 0; y < height; y++)
                            {
                                var diffuse = diffuseBitmap.GetPixel(x, y);
                                SpecularGlossiness specularGlossinessTexture = new SpecularGlossiness
                                {
                                    diffuse = new BabylonColor3(diffuse),
                                    opacity = babylonStandardMaterial.diffuseTexture.hasAlpha? diffuse.A / 255.0f :
                                              opacityBitmap != null && babylonStandardMaterial.opacityTexture.getAlphaFromRGB ? opacityBitmap.GetPixel(x, y).R / 255.0f :
                                              opacityBitmap != null && babylonStandardMaterial.opacityTexture.getAlphaFromRGB == false ? opacityBitmap.GetPixel(x, y).A / 255.0f :
                                              1,
                                    specular = specularBitmap != null ? new BabylonColor3(specularBitmap.GetPixel(x, y)) :
                                               new BabylonColor3(),
                                    glossiness = babylonStandardMaterial.useGlossinessFromSpecularMapAlpha && specularBitmap != null ? specularBitmap.GetPixel(x, y).A / 255.0f :
                                                 0
                                };

                                var displayPrints = x == width / 2 && y == height / 2;
                                MetallicRoughness metallicRoughnessTexture = ConvertToMetallicRoughness(specularGlossinessTexture, displayPrints);
                                
                                Color colorBase = Color.FromArgb(
                                    (int)(metallicRoughnessTexture.opacity * 255),
                                    (int)(metallicRoughnessTexture.baseColor.r * 255),
                                    (int)(metallicRoughnessTexture.baseColor.g * 255),
                                    (int)(metallicRoughnessTexture.baseColor.b * 255)
                                );
                                baseColorBitmap.SetPixel(x, y, colorBase);
                                if (metallicRoughnessTexture.opacity != 1)
                                {
                                    hasAlpha = true;
                                }

                                // The metalness values are sampled from the B channel.
                                // The roughness values are sampled from the G channel.
                                // These values are linear. If other channels are present (R or A), they are ignored for metallic-roughness calculations.
                                Color colorMetallicRoughness = Color.FromArgb(
                                    0,
                                    (int)(metallicRoughnessTexture.roughness * 255),
                                    (int)(metallicRoughnessTexture.metallic * 255)
                                );
                                metallicRoughnessBitmap.SetPixel(x, y, colorMetallicRoughness);
                            }
                        }

                        // Export maps and textures
                        var baseColorFileName = babylonMaterial.name + "_baseColor" + (hasAlpha ? ".png" : ".jpg");
                        gltfPbrMetallicRoughness.baseColorTexture = ExportBitmapTexture(babylonStandardMaterial.diffuseTexture, baseColorBitmap, baseColorFileName, gltf);
                        if (specularBitmap != null)
                        {
                            gltfPbrMetallicRoughness.metallicRoughnessTexture = ExportBitmapTexture(babylonStandardMaterial.diffuseTexture, metallicRoughnessBitmap, babylonMaterial.name + "_metallicRoughness" + ".jpg", gltf);
                        }
                    }
                }
            }
            else if (babylonMaterial.GetType() == typeof(BabylonPBRMetallicRoughnessMaterial))
            {

                var babylonPBRMetallicRoughnessMaterial = babylonMaterial as BabylonPBRMetallicRoughnessMaterial;


                // --- prints ---

                RaiseMessage("GLTFExporter.Material | babylonMaterial data", 2);
                RaiseMessage("GLTFExporter.Material | babylonMaterial.alpha=" + babylonMaterial.alpha, 3);
                RaiseMessage("GLTFExporter.Material | babylonMaterial.alphaMode=" + babylonMaterial.alphaMode, 3);
                RaiseMessage("GLTFExporter.Material | babylonMaterial.backFaceCulling=" + babylonMaterial.backFaceCulling, 3);
                RaiseMessage("GLTFExporter.Material | babylonMaterial.wireframe=" + babylonMaterial.wireframe, 3);

                // Global
                RaiseMessage("GLTFExporter.Material | babylonPBRMetallicRoughnessMaterial.maxSimultaneousLights=" + babylonPBRMetallicRoughnessMaterial.maxSimultaneousLights, 3);
                RaiseMessage("GLTFExporter.Material | babylonPBRMetallicRoughnessMaterial.disableLighting=" + babylonPBRMetallicRoughnessMaterial.disableLighting, 3);
                RaiseMessage("GLTFExporter.Material | babylonPBRMetallicRoughnessMaterial.alphaCutOff=" + babylonPBRMetallicRoughnessMaterial.alphaCutOff, 3);
                RaiseMessage("GLTFExporter.Material | babylonPBRMetallicRoughnessMaterial.transparencyMode=" + babylonPBRMetallicRoughnessMaterial.transparencyMode, 3);
                RaiseMessage("GLTFExporter.Material | babylonPBRMetallicRoughnessMaterial.doubleSided=" + babylonPBRMetallicRoughnessMaterial.doubleSided, 3);

                // Base color
                RaiseMessage("GLTFExporter.Material | babylonPBRMetallicRoughnessMaterial.baseColor.Length=" + babylonPBRMetallicRoughnessMaterial.baseColor.Length, 3);
                for (int i = 0; i < babylonPBRMetallicRoughnessMaterial.baseColor.Length; i++)
                {
                    RaiseMessage("GLTFExporter.Material | babylonPBRMetallicRoughnessMaterial.baseColor[" + i + "]=" + babylonPBRMetallicRoughnessMaterial.baseColor[i], 3);
                }
                if (babylonPBRMetallicRoughnessMaterial.baseTexture == null)
                {
                    RaiseMessage("GLTFExporter.Material | babylonPBRMetallicRoughnessMaterial.baseTexture=null", 3);
                }

                // Metallic+roughness
                RaiseMessage("GLTFExporter.Material | babylonPBRMetallicRoughnessMaterial.metallic=" + babylonPBRMetallicRoughnessMaterial.metallic, 3);
                RaiseMessage("GLTFExporter.Material | babylonPBRMetallicRoughnessMaterial.roughness=" + babylonPBRMetallicRoughnessMaterial.roughness, 3);
                if (babylonPBRMetallicRoughnessMaterial.metallicRoughnessTexture == null)
                {
                    RaiseMessage("GLTFExporter.Material | babylonPBRMetallicRoughnessMaterial.metallicRoughnessTexture=null", 3);
                }

                // Environment
                if (babylonPBRMetallicRoughnessMaterial.environmentTexture == null)
                {
                    RaiseMessage("GLTFExporter.Material | babylonPBRMetallicRoughnessMaterial.environmentTexture=null", 3);
                }

                // Normal / bump
                if (babylonPBRMetallicRoughnessMaterial.normalTexture == null)
                {
                    RaiseMessage("GLTFExporter.Material | babylonPBRMetallicRoughnessMaterial.normalTexture=null", 3);
                }
                RaiseMessage("GLTFExporter.Material | babylonPBRMetallicRoughnessMaterial.invertNormalMapX=" + babylonPBRMetallicRoughnessMaterial.invertNormalMapX, 3);
                RaiseMessage("GLTFExporter.Material | babylonPBRMetallicRoughnessMaterial.invertNormalMapY=" + babylonPBRMetallicRoughnessMaterial.invertNormalMapY, 3);

                // Emissive
                for (int i = 0; i < babylonPBRMetallicRoughnessMaterial.emissiveColor.Length; i++)
                {
                    RaiseMessage("GLTFExporter.Material | babylonPBRMetallicRoughnessMaterial.emissiveColor[" + i + "]=" + babylonPBRMetallicRoughnessMaterial.emissiveColor[i], 3);
                }
                if (babylonPBRMetallicRoughnessMaterial.emissiveTexture == null)
                {
                    RaiseMessage("GLTFExporter.Material | babylonPBRMetallicRoughnessMaterial.emissiveTexture=null", 3);
                }

                // Ambient occlusion
                RaiseMessage("GLTFExporter.Material | babylonPBRMetallicRoughnessMaterial.occlusionStrength=" + babylonPBRMetallicRoughnessMaterial.occlusionStrength, 3);
                if (babylonPBRMetallicRoughnessMaterial.occlusionTexture == null)
                {
                    RaiseMessage("GLTFExporter.Material | babylonPBRMetallicRoughnessMaterial.occlusionTexture=null", 3);
                }


                // --------------------------------
                // --------- gltfMaterial ---------
                // --------------------------------

                RaiseMessage("GLTFExporter.Material | create gltfMaterial", 2);
                var gltfMaterial = new GLTFMaterial
                {
                    name = name
                };
                gltfMaterial.id = babylonMaterial.id;
                gltfMaterial.index = gltf.MaterialsList.Count;
                gltf.MaterialsList.Add(gltfMaterial);

                // Alpha
                string alphaMode;
                float? alphaCutoff;
                getAlphaMode(babylonPBRMetallicRoughnessMaterial, out alphaMode, out alphaCutoff);
                gltfMaterial.alphaMode = alphaMode;
                gltfMaterial.alphaCutoff = alphaCutoff;

                // DoubleSided
                gltfMaterial.doubleSided = babylonPBRMetallicRoughnessMaterial.doubleSided;

                // Normal
                gltfMaterial.normalTexture = ExportTexture(babylonPBRMetallicRoughnessMaterial.normalTexture, gltf);

                // Occulison
                gltfMaterial.occlusionTexture = ExportTexture(babylonPBRMetallicRoughnessMaterial.occlusionTexture, gltf);

                // Emissive
                gltfMaterial.emissiveFactor = babylonPBRMetallicRoughnessMaterial.emissiveColor;
                gltfMaterial.emissiveTexture = ExportTexture(babylonPBRMetallicRoughnessMaterial.emissiveTexture, gltf);


                // --------------------------------
                // --- gltfPbrMetallicRoughness ---
                // --------------------------------

                RaiseMessage("GLTFExporter.Material | create gltfPbrMetallicRoughness", 2);
                var gltfPbrMetallicRoughness = new GLTFPBRMetallicRoughness();
                gltfMaterial.pbrMetallicRoughness = gltfPbrMetallicRoughness;

                // --- Global ---

                // Base color
                // TODO - Unclear if alpha must be retreived from 'alpha' property of BABYLON.Material
                // or from alpha channel of 'baseColor' of BABYLON.PBRMetallicRoughnessMaterial
                gltfPbrMetallicRoughness.baseColorFactor = new float[4]
                {
                    babylonPBRMetallicRoughnessMaterial.baseColor[0],
                    babylonPBRMetallicRoughnessMaterial.baseColor[1],
                    babylonPBRMetallicRoughnessMaterial.baseColor[2],
                    babylonPBRMetallicRoughnessMaterial.alpha
                };
                gltfPbrMetallicRoughness.baseColorTexture = ExportTexture(babylonPBRMetallicRoughnessMaterial.baseTexture, gltf);

                // Metallic roughness
                gltfPbrMetallicRoughness.metallicFactor = babylonPBRMetallicRoughnessMaterial.metallic;
                gltfPbrMetallicRoughness.roughnessFactor = babylonPBRMetallicRoughnessMaterial.roughness;
                gltfPbrMetallicRoughness.metallicRoughnessTexture = ExportTexture(babylonPBRMetallicRoughnessMaterial.metallicRoughnessTexture, gltf);
            }
            else
            {
                RaiseWarning("GLTFExporter.Material | Unsupported material type: " + babylonMaterial.GetType(), 2);
            }
        }

        private void getAlphaMode(BabylonStandardMaterial babylonMaterial, out string alphaMode, out float? alphaCutoff)
        {
            if (babylonMaterial.alpha != 1.0f ||
                (babylonMaterial.diffuseTexture != null && babylonMaterial.diffuseTexture.hasAlpha) ||
                 babylonMaterial.opacityTexture != null)
            {
                // Babylon standard material is assumed to useAlphaFromDiffuseTexture. If not, the alpha mode is a mask.
                alphaMode = GLTFMaterial.AlphaMode.BLEND.ToString();
            }
            else
            {
                alphaMode = null;  // glTF alpha mode default value is "OPAQUE"
            }
            alphaCutoff = null;
        }

        private void getAlphaMode(BabylonPBRMetallicRoughnessMaterial babylonMaterial, out string alphaMode, out float? alphaCutoff)
        {
            alphaMode = null;
            alphaCutoff = null;
            switch (babylonMaterial.transparencyMode)
            {
                case (int)BabylonPBRMetallicRoughnessMaterial.TransparencyMode.OPAQUE:
                    alphaMode = null; // glTF alpha mode default value is "OPAQUE"
                    break;
                case (int)BabylonPBRMetallicRoughnessMaterial.TransparencyMode.ALPHABLEND:
                    alphaMode = GLTFMaterial.AlphaMode.BLEND.ToString();
                    break;
                case (int)BabylonPBRMetallicRoughnessMaterial.TransparencyMode.ALPHATEST:
                    alphaCutoff = babylonMaterial.alphaCutOff;
                    alphaMode = GLTFMaterial.AlphaMode.MASK.ToString();
                    break;
                case (int)BabylonPBRMetallicRoughnessMaterial.TransparencyMode.ALPHATESTANDBLEND:
                    RaiseWarning("GLTFExporter.Material | Alpha test and blend mode is not supported in glTF. Alpha blend is used instead.", 3);
                    alphaMode = GLTFMaterial.AlphaMode.BLEND.ToString();
                    break;
                default:
                    RaiseWarning("GLTFExporter.Material | Unsupported transparency mode: " + babylonMaterial.transparencyMode, 3);
                    break;
            }
        }

        BabylonColor3 dielectricSpecular = new BabylonColor3(0.04f, 0.04f, 0.04f);
        const float epsilon = 1e-6f;

        private MetallicRoughness ConvertToMetallicRoughness(SpecularGlossiness specularGlossiness, bool displayPrints = false)
        {
            var diffuse = specularGlossiness.diffuse;
            var opacity = specularGlossiness.opacity;
            var specular = specularGlossiness.specular;
            var glossiness = specularGlossiness.glossiness;

            var oneMinusSpecularStrength = 1 - specular.getMaxComponent();
            var metallic = solveMetallic(diffuse.getPerceivedBrightness(), specular.getPerceivedBrightness(), oneMinusSpecularStrength);

            var diffuseScaleFactor = oneMinusSpecularStrength / (1 - dielectricSpecular.r) / Math.Max(1 - metallic, epsilon);
            var baseColorFromDiffuse = diffuse.scale(diffuseScaleFactor);
            var baseColorFromSpecular = specular.subtract(dielectricSpecular.scale(1 - metallic)).scale(1 / Math.Max(metallic, epsilon));
            var baseColor = BabylonColor3.Lerp(baseColorFromDiffuse, baseColorFromSpecular, metallic * metallic).clamp();
            //var baseColor = baseColorFromDiffuse.clamp();

            if (displayPrints)
            {
                RaiseMessage("-----------------------", 3);
                RaiseMessage("diffuse=" + diffuse, 3);
                RaiseMessage("opacity=" + opacity, 3);
                RaiseMessage("specular=" + specular, 3);
                RaiseMessage("glossiness=" + glossiness, 3);

                RaiseMessage("oneMinusSpecularStrength=" + oneMinusSpecularStrength, 3);
                RaiseMessage("metallic=" + metallic, 3);
                RaiseMessage("diffuseScaleFactor=" + diffuseScaleFactor, 3);
                RaiseMessage("baseColorFromDiffuse=" + baseColorFromDiffuse, 3);
                RaiseMessage("baseColorFromSpecular=" + baseColorFromSpecular, 3);
                RaiseMessage("metallic * metallic=" + metallic * metallic, 3);
                RaiseMessage("baseColor=" + baseColor, 3);
                RaiseMessage("-----------------------", 3);
            }

            return new MetallicRoughness
            {
                baseColor = baseColor,
                opacity = opacity,
                metallic = metallic,
                roughness = 1 - glossiness
            };
        }

        private float solveMetallic(float diffuse, float specular, float oneMinusSpecularStrength)
        {
            if (specular < dielectricSpecular.r)
            {
                return 0;
            }

            var a = dielectricSpecular.r;
            var b = diffuse * oneMinusSpecularStrength / (1 - dielectricSpecular.r) + specular - 2 * dielectricSpecular.r;
            var c = dielectricSpecular.r - specular;
            var D = b * b - 4 * a * c;
            return ClampScalar((float)(-b + Math.Sqrt(D)) / (2 * a), 0, 1);
        }

        /**
         * Returns the value itself if it's between min and max.  
         * Returns min if the value is lower than min.
         * Returns max if the value is greater than max.  
         */
        private static float ClampScalar(float value, float min = 0, float max = 1)
        {
            return Math.Min(max, Math.Max(min, value));
        }

        private class SpecularGlossiness
        {
            public BabylonColor3 diffuse;
            public float opacity;
            public BabylonColor3 specular;
            public float glossiness;
        }

        private class MetallicRoughness
        {
            public BabylonColor3 baseColor;
            public float opacity;
            public float metallic;
            public float roughness;
        }
    }
}
