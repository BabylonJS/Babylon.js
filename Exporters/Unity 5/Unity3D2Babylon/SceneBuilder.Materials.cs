using System;
using System.IO;
using BabylonExport.Entities;
using UnityEditor;
using UnityEngine;

namespace Unity3D2Babylon
{
    partial class SceneBuilder
    {
        private void CopyTextureCube(string texturePath, Cubemap cubemap, BabylonTexture babylonTexture)
        {
            if (!babylonScene.AddTextureCube(texturePath))
            {
                return;
            }

            try
            {
                foreach (CubemapFace face in Enum.GetValues(typeof(CubemapFace)))
                {
                    var faceTexturePath = Path.Combine(babylonScene.OutputPath, Path.GetFileNameWithoutExtension(texturePath));

                    switch (face)
                    {
                        case CubemapFace.PositiveX:
                            faceTexturePath += "_px.jpg";
                            break;
                        case CubemapFace.NegativeX:
                            faceTexturePath += "_nx.jpg";
                            break;
                        case CubemapFace.PositiveY:
                            faceTexturePath += "_py.jpg";
                            break;
                        case CubemapFace.NegativeY:
                            faceTexturePath += "_ny.jpg";
                            break;
                        case CubemapFace.PositiveZ:
                            faceTexturePath += "_pz.jpg";
                            break;
                        case CubemapFace.NegativeZ:
                            faceTexturePath += "_nz.jpg";
                            break;
                        default:
                            continue;
                    }

                    var tempTexture = new Texture2D(cubemap.width, cubemap.height, TextureFormat.RGB24, false);

                    tempTexture.SetPixels(cubemap.GetPixels(face));
                    tempTexture.Apply();

                    // Flip faces in cube texture.
                    tempTexture = FlipTexture(tempTexture);

                    File.WriteAllBytes(faceTexturePath, tempTexture.EncodeToJPG());
                }

            }
            catch (Exception ex)
            {
                Debug.LogException(ex);
            }

            var textureName = Path.GetFileNameWithoutExtension(texturePath);
            babylonTexture.name = textureName;
            babylonTexture.isCube = true;
            babylonTexture.level = exportationOptions.ReflectionDefaultLevel;
            babylonTexture.coordinatesMode = 3;
        }

        private Texture2D FlipTexture(Texture2D original)
        {
            Texture2D flipped = new Texture2D(original.width, original.height);

            for (int i = 0; i < original.width; i++)
            {
                for (int j = 0; j < original.height; j++)
                {
                    flipped.SetPixel(i, original.height - j - 1, original.GetPixel(i, j));
                }
            }
            flipped.Apply();

            return flipped;
        }

        private void CopyTexture(string texturePath, Texture2D texture2D, BabylonTexture babylonTexture, bool isLightmap = false)
        {
            bool needToDelete = false;
            var useJPG = !texture2D.alphaIsTransparency;

            // Convert unsupported file extensions
            if (texturePath.EndsWith(".psd") || texturePath.EndsWith(".tif") || texturePath.EndsWith(".exr"))
            {
                try
                {
                    // Change texture import settings to be able to read texture data
                    var textureImporter = AssetImporter.GetAtPath(texturePath) as TextureImporter;
                    var previousIsReadable = textureImporter.isReadable;
                    var previousNormalMap = textureImporter.normalmap;
                    var previousLightmap = textureImporter.lightmap;
                    var previousConvertToNormalmap = textureImporter.convertToNormalmap;
                    var previousTextureType = textureImporter.textureType;
                    var previousGrayscaleToAlpha = textureImporter.grayscaleToAlpha;

                    textureImporter.textureType = TextureImporterType.Advanced;
                    textureImporter.isReadable = true;
                    textureImporter.lightmap = false;
                    textureImporter.normalmap = false;
                    textureImporter.convertToNormalmap = false;
                    textureImporter.grayscaleToAlpha = false;

                    AssetDatabase.ImportAsset(texturePath);

                    texturePath = Path.Combine(Path.GetTempPath(), Path.GetFileName(texturePath));
                    var extension = useJPG ? ".jpg" : ".png";
                    texturePath = texturePath.Replace(".psd", extension).Replace(".tif", extension).Replace(".exr", extension);

                    var tempTexture = new Texture2D(texture2D.width, texture2D.height, TextureFormat.ARGB32, false);

                    if (isLightmap)
                    {
                        Color[] pixels = texture2D.GetPixels(0, 0, texture2D.width, texture2D.height);
                        for (int index = 0; index < pixels.Length; index++)
                        {
                            pixels[index].r = pixels[index].r * pixels[index].a * 5;
                            pixels[index].g = pixels[index].g * pixels[index].a * 5;
                            pixels[index].b = pixels[index].b * pixels[index].a * 5;
                        }
                        tempTexture.SetPixels(pixels);
                    }
                    else {
                        tempTexture.SetPixels32(texture2D.GetPixels32());
                    }
                    tempTexture.Apply();

                    File.WriteAllBytes(texturePath, useJPG ? tempTexture.EncodeToJPG() : tempTexture.EncodeToPNG());

                    needToDelete = true;

                    // Restore
                    textureImporter.isReadable = previousIsReadable;
                    textureImporter.normalmap = previousNormalMap;
                    textureImporter.lightmap = previousLightmap;
                    textureImporter.convertToNormalmap = previousConvertToNormalmap;
                    textureImporter.textureType = previousTextureType;
                    textureImporter.grayscaleToAlpha = previousGrayscaleToAlpha;

                    AssetDatabase.ImportAsset(texturePath, ImportAssetOptions.ForceUpdate);
                }
                catch (Exception ex)
                {
                    Debug.LogException(ex);
                }
            }

            var textureName = Path.GetFileName(texturePath);
            babylonTexture.name = textureName;
            babylonScene.AddTexture(texturePath);

            if (needToDelete)
            {
                File.Delete(texturePath);
            }
        }

