using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using BabylonExport;
using SharpDX.Direct3D9;
using Vertice.Core;
using Vertice.Nova;
using Vertice.Nova.Core;
using Vertice.Nova.Materials;
using System.Windows.Forms;

namespace BabylonExport.Core.Exporters
{
    partial class NovaExporter
    {
        void DumpMaterials(BabylonScene babylonScene)
        {
            var count = 0;
            foreach (NovaMaterial material in materialsToExport)
            {
                var stdMaterial = material as NovaStandardMaterial;

                if (stdMaterial != null)
                {
                    DumpStandardMaterial(stdMaterial, babylonScene);
                    continue;
                }

                var perPixelShader = material as NovaPerPixelShader;

                if (perPixelShader != null)
                {
                    DumpPerPixelShader(perPixelShader, babylonScene);
                    continue;
                }

                var multiMaterial = material as NovaMultiMaterial;

                if (multiMaterial != null)
                {
                    DumpMultiMaterial(multiMaterial, babylonScene);
                }

                ReportProgressChanged(75 + (count++ * 25) / materialsToExport.Count);
            }
        }

        void AttachMirrorPlane(BabylonTexture babylonTexture, NovaObject novaObject)
        {
            // Mirror plane
            int f1, f2, f3;

            if (novaObject.Is32bits)
            {
                f1 = novaObject.Indices32[2];
                f2 = novaObject.Indices32[1];
                f3 = novaObject.Indices32[0];
            }
            else
            {
                f1 = novaObject.Indices[2];
                f2 = novaObject.Indices[1];
                f3 = novaObject.Indices[0];
            }
            Vector3 a = novaObject.PositionOnlyVertices[f1];
            Vector3 b = novaObject.PositionOnlyVertices[f2];
            Vector3 c = novaObject.PositionOnlyVertices[f3];

            var mainPlane = new Plane(a, b, c);

            Matrix matrix = Matrix.Invert(novaObject.WorldMatrix);
            matrix = Matrix.Transpose(matrix);
            Plane plane = Plane.Transform(mainPlane, matrix);

            babylonTexture.mirrorPlane = new[] { plane.Normal.X, plane.Normal.Y, plane.Normal.Z, plane.D };
        }

