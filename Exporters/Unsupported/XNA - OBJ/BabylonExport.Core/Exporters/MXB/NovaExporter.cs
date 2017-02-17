using System;
using System.Linq;
using System.Collections.Generic;
using System.IO;
using System.Runtime.Serialization.Json;
using Vertice.Core;
using Vertice.Nova;
using Vertice.Nova.Core;
using Vertice.Nova.Core.DirectX9;
using Vertice.Nova.Materials;
using Vertice.Nova.Animations;
using Vertice.Nova.Core.DirectX10;

namespace BabylonExport.Core.Exporters
{
    public partial class NovaExporter : IExporter
    {
        readonly List<string> alreadyExportedTextures = new List<string>();
        readonly List<NovaMaterial> materialsToExport = new List<NovaMaterial>();
        readonly List<NovaParticleSystem> particleSystemsToExport = new List<NovaParticleSystem>();
        readonly List<NovaLensFlares> lensFlareSystemToExport = new List<NovaLensFlares>();
        readonly Dictionary<NovaMaterial, NovaObject> mirrorsMaterials = new Dictionary<NovaMaterial, NovaObject>();

        public event Action<int> OnImportProgressChanged;

        public string SupportedExtensions
        {
            get
            {
                return ".mxb .mxc";
            }
        }

        void ReportProgressChanged(int progress)
        {
            if (OnImportProgressChanged != null)
            {
                OnImportProgressChanged(progress);
            }
        }

        public void GenerateBabylonFile(string file, string outputFile, bool skinned, bool rightToLeft)
        {
            try
            {
                ReportProgressChanged(0);
                NovaEngine.Launch<DirectX9Provider>("", 128, 128);
                NovaScene novaScene = NovaEngine.CreateScene("TempScene");

                if (file.EndsWith(".mxc"))
                {
                    NovaEngine.ResourceManager.ArchivePath = Path.GetFullPath(file);

                    // Get the mbx file name
                    file = NovaEngine.ResourceManager.GetStartSceneFilename();
                }

                novaScene.Load(file);
                novaScene.Render(false);

                Generate(novaScene, outputFile);
            }

            finally
            {
                NovaEngine.Stop();
            }
        }

        void Generate(NovaScene scene, string outputFile)
        {
            ReportProgressChanged(25);
            var babylonScene = new BabylonScene(Path.GetDirectoryName(outputFile));
            alreadyExportedTextures.Clear();

            babylonScene.autoClear = scene.AutoClear;
            babylonScene.clearColor = scene.ClearColor.ToArray();
            babylonScene.ambientColor = scene.AmbientColor.ToArray();
            babylonScene.gravity = ((scene.Gravity == Vector3.Zero) ? new Vector3(0, -9.0f, 0) : scene.Gravity).ToArray();

            // Fog
            babylonScene.fogMode = (int)scene.FogMode;
            babylonScene.fogColor = scene.FogColor.ToArray();
            babylonScene.fogStart = scene.ActiveCamera.NearClip;
            babylonScene.fogEnd = scene.ActiveCamera.FarClip;
            babylonScene.fogDensity = scene.FogDensity;

            // Cameras
            DumpCameras(scene, babylonScene);

            // Lights
            DumpLights(scene, babylonScene);
            ReportProgressChanged(50);

            // Objects
            DumpObjects(scene, babylonScene);

            // Materials
            DumpMaterials(babylonScene);

            // Particles
            DumpParticles(babylonScene);

            // Lens flares
            DumpLensFlares(babylonScene);

            // Output
            babylonScene.Prepare(false);
            using (var outputStream = new FileStream(outputFile, FileMode.Create, FileAccess.Write))
            {
                var ser = new DataContractJsonSerializer(typeof(BabylonScene));
                ser.WriteObject(outputStream, babylonScene);
            }
            ReportProgressChanged(100);
        }


