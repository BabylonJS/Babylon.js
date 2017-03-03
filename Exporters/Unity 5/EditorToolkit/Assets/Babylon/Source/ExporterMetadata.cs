using System;
using System.Reflection;
using System.Collections.Generic;
using System.Runtime.Serialization;
using System.IO;
using BabylonExport.Entities;
using UnityEngine;
using UnityEditor;
using Object = UnityEngine.Object;

namespace Unity3D2Babylon
{
    #region Unity Components
    [DataContract]
    public class UnityScriptFile
    {
        [DataMember]
        public int order;

        [DataMember]
        public string name;

        [DataMember]
        public string script;
    }

    [DataContract]
    public class UnityFlareSystem
    {
        [DataMember]
        public string name;

        [DataMember]
        public string emitterId;

        [DataMember]
        public int borderLimit;

        [DataMember]
        public UnityFlareItem[] lensFlares;
    }

    [DataContract]
    public class UnityFlareItem
    {
        [DataMember]
        public float size;

        [DataMember]
        public float position;

        [DataMember]
        public float[] color;

        [DataMember]
        public string textureName;
    }

    [DataContract]
    public class UnityBabylonColor
    {
        [DataMember]
        public float r;

        [DataMember]
        public float g;

        [DataMember]
        public float b;

        [DataMember]
        public float a;
    }

    [DataContract]
    public class UnityBablylonVector2
    {
        [DataMember]
        public float x;

        [DataMember]
        public float y;
    }

    [DataContract]
    public class UnityBablylonVector3
    {
        [DataMember]
        public float x;

        [DataMember]
        public float y;

        [DataMember]
        public float z;
    }

    [DataContract]
    public class UnityBablylonVector4
    {
        [DataMember]
        public float x;

        [DataMember]
        public float y;

        [DataMember]
        public float z;

        [DataMember]
        public float w;
    }

    [DataContract]
    public class UnityScriptComponent
    {
        [DataMember]
        public int order;

        [DataMember]
        public string name;

        [DataMember]
        public string klass;

        [DataMember]
        public bool update;

        [DataMember]
        public bool controller;

        [DataMember]
        public Dictionary<string, object> properties;

        [DataMember]
        public object instance;

        [DataMember]
        public object tag;

        public UnityScriptComponent()
        {
            this.order = 0;
            this.name = String.Empty;
            this.klass = String.Empty;
            this.update = false;
            this.controller = false;
            this.properties = new Dictionary<string, object>();
            this.instance = null;
            this.tag = null;
        }
    }
    #endregion

    #region Read Only Attribute
    public class ReadOnlyAttribute : PropertyAttribute { }
    [CustomPropertyDrawer(typeof(ReadOnlyAttribute))]
    public class ReadOnlyDrawer : PropertyDrawer
    {
        public override float GetPropertyHeight(SerializedProperty property, GUIContent label)
        {
            return EditorGUI.GetPropertyHeight(property, label, true);
        }

        public override void OnGUI(Rect position, SerializedProperty property, GUIContent label)
        {
            GUI.enabled = false;
            EditorGUI.PropertyField(position, property, label, true);
            GUI.enabled = true;
        }
    }
    #endregion
}

namespace UnityEditor
{
    [System.Serializable]
    public class EmbeddedAsset
    {
        public BabylonTextEncoding encoding = BabylonTextEncoding.RawBytes;
        public TextAsset textAsset;
    }

    [System.Serializable]
    public class SceneMetaData
    {
        public bool api;
        public Dictionary<string, object> properties;
        public List<string> bakedMaterials;

        public SceneMetaData()
        {
            this.api = true;
            this.properties = new Dictionary<string, object>();
            this.bakedMaterials = new List<string>();
        }
    }

    [System.Serializable]
    public class UnityMetaData
    {
        public bool api;
        public string type;
        public string objectName;
        public string objectId;
        public string tagName;
        public int layerIndex;
        public string layerName;
        public int areaIndex;
        public object navAgent;
        public object meshLink;
        public object meshObstacle;
        public List<object> components;
        public Dictionary<string, object> properties;