        void DumpStandardMaterial(NovaStandardMaterial stdMaterial, BabylonScene babylonScene)
        {
            var babylonMaterial = new BabylonMaterial();
            babylonScene.MaterialsList.Add(babylonMaterial);

            babylonMaterial.name = stdMaterial.Name;
            babylonMaterial.id = stdMaterial.ID.ToString();
            babylonMaterial.alpha = stdMaterial.Alpha;
            babylonMaterial.ambient = (stdMaterial.Ambient * (1.0f - stdMaterial.SelfIllumination)).ToArray();
            babylonMaterial.diffuse = (stdMaterial.Diffuse * (1.0f - stdMaterial.SelfIllumination)).ToArray();
            babylonMaterial.emissive = (stdMaterial.Emissive * stdMaterial.SelfIllumination).ToArray();
            babylonMaterial.specular = stdMaterial.Specular.ToArray();
            babylonMaterial.specularPower = stdMaterial.SpecularSharpness;
            babylonMaterial.backFaceCulling = (stdMaterial.CullMode == NovaCull.CounterClockwise);

            if (stdMaterial.DiffuseTexture != null && stdMaterial.DiffuseTexture.HasTextureData && stdMaterial.OpacityTexture != null && stdMaterial.OpacityTexture.HasTextureData)
            {
                if (stdMaterial.DiffuseTexture.LoadedTexture == stdMaterial.OpacityTexture.LoadedTexture)
                {
                    stdMaterial.DiffuseTexture = stdMaterial.OpacityTexture;
                    stdMaterial.OpacityTexture = null;
                }
            }

            if (stdMaterial.DiffuseTexture != null && stdMaterial.DiffuseTexture.HasTextureData && !stdMaterial.DiffuseTexture.IsVideo && !stdMaterial.DiffuseTexture.IsCubeRender)
            {
                babylonMaterial.diffuseTexture = new BabylonTexture();
                DumpTexture(stdMaterial.DiffuseTexture, babylonMaterial.diffuseTexture, babylonScene);
            }

            if (stdMaterial.AmbientTexture != null && stdMaterial.AmbientTexture.HasTextureData && !stdMaterial.AmbientTexture.IsVideo && !stdMaterial.AmbientTexture.IsCubeRender)
            {
                babylonMaterial.ambientTexture = new BabylonTexture();
                DumpTexture(stdMaterial.AmbientTexture, babylonMaterial.ambientTexture, babylonScene);
            }

            if (stdMaterial.OpacityTexture != null && stdMaterial.OpacityTexture.HasTextureData && !stdMaterial.OpacityTexture.IsVideo && !stdMaterial.OpacityTexture.IsCubeRender)
            {
                babylonMaterial.opacityTexture = new BabylonTexture();
                DumpTexture(stdMaterial.OpacityTexture, babylonMaterial.opacityTexture, babylonScene);
            }

            if (mirrorsMaterials.ContainsKey(stdMaterial))
            {
                babylonMaterial.reflectionTexture = new BabylonTexture();
                var novaObject = mirrorsMaterials[stdMaterial];
                DumpRenderTargetTexture(stdMaterial.ReflectionTexture, babylonMaterial.reflectionTexture, novaObject.MirrorMapSize, novaObject.MirrorLevel, novaObject.MirroredObjects);

                AttachMirrorPlane(babylonMaterial.reflectionTexture, novaObject);
            }
            else if (stdMaterial.ReflectionTexture != null && stdMaterial.ReflectionTexture.HasTextureData && !stdMaterial.ReflectionTexture.IsVideo && !stdMaterial.ReflectionTexture.IsCubeRender)
            {
                babylonMaterial.reflectionTexture = new BabylonTexture();
                DumpTexture(stdMaterial.ReflectionTexture, babylonMaterial.reflectionTexture, babylonScene);
            }

            if (stdMaterial.EmissiveTexture != null && stdMaterial.EmissiveTexture.HasTextureData && !stdMaterial.EmissiveTexture.IsVideo && !stdMaterial.EmissiveTexture.IsCubeRender)
            {
                babylonMaterial.emissiveTexture = new BabylonTexture();
                DumpTexture(stdMaterial.EmissiveTexture, babylonMaterial.emissiveTexture, babylonScene);
            }

            if (stdMaterial.SpecularTexture != null && stdMaterial.SpecularTexture.HasTextureData && !stdMaterial.SpecularTexture.IsVideo && !stdMaterial.SpecularTexture.IsCubeRender)
            {
                babylonMaterial.specularTexture = new BabylonTexture();
                DumpTexture(stdMaterial.SpecularTexture, babylonMaterial.specularTexture, babylonScene);
            }

            if (stdMaterial.BumpTexture != null && stdMaterial.BumpTexture.HasTextureData && !stdMaterial.BumpTexture.IsVideo && !stdMaterial.BumpTexture.IsCubeRender)
            {
                babylonMaterial.bumpTexture = new BabylonTexture();
                DumpTexture(stdMaterial.BumpTexture, babylonMaterial.bumpTexture, babylonScene);
                babylonMaterial.bumpTexture.level /= 2.0f;
            }
        }