        void DumpLensFlares(BabylonScene babylonScene)
        {
            if (lensFlareSystemToExport.Count == 0)
                return;

            babylonScene.lensFlareSystems = new BabylonLensFlareSystem[lensFlareSystemToExport.Count];

            var index = 0;
            foreach (var lensFlareSystem in lensFlareSystemToExport)
            {
                var flares = new List<BabylonLensFlare>();
                foreach (var flare in lensFlareSystem.Flares)
                {
                    flares.Add(new BabylonLensFlare
                    {
                        color = flare.Color.ToArray(),
                        position = flare.Position,
                        size = flare.Size / 1000.0f,
                        textureName = CopyTexture(flare.Texture, babylonScene)
                    });
                }

                babylonScene.lensFlareSystems[index] = new BabylonLensFlareSystem
                {
                    emitterId = (lensFlareSystem.Tag as NovaLight).ID.ToString(),
                    borderLimit = lensFlareSystem.BorderLimit,
                    flares = flares.ToArray()
                };

                index++;
            }
        }

        private void DumpParticles(BabylonScene babylonScene)
        {
            if (particleSystemsToExport.Count == 0)
                return;

            babylonScene.particleSystems = new BabylonParticleSystem[particleSystemsToExport.Count];

            var index = 0;
            foreach (var particleSystem in particleSystemsToExport)
            {
                babylonScene.particleSystems[index] = new BabylonParticleSystem
                    {
                        capacity = particleSystem.BufferSize,
                        emitterId = particleSystem.Emitter.ID.ToString(),
                        gravity = particleSystem.Gravity.ToArray(),
                        direction1 = Vector3.TransformNormal(particleSystem.Direction1, particleSystem.Emitter.LocalMatrix).ToArray(),
                        direction2 = Vector3.TransformNormal(particleSystem.Direction2, particleSystem.Emitter.LocalMatrix).ToArray(),
                        minEmitBox = particleSystem.MinEmitBox.ToArray(),
                        maxEmitBox = particleSystem.MaxEmitBox.ToArray(),
                        color1 = particleSystem.Color1.ToArray(),
                        color2 = particleSystem.Color2.ToArray(),
                        colorDead = new RGBAColor(particleSystem.ColorDead.Red, particleSystem.ColorDead.Green, particleSystem.ColorDead.Blue, particleSystem.DeadAlpha).ToArray(),
                        emitRate = particleSystem.EmitRate,
                        updateSpeed = particleSystem.UpdateSpeed,
                        targetStopFrame = particleSystem.TargetStopFrame,
                        minEmitPower = particleSystem.MinEmitPower,
                        maxEmitPower = particleSystem.MaxEmitPower,
                        minLifeTime = particleSystem.MinLifeTime,
                        maxLifeTime = particleSystem.MaxLifeTime,
                        minSize = particleSystem.MinSize,
                        maxSize = particleSystem.MaxSize,
                        minAngularSpeed = particleSystem.MinAngularSpeed,
                        maxAngularSpeed = particleSystem.MaxAngularSpeed,
                        textureName = CopyTexture(particleSystem.Texture, babylonScene),
                        blendMode = (int)particleSystem.BlendType,
                        linkToEmitter = particleSystem.LinkToEmitter
                    };

                Vector4 textureMask = Vector4.Zero;

                switch (particleSystem.TextureUsage)
                {
                    case NovaParticleSystem.ParticleTextureUsages.Alpha:
                        textureMask = new Vector4(0, 0, 0, 1);
                        break;
                    case NovaParticleSystem.ParticleTextureUsages.RGB:
                        textureMask = new Vector4(1, 1, 1, 0);
                        break;
                    case NovaParticleSystem.ParticleTextureUsages.ARGB:
                        textureMask = new Vector4(1, 1, 1, 1);
                        break;
                }

                babylonScene.particleSystems[index].textureMask = textureMask.ToArray();

                index++;
            }
        }

