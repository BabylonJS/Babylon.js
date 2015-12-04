using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.Serialization;
using SharpDX;

namespace BabylonExport.Core
{
    [DataContract]
    public class BabylonScene
    {
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
        public BabylonCamera[] cameras { get; set; }

        [DataMember]
        public string activeCameraID { get; set; }

        [DataMember]
        public BabylonLight[] lights { get; set; }

        [DataMember]
        public BabylonMesh[] meshes { get; set; }

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
        
        public Vector3 MaxVector { get; set; }
        public Vector3 MinVector { get; set; }

        public string OutputPath { get; private set; }

        internal List<BabylonMesh> MeshesList { get; private set; }
        internal List<BabylonCamera> CamerasList { get; private set; }
        internal List<BabylonLight> LightsList { get; private set; }
        internal List<BabylonMaterial> MaterialsList { get; private set; }
        internal List<BabylonMultiMaterial> MultiMaterialsList { get; private set; }
        internal List<BabylonShadowGenerator> ShadowGeneratorsList { get; private set; }
        internal List<BabylonSkeleton> SkeletonsList { get; private set; }

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

            // Default values
            autoClear = true;
            clearColor = new[] { 0.2f, 0.2f, 0.3f };
            ambientColor = new[] {0f, 0f, 0f };
            gravity = new[] {0f, 0f, -0.9f};
        }

        public void Prepare(bool generateDefaultLight = true)
        {
            meshes = MeshesList.ToArray();

            materials = MaterialsList.ToArray();
            multiMaterials = MultiMaterialsList.ToArray();
            shadowGenerators = ShadowGeneratorsList.ToArray();
            skeletons = SkeletonsList.ToArray();

            if (CamerasList.Count == 0)
            {
                var camera = new BabylonCamera {name = "Default camera", id = Guid.NewGuid().ToString()};

                var distanceVector = MaxVector - MinVector;
                var midPoint = MinVector +distanceVector / 2;
                camera.target = midPoint.ToArray();
                camera.position = (midPoint + distanceVector).ToArray();

                var distance = distanceVector.Length();
                camera.speed =  distance/ 50.0f;
                camera.maxZ = distance * 4f;

                camera.minZ = distance < 100.0f ? 0.1f : 1.0f;

                CamerasList.Add(camera);
            }

            if (LightsList.Count == 0 && generateDefaultLight)
            {
                var light = new BabylonLight {name = "Default light", id = Guid.NewGuid().ToString()};

                var midPoint = MinVector + (MaxVector - MinVector) / 2;
                light.type = 0;
                light.position = (midPoint + (MaxVector - MinVector)).ToArray();

                light.diffuse = new Vector3(1, 1, 1).ToArray();
                light.specular = new Vector3(1, 1, 1).ToArray();

                LightsList.Add(light);
            }
            
            cameras = CamerasList.ToArray();
            lights = LightsList.ToArray();

            if (activeCameraID == null)
            {
                activeCameraID = CamerasList[0].id;
            }
        }

        public void AddTexture(string diffuseTexture)
        {
            if (exportedTextures.Contains(diffuseTexture))
                return;

            exportedTextures.Add(diffuseTexture);

            File.Copy(diffuseTexture, Path.Combine(OutputPath, Path.GetFileName(diffuseTexture)), true);
        }
    }
}