        void DumpPerPixelShader(NovaPerPixelShader ppShader, BabylonScene babylonScene)
        {
            var babylonMaterial = new BabylonMaterial();
            babylonScene.MaterialsList.Add(babylonMaterial);

            babylonMaterial.name = ppShader.Name;
            babylonMaterial.id = ppShader.ID.ToString();
            babylonMaterial.alpha = ppShader.Alpha;
            babylonMaterial.ambient = (ppShader.Ambient * (1.0f - ppShader.SelfIllumination)).ToArray();
            babylonMaterial.diffuse = (ppShader.Diffuse * (1.0f - ppShader.SelfIllumination)).ToArray();
            babylonMaterial.emissive = (ppShader.Emissive * ppShader.SelfIllumination).ToArray();
            babylonMaterial.specular = ppShader.Specular.ToArray();
            babylonMaterial.specularPower = ppShader.SpecularSharpness;
            babylonMaterial.backFaceCulling = (ppShader.CullMode == NovaCull.CounterClockwise);

            if (ppShader.DiffuseTexture != null && ppShader.DiffuseTexture.HasTextureData && ppShader.OpacityTexture != null && ppShader.OpacityTexture.HasTextureData)
            {
                if (ppShader.DiffuseTexture.LoadedTexture == ppShader.OpacityTexture.LoadedTexture)
                {
                    ppShader.DiffuseTexture = ppShader.OpacityTexture;
                    ppShader.OpacityTexture = null;
                }
            }

            if (ppShader.DiffuseTexture != null && ppShader.DiffuseTexture.HasTextureData && !ppShader.DiffuseTexture.IsVideo && !ppShader.DiffuseTexture.IsCubeRender)
            {
                babylonMaterial.diffuseTexture = new BabylonTexture();
                DumpTexture(ppShader.DiffuseTexture, babylonMaterial.diffuseTexture, babylonScene);
            }

            if (ppShader.AmbientTexture != null && ppShader.AmbientTexture.HasTextureData && !ppShader.AmbientTexture.IsVideo && !ppShader.AmbientTexture.IsCubeRender)
            {
                babylonMaterial.ambientTexture = new BabylonTexture();
                DumpTexture(ppShader.AmbientTexture, babylonMaterial.ambientTexture, babylonScene);
            }

            if (ppShader.OpacityTexture != null && ppShader.OpacityTexture.HasTextureData && !ppShader.OpacityTexture.IsVideo && !ppShader.OpacityTexture.IsCubeRender)
            {
                babylonMaterial.opacityTexture = new BabylonTexture();
                DumpTexture(ppShader.OpacityTexture, babylonMaterial.opacityTexture, babylonScene);
            }

            if (mirrorsMaterials.ContainsKey(ppShader))
            {
                babylonMaterial.reflectionTexture = new BabylonTexture();
                var novaObject = mirrorsMaterials[ppShader];
                DumpRenderTargetTexture(ppShader.ReflectionTexture, babylonMaterial.reflectionTexture, novaObject.MirrorMapSize, novaObject.MirrorLevel, novaObject.MirroredObjects);

                AttachMirrorPlane(babylonMaterial.reflectionTexture, novaObject);
            }
            else if (ppShader.ReflectionTexture != null && ppShader.ReflectionTexture.HasTextureData && !ppShader.ReflectionTexture.IsVideo && !ppShader.ReflectionTexture.IsCubeRender)
            {
                babylonMaterial.reflectionTexture = new BabylonTexture();
                DumpTexture(ppShader.ReflectionTexture, babylonMaterial.reflectionTexture, babylonScene);
            }

            // Refraction
            if (ppShader.RefractionLevel > 0)
            {
                babylonMaterial.alpha = 1.0f - ppShader.RefractionLevel;
            }

            if (ppShader.EmissiveTexture != null && ppShader.EmissiveTexture.HasTextureData && !ppShader.EmissiveTexture.IsVideo && !ppShader.EmissiveTexture.IsCubeRender)
            {
                babylonMaterial.emissiveTexture = new BabylonTexture();
                DumpTexture(ppShader.EmissiveTexture, babylonMaterial.emissiveTexture, babylonScene);
            }

            if (ppShader.SpecularTexture != null && ppShader.SpecularTexture.HasTextureData && !ppShader.SpecularTexture.IsVideo && !ppShader.SpecularTexture.IsCubeRender)
            {
                babylonMaterial.specularTexture = new BabylonTexture();
                DumpTexture(ppShader.SpecularTexture, babylonMaterial.specularTexture, babylonScene);
            }

            if (ppShader.BumpTexture != null && ppShader.BumpTexture.HasTextureData && !ppShader.BumpTexture.IsVideo && !ppShader.BumpTexture.IsCubeRender)
            {
                babylonMaterial.bumpTexture = new BabylonTexture();
                DumpTexture(ppShader.BumpTexture, babylonMaterial.bumpTexture, babylonScene);
                babylonMaterial.bumpTexture.level /= 2.0f;
            }
        }

        static void DumpMultiMaterial(NovaMultiMaterial multiMaterial, BabylonScene babylonScene)
        {
            var babylonMultiMaterial = new BabylonMultiMaterial();
            babylonScene.MultiMaterialsList.Add(babylonMultiMaterial);

            babylonMultiMaterial.name = multiMaterial.Name;
            babylonMultiMaterial.id = multiMaterial.ID.ToString();

            babylonMultiMaterial.materials = multiMaterial.Materials.Select(material => (material != null ? material.ID.ToString() : "")).ToArray();
        }