        bool IsInterpolatorIsEmpty(NovaFloatInterpolator interpolator)
        {
            for (int index = 0; index < interpolator.Datas.Length - 1; index++)
            {
                if (interpolator.Datas[index].Value != interpolator.Datas[index + 1].Value)
                {
                    return false;
                }
            }

            return true;
        }

        bool IsInterpolatorIsEmpty(NovaVector3Interpolator interpolator)
        {
            for (int index = 0; index < interpolator.Datas.Length - 1; index++)
            {
                if (interpolator.Datas[index].Value != interpolator.Datas[index + 1].Value)
                {
                    return false;
                }
            }

            return true;
        }

        bool DumpInterpolator(string name, string property, NovaFloatInterpolator interpolator, NovaScene scene, List<BabylonAnimation> animations, float mult = 1.0f)
        {
            if (interpolator.Ready && !IsInterpolatorIsEmpty(interpolator))
            {
                var fps = scene.AnimationFramerate < 1 ? 30 : scene.AnimationFramerate;
                var babylonAnimation = new BabylonAnimation { name = name, property = property, dataType = BabylonAnimation.DataType.Float, framePerSecond = fps };

                babylonAnimation.keys = interpolator.Datas.Select(value => new BabylonAnimationKey { frame = value.Key / scene.AnimationKeyStep, values = new[] { value.Value * mult } }).ToArray();

                babylonAnimation.loopBehavior = interpolator.LoopAfter;

                animations.Add(babylonAnimation);
                return true;
            }

            return false;
        }

        bool DumpInterpolator(string name, string property, NovaVector3Interpolator interpolator, NovaScene scene, List<BabylonAnimation> animations)
        {
            if (interpolator.Ready && !IsInterpolatorIsEmpty(interpolator))
            {
                var fps = scene.AnimationFramerate < 1 ? 30 : scene.AnimationFramerate;
                var babylonAnimation = new BabylonAnimation { name = name, property = property, dataType = BabylonAnimation.DataType.Vector3, framePerSecond = fps };

                babylonAnimation.keys = interpolator.Datas.Select(value => new BabylonAnimationKey { frame = value.Key / scene.AnimationKeyStep, values = value.Value.ToArray() }).ToArray();

                babylonAnimation.loopBehavior = interpolator.LoopAfter;

                animations.Add(babylonAnimation);
                return true;
            }

            return false;
        }

        bool DumpInterpolator(string name, string property, NovaQuaternionInterpolator interpolator, NovaScene scene, List<BabylonAnimation> animations)
        {
            if (interpolator.Ready)
            {
                var fps = scene.AnimationFramerate < 1 ? 30 : scene.AnimationFramerate;
                var babylonAnimation = new BabylonAnimation { name = name, property = property, dataType = BabylonAnimation.DataType.Quaternion, framePerSecond = fps };

                babylonAnimation.keys = interpolator.Datas.Select(value => new BabylonAnimationKey { frame = value.Key / scene.AnimationKeyStep, values = value.Value.ToArray() }).ToArray();

                babylonAnimation.loopBehavior = interpolator.LoopAfter;

                animations.Add(babylonAnimation);
                return true;
            }

            return false;
        }

        void DumpObjects(NovaScene scene, BabylonScene babylonScene)
        {
            int count = 0;
            foreach (NovaObject novaObject in scene.Objects)
            {
                if (novaObject.Is32bits)
                {
                    if (novaObject.SubObjects.Count == 1)
                    {
                        var total = novaObject.VerticesCount;
                        const int step = 32000;
                        var stepsCount = (int)(Math.Floor((float)total / step) + 1);

                        for (var index = 0; index < stepsCount; index++)
                        {
                            var start = index * step;
                            var end = (index + 1) * step;
                            DumpObject(novaObject, babylonScene, scene, start, end, string.Format("#{0}", index));
                        }
                    }
                }
                else
                {
                    DumpObject(novaObject, babylonScene, scene, 0, novaObject.VerticesCount);
                }

                ReportProgressChanged(50 + (count++ * 25) / scene.Objects.Count);
            }
        }