        public UnityMetaData()
        {
            this.api = true;
            this.type = "Unity";
            this.objectName = String.Empty;
            this.objectId = String.Empty;
            this.tagName = String.Empty;
            this.layerIndex = -1;
            this.layerName = String.Empty;
            this.areaIndex = -1;
            this.navAgent = null;
            this.meshLink = null;
            this.meshObstacle = null;
            this.components = new List<object>();
            this.properties = new Dictionary<string, object>();
        }
    }

    [System.Serializable]
    public sealed class UnityLensFlareItem
    {
        public float size;
        public float position;
        public Color color;
        public Texture2D texture;
    }

    [System.Serializable]
    public class BabylonSceneOptions
    {
        public bool autoClear = true;
        public Color ambientColor = Color.clear;
        public Vector3 defaultGravity = new Vector3(0, -0.9f, 0);
        public Vector3 cameraEllipsoid = new Vector3(0.5f, 0.85f, 0.5f);
        public BabylonNavigationMesh navigationMesh = BabylonNavigationMesh.EnableNavigation;
        public bool particleSystems = true;
        public bool lensFlareSystems = true;
        public bool autoDrawInterface = true;
        public BabylonGuiMode userInterfaceMode = BabylonGuiMode.None;
        public EmbeddedAsset graphicUserInterface = null;
    }

    [System.Serializable]
    public class BabylonSoundOptions
    {
        public float volume = 1;
        public float playbackRate = 1;
        public bool autoplay = false;
        public bool loop = false;
        public int soundTrackId = -1;
        public bool spatialSound = false;
        public Vector3 position = new Vector3(0, 0, 0);
        public float refDistance = 1;
        public float rolloffFactor = 1;
        public float maxDistance = 100;
        public string distanceModel = "linear";
        public string panningModel = "equalpower";
        public bool isDirectional = false;
        public float coneInnerAngle = 360;
        public float coneOuterAngle = 360;
        public float coneOuterGain = 0;
        public Vector3 directionToMesh = new Vector3(1, 0, 0);
    }

    [System.Serializable]
    public class BabylonLightOptions
    {
        public BabylonAmbientLighting lightMode = BabylonAmbientLighting.UnityAmbientLighting;
        [Range(0.0f, 10.0f)]
        public float lightLevel = 1;
        public Color specularColor = Color.black;
    }

    [System.Serializable]
    public class BabylonSkyboxOptions
    {
        public bool exportSkybox = true;
        public BabylonTextureExport textureFile = BabylonTextureExport.AlwaysExport;
        public Color albedoColor = Color.white;
        public Color reflectivityColor = Color.white;
        [Range(0.0f, 5.0f)]
        public float lightIntensity = 1;
        [Range(0.0f, 5.0f)]
        public float microSurface = 1;
        [Range(0.0f, 5.0f)]
        public float cameraExposure = 1;
        [Range(0.0f, 5.0f)]
        public float cameraContrast = 1;
        [Range(0.0f, 5.0f)]
        public float directIntensity = 1;
        [Range(0.0f, 5.0f)]
        public float emissiveIntensity = 1;
        [Range(0.0f, 5.0f)]
        public float specularIntensity = 1;
        [Range(0.0f, 5.0f)]
        public float environmentIntensity = 1;
    }

    [System.Serializable]
    public class BabylonManifestOptions
    {
        public bool exportManifest = true;
        public int manifestVersion = 1;
        public bool storeSceneOffline = false;
        public bool storeTextureOffline = false;
    }

    public enum BabylonImageFormat
    {
        JPEG = 0,
        PNG = 1
    }

    public enum BabylonFogMode
    {
        None = 0,
        Exponential = 1,
        FastExponential = 2,
        Linear = 3
    }

    public enum BabylonGuiMode
    {
        None = 0,
        Html = 1
    }

    public enum BabylonTickOptions
    {
        EnableTick = 0,
        DisableTick = 1
    }

    public enum BabylonTextEncoding
    {
        RawBytes = 0,
        EncodedText = 1
    }