        private BabylonMaterial DumpMaterial(Material material, Renderer renderer)
        {
            if (renderer.sharedMaterial.shader.name == "Standard")
            {
                return DumpPBRMaterial(renderer.sharedMaterial, renderer, true);
            }
            else if (renderer.sharedMaterial.shader.name == "Standard (Specular setup)")
            {
                return DumpPBRMaterial(renderer.sharedMaterial, renderer, false);
            }

            return DumpStandardMaterial(material, renderer);
        }

        private BabylonMaterial DumpStandardMaterial(Material material, Renderer renderer)
        {
            var materialNotSupported = false;

            if (!materialsDictionary.ContainsKey(material.name))
            {
                var bMat = new BabylonStandardMaterial
                {
                    name = material.name,
                    id = Guid.NewGuid().ToString(),
                    diffuse = new float[4],
                    specular = new float[4]
                };

                bMat.diffuse[0] = 1.0f;
                bMat.diffuse[1] = 1.0f;
                bMat.diffuse[2] = 1.0f;
                bMat.diffuse[3] = 1.0f;

                if (material.HasProperty("_Color"))
                {
                    bMat.diffuse = material.color.ToFloat();
                }

                if (material.HasProperty("_SpecColor"))
                {
                    var specColor = material.GetColor("_SpecColor");
                    bMat.specular = specColor.ToFloat();
                }

                if (material.HasProperty("_Shininess"))
                {
                    var specShininess = material.GetFloat("_Shininess");
                    bMat.specularPower = specShininess * 128;
                }

                if (material.HasProperty("_Emission"))
                {
                    var emissiveColor = material.GetColor("_Emission");
                    bMat.emissive = emissiveColor.ToFloat();
                }

                if (material.mainTexture && material.mainTexture.GetType().FullName == "UnityEngine.ProceduralTexture")
                {
                    materialNotSupported = true;
                    Debug.LogWarning("ProceduralTexture: " + material.mainTexture.name + " not supported by Babylon.js");
                }

                if (material.mainTexture && !(materialNotSupported))
                {
                    var mainTexturePath = AssetDatabase.GetAssetPath(material.mainTexture);
                    bMat.diffuseTexture = new BabylonTexture
                    {
                        uScale = material.mainTextureScale.x,
                        vScale = material.mainTextureScale.y,
                        uOffset = material.mainTextureOffset.x,
                        vOffset = material.mainTextureOffset.y
                    };

                    var mainTexture2D = material.mainTexture as Texture2D;

                    CopyTexture(mainTexturePath, mainTexture2D, bMat.diffuseTexture);

                    var alphaCuttOff = 0f;

                    if (material.HasProperty("_Cutoff"))
                    {
                        alphaCuttOff = material.GetFloat("_Cutoff");
                    }

                    if ((mainTexture2D && mainTexture2D.alphaIsTransparency) || alphaCuttOff > 0)
                    {
                        bMat.diffuseTexture.hasAlpha = true;
                        bMat.backFaceCulling = false;
                    }

                    bMat.diffuse[0] = 1.0f;
                    bMat.diffuse[1] = 1.0f;
                    bMat.diffuse[2] = 1.0f;
                    bMat.diffuse[3] = 1.0f;
                }

                bMat.bumpTexture = DumpTextureFromMaterial(material, "_BumpMap");
                bMat.emissiveTexture = DumpTextureFromMaterial(material, "_Illum");
                bMat.ambientTexture = DumpTextureFromMaterial(material, "_LightMap");
                bMat.reflectionTexture = DumpTextureFromMaterial(material, "_Cube");

                if (bMat.ambientTexture == null && renderer.lightmapIndex >= 0 && renderer.lightmapIndex != 255 && LightmapSettings.lightmaps.Length > renderer.lightmapIndex)
                {
                    var lightmap = LightmapSettings.lightmaps[renderer.lightmapIndex].lightmapFar;
                    bMat.lightmapTexture = DumpTexture(lightmap, isLightmap: true);
                    bMat.lightmapTexture.coordinatesIndex = 1;
                    bMat.useLightmapAsShadowmap = true;

                    bMat.lightmapTexture.uScale = renderer.lightmapScaleOffset.x;
                    bMat.lightmapTexture.vScale = renderer.lightmapScaleOffset.y;

                    bMat.lightmapTexture.uOffset = renderer.lightmapScaleOffset.z;
                    bMat.lightmapTexture.vOffset = renderer.lightmapScaleOffset.w;
                }

                materialsDictionary.Add(bMat.name, bMat);
                return bMat;
            }

            return materialsDictionary[material.name];
        }