        void DumpTextureAnimation(NovaTexture texture, BabylonTexture babylonTexture)
        {
            var animations = new List<BabylonAnimation>();

            DumpInterpolator("Texture UOffset", "uOffset", texture.UOffsetInterpolator, texture.ParentScene, animations);
            DumpInterpolator("Texture VOffset", "vOffset", texture.VOffsetInterpolator, texture.ParentScene, animations);
            DumpInterpolator("Texture UScale", "uScale", texture.UScaleInterpolator, texture.ParentScene, animations);
            DumpInterpolator("Texture VScale", "vScale", texture.VScaleInterpolator, texture.ParentScene, animations);

            babylonTexture.animations = animations.ToArray();
        }

        private void DumpCubeTexture(NovaTexture texture, BabylonTexture babylonTexture, BabylonScene babylonScene)
        {
            var textureFilename = Path.Combine(texture.LoadedTexture.Directory, texture.LoadedTexture.Filename);
            var baseName = Path.GetFileNameWithoutExtension(texture.LoadedTexture.Filename);

            babylonTexture.isCube = true;
            babylonTexture.name = baseName;

            baseName = Path.Combine(babylonScene.OutputPath, baseName);

            if (!File.Exists(textureFilename))
            {
                texture.LoadedTexture.SaveToDDS(false, textureFilename);
            }

            if (!alreadyExportedTextures.Contains(textureFilename))
            {
                alreadyExportedTextures.Add(textureFilename);

                // Use SharpDX to extract face images
                var form = new Form { ClientSize = new Size(64, 64) };
                var device = new Device(new Direct3D(), 0, DeviceType.Hardware, form.Handle,
                                        CreateFlags.HardwareVertexProcessing,
                                        new PresentParameters(form.ClientSize.Width, form.ClientSize.Height));

                var cubeTexture = CubeTexture.FromFile(device, textureFilename);

                using (var surface = cubeTexture.GetCubeMapSurface(CubeMapFace.PositiveX, 0))
                {
                    Surface.ToFile(surface, baseName + "_px.jpg", ImageFileFormat.Jpg);
                }
                using (var surface = cubeTexture.GetCubeMapSurface(CubeMapFace.PositiveY, 0))
                {
                    Surface.ToFile(surface, baseName + "_py.jpg", ImageFileFormat.Jpg);
                }
                using (var surface = cubeTexture.GetCubeMapSurface(CubeMapFace.PositiveZ, 0))
                {
                    Surface.ToFile(surface, baseName + "_pz.jpg", ImageFileFormat.Jpg);
                }
                using (var surface = cubeTexture.GetCubeMapSurface(CubeMapFace.NegativeX, 0))
                {
                    Surface.ToFile(surface, baseName + "_nx.jpg", ImageFileFormat.Jpg);
                }
                using (var surface = cubeTexture.GetCubeMapSurface(CubeMapFace.NegativeY, 0))
                {
                    Surface.ToFile(surface, baseName + "_ny.jpg", ImageFileFormat.Jpg);
                }
                using (var surface = cubeTexture.GetCubeMapSurface(CubeMapFace.NegativeZ, 0))
                {
                    Surface.ToFile(surface, baseName + "_nz.jpg", ImageFileFormat.Jpg);
                }

                cubeTexture.Dispose();
                device.Dispose();
                form.Dispose();
            }
        }

        private void DumpRenderTargetTexture(NovaTexture texture, BabylonTexture babylonTexture, int renderSize, float level, NovaMirroredObjectsList renderList)
        {
            babylonTexture.level = level;
            babylonTexture.hasAlpha = false;
            babylonTexture.coordinatesMode = (int)NovaTexture.NovaTextureMapType.Projection;

            babylonTexture.name = texture.Name;
            babylonTexture.uOffset = texture.UOffset;
            babylonTexture.vOffset = texture.VOffset;
            babylonTexture.uScale = texture.UScale;
            babylonTexture.vScale = texture.VScale;
            babylonTexture.uAng = texture.UAng;
            babylonTexture.vAng = texture.VAng;
            babylonTexture.wAng = texture.WAng;
            switch (texture.UAddressMode)
            {
                case NovaTextureAddress.Wrap:
                    babylonTexture.wrapU = 1;
                    break;
                case NovaTextureAddress.Mirror:
                    babylonTexture.wrapU = 2;
                    break;
                case NovaTextureAddress.Clamp:
                    babylonTexture.wrapU = 0;
                    break;
            }
            switch (texture.VAddressMode)
            {
                case NovaTextureAddress.Wrap:
                    babylonTexture.wrapV = 1;
                    break;
                case NovaTextureAddress.Mirror:
                    babylonTexture.wrapV = 2;
                    break;
                case NovaTextureAddress.Clamp:
                    babylonTexture.wrapV = 0;
                    break;
            }
            babylonTexture.coordinatesIndex = texture.MapCoordinateIndex;

            DumpTextureAnimation(texture, babylonTexture);

            babylonTexture.isRenderTarget = true;
            babylonTexture.renderTargetSize = renderSize;

            babylonTexture.renderList = renderList.Select(o => o.ID.ToString()).ToArray();
        }

