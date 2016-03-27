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
                    }

                    var tempTexture = new Texture2D(cubemap.width, cubemap.height, cubemap.format, false);

                    tempTexture.SetPixels(cubemap.GetPixels(face));
                    tempTexture.Apply();

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
            var materialNotSupported = false; 

            if (!materialsDictionary.ContainsKey(material.name))
            {
                var bMat = new BabylonMaterial
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
