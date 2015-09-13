using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.Serialization.Json;
using System.Windows.Forms;
using BabylonExport.Core.Exporters.FBX;
using Microsoft.Xna.Framework.Content;
using Microsoft.Xna.Framework.Graphics;
using SkinnedModel;
using Vertice.Nova.Animations;

namespace BabylonExport.Core.Exporters.XNA
{
    public abstract class XNAExporter : IExporter
    {
        public abstract string SupportedExtensions { get; }
        public abstract string Importer { get; }

        public virtual IEnumerable<string> ExtraPipelineAssemblies { get { return null; } }
        
        public event Action<int> OnImportProgressChanged;

        readonly Dictionary<string, string> exportedTexturesFilename = new Dictionary<string, string>();
        readonly List<StandardMaterial> exportedMaterials = new List<StandardMaterial>();

        private int texturesCount = 0;

        public void GenerateBabylonFile(string file, string outputFile, bool skinned, bool rightToLeft)
        {
            if (OnImportProgressChanged != null)
                OnImportProgressChanged(0);


            var scene = new BabylonScene(Path.GetDirectoryName(outputFile));

            var services = new ServiceContainer();

            // Create a graphics device
            var form = new Form();
            
            services.AddService<IGraphicsDeviceService>(GraphicsDeviceService.AddRef(form.Handle, 1, 1));

            var contentBuilder = new ContentBuilder(ExtraPipelineAssemblies);
            var contentManager = new ContentManager(services, contentBuilder.OutputDirectory);

            // Tell the ContentBuilder what to build.
            contentBuilder.Clear();
            contentBuilder.Add(Path.GetFullPath(file), "Model", Importer, skinned ? "SkinnedModelProcessor" : "ModelProcessor");

            // Build this new model data.
            string buildError = contentBuilder.Build();

            if (string.IsNullOrEmpty(buildError))
            {
                var model = contentManager.Load<Model>("Model");
                ParseModel(model, scene, rightToLeft);
            }
            else
            {
                throw new Exception(buildError);
            }

            // Output
            scene.Prepare();
            using (var outputStream = new FileStream(outputFile, FileMode.Create, FileAccess.Write))
            {
                var ser = new DataContractJsonSerializer(typeof(BabylonScene));
                ser.WriteObject(outputStream, scene);
            }

            // Cleaning
            foreach (var path in exportedTexturesFilename.Values)
            {
                File.Delete(path);
            }

            if (OnImportProgressChanged != null)
                OnImportProgressChanged(100);
        }

        void ParseModel(Model model, BabylonScene scene, bool rightToLeft)
        {
            var effects = model.Meshes.SelectMany(m => m.Effects).ToList();
            var meshes = model.Meshes.ToList();
            var total = effects.Count + meshes.Count;
            var progress = 0;
            SkinningData skinningData = null;
            BabylonSkeleton currentSkeleton = null;

            if (model.Tag != null)
            {
                skinningData = model.Tag as SkinningData;
            }

            if (skinningData != null)
            {
                var skeleton = new BabylonSkeleton();
                skeleton.id = scene.SkeletonsList.Count;
                skeleton.name = "Skeleton" + scene.SkeletonsList.Count;
                ParseBones(skinningData, skeleton);

                // Animations
                ParseAnimationClip(skinningData, skeleton);

                scene.SkeletonsList.Add(skeleton);
                currentSkeleton = skeleton;
            }

            foreach (Effect effect in effects)
            {
                ParseEffect(effect, scene);
                if (OnImportProgressChanged != null)
                    OnImportProgressChanged(((progress++) * 100) / total);
            }

            foreach (var mesh in meshes)
            {
                ParseMesh(mesh, scene, currentSkeleton, rightToLeft);
                if (OnImportProgressChanged != null)
                    OnImportProgressChanged(((progress++) * 100) / total);
            }
        }

        private void ParseAnimationClip(SkinningData skinningData, BabylonSkeleton skeleton)
        {
            foreach (var clipKey in skinningData.AnimationClips.Keys)
            {
                var clip = skinningData.AnimationClips[clipKey];
                var duration = clip.Duration.TotalMilliseconds;
                var dic = new Dictionary<int, List<BabylonAnimationKey>>();

                foreach (var keyframe in clip.Keyframes)
                {
                    if (!dic.ContainsKey(keyframe.Bone))
                    {
                        dic.Add(keyframe.Bone, new List<BabylonAnimationKey>());
                    }

                    var currentTime = (float)(keyframe.Time.TotalMilliseconds * 100.0 / duration);

                    dic[keyframe.Bone].Add(new BabylonAnimationKey
                    {
                        frame = currentTime,
                        values = keyframe.Transform.ToMatrix().ToArray()
                    });
                }

                foreach (var index in dic.Keys)
                {
                    var bone = skeleton.bones[index];
                    var babylonAnimation = new BabylonAnimation { name = bone.name + "Animation", property = "_matrix", dataType = BabylonAnimation.DataType.Matrix, loopBehavior = InterpolationLoop.Cycle, framePerSecond = 60 };
                    babylonAnimation.keys = dic[index].ToArray();
                    bone.animation = babylonAnimation;
                }

                return; // Only one animation track
            }
        }

        private void ParseBones(SkinningData skinningData, BabylonSkeleton skeleton)
        {
            // Bones
            var bones = new List<BabylonBone>();
            for (int boneIndex = 0; boneIndex < skinningData.BindPose.Count; boneIndex++)
            {
                var newBone = new BabylonBone();
                bones.Add(newBone);

                newBone.name = "bone" + boneIndex;
                newBone.index = boneIndex;
                newBone.matrix = skinningData.BindPose[boneIndex].ToMatrix().ToArray();
                newBone.parentBoneIndex = skinningData.SkeletonHierarchy[boneIndex];
            }

            skeleton.bones = bones.ToArray();
        }

