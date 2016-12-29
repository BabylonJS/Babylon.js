using System;
using System.IO;
using System.Text;
using System.Collections;
using System.Collections.Generic;
using BabylonExport.Entities;

using UnityEditor;
using UnityEngine;

namespace Unity3D2Babylon
{
    partial class SceneBuilder
    {
        private void CopyTextureCube(string texturePath, Cubemap cubemap, BabylonTexture babylonTexture, bool hdr = false)
        {
            if (!babylonScene.AddTextureCube(texturePath))
            {
                return;
            }
            ExporterWindow.ReportProgress(1, "Parsing texture cube: " + texturePath);
            var srcTexturePath = AssetDatabase.GetAssetPath(cubemap);
            bool textureNotExistsMode = (SceneController != null && SceneController.skyboxOptions.textureFile == BabylonTextureExport.IfNotExists);
            bool png = (exportationOptions.DefaultImageFormat == (int)BabylonImageFormat.PNG);
            string fext = (png == true) ? ".png" : ".jpg";
            try
            {
                if (hdr)
                {
                    var hdrTexturePath = Path.Combine(babylonScene.OutputPath, Path.GetFileName(texturePath));
                    bool writeHdrTexture = true;
                    string textureHdrName = Path.GetFileName(hdrTexturePath);
                    if (textureNotExistsMode && File.Exists(hdrTexturePath))
                    {
                        writeHdrTexture = false;
                        ExporterWindow.ReportProgress(1, "Texture hdr cube item exists: " + textureHdrName);
                    }
                    if (writeHdrTexture)
                    {
                        ExporterWindow.ReportProgress(1, "Copying hdr texture cube item: " + textureHdrName);
                        File.Copy(srcTexturePath, hdrTexturePath, true);
                    }
                }
                else
                {
                    var importTool = new BabylonTextureImporter(srcTexturePath);
                    bool isReadable = importTool.IsReadable();
                    if (!isReadable) importTool.SetReadable();
                    try
                    {
                        foreach (CubemapFace face in Enum.GetValues(typeof(CubemapFace)))
                        {
                            var faceTexturePath = Path.Combine(babylonScene.OutputPath, Path.GetFileNameWithoutExtension(texturePath));
                            switch (face)
                            {
                                case CubemapFace.PositiveX:
                                    faceTexturePath += ("_px" + fext);
                                    break;
                                case CubemapFace.NegativeX:
                                    faceTexturePath += ("_nx" + fext);
                                    break;
                                case CubemapFace.PositiveY:
                                    faceTexturePath += ("_py" + fext);
                                    break;
                                case CubemapFace.NegativeY:
                                    faceTexturePath += ("_ny" + fext);
                                    break;
                                case CubemapFace.PositiveZ:
                                    faceTexturePath += ("_pz" + fext);
                                    break;
                                case CubemapFace.NegativeZ:
                                    faceTexturePath += ("_nz" + fext);
                                    break;
                                default:
                                    continue;
                            }
                            bool writeFaceTexture = true;
                            string textureFaceName = Path.GetFileName(faceTexturePath);
                            if (textureNotExistsMode && File.Exists(faceTexturePath))
                            {
                                writeFaceTexture = false;
                                ExporterWindow.ReportProgress(1, "Texture cube item exists: " + textureFaceName);
                            }
                            if (writeFaceTexture)
                            {
                                ExporterWindow.ReportProgress(1, "Exporting texture cube item: " + textureFaceName);
                                var tempTexture = new Texture2D(cubemap.width, cubemap.height, TextureFormat.ARGB32, false);

                                Color[] pixels = cubemap.GetPixels(face);
                                tempTexture.SetPixels(pixels);
                                tempTexture.Apply();

                                // Flip faces in cube texture.
                                tempTexture = FlipTexture(tempTexture);

                                // Encode cube face texture
                                if (png)
                                {
                                    File.WriteAllBytes(faceTexturePath, tempTexture.EncodeToPNG());
                                }
                                else
                                {
                                    File.WriteAllBytes(faceTexturePath, tempTexture.EncodeToJPG(exportationOptions.DefaultQualityLevel));
                                }
                            }
                        }
                    }
                    finally
                    {
                        if (!isReadable) importTool.ForceUpdate();
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.LogException(ex);
            }
            if (babylonTexture != null)
            {
                var textureName = Path.GetFileNameWithoutExtension(texturePath);
                if (hdr) textureName += ".hdr";
                babylonTexture.name = textureName;
                babylonTexture.isCube = true;
                babylonTexture.level = exportationOptions.ReflectionDefaultLevel;
                babylonTexture.coordinatesMode = 3;
            }
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

        private void CopyTextureFace(string texturePath, string textureName, Texture2D textureFace)
        {
            if (!babylonScene.AddTextureCube(textureName))
            {
                return;
            }
            bool png = (exportationOptions.DefaultImageFormat == (int)BabylonImageFormat.PNG);
            bool textureNotExistsMode = (SceneController != null && SceneController.skyboxOptions.textureFile == BabylonTextureExport.IfNotExists);
            bool writeTextureFile = true;
            if (textureNotExistsMode && File.Exists(texturePath))
            {
                writeTextureFile = false;
                ExporterWindow.ReportProgress(1, "Texture cube item exists: " + textureName);
            }
            if (writeTextureFile)
            {
                var srcTexturePath = AssetDatabase.GetAssetPath(textureFace);
                if ((png && srcTexturePath.EndsWith(".png", StringComparison.OrdinalIgnoreCase)) || (!png && (srcTexturePath.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase) || srcTexturePath.EndsWith(".jpeg", StringComparison.OrdinalIgnoreCase))))
                {
                    ExporterWindow.ReportProgress(1, "Copying texture cube item: " + textureName);
                    File.Copy(srcTexturePath, texturePath, true);
                }
                else
                {
                    if (textureFace != null)
                    {
                        var importTool = new BabylonTextureImporter(srcTexturePath);
                        bool isReadable = importTool.IsReadable();
                        if (!isReadable) importTool.SetReadable();
                        try
                        {
                            ExporterWindow.ReportProgress(1, "Exporting texture cube item: " + textureName);
                            var tempTexture = new Texture2D(textureFace.width, textureFace.height, TextureFormat.ARGB32, false);
                            Color32[] pixels = textureFace.GetPixels32();
                            tempTexture.SetPixels32(pixels);
                            tempTexture.Apply();
                            if (png)
                            {
                                File.WriteAllBytes(texturePath, tempTexture.EncodeToPNG());
                            }
                            else
                            {
                                File.WriteAllBytes(texturePath, tempTexture.EncodeToJPG(exportationOptions.DefaultQualityLevel));
                            }
                        }
                        catch (Exception ex)
                        {
                            Debug.LogException(ex);
                        }
                        finally
                        {
                            if (!isReadable) importTool.ForceUpdate();
                        }
                    }
                }
            }
        }

        private void CopyTexture(string texturePath, Texture2D texture2D, BabylonTexture babylonTexture, bool isLightmap = false)
        {
            string rename = null;
            bool needToDelete = false;
            // Convert unsupported file extensions
            if (texturePath.EndsWith(".psd") || texturePath.EndsWith(".tif") || texturePath.EndsWith(".exr"))
            {
                string srcTexturePath = AssetDatabase.GetAssetPath(texture2D);
                var importTool = new BabylonTextureImporter(srcTexturePath);
                var previousConvertToNormalmap = importTool.textureImporter.convertToNormalmap;
                var previousAlphaSource = importTool.textureImporter.alphaSource;
                var previousTextureType = importTool.textureImporter.textureType;
                importTool.SetReadable();
                importTool.textureImporter.textureType = (isLightmap) ? TextureImporterType.Lightmap : TextureImporterType.Default;
                importTool.textureImporter.alphaSource = TextureImporterAlphaSource.FromInput;
                importTool.textureImporter.convertToNormalmap = false;
                AssetDatabase.ImportAsset(texturePath);

                try
                {
                    var usePNG = texture2D.alphaIsTransparency;
                    var tempTexture = new Texture2D(texture2D.width, texture2D.height, TextureFormat.ARGB32, false);
                    if (isLightmap)
                    {
                        rename = SceneName + Path.GetFileName(texturePath);
                        Color[] pixels = texture2D.GetPixels(0, 0, texture2D.width, texture2D.height);
                        for (int index = 0; index < pixels.Length; index++)
                        {
                            pixels[index].r = pixels[index].r * pixels[index].a * 5;
                            pixels[index].g = pixels[index].g * pixels[index].a * 5;
                            pixels[index].b = pixels[index].b * pixels[index].a * 5;
                        }
                        tempTexture.SetPixels(pixels);
                    }
                    else
                    {
                        Color[] pixels = texture2D.GetPixels(0, 0, texture2D.width, texture2D.height);
                        for (int index = 0; index < pixels.Length; index++)
                        {
                            usePNG |= pixels[index].a <= 0.99999f;
                        }
                        tempTexture.SetPixels32(texture2D.GetPixels32());
                    }
                    tempTexture.Apply();
                    string outputfile = (!String.IsNullOrEmpty(rename)) ? rename : texturePath;
                    texturePath = Path.Combine(Path.GetTempPath(), Path.GetFileName(outputfile));
                    var extension = (usePNG || exportationOptions.DefaultImageFormat == (int)BabylonImageFormat.PNG) ? ".png" : ".jpg";
                    texturePath = texturePath.Replace(".psd", extension).Replace(".tif", extension).Replace(".exr", extension);
                    File.WriteAllBytes(texturePath, (usePNG || exportationOptions.DefaultImageFormat == (int)BabylonImageFormat.PNG) ? tempTexture.EncodeToPNG() : tempTexture.EncodeToJPG(exportationOptions.DefaultQualityLevel));
                    needToDelete = true;
                }
                catch (Exception ex)
                {
                    Debug.LogException(ex);
                }
                finally
                {
                    importTool.textureImporter.textureType = previousTextureType;
                    importTool.textureImporter.alphaSource = previousAlphaSource;
                    importTool.textureImporter.convertToNormalmap = previousConvertToNormalmap;
                    importTool.ForceUpdate();
                }
            }
            else if (texture2D.alphaIsTransparency || texturePath.EndsWith(".png"))
            {
                babylonTexture.hasAlpha = true;
            }
            else
            {
                babylonTexture.hasAlpha = false;
            }
            var textureName = Path.GetFileName(texturePath);
            babylonTexture.name = textureName;
            babylonScene.AddTexture(texturePath);
            if (needToDelete) File.Delete(texturePath);
        }

        private static Color[] GetPixels(Texture2D texture)
        {
            Color[] pixels = null;
            string srcTexturePath = AssetDatabase.GetAssetPath(texture);
            var importTool = new BabylonTextureImporter(srcTexturePath);
            bool isReadable = importTool.IsReadable();
            if (!isReadable) importTool.SetReadable();
            try
            {
                pixels = texture.GetPixels();
            }
            catch (Exception ex)
            {
                Debug.LogException(ex);
            }
            finally
            {
                if (!isReadable) importTool.ForceUpdate();
            }
            return pixels;
        }

        private BabylonMaterial DumpMaterial(Material material, int lightmapIndex = -1, Vector4 lightmapScaleOffset = default(Vector4), int lightmapCoordIndex = -1)
        {
            if (material.shader.name == "Standard" || material.shader.name == "BabylonJS/Materials/PBR Material")
            {
                return DumpPBRMaterial(material, lightmapIndex, lightmapScaleOffset, true, lightmapCoordIndex);
            }
            else if (material.shader.name == "Standard (Specular setup)" || material.shader.name == "BabylonJS/Materials/PBR Material (Specular)")
            {
                return DumpPBRMaterial(material, lightmapIndex, lightmapScaleOffset, false, lightmapCoordIndex);
            }
            else if (material.shader.name.StartsWith("BabylonJS/Materials/", StringComparison.OrdinalIgnoreCase))
            {
                return DumpStandardMaterial(material, lightmapIndex, lightmapScaleOffset, lightmapCoordIndex);
            }
            else if (material.shader.name.StartsWith("BabylonJS/", StringComparison.OrdinalIgnoreCase))
            {
                return DumpShaderMaterial(material);
            }
            return DumpStandardMaterial(material, lightmapIndex, lightmapScaleOffset, lightmapCoordIndex);
        }

        private BabylonMaterial DumpStandardMaterial(Material material, int lightmapIndex = -1, Vector4 lightmapScaleOffset = default(Vector4), int lightmapCoordIndex = -1)
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

                ExporterWindow.ReportProgress(1, "Exporting standard material: " + material.name);

                // Default diffuse
                bMat.diffuse[0] = 1.0f;
                bMat.diffuse[1] = 1.0f;
                bMat.diffuse[2] = 1.0f;
                bMat.diffuse[3] = 1.0f;

                // Default specular
                bMat.specular[0] = 0.0f;
                bMat.specular[1] = 0.0f;
                bMat.specular[2] = 0.0f;
                bMat.specular[3] = 1.0f;

                if (material.mainTexture && material.mainTexture.GetType().FullName == "UnityEngine.ProceduralTexture")
                {
                    materialNotSupported = true;
                    Debug.LogWarning("ProceduralTexture: " + material.mainTexture.name + " not supported by Babylon.js");
                }

                if (material.HasProperty("_Shininess"))
                {
                    var specShininess = material.GetFloat("_Shininess");
                    bMat.specularPower = specShininess * 128;
                }
                if (material.HasProperty("_Color"))
                {
                    bMat.diffuse = material.color.ToFloat();
                }
                if (material.HasProperty("_SpecColor"))
                {
                    var specColor = material.GetColor("_SpecColor");
                    bMat.specular = specColor.ToFloat();
                }
                if (material.HasProperty("_Emission"))
                {
                    if (material.GetColorNames().IndexOf("_Emission") >= 0)
                    {
                        var emissiveColor = material.GetColor("_Emission");
                        bMat.emissive = emissiveColor.ToFloat();
                    }
                    else if (material.GetFloatNames().IndexOf("_Emission") >= 0)
                    {
                        // TODO: Convert Lightmapper Emission Color
                        UnityEngine.Debug.LogWarning("Material Emission Is Float Not Color: " + material.name);
                    }
                }

                if (material.HasProperty("_AlphaMode"))
                {
                    bMat.alphaMode = material.GetInt("_AlphaMode");
                }

                if (material.HasProperty("_DisableLighting"))
                {
                    bMat.disableLighting = (material.GetInt("_DisableLighting") != 0);
                }
                
                if (material.HasProperty("_UseEmissiveAsIllumination"))
                {
                    bMat.useEmissiveAsIllumination = (material.GetInt("_UseEmissiveAsIllumination") != 0);
                }

                if (material.HasProperty("_BackFaceCulling"))
                {
                    bMat.backFaceCulling = (material.GetInt("_BackFaceCulling") != 0);
                }

                if (material.mainTexture && !materialNotSupported)
                {
                    var mainTexture2D = material.mainTexture as Texture2D;
                    var mainTexturePath = AssetDatabase.GetAssetPath(mainTexture2D);
                    var alphaCuttOff = 0f;
                    if (material.HasProperty("_Cutoff"))
                    {
                        alphaCuttOff = material.GetFloat("_Cutoff");
                    }
                    bMat.diffuseTexture = new BabylonTexture
                    {
                        uScale = material.mainTextureScale.x,
                        vScale = material.mainTextureScale.y,
                        uOffset = material.mainTextureOffset.x,
                        vOffset = material.mainTextureOffset.y
                    };
                    CopyTexture(mainTexturePath, mainTexture2D, bMat.diffuseTexture);
                    if ((mainTexture2D && mainTexture2D.alphaIsTransparency) || alphaCuttOff > 0)
                    {
                        bMat.diffuseTexture.hasAlpha = true;
                        bMat.backFaceCulling = false;
                    }
                }

                // Normal map
                bMat.bumpTexture = DumpTextureFromMaterial(material, "_BumpMap");
                if (bMat.bumpTexture != null && material.HasProperty("_BumpScale"))
                {
                    bMat.bumpTexture.level = material.GetFloat("_BumpScale");
                }

                bMat.emissiveTexture = DumpTextureFromMaterial(material, "_Illum");
                bMat.ambientTexture = DumpTextureFromMaterial(material, "_LightMap");
                bMat.reflectionTexture = DumpTextureFromMaterial(material, "_Cube");

                // Baking override
                if (exportationOptions.DefaultLightmapMode == (int)BabylonLightmapMode.FullLightBaking)
                {
                    bMat.disableLighting = true;
                    bMat.useEmissiveAsIllumination = true;
                }

                // If no ambient texture already (ambientTexture manually set for lightmaps on standard material)
                bool hasLightmap = (exportationOptions.ExportLightmaps && lightmapIndex >= 0 && lightmapIndex != 65535 && LightmapSettings.lightmaps.Length > lightmapIndex);
                if (hasLightmap && bMat.ambientTexture == null)
                {
                    var lightmap = LightmapSettings.lightmaps[lightmapIndex].lightmapLight;
                    var texturePath = AssetDatabase.GetAssetPath(lightmap);
                    if (!String.IsNullOrEmpty(texturePath))
                    {
                        ExporterWindow.ReportProgress(1, "Dumping std material lightmap: " + lightmap.name);
                        bMat.lightmapTexture = DumpTexture(lightmap, isLightmap: true);
                        bMat.lightmapTexture.coordinatesIndex = (lightmapCoordIndex >= 0) ? lightmapCoordIndex : exportationOptions.DefaultCoordinatesIndex;
                        bMat.useLightmapAsShadowmap = true;

                        bMat.lightmapTexture.uScale = lightmapScaleOffset.x;
                        bMat.lightmapTexture.vScale = lightmapScaleOffset.y;

                        bMat.lightmapTexture.uOffset = lightmapScaleOffset.z;
                        bMat.lightmapTexture.vOffset = lightmapScaleOffset.w;
                    }
                }
                materialsDictionary.Add(bMat.name, bMat);
                return bMat;
            }
            return materialsDictionary[material.name];
        }