        void DumpObject(NovaObject novaObject, BabylonScene babylonScene, NovaScene scene, int startIndex, int endIndex, string nameIndex = "")
        {
            var babylonMesh = new BabylonMesh();
            babylonScene.MeshesList.Add(babylonMesh);

            babylonMesh.name = novaObject.Name + nameIndex;
            babylonMesh.id = novaObject.ID.ToString();
            babylonMesh.materialId = novaObject.Material == null ? "" : novaObject.Material.ID.ToString();
            babylonMesh.parentId = novaObject.ParentEntity == null ? "" : novaObject.ParentEntity.ID.ToString();
            babylonMesh.isEnabled = novaObject.Enabled;
            babylonMesh.isVisible = novaObject.Renderable;
            babylonMesh.visibility = novaObject.Visibility;
            babylonMesh.checkCollisions = novaObject.CheckCollisions;
            babylonMesh.receiveShadows = novaObject.ReceiveShadows;
            babylonMesh.infiniteDistance = novaObject.InfiniteDistance;

            if (novaObject.Billboard)
            {
                babylonMesh.billboardMode |= (novaObject.BillboardX ? 1 : 0);
                babylonMesh.billboardMode |= (novaObject.BillboardY ? 2 : 0);
                babylonMesh.billboardMode |= (novaObject.BillboardZ ? 4 : 0);
            }

            if (novaObject.ParticleSystem != null)
            {
                particleSystemsToExport.Add(novaObject.ParticleSystem);
            }

            // Mirror
            if (novaObject.IsMirror && novaObject.Material != null)
            {
                mirrorsMaterials.Add(novaObject.Material, novaObject);
            }

            // World
            babylonMesh.position = novaObject.Position.ToArray();
            babylonMesh.rotation = novaObject.Rotation.ToArray();
            babylonMesh.localMatrix = (Matrix.Scaling(novaObject.Scaling) * novaObject.LocalMatrix).ToArray();

            // Animations
            var animations = new List<BabylonAnimation>();

            DumpInterpolator("Visibility animation", "visibility", novaObject.VisibilityInterpolator, scene, animations);

            // Position
            if (!DumpInterpolator("Position animation", "position", novaObject.PositionInterpolator, scene, animations))
            {
                DumpInterpolator("PositionX animation", "position.x", novaObject.PositionXInterpolator, scene, animations);
                DumpInterpolator("PositionY animation", "position.y", novaObject.PositionYInterpolator, scene, animations);
                DumpInterpolator("PositionZ animation", "position.z", novaObject.PositionZInterpolator, scene, animations);
            }

            // Rotation
            if (!DumpInterpolator("Rotation animation", "rotationQuaternion", novaObject.RotationInterpolator, scene, animations))
            {
                DumpInterpolator("RotationX animation", "rotation.x", novaObject.RotationXInterpolator, scene,
                    animations, -novaObject.Determinant);
                DumpInterpolator("RotationY animation", "rotation.y", novaObject.RotationYInterpolator, scene,
                    animations, -novaObject.Determinant);
                DumpInterpolator("RotationZ animation", "rotation.z", novaObject.RotationZInterpolator, scene,
                    animations, -novaObject.Determinant);
            }
            else
            {
                babylonMesh.localMatrix = Matrix.Identity.ToArray();
                babylonMesh.scaling = novaObject.Scaling.ToArray();
            }

            // Scaling
            if (!DumpInterpolator("Scaling animation", "scaling", novaObject.ScalingInterpolator, scene, animations))
            {
                DumpInterpolator("ScalingX animation", "scaling.x", novaObject.ScalingXInterpolator, scene, animations);
                DumpInterpolator("ScalingY animation", "scaling.y", novaObject.ScalingYInterpolator, scene, animations);
                DumpInterpolator("ScalingZ animation", "scaling.z", novaObject.ScalingZInterpolator, scene, animations);
            }
            else
            {
                babylonMesh.localMatrix = novaObject.LocalMatrix.ToArray();
                babylonMesh.scaling = novaObject.Scaling.ToArray();
            }

            babylonMesh.animations = animations.ToArray();
            babylonMesh.autoAnimate = novaObject.AutoAnimate;

            if (novaObject.AutoAnimate)
            {
                babylonMesh.autoAnimateFrom = novaObject.AnimationStartKey;
                if (novaObject.AnimationEndKey == -1)
                {
                    babylonMesh.autoAnimateTo = scene.AnimationKeyMax / scene.AnimationKeyStep;
                    babylonMesh.autoAnimateLoop = true;
                }
                else
                {
                    babylonMesh.autoAnimateTo = novaObject.AnimationEndKey;
                }
            }

            // Vertices & faces
            var exportedVerticesCount = DumpObjectGeometry(novaObject, babylonMesh, startIndex, endIndex);

            // Subobjects
            var subMeshes = new List<BabylonSubMesh>();

            if (novaObject.Is32bits)
            {
                var subMesh = new BabylonSubMesh();
                subMesh.materialIndex = 0;
                subMesh.verticesStart = 0;
                subMesh.verticesCount = exportedVerticesCount;
                subMesh.indexStart = 0;
                subMesh.indexCount = babylonMesh.indices.Length;

                subMeshes.Add(subMesh);
            }
            else
            {
                foreach (NovaSubObject subObject in novaObject.SubObjects)
                {
                    var subMesh = new BabylonSubMesh();
                    subMesh.materialIndex = subObject.AttributeRange.AttributeId;
                    subMesh.verticesStart = subObject.AttributeRange.VertexStart;
                    subMesh.verticesCount = subObject.AttributeRange.VertexCount;
                    subMesh.indexStart = subObject.AttributeRange.FaceStart * 3;
                    subMesh.indexCount = subObject.AttributeRange.FaceCount * 3;

                    subMeshes.Add(subMesh);
                }
            }
            babylonMesh.subMeshes = subMeshes.ToArray();

            if (novaObject.Material != null)
            {
                if (!materialsToExport.Contains(novaObject.Material))
                {
                    materialsToExport.Add(novaObject.Material);
                    var multiMat = novaObject.Material as NovaMultiMaterial;

                    if (multiMat != null)
                    {
                        foreach (var mat in multiMat.Materials)
                        {
                            if (!materialsToExport.Contains(mat))
                            {
                                materialsToExport.Add(mat);
                            }
                        }
                    }
                }
            }
        }