        private BabylonMaterial DumpPBRMaterial(Material material, Renderer renderer, bool metallic)
        {
            if (materialsDictionary.ContainsKey(material.name))
            {
                return materialsDictionary[material.name];
            }

            var babylonPbrMaterial = new BabylonPBRMaterial
            {
                name = material.name,
                id = Guid.NewGuid().ToString(),
                albedo = new float[4],
                useEmissiveAsIllumination = true,
                useSpecularOverAlpha = true,
                useRadianceOverAlpha = true,
            };

            babylonPbrMaterial.environmentIntensity = RenderSettings.ambientIntensity;

            // Albedo
            if (material.HasProperty("_Color"))
            {
                babylonPbrMaterial.albedo = material.color.ToFloat();
            }
            babylonPbrMaterial.albedoTexture = DumpTextureFromMaterial(material, "_MainTex");

            // Transparency
            DumpTransparency(material, babylonPbrMaterial);

            // Glossiess/Reflectivity
            DumpGlossinessReflectivity(material, metallic, babylonPbrMaterial);

            // Occlusion
            babylonPbrMaterial.ambientTexture = DumpTextureFromMaterial(material, "_OcclusionMap");
            if (babylonPbrMaterial.ambientTexture != null && material.HasProperty("_OcclusionStrength"))
            {
                babylonPbrMaterial.ambientTexture.level = material.GetFloat("_OcclusionStrength");
            }

            // Emissive
            if (material.HasProperty("_EmissionColor"))
            {
                babylonPbrMaterial.emissive = material.GetColor("_EmissionColor").ToFloat();
            }
            babylonPbrMaterial.emissiveTexture = DumpTextureFromMaterial(material, "_EmissionMap");

            // Normal
            babylonPbrMaterial.bumpTexture = DumpTextureFromMaterial(material, "_BumpMap");
            if (babylonPbrMaterial.bumpTexture != null && material.HasProperty("_BumpMapScale"))
            {
                babylonPbrMaterial.bumpTexture.level = material.GetFloat("_BumpMapScale");
            }

            // Reflection
            babylonPbrMaterial.reflectionTexture = DumpReflectionTexture();

            materialsDictionary.Add(babylonPbrMaterial.name, babylonPbrMaterial);
            return babylonPbrMaterial;
        }