        void DumpTexture(NovaTexture texture, BabylonTexture babylonTexture, BabylonScene babylonScene)
        {
            babylonTexture.level = texture.Level;
            babylonTexture.hasAlpha = texture.HasAlpha;
            babylonTexture.coordinatesMode = (int)texture.MapType;

            if (texture.LoadedTexture.IsCube)
            {
                DumpCubeTexture(texture, babylonTexture, babylonScene);
                return;
            }

            babylonTexture.name = texture.Name;
            babylonTexture.uOffset = texture.UOffset;
            babylonTexture.vOffset = texture.VOffset;
            babylonTexture.uScale = texture.UScale;
            babylonTexture.vScale = texture.VScale;
            babylonTexture.uAng = texture.UAng;
            babylonTexture.vAng = texture.VAng;
            babylonTexture.wAng = texture.WAng;
            switch (texture.UAddressMode)
            {
                case NovaTextureAddress.Wrap:
                    babylonTexture.wrapU = 1;
                    break;
                case NovaTextureAddress.Mirror:
                    babylonTexture.wrapU = 2;
                    break;
                case NovaTextureAddress.Clamp:
                    babylonTexture.wrapU = 0;
                    break;
            }
            switch (texture.VAddressMode)
            {
                case NovaTextureAddress.Wrap:
                    babylonTexture.wrapV = 1;
                    break;
                case NovaTextureAddress.Mirror:
                    babylonTexture.wrapV = 2;
                    break;
                case NovaTextureAddress.Clamp:
                    babylonTexture.wrapV = 0;
                    break;
            }
            babylonTexture.coordinatesIndex = texture.MapCoordinateIndex;

            DumpTextureAnimation(texture, babylonTexture);

            babylonTexture.name = CopyTexture(texture, babylonScene);
        }

        string CopyTexture(NovaTexture texture, BabylonScene babylonScene)
        {
            string name = texture.Name;
            // Data
            if (!alreadyExportedTextures.Contains(texture.Name + texture.HasAlpha))
            {
                alreadyExportedTextures.Add(texture.Name + texture.HasAlpha);

                if (Path.GetExtension(texture.Name).ToLower() == ".dds" || Path.GetExtension(texture.Name).ToLower() == ".bmp")
                {
                    name = Path.GetFileNameWithoutExtension(texture.Name) + ".png";
                    var alreadyExists = File.Exists(Path.Combine(babylonScene.OutputPath, name));

                    texture.LoadedTexture.SaveToPNG(Path.Combine(babylonScene.OutputPath, name));

                    if (!texture.HasAlpha)
                    {
                        var oldPath = Path.Combine(babylonScene.OutputPath, name);
                        var bmp = Image.FromFile(oldPath);

                        name = Path.GetFileNameWithoutExtension(texture.Name) + ".jpg";

                        bmp.Save(Path.Combine(babylonScene.OutputPath, name), ImageFormat.Jpeg);
                        bmp.Dispose();

                        if (!alreadyExists)
                        {
                            File.Delete(oldPath);
                        }
                    }
                }
                else
                {
                    var sourceFile = Path.Combine(texture.Directory, texture.Filename);
                    File.Copy(sourceFile, Path.Combine(babylonScene.OutputPath, Path.GetFileName(sourceFile)), true);
                }
            }
            else
            {
                if (Path.GetExtension(texture.Name).ToLower() == ".dds" ||
                    Path.GetExtension(texture.Name).ToLower() == ".bmp")
                {
                    name = Path.GetFileNameWithoutExtension(texture.Name) + (texture.HasAlpha ? ".png" : ".jpg");
                }
            }

            return name;
        }
    }
}
