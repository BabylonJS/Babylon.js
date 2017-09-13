using System;
using System.Collections.Generic;
using System.IO;
using Autodesk.Max;
using BabylonExport.Entities;
using System.Drawing;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
        // -------------------------------
        // --- "public" export methods ---
        // -------------------------------

        private BabylonTexture ExportTexture(IStdMat2 stdMat, int index, out BabylonFresnelParameters fresnelParameters, BabylonScene babylonScene, bool allowCube = false, bool forceAlpha = false)
        {
            fresnelParameters = null;

            if (!stdMat.MapEnabled(index))
            {
                return null;
            }

            var texMap = stdMat.GetSubTexmap(index);

            if (texMap == null)
            {
                RaiseWarning("Texture channel " + index + " activated but no texture found.", 2);
                return null;
            }

            texMap = _exportFresnelParameters(texMap, out fresnelParameters);

            var amount = stdMat.GetTexmapAmt(index, 0);

            return _exportTexture(texMap, amount, babylonScene, allowCube, forceAlpha);
        }

        private BabylonTexture ExportPBRTexture(IIGameMaterial materialNode, int index, BabylonScene babylonScene, float amount = 1.0f)
        {
            var texMap = _getTexMap(materialNode, index);
            if (texMap != null)
            {
                return _exportTexture(texMap, amount, babylonScene);
            }
            return null;
        }

        private BabylonTexture ExportMetallicRoughnessTexture(IIGameMaterial materialNode, float metallic, float roughness, BabylonScene babylonScene, string materialName)
        {
            ITexmap metallicTexMap = _getTexMap(materialNode, 5);
            ITexmap roughnessTexMap = _getTexMap(materialNode, 4);

            if (metallicTexMap == null && roughnessTexMap == null)
            {
                return null;
            }

            // Use one as a reference for UVs parameters
            var referenceTexMap = metallicTexMap != null ? metallicTexMap : roughnessTexMap;


            // --- Babylon texture ---

            if (referenceTexMap.GetParamBlock(0) == null || referenceTexMap.GetParamBlock(0).Owner == null)
            {
                return null;
            }

            var texture = referenceTexMap.GetParamBlock(0).Owner as IBitmapTex;

            if (texture == null)
            {
                return null;
            }

            var babylonTexture = new BabylonTexture
            {
                name = materialName + "_metallicRoughness" + ".jpg" // TODO - unsafe name, may conflict with another texture name
            };

            // Level
            babylonTexture.level = 1.0f;

            // No alpha
            babylonTexture.hasAlpha = false;
            babylonTexture.getAlphaFromRGB = false;

            // UVs
            var uvGen = _exportUV(texture, babylonTexture);

            // Is cube
            _exportIsCube(texture, babylonTexture, false);


            // --- Merge metallic and roughness maps ---

            // Load bitmaps
            var metallicBitmap = _loadTexture(metallicTexMap);
            var roughnessBitmap = _loadTexture(roughnessTexMap);

            // Retreive dimensions
            int width = 0;
            int height = 0;
            var haveSameDimensions = _getMinimalBitmapDimensions(out width, out height, metallicBitmap, roughnessBitmap);
            if (!haveSameDimensions)
            {
                RaiseWarning("Metallic and roughness maps should have same dimensions", 2);
            }

            // Create metallic+roughness map
            Bitmap metallicRoughnessBitmap = new Bitmap(width, height);
            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    var _metallic = metallicBitmap != null ? metallicBitmap.GetPixel(x, y).R :
                                    metallic * 255.0f;
                    var _roughness = roughnessBitmap != null ? roughnessBitmap.GetPixel(x, y).R :
                                    roughness * 255.0f;

                    // The metalness values are sampled from the B channel.
                    // The roughness values are sampled from the G channel.
                    // These values are linear. If other channels are present (R or A), they are ignored for metallic-roughness calculations.
                    Color colorMetallicRoughness = Color.FromArgb(
                        0,
                        (int)_roughness,
                        (int)_metallic
                    );
                    metallicRoughnessBitmap.SetPixel(x, y, colorMetallicRoughness);
                }
            }

            // Write bitmap
            var absolutePath = Path.Combine(babylonScene.OutputPath, babylonTexture.name);
            RaiseMessage($"Texture | write image '{babylonTexture.name}'", 2);
            metallicRoughnessBitmap.Save(absolutePath);

            return babylonTexture;
        }

        // -------------------------
        // -- Export sub methods ---
        // -------------------------

        private BabylonTexture _exportTexture(ITexmap texMap, float amount, BabylonScene babylonScene, bool allowCube = false, bool forceAlpha = false)
        {
            if (texMap.GetParamBlock(0) == null || texMap.GetParamBlock(0).Owner == null)
            {
                return null;
            }

            var texture = texMap.GetParamBlock(0).Owner as IBitmapTex;

            if (texture == null)
            {
                return null;
            }

            var babylonTexture = new BabylonTexture
            {
                name = Path.GetFileName(texture.MapName)
            };

            // Level
            babylonTexture.level = amount;

            // Alpha
            if (forceAlpha)
            {
                babylonTexture.hasAlpha = true;
                babylonTexture.getAlphaFromRGB = (texture.AlphaSource == 2) || (texture.AlphaSource == 3);
            }
            else
            {
                babylonTexture.hasAlpha = (texture.AlphaSource != 3);
                babylonTexture.getAlphaFromRGB = (texture.AlphaSource == 2);
            }

            // UVs
            var uvGen = _exportUV(texture, babylonTexture);

            // Animations
            var animations = new List<BabylonAnimation>();
            ExportFloatAnimation("uOffset", animations, key => new[] { uvGen.GetUOffs(key) });
            ExportFloatAnimation("vOffset", animations, key => new[] { -uvGen.GetVOffs(key) });
            ExportFloatAnimation("uScale", animations, key => new[] { uvGen.GetUScl(key) });
            ExportFloatAnimation("vScale", animations, key => new[] { uvGen.GetVScl(key) });
            ExportFloatAnimation("uAng", animations, key => new[] { uvGen.GetUAng(key) });
            ExportFloatAnimation("vAng", animations, key => new[] { uvGen.GetVAng(key) });
            ExportFloatAnimation("wAng", animations, key => new[] { uvGen.GetWAng(key) });
            babylonTexture.animations = animations.ToArray();

            // Is cube
            _exportIsCube(texture, babylonTexture, allowCube);

            // Copy texture to output
            var absolutePath = texture.Map.FullFilePath;
            try
            {
                if (File.Exists(absolutePath))
                {
                    if (CopyTexturesToOutput)
                    {
                        File.Copy(absolutePath, Path.Combine(babylonScene.OutputPath, babylonTexture.name), true);
                    }
                }
            }
            catch
            {
                // silently fails
            }

            return babylonTexture;
        }

        private ITexmap _exportFresnelParameters(ITexmap texMap, out BabylonFresnelParameters fresnelParameters)
        {
            fresnelParameters = null;

            // Fallout
            if (texMap.ClassName == "Falloff") // This is the only way I found to detect it. This is crappy but it works
            {
                RaiseMessage("fresnelParameters", 2);
                fresnelParameters = new BabylonFresnelParameters();

                var paramBlock = texMap.GetParamBlock(0);
                var color1 = paramBlock.GetColor(0, 0, 0);
                var color2 = paramBlock.GetColor(4, 0, 0);

                fresnelParameters.isEnabled = true;
                fresnelParameters.leftColor = color2.ToArray();
                fresnelParameters.rightColor = color1.ToArray();

                if (paramBlock.GetInt(8, 0, 0) == 2)
                {
                    fresnelParameters.power = paramBlock.GetFloat(12, 0, 0);
                }
                else
                {
                    fresnelParameters.power = 1;
                }
                var texMap1 = paramBlock.GetTexmap(2, 0, 0);
                var texMap1On = paramBlock.GetInt(3, 0, 0);

                var texMap2 = paramBlock.GetTexmap(6, 0, 0);
                var texMap2On = paramBlock.GetInt(7, 0, 0);

                if (texMap1 != null && texMap1On != 0)
                {
                    texMap = texMap1;
                    fresnelParameters.rightColor = new float[] { 1, 1, 1 };

                    if (texMap2 != null && texMap2On != 0)
                    {
                        RaiseWarning(string.Format("You cannot specify two textures for falloff. Only one is supported"), 2);
                    }
                }
                else if (texMap2 != null && texMap2On != 0)
                {
                    fresnelParameters.leftColor = new float[] { 1, 1, 1 };
                    texMap = texMap2;
                }
                else
                {
                    return null;
                }
            }

            return texMap;
        }

        private IStdUVGen _exportUV(IBitmapTex texture, BabylonTexture babylonTexture)
        {
            var uvGen = texture.UVGen;

            switch (uvGen.GetCoordMapping(0))
            {
                case 1: //MAP_SPHERICAL
                    babylonTexture.coordinatesMode = 1;
                    break;
                case 2: //MAP_PLANAR
                    babylonTexture.coordinatesMode = 2;
                    break;
                default:
                    babylonTexture.coordinatesMode = 0;
                    break;
            }

            babylonTexture.coordinatesIndex = uvGen.MapChannel - 1;
            if (uvGen.MapChannel > 2)
            {
                RaiseWarning(string.Format("Unsupported map channel, Only channel 1 and 2 are supported."), 2);
            }

            babylonTexture.uOffset = uvGen.GetUOffs(0);
            babylonTexture.vOffset = uvGen.GetVOffs(0);

            babylonTexture.uScale = uvGen.GetUScl(0);
            babylonTexture.vScale = uvGen.GetVScl(0);

            if (Path.GetExtension(texture.MapName).ToLower() == ".dds")
            {
                babylonTexture.vScale *= -1; // Need to invert Y-axis for DDS texture
            }

            babylonTexture.uAng = uvGen.GetUAng(0);
            babylonTexture.vAng = uvGen.GetVAng(0);
            babylonTexture.wAng = uvGen.GetWAng(0);

            babylonTexture.wrapU = BabylonTexture.AddressMode.CLAMP_ADDRESSMODE; // CLAMP
            if ((uvGen.TextureTiling & 1) != 0) // WRAP
            {
                babylonTexture.wrapU = BabylonTexture.AddressMode.WRAP_ADDRESSMODE;
            }
            else if ((uvGen.TextureTiling & 4) != 0) // MIRROR
            {
                babylonTexture.wrapU = BabylonTexture.AddressMode.MIRROR_ADDRESSMODE;
            }

            babylonTexture.wrapV = BabylonTexture.AddressMode.CLAMP_ADDRESSMODE; // CLAMP
            if ((uvGen.TextureTiling & 2) != 0) // WRAP
            {
                babylonTexture.wrapV = BabylonTexture.AddressMode.WRAP_ADDRESSMODE;
            }
            else if ((uvGen.TextureTiling & 8) != 0) // MIRROR
            {
                babylonTexture.wrapV = BabylonTexture.AddressMode.MIRROR_ADDRESSMODE;
            }

            return uvGen;
        }

        private void _exportIsCube(IBitmapTex texture, BabylonTexture babylonTexture, bool allowCube)
        {
            var absolutePath = texture.Map.FullFilePath;

            try
            {
                if (File.Exists(absolutePath))
                {
                    babylonTexture.isCube = _isTextureCube(absolutePath);
                }
                else
                {
                    RaiseWarning(string.Format("Texture {0} not found.", babylonTexture.name), 2);
                }

            }
            catch
            {
                // silently fails
            }

            if (babylonTexture.isCube && !allowCube)
            {
                RaiseWarning(string.Format("Cube texture are only supported for reflection channel"), 2);
            }
        }

        private bool _isTextureCube(string filepath)
        {
            try
            {
                if (Path.GetExtension(filepath).ToLower() != ".dds")
                {
                    return false;
                }

                var data = File.ReadAllBytes(filepath);
                var intArray = new int[data.Length / 4];

                Buffer.BlockCopy(data, 0, intArray, 0, intArray.Length * 4);


                int width = intArray[4];
                int height = intArray[3];
                int mipmapsCount = intArray[7];

                if ((width >> (mipmapsCount - 1)) > 1)
                {
                    var expected = 1;
                    var currentSize = Math.Max(width, height);

                    while (currentSize > 1)
                    {
                        currentSize = currentSize >> 1;
                        expected++;
                    }

                    RaiseWarning(string.Format("Mipmaps chain is not complete: {0} maps instead of {1} (based on texture max size: {2})", mipmapsCount, expected, width), 2);
                    RaiseWarning(string.Format("You must generate a complete mipmaps chain for .dds)"), 2);
                    RaiseWarning(string.Format("Mipmaps will be disabled for this texture. If you want automatic texture generation you cannot use a .dds)"), 2);
                }

                bool isCube = (intArray[28] & 0x200) == 0x200;

                return isCube;
            }
            catch
            {
                return false;
            }
        }

        // -------------------------
        // --------- Utils ---------
        // -------------------------

        private ITexmap _getTexMap(IIGameMaterial materialNode, int index)
        {
            ITexmap texMap = null;
            if (materialNode.MaxMaterial.SubTexmapOn(index) == 1)
            {
                texMap = materialNode.MaxMaterial.GetSubTexmap(index);

                // No warning displayed because by default, physical material in 3ds Max have all maps on
                // Would be tedious for the user to uncheck all unused maps

                //if (texMap == null)
                //{
                //    RaiseWarning("Texture channel " + index + " activated but no texture found.", 2);
                //}
            }
            return texMap;
        }

        private bool _getMinimalBitmapDimensions(out int width, out int height, params Bitmap[] bitmaps)
        {
            var haveSameDimensions = true;

            var bitmapsNoNull = ((new List<Bitmap>(bitmaps)).FindAll(bitmap => bitmap != null)).ToArray();
            if (bitmapsNoNull.Length > 0)
            {
                // Init with first element
                width = bitmapsNoNull[0].Width;
                height = bitmapsNoNull[0].Height;

                // Update with others
                for (int i = 1; i < bitmapsNoNull.Length; i++)
                {
                    var bitmap = bitmapsNoNull[i];
                    if (width != bitmap.Width || height != bitmap.Height)
                    {
                        haveSameDimensions = false;
                    }
                    width = Math.Min(width, bitmap.Width);
                    height = Math.Min(height, bitmap.Height);
                }
            }
            else
            {
                width = 0;
                height = 0;
            }

            return haveSameDimensions;
        }

        private Bitmap LoadTexture(string absolutePath)
        {
            if (File.Exists(absolutePath))
            {
                return new Bitmap(absolutePath);
            }
            else
            {
                RaiseWarning(string.Format("Texture {0} not found.", Path.GetFileName(absolutePath), 2));
                return null;
            }
        }

        private Bitmap _loadTexture(ITexmap texMap)
        {
            if (texMap == null || texMap.GetParamBlock(0) == null || texMap.GetParamBlock(0).Owner == null)
            {
                return null;
            }

            var texture = texMap.GetParamBlock(0).Owner as IBitmapTex;

            if (texture == null)
            {
                return null;
            }

            return LoadTexture(texture.Map.FullFilePath);
        }
    }
}