    public enum BabylonLightmapMode
    {
        ShadowBaking = 0,
        FullLightBaking = 1
    }

    public enum BabylonShadowOptions
    {
        Baked = 0,
        Realtime = 1
    }

    public enum BabylonLightmapBaking
    {
        Disabled = 0,
        Enabled = 1
    }

    public enum BabylonParticleBlend
    {
        OneOne = 0,
        Standard = 1
    }

    public enum BabylonTextureExport
    {
        AlwaysExport = 0,
        IfNotExists = 1
    }

    public enum BabylonPhysicsEngine
    {
        Cannon = 0,
        Oimo = 1
    }

    public enum BabylonProgramSection
    {
        Babylon = 0,
        Vertex = 1,
        Fragment = 2
    }

    public enum BabylonPhysicsImposter
    {
        None = 0,
        Sphere = 1,
        Box = 2,
        Plane = 3,
        Mesh = 4,
        Cylinder = 7,
        Particle = 8,
        HeightMap = 9
    }

    public enum BabylonAmbientLighting
    {
        NoAmbientLighting = 0,
        UnityAmbientLighting = 1
    }

    public enum BabylonNavigationMesh
    {
        DisableNavigation = 0,
        EnableNavigation = 1
    }

    public enum BabylonUpdateOptions
    {
        StableProduction = 0,
        PreviewRelease = 1,
    }

    public enum BabylonLightingFilter
    {
        NoFilter = 0,
        PoissonSampling = 1,
        VarianceShadowMap = 2,
        BlurVarianceShadowMap = 3,
        SoftPoissonSampling = 4
    }

    public class BabylonTerrainData
    {
        public Vector3[] vertices;
        public Vector3[] normals;
        public Vector2[] uvs;
        public int[] triangles;
    }

    public enum BabylonTerrainFormat
    {
        Triangles = 0
    }

    public enum BabylonTerrainResolution
    {
        FullResolution = 0,
        HighResolution = 1,
        MediumResolution = 2,
        LowResolution = 3,
        VeryLowResolution = 4
    }

    public enum BabylonColliderDetail
    {
        FullResolution = 0,
        HighResolution = 1,
        MediumResolution = 2,
        LowResolution = 3,
        VeryLowResolution = 4,
        MinimumResolution = 5
    }

    public enum BabylonPreviewWindow
    {
        OpenDefaultBrowser = 0,
        AttachUnityBrowser = 1
    }

    [AttributeUsage(AttributeTargets.Class, Inherited = false)]
    public sealed class BabylonClassAttribute : Attribute { }

    [AttributeUsage(AttributeTargets.Field, Inherited = false)]
    public sealed class BabylonPropertyAttribute : PropertyAttribute { }

    public abstract class BabylonScriptComponent : MonoBehaviour
    {
        [Unity3D2Babylon.ReadOnly]
        public string babylonClass;
        public BabylonTickOptions updateOption;
        protected BabylonScriptComponent()
        {
            this.babylonClass = "BABYLON.ScriptComponent";
            this.updateOption = BabylonTickOptions.EnableTick;
        }
        public virtual void OnExportProperties(ref Unity3D2Babylon.ExportationOptions exportOptions, ref GameObject unityGameObject, ref Dictionary<string, object> propertyBag, string outputPath) { }
    }

    public abstract class BabylonSceneController : BabylonScriptComponent
    {
        public BabylonSceneOptions sceneOptions;
        public BabylonSkyboxOptions skyboxOptions;
        public BabylonLightOptions lightingOptions;
        public BabylonManifestOptions manifestOptions;

        protected BabylonSceneController()
        {
            this.babylonClass = "BABYLON.SceneController";
            this.updateOption = BabylonTickOptions.EnableTick;
        }
        public virtual void OnExportGameObject(ref Unity3D2Babylon.ExportationOptions exportOptions, ref GameObject unityGameObject, ref UnityMetaData metaData, ref BabylonScene sceneBuilder, string outputPath) { }
    }
}