        private void DumpGlossinessReflectivity(Material material, bool metallic, BabylonPBRMaterial babylonPbrMaterial)
        {
            if (material.HasProperty("_Glossiness"))
            {
                babylonPbrMaterial.microSurface = material.GetFloat("_Glossiness");
            }

            if (metallic)
            {
                if (material.HasProperty("_Metallic"))
                {
                    var metalness = material.GetFloat("_Metallic");
                    babylonPbrMaterial.reflectivity = new float[] { metalness * babylonPbrMaterial.albedo[0],
                        metalness * babylonPbrMaterial.albedo[1],
                        metalness * babylonPbrMaterial.albedo[2] };

                    if (babylonPbrMaterial.albedoTexture != null)
                    {
                        var albedoTexture = material.GetTexture("_MainTex") as Texture2D;
                        if (albedoTexture != null)
                        {
                            var albedoPixels = GetPixels(albedoTexture);
                            var reflectivityTexture = new Texture2D(albedoTexture.width, albedoTexture.height, TextureFormat.RGBA32, false);
                            reflectivityTexture.alphaIsTransparency = true;
                            babylonPbrMaterial.useMicroSurfaceFromReflectivityMapAlpha = true;

                            var metallicTexture = material.GetTexture("_MetallicGlossMap") as Texture2D;
                            if (metallicTexture == null)
                            {
                                for (var i = 0; i < albedoTexture.width; i++)
                                {
                                    for (var j = 0; j < albedoTexture.height; j++)
                                    {
                                        albedoPixels[j * albedoTexture.width + i].r *= metalness;
                                        albedoPixels[j * albedoTexture.width + i].g *= metalness;
                                        albedoPixels[j * albedoTexture.width + i].b *= metalness;
                                        albedoPixels[j * albedoTexture.width + i].a = babylonPbrMaterial.microSurface;
                                    }
                                }
                            }
                            else
                            {
                                var metallicPixels = GetPixels(metallicTexture);
                                for (var i = 0; i < albedoTexture.width; i++)
                                {
                                    for (var j = 0; j < albedoTexture.height; j++)
                                    {
                                        var metallicPixel = metallicPixels[j * albedoTexture.width + i];
                                        albedoPixels[j * albedoTexture.width + i].r *= metallicPixel.r;
                                        albedoPixels[j * albedoTexture.width + i].g *= metallicPixel.r;
                                        albedoPixels[j * albedoTexture.width + i].b *= metallicPixel.r;
                                        albedoPixels[j * albedoTexture.width + i].a = metallicPixel.a;
                                    }
                                }
                            }

                            reflectivityTexture.SetPixels(albedoPixels);
                            reflectivityTexture.Apply();

                            var textureName = albedoTexture.name + "_MetallicGlossMap.png";
                            var babylonTexture = new BabylonTexture { name = textureName };
                            var textureScale = material.GetTextureScale("_MainTex");
                            babylonTexture.uScale = textureScale.x;
                            babylonTexture.vScale = textureScale.y;

                            var textureOffset = material.GetTextureOffset("_MainTex");
                            babylonTexture.uOffset = textureOffset.x;
                            babylonTexture.vOffset = textureOffset.y;

                            var reflectivityTexturePath = Path.Combine(Path.GetTempPath(), textureName);
                            File.WriteAllBytes(reflectivityTexturePath, reflectivityTexture.EncodeToPNG());
                            babylonScene.AddTexture(reflectivityTexturePath);
                            if (File.Exists(reflectivityTexturePath))
                            {
                                File.Delete(reflectivityTexturePath);
                            }

                            babylonPbrMaterial.reflectivityTexture = babylonTexture;
                        }
                    }
                    //else
                    //{
                    //      TODO. Manage Albedo Cube Texture.
                    //}
                }
            }
            else
            {

                if (material.HasProperty("_SpecColor"))
                {
                    babylonPbrMaterial.reflectivity = material.GetColor("_SpecColor").ToFloat();
                }
                babylonPbrMaterial.reflectivityTexture = DumpTextureFromMaterial(material, "_SpecGlossMap");
                if (babylonPbrMaterial.reflectivityTexture != null && babylonPbrMaterial.reflectivityTexture.hasAlpha)
                {
                    babylonPbrMaterial.useMicroSurfaceFromReflectivityMapAlpha = true;
                }
            }
        }

        private static Color[] GetPixels(Texture2D texture)
        {
            string texturePath = AssetDatabase.GetAssetPath(texture);

            // Change texture import settings to be able to read texture data
            var textureImporter = AssetImporter.GetAtPath(texturePath) as TextureImporter;
            var previousIsReadable = textureImporter.isReadable;
            var previousNormalMap = textureImporter.normalmap;
            var previousLightmap = textureImporter.lightmap;
            var previousConvertToNormalmap = textureImporter.convertToNormalmap;
            var previousTextureType = textureImporter.textureType;
            var previousGrayscaleToAlpha = textureImporter.grayscaleToAlpha;

            textureImporter.textureType = TextureImporterType.Advanced;
            textureImporter.isReadable = true;
            textureImporter.lightmap = false;
            textureImporter.normalmap = false;
            textureImporter.convertToNormalmap = false;
            textureImporter.grayscaleToAlpha = false;

            AssetDatabase.ImportAsset(texturePath);

            var pixels = texture.GetPixels();

            // Restore
            textureImporter.isReadable = previousIsReadable;
            textureImporter.normalmap = previousNormalMap;
            textureImporter.lightmap = previousLightmap;
            textureImporter.convertToNormalmap = previousConvertToNormalmap;
            textureImporter.textureType = previousTextureType;
            textureImporter.grayscaleToAlpha = previousGrayscaleToAlpha;

            return pixels;
        }