        private void DumpVertex(NovaCustomVertexFormat.GlobalVector3 vertex, List<float> positions, List<float> normals, List<float> uvs, List<float> uvs2, List<float> colors, Matrix transformMatrix, NovaObject novaObject)
        {
            var position = Vector3.TransformCoordinate(vertex.Position, transformMatrix);
            var normal = Vector3.TransformNormal(vertex.Normal, transformMatrix);

            positions.Add(position.X); positions.Add(position.Y); positions.Add(position.Z);
            normals.Add(normal.X); normals.Add(normal.Y); normals.Add(normal.Z);
            uvs.Add(vertex.Tu); uvs.Add(vertex.Tv);

            if (novaObject.Use2TextureCoordinatesForMeshCreation)
            {
                uvs2.Add(vertex.Tu2); uvs2.Add(vertex.Tv2);
            }

            if (novaObject.VertexPaint)
            {
                var color = RGBAColor.FromArgb((int)vertex.Color);
                colors.Add(color.Red); colors.Add(color.Green); colors.Add(color.Blue);
            }
        }

        private int DumpObjectGeometry(NovaObject novaObject, BabylonMesh babylonMesh, int startIndex, int endIndex)
        {
            var verticesIndices = new int[novaObject.VerticesCount];
            for (var index = 0; index < verticesIndices.Length; index++)
            {
                verticesIndices[index] = -1;
            }

            // Vertices
            var transformMatrix = Matrix.Identity;//.Scaling(novaObject.Scaling) * novaObject.LocalMatrix;
            var indicesList = new List<int>();

            NovaCustomVertexFormat.GlobalVector3[] vertices = novaObject.InternalMesh.LockVertexBuffer<NovaCustomVertexFormat.GlobalVector3>(NovaLock.ReadOnly, novaObject.VerticesCount);

            // Faces
            INovaDataStream data = novaObject.InternalMesh.LockIndexBuffer(NovaLock.ReadOnly);

            int[] indices;

            if (novaObject.Is32bits)
            {
                indices = data.Read<int>(novaObject.FacesCount * 3 * 4);
            }
            else
            {
                indices = (data.Read<ushort>(novaObject.FacesCount * 3 * 4)).Select(i => (int)i).ToArray();
            }

            var positions = new List<float>();
            var normals = new List<float>();
            var uvs = new List<float>();
            var uvs2 = new List<float>();
            var colors = new List<float>();
            int exportedVerticesCount = 0;
            for (var index = 0; index < novaObject.FacesCount; index++)
            {
                var v0 = indices[index * 3];
                var v1 = indices[index * 3 + 1];
                var v2 = indices[index * 3 + 2];

                if (v0 < startIndex || v1 < startIndex || v2 < startIndex)
                {
                    continue;
                }

                if (v0 >= startIndex && v0 < endIndex || v1 >= startIndex && v1 < endIndex || v2 >= startIndex && v2 < endIndex)
                {
                    if (verticesIndices[v0] == -1)
                    {
                        verticesIndices[v0] = exportedVerticesCount++;
                        DumpVertex(vertices[v0], positions, normals, uvs, uvs2, colors, transformMatrix, novaObject);
                    }
                    if (verticesIndices[v1] == -1)
                    {
                        verticesIndices[v1] = exportedVerticesCount++;
                        DumpVertex(vertices[v1], positions, normals, uvs, uvs2, colors, transformMatrix, novaObject);
                    }
                    if (verticesIndices[v2] == -1)
                    {
                        verticesIndices[v2] = exportedVerticesCount++;
                        DumpVertex(vertices[v2], positions, normals, uvs, uvs2, colors, transformMatrix, novaObject);
                    }

                    indicesList.Add(verticesIndices[v0]);
                    indicesList.Add(verticesIndices[v1]);
                    indicesList.Add(verticesIndices[v2]);
                }
            }

            if (positions.Count > 0)
            {
                babylonMesh.positions = positions.ToArray();
            }
            if (normals.Count > 0)
            {
                babylonMesh.normals = normals.ToArray();
            }
            if (uvs.Count > 0)
            {
                babylonMesh.uvs = uvs.ToArray();
            }
            if (uvs2.Count > 0)
            {
                babylonMesh.uvs2 = uvs2.ToArray();
            }
            if (colors.Count > 0)
            {
                babylonMesh.colors = colors.ToArray();
            }
            babylonMesh.indices = indicesList.ToArray();

            // Invert normal order
            for (var index = 0; index < babylonMesh.indices.Length; index += 3)
            {
                var temp = babylonMesh.indices[index];
                babylonMesh.indices[index] = babylonMesh.indices[index + 2];
                babylonMesh.indices[index + 2] = temp;
            }

            novaObject.InternalMesh.UnlockIndexBuffer();
            novaObject.InternalMesh.UnlockVertexBuffer();

            return exportedVerticesCount;
        }

