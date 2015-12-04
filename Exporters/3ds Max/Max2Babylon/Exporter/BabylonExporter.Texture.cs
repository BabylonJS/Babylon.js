using System;
using System.Collections.Generic;
using System.IO;
using Autodesk.Max;
using BabylonExport.Entities;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
        bool IsTextureCube(string filepath)
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

        private BabylonTexture ExportTexture(IStdMat2 stdMat, int index, out BabylonFresnelParameters fresnelParameters, BabylonScene babylonScene, bool allowCube = false, bool forceAlpha = false)
        {
            fresnelParameters = null;

            if (!stdMat.MapEnabled(index))
            {
                return null;
            }
            var babylonTexture = new BabylonTexture();

            var texMap = stdMat.GetSubTexmap(index);

            if (texMap == null)
            {
                RaiseWarning("Texture channel " + index + " activated but no texture found.");
                return null;
            }

            // Fallout
            if (texMap.ClassName == "Falloff") // This is the only way I found to detect it. This is crappy but it works
            {
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

            // Bitmap
            var texture = texMap.GetParamBlock(0).Owner as IBitmapTex;

            if (texture == null)
            {
                return null;
            }

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


            babylonTexture.level = stdMat.GetTexmapAmt(index, 0);

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

            babylonTexture.wrapU = 0; // CLAMP
            if ((uvGen.TextureTiling & 1) != 0) // WRAP
            {
                babylonTexture.wrapU = 1;
            }
            else if ((uvGen.TextureTiling & 4) != 0) // MIRROR
            {
                babylonTexture.wrapU = 2;
            }

            babylonTexture.wrapV = 0; // CLAMP
            if ((uvGen.TextureTiling & 2) != 0) // WRAP
            {
                babylonTexture.wrapV = 1;
            }
            else if ((uvGen.TextureTiling & 8) != 0) // MIRROR
            {
                babylonTexture.wrapV = 2;
            }

            babylonTexture.name = Path.GetFileName(texture.MapName);

            // Animations
            var animations = new List<BabylonAnimation>();
            ExportFloatAnimation("uOffset", animations, key => new[] { uvGen.GetUOffs(key) });
            ExportFloatAnimation("vOffset", animations, key => new[] { uvGen.GetVOffs(key) });
            ExportFloatAnimation("uScale", animations, key => new[] { uvGen.GetUScl(key) });
            ExportFloatAnimation("vScale", animations, key => new[] { uvGen.GetVScl(key) });
            ExportFloatAnimation("uAng", animations, key => new[] { uvGen.GetUAng(key) });
            ExportFloatAnimation("vAng", animations, key => new[] { uvGen.GetVAng(key) });
            ExportFloatAnimation("wAng", animations, key => new[] { uvGen.GetWAng(key) });

            babylonTexture.animations = animations.ToArray();
            var absolutePath = texture.Map.FullFilePath;
            // Copy texture to output
            try
            {
                if (File.Exists(absolutePath))
                {
                    babylonTexture.isCube = IsTextureCube(absolutePath);
                    if (CopyTexturesToOutput)
                    {
                        File.Copy(absolutePath, Path.Combine(babylonScene.OutputPath, babylonTexture.name), true);
                    }
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

            return babylonTexture;
        }
    }
}
