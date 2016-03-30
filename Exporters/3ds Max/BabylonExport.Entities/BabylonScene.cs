using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.Serialization;

namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonScene
    {
        [DataMember]
        public BabylonProducer producer { get; set; }

        [DataMember]
        public bool autoClear { get; set; }

        [DataMember]
        public float[] clearColor { get; set; }

        [DataMember]
        public float[] ambientColor { get; set; }

        [DataMember]
        public int fogMode { get; set; }

        [DataMember]
        public float[] fogColor { get; set; }

        [DataMember]
        public float fogStart { get; set; }

        [DataMember]
        public float fogEnd { get; set; }

        [DataMember]
        public float fogDensity { get; set; }

        [DataMember]
        public float[] gravity { get; set; }
        
        [DataMember]
        public bool physicsEnabled { get; set; }

        [DataMember]
        public float[] physicsGravity { get; set; }

        [DataMember]
        public BabylonCamera[] cameras { get; set; }

        [DataMember]
        public string activeCameraID { get; set; }

        [DataMember]
        public BabylonLight[] lights { get; set; }

        [DataMember]
        public BabylonMesh[] meshes { get; set; }

        [DataMember]
        public BabylonSound[] sounds { get; set; }

        [DataMember]
        public BabylonMaterial[] materials { get; set; }

        [DataMember]
        public BabylonMultiMaterial[] multiMaterials { get; set; }

        [DataMember]
        public BabylonParticleSystem[] particleSystems { get; set; }

        [DataMember]
        public BabylonLensFlareSystem[] lensFlareSystems { get; set; }

        [DataMember]
        public BabylonShadowGenerator[] shadowGenerators { get; set; }

        [DataMember]
        public BabylonSkeleton[] skeletons { get; set; }

        [DataMember]
        public BabylonActions actions { get; set; }

        public BabylonVector3 MaxVector { get; set; }
        public BabylonVector3 MinVector { get; set; }

        public string OutputPath { get; private set; }

        public List<BabylonMesh> MeshesList { get; private set; }
        public List<BabylonSound> SoundsList { get; private set; }
        public List<BabylonCamera> CamerasList { get; private set; }
        public List<BabylonLight> LightsList { get; private set; }
        public List<BabylonMaterial> MaterialsList { get; private set; }
        public List<BabylonMultiMaterial> MultiMaterialsList { get; private set; }
        public List<BabylonShadowGenerator> ShadowGeneratorsList { get; private set; }
        public List<BabylonSkeleton> SkeletonsList { get; private set; }

        readonly List<string> exportedTextures = new List<string>();

        public BabylonScene(string outputPath)
        {
            OutputPath = outputPath;

            MeshesList = new List<BabylonMesh>();
            MaterialsList = new List<BabylonMaterial>();
            CamerasList = new List<BabylonCamera>();
            LightsList = new List<BabylonLight>();
            MultiMaterialsList = new List<BabylonMultiMaterial>();
            ShadowGeneratorsList = new List<BabylonShadowGenerator>();
            SkeletonsList = new List<BabylonSkeleton>();
            SoundsList = new List<BabylonSound>();

            // Default values
            autoClear = true;
            clearColor = new[] { 0.2f, 0.2f, 0.3f };
            ambientColor = new[] { 0f, 0f, 0f };
            gravity = new[] { 0f, 0f, -0.9f };

            MaxVector = new BabylonVector3 { X = float.MinValue, Y = float.MinValue, Z = float.MinValue };
            MinVector = new BabylonVector3 { X = float.MaxValue, Y = float.MaxValue, Z = float.MaxValue };
        }

        public void Prepare(bool generateDefaultLight = true)
        {
            meshes = MeshesList.ToArray();
            sounds = SoundsList.ToArray();

            materials = MaterialsList.ToArray();
            multiMaterials = MultiMaterialsList.ToArray();
            shadowGenerators = ShadowGeneratorsList.ToArray();
            skeletons = SkeletonsList.ToArray();

            if (CamerasList.Count == 0)
            {
                var camera = new BabylonCamera { name = "Default camera", id = Guid.NewGuid().ToString() };

                var distanceVector = MaxVector - MinVector;
                var midPoint = MinVector + distanceVector / 2;
                camera.target = midPoint.ToArray();
                camera.position = (midPoint + distanceVector).ToArray();

                var distance = distanceVector.Length();
                camera.speed = distance / 50.0f;
                camera.maxZ = distance * 4f;

                camera.minZ = distance < 100.0f ? 0.1f : 1.0f;

                CamerasList.Add(camera);
            }

            if (LightsList.Count == 0 && generateDefaultLight)
            {
                var light = new BabylonLight
                {
                    name = "Default light",
                    id = Guid.NewGuid().ToString(),
                    type = 3,
                    groundColor = new float[] {0, 0, 0},
                    direction = new[] {0, 1.0f, 0},
                    intensity = 1
                };

                LightsList.Add(light);
            }

            cameras = CamerasList.ToArray();
            lights = LightsList.ToArray();

            if (activeCameraID == null)
            {
                activeCameraID = CamerasList[0].id;
            }
        }

        public void AddTexture(string texture)
        {
            if (exportedTextures.Contains(texture))
                return;

            exportedTextures.Add(texture);

            File.Copy(texture, Path.Combine(OutputPath, Path.GetFileName(texture)), true);
        }

        public bool AddTextureCube(string textureName)
        {
            if (exportedTextures.Contains(textureName))
                return false;

            exportedTextures.Add(textureName);

            return true;
        }
    }
}