        void DumpCameras(NovaScene scene, BabylonScene babylonScene)
        {
            foreach (NovaCamera camera in scene.Cameras)
            {
                var babylonCamera = new BabylonCamera();
                babylonScene.CamerasList.Add(babylonCamera);

                babylonCamera.name = camera.Name;
                babylonCamera.id = camera.ID.ToString();
                babylonCamera.parentId = camera.ParentEntity == null ? "" : camera.ParentEntity.ID.ToString();
                babylonCamera.lockedTargetId = camera.Target == null ? "" : camera.Target.ID.ToString();
                babylonCamera.position = camera.Position.ToArray();
                babylonCamera.rotation = camera.Rotation.ToArray();
                babylonCamera.fov = camera.FOV;
                babylonCamera.minZ = camera.NearClip;
                babylonCamera.maxZ = camera.FarClip;
                babylonCamera.inertia = camera.Inertia;
                babylonCamera.speed = camera.Speed;
                babylonCamera.checkCollisions = camera.CheckCollisions;
                babylonCamera.applyGravity = camera.ApplyGravity;
                babylonCamera.ellipsoid = camera.EllipsoidVector.ToArray();

                // Animations
                var animations = new List<BabylonAnimation>();

                // Position
                if (!DumpInterpolator("Position animation", "position", camera.PositionInterpolator, scene, animations))
                {
                    DumpInterpolator("PositionX animation", "position.x", camera.PositionXInterpolator, scene, animations);
                    DumpInterpolator("PositionY animation", "position.y", camera.PositionYInterpolator, scene, animations);
                    DumpInterpolator("PositionZ animation", "position.z", camera.PositionZInterpolator, scene, animations);
                }

                babylonCamera.animations = animations.ToArray();
                babylonCamera.autoAnimate = camera.AutoAnimate;

                if (camera.AutoAnimate)
                {
                    babylonCamera.autoAnimateFrom = camera.AnimationStartKey;
                    if (camera.AnimationEndKey == -1)
                    {
                        babylonCamera.autoAnimateTo = scene.AnimationKeyMax / scene.AnimationKeyStep;
                        babylonCamera.autoAnimateLoop = true;
                    }
                    else
                    {
                        babylonCamera.autoAnimateTo = camera.AnimationEndKey;
                    }
                }
            }

            if (scene.ActiveCamera != null)
            {
                babylonScene.activeCameraID = scene.ActiveCamera.ID.ToString();
            }
        }