        void ParseMesh(ModelMesh modelMesh, BabylonScene scene, BabylonSkeleton skeleton, bool rightToLeft)
        {
            var proxyID = ProxyMesh.CreateBabylonMesh(modelMesh.Name, scene);
            int indexName = 0;

            foreach (var part in modelMesh.MeshParts)
            {
                var material = exportedMaterials.First(m => m.Name == part.Effect.GetHashCode().ToString());

                var indices = new ushort[part.PrimitiveCount * 3];
                part.IndexBuffer.GetData(part.StartIndex * 2, indices, 0, indices.Length);

                if (rightToLeft)
                {
                    for (int ib = 0; ib < indices.Length; ib += 3) // reverse winding of triangles
                    {
                        ushort ti = indices[ib];
                        indices[ib] = indices[ib + 2];
                        indices[ib + 2] = ti;
                    }
                }

                if (part.VertexBuffer.VertexDeclaration.VertexStride >= PositionNormalTexturedWeights.Stride)
                {
                    var mesh = new Mesh<PositionNormalTexturedWeights>(material);
                    var vertices = new PositionNormalTexturedWeights[part.NumVertices];

                    part.VertexBuffer.GetData(part.VertexOffset * part.VertexBuffer.VertexDeclaration.VertexStride, vertices, 0, vertices.Length, part.VertexBuffer.VertexDeclaration.VertexStride);

                    for (int index = 0; index < vertices.Length; index++)
                    {
                        vertices[index].TextureCoordinates.Y = 1.0f - vertices[index].TextureCoordinates.Y;
                        if (rightToLeft)
                        {
                            vertices[index].Position.Z = -vertices[index].Position.Z;
                            vertices[index].Normal.Z = -vertices[index].Normal.Z;
                        }
                    }

                    mesh.AddPart(modelMesh.Name + "#" + indexName.ToString(), vertices.ToList(), indices.Select(i => (int)i).ToList());
                    mesh.CreateBabylonMesh(scene, proxyID, skeleton);
                }
                else
                {
                    var mesh = new Mesh<PositionNormalTextured>(material);
                    var vertices = new PositionNormalTextured[part.NumVertices];
                    part.VertexBuffer.GetData(part.VertexOffset * part.VertexBuffer.VertexDeclaration.VertexStride, vertices, 0, vertices.Length, part.VertexBuffer.VertexDeclaration.VertexStride);

                    for (int index = 0; index < vertices.Length; index++)
                    {
                        vertices[index].TextureCoordinates.Y = 1.0f - vertices[index].TextureCoordinates.Y;
                        if (rightToLeft)
                        {
                            vertices[index].Position.Z = -vertices[index].Position.Z;
                            vertices[index].Normal.Z = -vertices[index].Normal.Z;
                        }
                    }

                    mesh.AddPart(modelMesh.Name + "#" + indexName.ToString(), vertices.ToList(), indices.Select(i => (int)i).ToList());
                    mesh.CreateBabylonMesh(scene, proxyID, skeleton);
                }

                indexName++;
            }
        }

        void ParseEffect(Effect effect, BabylonScene scene)
        {
            var material = new StandardMaterial(effect.GetHashCode().ToString());

            exportedMaterials.Add(material);

            var basicEffect = effect as BasicEffect;
            var skinnedEffect = effect as SkinnedEffect;

            if (basicEffect != null)
            {
                material.Alpha = basicEffect.Alpha;
                material.Diffuse = basicEffect.DiffuseColor.ToColor3();
                material.Emissive = basicEffect.EmissiveColor.ToColor3();
                material.Specular = basicEffect.SpecularColor.ToColor3();
                material.SpecularPower = basicEffect.SpecularPower;
            }
            else
            {
                material.Alpha = skinnedEffect.Alpha;
                material.Diffuse = skinnedEffect.DiffuseColor.ToColor3();
                material.Emissive = skinnedEffect.EmissiveColor.ToColor3();
                material.Specular = skinnedEffect.SpecularColor.ToColor3();
                material.SpecularPower = skinnedEffect.SpecularPower;
            }

            var texture = basicEffect != null ? basicEffect.Texture : skinnedEffect.Texture;

            if (texture != null)
            {
                var id = texture.GetHashCode().ToString();

                if (!exportedTexturesFilename.ContainsKey(id))
                {
                    var tempPath = Path.GetTempPath();
                    var width = texture.Width;
                    var height = texture.Height;
                    string filename;

                    if (texture.Format != SurfaceFormat.Dxt1)
                    {
                        filename = Path.Combine(tempPath, texturesCount + ".png");
                    }
                    else
                    {
                        filename = Path.Combine(tempPath, texturesCount + ".jpg");
                    }

                    texturesCount++;

                    using (var file = new FileStream(filename, FileMode.Create, FileAccess.Write))
                    {
                        if (texture.Format != SurfaceFormat.Dxt1)
                        {
                            texture.SaveAsPng(file, width, height);
                        }
                        else
                        {
                            texture.SaveAsJpeg(file, width, height);
                        }
                    }

                    exportedTexturesFilename.Add(id, filename);
                }

                material.DiffuseTexture = exportedTexturesFilename[id];
            }

            material.CreateBabylonMaterial(scene);
        }
    }
}