        private static void DumpTransparency(Material material, BabylonPBRMaterial babylonPbrMaterial)
        {
            if (material.HasProperty("_Mode"))
            {
                var mode = material.GetFloat("_Mode");
                if (mode >= 2.0f)
                {
                    // Transparent Albedo
                    if (babylonPbrMaterial.albedoTexture != null && babylonPbrMaterial.albedoTexture.hasAlpha)
                    {
                        babylonPbrMaterial.useAlphaFromAlbedoTexture = true;
                    }
                    // Material Alpha
                    else
                    {
                        babylonPbrMaterial.alpha = babylonPbrMaterial.albedo[3];
                    }
                }
                else if (mode == 1.0f)
                {
                    // Cutout
                    // Follow the texture hasAlpha property.
                }
                else
                {
                    // Opaque
                    if (babylonPbrMaterial.albedoTexture != null)
                    {
                        babylonPbrMaterial.albedoTexture.hasAlpha = false;
                    }
                    babylonPbrMaterial.alpha = 1.0f;
                }
            }
        }

        private BabylonTexture DumpReflectionTexture()
        {
            if (sceneReflectionTexture != null)
            {
                return sceneReflectionTexture;
            }

            // Take only reflection source currently and not the RenderSettings.ambientMode
            if (RenderSettings.defaultReflectionMode == UnityEngine.Rendering.DefaultReflectionMode.Skybox)
            {
                var skybox = RenderSettings.skybox;
                if (skybox != null)
                {
                    if (skybox.shader.name == "Skybox/Cubemap")
                    {
                        var cubeMap = skybox.GetTexture("_Tex") as Cubemap;
                        if (cubeMap != null)
                        {
                            sceneReflectionTexture = new BabylonTexture();
                            CopyTextureCube("sceneReflectionTexture.hdr", cubeMap, sceneReflectionTexture);
                            sceneReflectionTexture.level = RenderSettings.reflectionIntensity;
                        }
                    }
                    //else if (skybox.shader.name == "Skybox/6 Sided")
                    //{
                    //    // TODO. HDR faces.
                    //}
                }
            }
            else if (RenderSettings.customReflection != null)
            {
                var cubeMap = RenderSettings.customReflection;
                sceneReflectionTexture = new BabylonTexture();
                CopyTextureCube("sceneReflectionTexture.hdr", cubeMap, sceneReflectionTexture);
                sceneReflectionTexture.level = RenderSettings.reflectionIntensity;
            }

            return sceneReflectionTexture;
        }

        private BabylonTexture DumpTextureFromMaterial(Material material, string name)
        {
            if (!material.HasProperty(name))
            {
                return null;
            }

            var texture = material.GetTexture(name);
            return DumpTexture(texture, material, name);
        }

        private BabylonTexture DumpTexture(Texture texture, Material material = null, string name = "", bool isLightmap = false)
        {
            if (texture == null)
            {
                return null;
            }

            var texturePath = AssetDatabase.GetAssetPath(texture);
            var textureName = Path.GetFileName(texturePath);
            var babylonTexture = new BabylonTexture { name = textureName };

            if (material != null)
            {
                var textureScale = material.GetTextureScale(name);
                babylonTexture.uScale = textureScale.x;
                babylonTexture.vScale = textureScale.y;

                var textureOffset = material.GetTextureOffset(name);
                babylonTexture.uOffset = textureOffset.x;
                babylonTexture.vOffset = textureOffset.y;
            }

            var texture2D = texture as Texture2D;
            if (texture2D)
            {
                babylonTexture.hasAlpha = texture2D.alphaIsTransparency;

                CopyTexture(texturePath, texture2D, babylonTexture, isLightmap);
            }
            else
            {
                var cubemap = texture as Cubemap;
                if (cubemap != null)
                {
                    CopyTextureCube(texturePath, cubemap, babylonTexture);
                }
            }

            return babylonTexture;
        }
    }
}