        void DumpLights(NovaScene scene, BabylonScene babylonScene)
        {
            foreach (NovaLight light in scene.Lights)
            {
                if (light.Enabled)
                {
                    var babylonLight = new BabylonLight();
                    babylonScene.LightsList.Add(babylonLight);

                    babylonLight.name = light.Name;
                    babylonLight.id = light.ID.ToString();
                    switch (light.Type)
                    {
                        case NovaLightType.Point:
                            babylonLight.type = 0;
                            babylonLight.position = light.Position.ToArray();
                            break;
                        case NovaLightType.Spot:
                        case NovaLightType.Directional:
                            babylonLight.type = 1;
                            babylonLight.position = light.Position.ToArray();
                            babylonLight.direction = light.Direction.ToArray();
                            break;
                    }
                    babylonLight.diffuse = light.Diffuse.ToArray();
                    babylonLight.specular = light.Specular.ToArray();
                    babylonLight.intensity = light.Multiplicator;

                    if (light.ShadowMembers.Count > 0)
                    {
                        var shadowGenerator = new BabylonShadowGenerator
                        {
                            useVarianceShadowMap = true,
                            lightId = light.ID.ToString(),
                            mapSize = light.ShadowMapSize,
                            renderList = light.ShadowMembers.Select(m => m.ID.ToString()).ToArray()
                        };
                        babylonScene.ShadowGeneratorsList.Add(shadowGenerator);
                    }

                    if (light.LensFlares != null)
                    {
                        light.LensFlares.Tag = light;
                        lensFlareSystemToExport.Add(light.LensFlares);
                    }
                }
            }
        }

    }
}