        private BabylonMaterial DumpPBRMaterial(Material material, int lightmapIndex = -1, Vector4 lightmapScaleOffset = default(Vector4), bool metallic = true, int lightmapCoordIndex = -1)
        {
            var materialNotSupported = false;
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

            ExporterWindow.ReportProgress(1, "Exporting physical material: " + material.name);
            babylonPbrMaterial.environmentIntensity = RenderSettings.ambientIntensity;

            if (material.mainTexture && material.mainTexture.GetType().FullName == "UnityEngine.ProceduralTexture")
            {
                materialNotSupported = true;
                Debug.LogWarning("ProceduralTexture: " + material.mainTexture.name + " not supported by Babylon.js");
            }

            if (material.HasProperty("_Roughness"))
            {
                babylonPbrMaterial.roughness = material.GetInt("_Roughness");
            }

            if (material.HasProperty("_UseRoughnessFromMetallicTextureAlpha"))
            {
                babylonPbrMaterial.useRoughnessFromMetallicTextureAlpha = (material.GetInt("_UseRoughnessFromMetallicTextureAlpha") != 0);
            }

            if (material.HasProperty("_UseRoughnessFromMetallicTextureGreen"))
            {
                babylonPbrMaterial.useRoughnessFromMetallicTextureGreen = (material.GetInt("_UseRoughnessFromMetallicTextureGreen") != 0);
            }

            if (material.HasProperty("_AlphaMode"))
            {
                babylonPbrMaterial.alphaMode = material.GetInt("_AlphaMode");
            }

            if (material.HasProperty("_DisableLighting"))
            {
                babylonPbrMaterial.disableLighting = (material.GetInt("_DisableLighting") != 0);
            }
            
            if (material.HasProperty("_UseEmissiveAsIllumination"))
            {
                babylonPbrMaterial.useEmissiveAsIllumination = (material.GetInt("_UseEmissiveAsIllumination") != 0);
            }

            if (material.HasProperty("_BackFaceCulling"))
            {
                babylonPbrMaterial.backFaceCulling = (material.GetInt("_BackFaceCulling") != 0);
            }

            // Albedo
            if (material.HasProperty("_Color"))
            {
                babylonPbrMaterial.albedo = material.color.ToFloat();
            }
            babylonPbrMaterial.albedoTexture = DumpTextureFromMaterial(material, "_MainTex");
            if (material.mainTexture != null && !materialNotSupported)
            {
                var textureScale = material.mainTextureScale;
                babylonPbrMaterial.albedoTexture.uScale = textureScale.x;
                babylonPbrMaterial.albedoTexture.vScale = textureScale.y;
                var textureOffset = material.mainTextureOffset;
                babylonPbrMaterial.albedoTexture.uOffset = textureOffset.x;
                babylonPbrMaterial.albedoTexture.vOffset = textureOffset.y;
            }
            // Emissive
            if (material.HasProperty("_EmissionColor"))
            {
                babylonPbrMaterial.emissive = material.GetColor("_EmissionColor").ToFloat();
            }
            babylonPbrMaterial.emissiveTexture = DumpTextureFromMaterial(material, "_EmissionMap");

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

            // Normal
            babylonPbrMaterial.bumpTexture = DumpTextureFromMaterial(material, "_BumpMap");
            if (babylonPbrMaterial.bumpTexture != null && material.HasProperty("_BumpScale"))
            {
                babylonPbrMaterial.bumpTexture.level = material.GetFloat("_BumpScale");
            }

            // Reflection
            babylonPbrMaterial.reflectionTexture = DumpReflectionTexture();

            // Baking Override
            if (exportationOptions.DefaultLightmapMode == (int)BabylonLightmapMode.FullLightBaking)
            {
                babylonPbrMaterial.disableLighting = true;
                babylonPbrMaterial.useEmissiveAsIllumination = true;
            }

            // Lightmapping
            bool hasLightmap = (exportationOptions.ExportLightmaps && lightmapIndex >= 0 && lightmapIndex != 65535 && LightmapSettings.lightmaps.Length > lightmapIndex);
            if (hasLightmap && babylonPbrMaterial.ambientTexture == null)
            {
                var lightmap = LightmapSettings.lightmaps[lightmapIndex].lightmapLight;
                var texturePath = AssetDatabase.GetAssetPath(lightmap);
                if (!String.IsNullOrEmpty(texturePath))
                {
                    ExporterWindow.ReportProgress(1, "Dumping pbr material lightmap: " + lightmap.name);
                    babylonPbrMaterial.lightmapTexture = DumpTexture(lightmap, isLightmap: true);
                    babylonPbrMaterial.lightmapTexture.coordinatesIndex = (lightmapCoordIndex >= 0) ? lightmapCoordIndex : exportationOptions.DefaultCoordinatesIndex;
                    babylonPbrMaterial.useLightmapAsShadowmap = true;

                    babylonPbrMaterial.lightmapTexture.uScale = lightmapScaleOffset.x;
                    babylonPbrMaterial.lightmapTexture.vScale = lightmapScaleOffset.y;

                    babylonPbrMaterial.lightmapTexture.uOffset = lightmapScaleOffset.z;
                    babylonPbrMaterial.lightmapTexture.vOffset = lightmapScaleOffset.w;
                }
            }
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
                    babylonPbrMaterial.reflectivity = new float[] { metalness * babylonPbrMaterial.albedo[0], metalness * babylonPbrMaterial.albedo[1], metalness * babylonPbrMaterial.albedo[2] };

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

        private BabylonMaterial DumpShaderMaterial(Material material)
        {
            if (materialsDictionary.ContainsKey(material.name))
            {
                return materialsDictionary[material.name];
            }

            var babylonShaderMaterial = new BabylonShaderMaterial
            {
                name = material.name,
                id = Guid.NewGuid().ToString(),
            };

            ExporterWindow.ReportProgress(1, "Exporting glsl material: " + material.name);

            List<string> tnames = material.GetTextureNames();
            foreach (string tname in tnames)
            {
                BabylonTexture tdata = DumpTextureFromMaterial(material, tname);
                if (tdata != null)
                {
                    babylonShaderMaterial.textures.Add(tname, tdata);
                }
            }

            List<string> fnames = material.GetFloatNames();
            foreach (string fname in fnames)
            {
                float fdata = material.GetFloat(fname);
                babylonShaderMaterial.floats.Add(fname, fdata);
            }

            List<string> rnames = material.GetRangeNames();
            foreach (string rname in rnames)
            {
                float rdata = material.GetFloat(rname);
                babylonShaderMaterial.floats.Add(rname, rdata);
            }

            List<string> cnames = material.GetColorNames();
            foreach (string cname in cnames)
            {
                Color cdata = material.GetColor(cname);
                babylonShaderMaterial.vectors4.Add(cname, cdata.ToFloat());
            }

            List<string> vnames = material.GetVectorNames();
            foreach (string vname in vnames)
            {
                Vector4 vdata = material.GetVector(vname);
                babylonShaderMaterial.vectors4.Add(vname, vdata.ToFloat());
            }

            Shader shader = material.shader;
            string filename = AssetDatabase.GetAssetPath(shader);
            string program = Tools.LoadTextAsset(filename);
            string basename = shader.name.Replace("BabylonJS/", "").Replace("/", "_").Replace(" ", "");
            string outpath = (!String.IsNullOrEmpty(exportationOptions.DefaultShaderFolder)) ? exportationOptions.DefaultShaderFolder : OutputPath;

            var shaderpath = new Dictionary<string, string>();
            List<string> attributeList = new List<string>();
            List<string> uniformList = new List<string>();
            List<string> samplerList = new List<string>();
            List<string> defineList = new List<string>();
            string babylonOptions = GetShaderProgramSection(basename, program, BabylonProgramSection.Babylon);
            string[] babylonLines = babylonOptions.Split('\n');
            foreach (string babylonLine in babylonLines)
            {
                if (babylonLine.IndexOf("attributes", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    string[] attributes = babylonLine.Split(':');
                    if (attributes != null && attributes.Length > 1)
                    {
                        string abuffer = attributes[1].Replace("[", "").Replace("]", "").Replace("\"", "");
                        if (!String.IsNullOrEmpty(abuffer))
                        {
                            abuffer = abuffer.Trim();
                            string[] adata = abuffer.Split(',');
                            if (adata != null && adata.Length > 0)
                            {
                                foreach (string aoption in adata)
                                {
                                    string aoption_buffer = aoption.Trim();
                                    if (!String.IsNullOrEmpty(aoption_buffer))
                                    {
                                        attributeList.Add(aoption_buffer);
                                    }
                                }
                            }
                        }
                    }
                }
                else if (babylonLine.IndexOf("uniforms", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    string[] uniforms = babylonLine.Split(':');
                    if (uniforms != null && uniforms.Length > 1)
                    {
                        string ubuffer = uniforms[1].Replace("[", "").Replace("]", "").Replace("\"", "");
                        if (!String.IsNullOrEmpty(ubuffer))
                        {
                            ubuffer = ubuffer.Trim();
                            string[] udata = ubuffer.Split(',');
                            if (udata != null && udata.Length > 0)
                            {
                                foreach (string uoption in udata)
                                {
                                    string uoption_buffer = uoption.Trim();
                                    if (!String.IsNullOrEmpty(uoption_buffer))
                                    {
                                        uniformList.Add(uoption_buffer);
                                    }
                                }
                            }
                        }
                    }
                }
                else if (babylonLine.IndexOf("samplers", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    string[] samplers = babylonLine.Split(':');
                    if (samplers != null && samplers.Length > 1)
                    {
                        string sbuffer = samplers[1].Replace("[", "").Replace("]", "").Replace("\"", "");
                        if (!String.IsNullOrEmpty(sbuffer))
                        {
                            sbuffer = sbuffer.Trim();
                            string[] sdata = sbuffer.Split(',');
                            if (sdata != null && sdata.Length > 0)
                            {
                                foreach (string soption in sdata)
                                {
                                    string soption_buffer = soption.Trim();
                                    if (!String.IsNullOrEmpty(soption_buffer))
                                    {
                                        samplerList.Add(soption_buffer);
                                    }
                                }
                            }
                        }
                    }
                }
                else if (babylonLine.IndexOf("defines", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    string[] defines = babylonLine.Split(':');
                    if (defines != null && defines.Length > 1)
                    {
                        string dbuffer = defines[1].Replace("[", "").Replace("]", "").Replace("\"", "");
                        if (!String.IsNullOrEmpty(dbuffer))
                        {
                            dbuffer = dbuffer.Trim();
                            string[] ddata = dbuffer.Split(',');
                            if (ddata != null && ddata.Length > 0)
                            {
                                foreach (string doption in ddata)
                                {
                                    string doption_buffer = doption.Trim();
                                    if (!String.IsNullOrEmpty(doption_buffer))
                                    {
                                        defineList.Add(doption_buffer);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (material.HasProperty("_AlphaMode")) {
                babylonShaderMaterial.alphaMode = material.GetInt("_AlphaMode");
            }
            bool needsAlphaBlending = false;
            if (material.HasProperty("_NeedsAlphaBlending")) {
                needsAlphaBlending = (material.GetInt("_NeedsAlphaBlending") != 0);
            }
            bool needsAlphaTesting = false;
            if (material.HasProperty("_NeedsAlphaTesting")) {
                needsAlphaTesting = (material.GetInt("_NeedsAlphaTesting") != 0);
            }
            if (material.HasProperty("_BackFaceCulling")) {
                babylonShaderMaterial.backFaceCulling = (material.GetInt("_BackFaceCulling") != 0);
            }
            babylonShaderMaterial.options = new BabylonShaderOptions();
            babylonShaderMaterial.options.needAlphaBlending = needsAlphaBlending;
            babylonShaderMaterial.options.needAlphaTesting = needsAlphaTesting;
            babylonShaderMaterial.options.attributes = attributeList.ToArray();
            babylonShaderMaterial.options.uniforms = uniformList.ToArray();
            babylonShaderMaterial.options.samplers = samplerList.ToArray();
            babylonShaderMaterial.options.defines = defineList.ToArray();

            string vertexProgram = GetShaderProgramSection(basename, program, BabylonProgramSection.Vertex);
            var vertextFile = Path.Combine(outpath, basename + ".vertex.fx");
            if (exportationOptions.EmbeddedShaders)
            {
                shaderpath.Add("vertexElement", ("base64:" + Tools.FormatBase64(vertexProgram)));
            }
            else
            {
                File.WriteAllText(vertextFile, vertexProgram);
            }

            string fragmentProgram = GetShaderProgramSection(basename, program, BabylonProgramSection.Fragment);
            var fragmentFile = Path.Combine(outpath, basename + ".fragment.fx");
            if (exportationOptions.EmbeddedShaders)
            {
                shaderpath.Add("fragmentElement", ("base64:" + Tools.FormatBase64(fragmentProgram)));
            }
            else
            {
                File.WriteAllText(fragmentFile, fragmentProgram);
            }

            babylonShaderMaterial.shaderPath = (exportationOptions.EmbeddedShaders) ? (object)shaderpath : (object)basename;
            materialsDictionary.Add(babylonShaderMaterial.name, babylonShaderMaterial);
            return babylonShaderMaterial;
        }

        private string GetShaderProgramSection(string name, string program, BabylonProgramSection section)
        {
            string result = String.Empty;
            string[] lines = program.Split('\n');
            int babylonIndexStart = -1, babylonIndexEnd = -1;
            int vertextIndexStart = -1, vertextIndexEnd = -1;
            int fragmentIndexStart = -1, fragmentIndexEnd = -1;
            for (int ii = 0; ii < lines.Length; ii++)
            {
                string line = lines[ii];
                if (babylonIndexStart < 0 && line.IndexOf("#ifdef BABYLON", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    babylonIndexStart = ii;
                }
                if (babylonIndexEnd < 0 && line.IndexOf("#endif //BABYLON-END", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    babylonIndexEnd = ii;
                }
                if (vertextIndexStart < 0 && line.IndexOf("#ifdef VERTEX", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    vertextIndexStart = ii;
                }
                if (vertextIndexEnd < 0 && line.IndexOf("#endif //VERTEX-END", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    vertextIndexEnd = ii;
                }
                if (fragmentIndexStart < 0 && line.IndexOf("#ifdef FRAGMENT", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    fragmentIndexStart = ii;
                }
                if (fragmentIndexEnd < 0 && line.IndexOf("#endif //FRAGMENT-END", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    fragmentIndexEnd = ii;
                }
            }
            // Note: All Babylon Shader Blocks Are Required
            if (babylonIndexStart >= 0 && babylonIndexEnd >= 0 && vertextIndexStart >= 0 && vertextIndexEnd >= 0 && fragmentIndexStart >= 0 && fragmentIndexEnd >= 0)
            {
                int lineStart = -1, lineEnd = -1;
                switch (section)
                {
                    case BabylonProgramSection.Babylon:
                        lineStart = babylonIndexStart;
                        lineEnd = babylonIndexEnd;
                        break;
                    case BabylonProgramSection.Vertex:
                        lineStart = vertextIndexStart;
                        lineEnd = vertextIndexEnd;
                        break;
                    case BabylonProgramSection.Fragment:
                        lineStart = fragmentIndexStart;
                        lineEnd = fragmentIndexEnd;
                        break;
                }
                if (lineStart >= 0 && lineEnd >= 0)
                {
                    lineStart++;
                    for (int xx = lineStart; xx < lineEnd; xx++)
                    {
                        string buffer = lines[xx];
                        buffer = buffer.TrimEnd('\n').TrimEnd('\r');
                        result += (buffer + "\r\n");
                    }
                }
                else
                {
                    Debug.LogError("Invalid Babylon Shader Block Lines: " + name);
                }
            }
            else
            {
                Debug.LogError("Invalid Babylon Shader Block Format: " + name);
            }
            return result;
        }

        private BabylonTexture DumpReflectionTexture()
        {
            if (sceneReflectionTexture != null)
            {
                return sceneReflectionTexture;
            }

            bool png = (exportationOptions.DefaultImageFormat == (int)BabylonImageFormat.PNG);
            string fext = (png == true) ? ".png" : ".jpg";

            // Take only reflection source currently and not the RenderSettings.ambientMode
            if (RenderSettings.defaultReflectionMode == UnityEngine.Rendering.DefaultReflectionMode.Skybox)
            {
                var skybox = RenderSettings.skybox;
                if (SceneController != null && skybox != null)
                {
                    if (skybox.shader.name == "Skybox/Cubemap")
                    {
                        var cubeMap = skybox.GetTexture("_Tex") as Cubemap;
                        if (cubeMap != null)
                        {
                            var srcTexturePath = AssetDatabase.GetAssetPath(cubeMap);
                            if (srcTexturePath.EndsWith(".hdr", StringComparison.OrdinalIgnoreCase))
                            {
                                var hdr = new BabylonHDRCubeTexture();
                                hdr.size = cubeMap.width;
                                sceneReflectionTexture = hdr;
                                sceneReflectionTexture.isCube = true;
                                CopyTextureCube(String.Format("{0}Reflection.hdr", SceneName), cubeMap, sceneReflectionTexture, true);
                            }
                            else
                            {
                                sceneReflectionTexture = new BabylonTexture();
                                sceneReflectionTexture.isCube = true;
                                CopyTextureCube(String.Format("{0}Reflection.hdr", SceneName), cubeMap, sceneReflectionTexture, false);
                                if (png) (sceneReflectionTexture as BabylonTexture).extensions = new string[] { "_px.png", "_py.png", "_pz.png", "_nx.png", "_ny.png", "_nz.png" };
                            }
                            sceneReflectionTexture.level = (SceneController != null) ? SceneController.skyboxOptions.lightIntensity : 1.0f;
                        }
                    }
                    else if (skybox.shader.name == "Skybox/6 Sided")
                    {
                        var frontTexture = skybox.GetTexture("_FrontTex") as Texture2D;
                        var backTexture = skybox.GetTexture("_BackTex") as Texture2D;
                        var leftTexture = skybox.GetTexture("_LeftTex") as Texture2D;
                        var rightTexture = skybox.GetTexture("_RightTex") as Texture2D;
                        var upTexture = skybox.GetTexture("_UpTex") as Texture2D;
                        var downTexture = skybox.GetTexture("_DownTex") as Texture2D;
                        if (frontTexture != null && backTexture != null && leftTexture != null && rightTexture != null && upTexture != null && downTexture != null)
                        {
                            sceneReflectionTexture = new BabylonTexture();
                            sceneReflectionTexture.name = String.Format("{0}Reflection", SceneName);
                            sceneReflectionTexture.isCube = true;

                            var frontTextureName = String.Format("{0}_pz{1}", sceneReflectionTexture.name, fext);
                            var frontTexturePath = Path.Combine(babylonScene.OutputPath, frontTextureName);
                            CopyTextureFace(frontTexturePath, frontTextureName, frontTexture);

                            var backTextureName = String.Format("{0}_nz{1}", sceneReflectionTexture.name, fext);
                            var backTexturePath = Path.Combine(babylonScene.OutputPath, backTextureName);
                            CopyTextureFace(backTexturePath, backTextureName, backTexture);

                            var leftTextureName = String.Format("{0}_px{1}", sceneReflectionTexture.name, fext);
                            var leftTexturePath = Path.Combine(babylonScene.OutputPath, leftTextureName);
                            CopyTextureFace(leftTexturePath, leftTextureName, leftTexture);

                            var rightTextureName = String.Format("{0}_nx{1}", sceneReflectionTexture.name, fext);
                            var rightTexturePath = Path.Combine(babylonScene.OutputPath, rightTextureName);
                            CopyTextureFace(rightTexturePath, rightTextureName, rightTexture);

                            var upTextureName = String.Format("{0}_py{1}", sceneReflectionTexture.name, fext);
                            var upTexturePath = Path.Combine(babylonScene.OutputPath, upTextureName);
                            CopyTextureFace(upTexturePath, upTextureName, upTexture);

                            var downTextureName = String.Format("{0}_ny{1}", sceneReflectionTexture.name, fext);
                            var downTexturePath = Path.Combine(babylonScene.OutputPath, downTextureName);
                            CopyTextureFace(downTexturePath, downTexturePath, downTexture);

                            if (png) (sceneReflectionTexture as BabylonTexture).extensions = new string[] { "_px.png", "_py.png", "_pz.png", "_nx.png", "_ny.png", "_nz.png" };
                            sceneReflectionTexture.level = (SceneController != null) ? SceneController.skyboxOptions.lightIntensity : 1.0f;
                        }
                    }
                }
            }
            else if (RenderSettings.customReflection != null)
            {
                var cubeMap = RenderSettings.customReflection;
                var srcTexturePath = AssetDatabase.GetAssetPath(cubeMap);
                if (srcTexturePath.EndsWith(".hdr", StringComparison.OrdinalIgnoreCase))
                {
                    var hdr = new BabylonHDRCubeTexture();
                    hdr.size = cubeMap.width;
                    sceneReflectionTexture = hdr;
                    sceneReflectionTexture.isCube = true;
                    CopyTextureCube(String.Format("{0}Reflection.hdr", SceneName), cubeMap, sceneReflectionTexture);
                }
                else
                {
                    sceneReflectionTexture = new BabylonTexture();
                    sceneReflectionTexture.isCube = true;
                    CopyTextureCube(String.Format("{0}Reflection.hdr", SceneName), cubeMap, sceneReflectionTexture);
                    if (png) (sceneReflectionTexture as BabylonTexture).extensions = new string[] { "_px.png", "_py.png", "_pz.png", "_nx.png", "_ny.png", "_nz.png" };
                }
                sceneReflectionTexture.level = (SceneController != null) ? SceneController.skyboxOptions.lightIntensity : 1.0f;
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
                    else
                    {
                        // Material Alpha
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
    }
}
