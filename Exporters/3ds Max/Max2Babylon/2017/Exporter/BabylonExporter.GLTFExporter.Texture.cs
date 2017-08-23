using BabylonExport.Entities;
using GLTFExport.Entities;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
        private GLTFTextureInfo ExportTexture(BabylonTexture babylonTexture, GLTF gltf)
        {
            if (babylonTexture == null)
            {
                return null;
            }

            RaiseMessage("GLTFExporter.Texture | ExportTexture babylonTexture.name=" + babylonTexture.name, 1);

            // --------------------------
            // -------- Sampler ---------
            // --------------------------

            RaiseMessage("GLTFExporter.Texture | create sampler", 1);
            GLTFSampler gltfSampler = new GLTFSampler();
            gltfSampler.index = gltf.SamplersList.Count;
            gltf.SamplersList.Add(gltfSampler);

            // --- Retreive info from babylon texture ---
            // Mag and min filters
            GLTFSampler.TextureMagFilter? magFilter;
            GLTFSampler.TextureMinFilter? minFilter;
            getSamplingParameters(babylonTexture.samplingMode, out magFilter, out minFilter);
            gltfSampler.magFilter = magFilter;
            gltfSampler.minFilter = minFilter;
            // WrapS and wrapT
            gltfSampler.wrapS = getWrapMode(babylonTexture.wrapU);
            gltfSampler.wrapT = getWrapMode(babylonTexture.wrapV);
            

            // --------------------------
            // --------- Image ----------
            // --------------------------

            RaiseMessage("GLTFExporter.Texture | create image", 1);
            GLTFImage gltfImage = new GLTFImage
            {
                uri = babylonTexture.name
            };

            gltfImage.index = gltf.ImagesList.Count;
            gltf.ImagesList.Add(gltfImage);


            // --------------------------
            // -------- Texture ---------
            // --------------------------

            RaiseMessage("GLTFExporter.Texture | create texture", 1);
            var gltfTexture = new GLTFTexture
            {
                name = babylonTexture.name,
                sampler = gltfSampler.index,
                source = gltfImage.index
            };
            gltfTexture.index = gltf.TexturesList.Count;
            gltf.TexturesList.Add(gltfTexture);


            // --------------------------
            // ------ TextureInfo -------
            // --------------------------
            var gltfTextureInfo = new GLTFTextureInfo
            {
                index = gltfTexture.index
            };


            // TODO - Animations

            //// Copy image to output
            //var absolutePath = texture.Map.FullFilePath;
            //try
            //{
            //    if (File.Exists(absolutePath))
            //    {
            //        if (CopyTexturesToOutput)
            //        {
            //            RaiseMessage("GLTFExporter.Texture | copy image src path = "+ absolutePath + " and dest path = "+ Path.Combine(gltf.OutputPath, gltfTexture.name));
            //            File.Copy(absolutePath, Path.Combine(gltf.OutputPath, gltfTexture.name), true);
            //        }
            //    }
            //    else
            //    {
            //        RaiseWarning(string.Format("Texture {0} not found.", gltfTexture.name), 2);
            //    }

            //}
            //catch
            //{
            //    // silently fails
            //}

            return gltfTextureInfo;
        }

        private void getSamplingParameters(BabylonTexture.SamplingMode samplingMode, out GLTFSampler.TextureMagFilter? magFilter, out GLTFSampler.TextureMinFilter? minFilter)
        {
            switch (samplingMode)
            {
                case BabylonTexture.SamplingMode.NEAREST_NEAREST_MIPLINEAR:
                    magFilter = GLTFSampler.TextureMagFilter.NEAREST;
                    minFilter = GLTFSampler.TextureMinFilter.NEAREST_MIPMAP_LINEAR;
                    break;
                case BabylonTexture.SamplingMode.LINEAR_LINEAR_MIPNEAREST:
                    magFilter = GLTFSampler.TextureMagFilter.LINEAR;
                    minFilter = GLTFSampler.TextureMinFilter.LINEAR_MIPMAP_NEAREST;
                    break;
                case BabylonTexture.SamplingMode.LINEAR_LINEAR_MIPLINEAR:
                    magFilter = GLTFSampler.TextureMagFilter.LINEAR;
                    minFilter = GLTFSampler.TextureMinFilter.LINEAR_MIPMAP_LINEAR;
                    break;
                case BabylonTexture.SamplingMode.NEAREST_NEAREST_MIPNEAREST:
                    magFilter = GLTFSampler.TextureMagFilter.NEAREST;
                    minFilter = GLTFSampler.TextureMinFilter.NEAREST_MIPMAP_NEAREST;
                    break;
                case BabylonTexture.SamplingMode.NEAREST_LINEAR_MIPNEAREST:
                    magFilter = GLTFSampler.TextureMagFilter.NEAREST;
                    minFilter = GLTFSampler.TextureMinFilter.LINEAR_MIPMAP_NEAREST;
                    break;
                case BabylonTexture.SamplingMode.NEAREST_LINEAR_MIPLINEAR:
                    magFilter = GLTFSampler.TextureMagFilter.NEAREST;
                    minFilter = GLTFSampler.TextureMinFilter.LINEAR_MIPMAP_LINEAR;
                    break;
                case BabylonTexture.SamplingMode.NEAREST_LINEAR:
                    magFilter = GLTFSampler.TextureMagFilter.NEAREST;
                    minFilter = GLTFSampler.TextureMinFilter.LINEAR;
                    break;
                case BabylonTexture.SamplingMode.NEAREST_NEAREST:
                    magFilter = GLTFSampler.TextureMagFilter.NEAREST;
                    minFilter = GLTFSampler.TextureMinFilter.NEAREST;
                    break;
                case BabylonTexture.SamplingMode.LINEAR_NEAREST_MIPNEAREST:
                    magFilter = GLTFSampler.TextureMagFilter.LINEAR;
                    minFilter = GLTFSampler.TextureMinFilter.NEAREST_MIPMAP_NEAREST;
                    break;
                case BabylonTexture.SamplingMode.LINEAR_NEAREST_MIPLINEAR:
                    magFilter = GLTFSampler.TextureMagFilter.LINEAR;
                    minFilter = GLTFSampler.TextureMinFilter.NEAREST_MIPMAP_LINEAR;
                    break;
                case BabylonTexture.SamplingMode.LINEAR_LINEAR:
                    magFilter = GLTFSampler.TextureMagFilter.LINEAR;
                    minFilter = GLTFSampler.TextureMinFilter.LINEAR;
                    break;
                case BabylonTexture.SamplingMode.LINEAR_NEAREST:
                    magFilter = GLTFSampler.TextureMagFilter.LINEAR;
                    minFilter = GLTFSampler.TextureMinFilter.NEAREST;
                    break;
                default:
                    RaiseError("GLTFExporter.Texture | texture sampling mode not found");
                    magFilter = null;
                    minFilter = null;
                    break;
            }
        }

        private GLTFSampler.TextureWrapMode? getWrapMode(BabylonTexture.AddressMode babylonTextureAdresseMode)
        {
            switch (babylonTextureAdresseMode)
            {
                case BabylonTexture.AddressMode.CLAMP_ADDRESSMODE:
                    return GLTFSampler.TextureWrapMode.CLAMP_TO_EDGE;
                case BabylonTexture.AddressMode.WRAP_ADDRESSMODE:
                    return GLTFSampler.TextureWrapMode.REPEAT;
                case BabylonTexture.AddressMode.MIRROR_ADDRESSMODE:
                    return GLTFSampler.TextureWrapMode.MIRRORED_REPEAT;
                default:
                    RaiseError("GLTFExporter.Texture | texture wrap mode not found");
                    return null;
            }
        }
    }
}
