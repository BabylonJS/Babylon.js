using System;
using System.IO;
using UnityEngine;
using BabylonHosting;

namespace Unity3D2Babylon
{
    public class ExportationOptions
    {
        public bool HostPreviewPage { get; set; }
        public bool BuildJavaScript { get; set; }
        public bool CompileTypeScript { get; set; }
        public bool AttachUnityEditor { get; set; }
        public bool ShowDebugControls { get; set; }
        public float ReflectionDefaultLevel { get; set; }
        public SerializableVector3 LightRotationOffset { get; set; }
        public float LightIntensityFactor { get; set; }
        public int DefaultQualityLevel { get; set; }
        public bool EmbeddedShaders { get; set; }
        public bool ExportLightmaps { get; set; }
        public bool ExportCollisions { get; set; }
        public bool ExportPhysics { get; set; }
        public bool ExportShadows { get; set; }
        public bool WorkerCollisions { get; set; }
        public int ShadowMapSize { get; set; }
        public float ShadowMapBias { get; set; }
        public float ShadowBlurScale { get; set; }
        public float ProductionVersion { get; set; }
        public float DefaultAspectRatio { get; set; }
        public int DefaultUpdateOptions { get; set; }
        public int DefaultPreviewWindow { get; set; }
        public int DefaultLightFilter { get; set; }
        public int DefaultImageFormat { get; set; }
        public int DefaultPhysicsEngine { get; set; }
        public int DefaultLightmapMode { get; set; }
        public int DefaultLightmapBaking { get; set; }
        public int DefaultCoordinatesIndex { get; set; }
        public int DefaultColliderDetail { get; set; }
        public string DefaultIndexPage { get; set; }
        public string DefaultBuildPath { get; set; }
        public string DefaultScenePath { get; set; }
        public string DefaultScriptPath { get; set; }
        public int DefaultServerPort { get; set; }
        public string DefaultShaderFolder { get; set; }
        public string DefaultProjectFolder { get; set; }
        public string DefaultTypeSriptPath { get; set; }
        public string DefaultNodeRuntimePath { get; set; }

        public ExportationOptions()
        {
            ProductionVersion = (float)ExporterWindow.BabylonVersion;
            HostPreviewPage = true;
            BuildJavaScript = true;
            CompileTypeScript = true;
            AttachUnityEditor = true;
            ShowDebugControls = true;
            LightRotationOffset = new Vector3(0,0,0);
            LightIntensityFactor = 1f;
            ReflectionDefaultLevel = 0.25f;
            DefaultQualityLevel = 90;
            EmbeddedShaders = true;
            ExportLightmaps = true;
            ExportCollisions = true;
            ExportPhysics = true;
            ExportShadows = false;
            WorkerCollisions = false;
            ShadowMapSize = 1024;
            ShadowMapBias = 0.0001f;
            ShadowBlurScale = 0;
            DefaultAspectRatio = 1f;
            DefaultUpdateOptions = 0;
            DefaultPreviewWindow = 0;
            DefaultLightFilter = 4;
            DefaultImageFormat = 1;
            DefaultLightmapMode = 0;
            DefaultLightmapBaking = 0;
            DefaultCoordinatesIndex = 1;
            DefaultColliderDetail = 4;
            DefaultPhysicsEngine = 0;
            DefaultShaderFolder = String.Empty;
            DefaultServerPort = 8888;
            DefaultBuildPath = "Build";
            DefaultScenePath = "Scenes";
            DefaultScriptPath = "Scripts";
            DefaultIndexPage = "Index.html";
            DefaultTypeSriptPath = Tools.GetDefaultTypeScriptPath();
            DefaultNodeRuntimePath = Tools.GetDefaultNodeRuntimePath();
            DefaultProjectFolder = Tools.FormatSafePath(Application.dataPath.Replace("/Assets", "/Project"));
        }
    }
}
