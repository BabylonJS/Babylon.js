
using System;
using System.IO;
using System.Text;
using System.Linq;
using System.Reflection;
using System.Collections.Generic;
using System.Runtime.Serialization;
using BabylonExport.Entities;
using UnityEngine;
using UnityEditor;
using UnityEngine.AI;
using Object = UnityEngine.Object;

using JsonFx.Json;
using JsonFx.Json.Resolvers;
using JsonFx.Serialization;
using JsonFx.Serialization.Resolvers;

namespace Unity3D2Babylon
{
    public partial class SceneBuilder
    {
        public const int MAX_VERTEX_COUNT = 65000;
        public string OutputPath { get; private set; }
        public string SceneName { get; private set; }
        public string ManifestData { get; private set; }
        public string SceneJavascriptPath { get; private set; }
        public BabylonSceneController SceneController { get; private set; }
        public List<MonoScript> MonoRuntimeScripts { get; private set; }
        readonly Dictionary<string, BabylonMaterial> materialsDictionary;
        readonly Dictionary<string, BabylonMultiMaterial> multiMatDictionary;
        readonly Dictionary<int, string> uniqueGuids;
        readonly BabylonScene babylonScene;
        GameObject[] gameObjects;
        readonly ExportationOptions exportationOptions;
        BabylonTexture sceneReflectionTexture;
        public static SceneMetaData Metadata = new SceneMetaData();


        public SceneBuilder(string outputPath, string sceneName, ExportationOptions exportationOptions, BabylonSceneController controller, string scriptPath)
        {
            OutputPath = outputPath;
            SceneName = string.IsNullOrEmpty(sceneName) ? "scene" : sceneName;
            SceneController = controller;
            SceneJavascriptPath = scriptPath;

            materialsDictionary = new Dictionary<string, BabylonMaterial>();
            multiMatDictionary = new Dictionary<string, BabylonMultiMaterial>();
            uniqueGuids = new Dictionary<int, string>();

            babylonScene = new BabylonScene(OutputPath);
            babylonScene.producer = new BabylonProducer
            {
                file = Path.GetFileName(outputPath),
                version = "Unity3D",
                name = SceneName,
                exporter_version = "0.8.1"
            };
            this.exportationOptions = exportationOptions;
            this.ManifestData = String.Empty;
            if (SceneController != null)
            {
                this.ManifestData = "{" + String.Format("\n\t\"version\" : {0},\n\t\"enableSceneOffline\" : {1},\n\t\"enableTexturesOffline\" : {2}\n", SceneController.manifestOptions.manifestVersion, SceneController.manifestOptions.storeSceneOffline.ToString().ToLower(), SceneController.manifestOptions.storeTextureOffline.ToString().ToLower()) + "}";
            }
        }

        public void WriteToBabylonFile(string outputFile)
        {
            ExporterWindow.ReportProgress(1, "Preparing babylon scene file...");
            babylonScene.Prepare(false);
            if (SceneController != null && SceneController.manifestOptions.exportManifest)
            {
                if (!String.IsNullOrEmpty(this.ManifestData))
                {
                    var manifestFile = outputFile + ".manifest";
                    File.WriteAllText(manifestFile, this.ManifestData);
                }
            }
            ExporterWindow.ReportProgress(1, "Serializing babylon scene file... This may take a while.");
            using (var file = File.CreateText(outputFile))
            {
                var settings = new DataWriterSettings(new BabylonSceneContractResolver()) { PrettyPrint = true };
                var jsWriter = new JsonWriter(settings);
                jsWriter.Write(babylonScene, file);
            }
        }

        public void GenerateStatus(List<string> logs)
        {
            var initialLog = new List<string> {
                "*Exportation Status:",
                babylonScene.meshes.Length + " mesh(es)",
                babylonScene.lights.Length + " light(s)",
                babylonScene.cameras.Length + " camera(s)",
                babylonScene.materials.Length + " material(s)",
                babylonScene.multiMaterials.Length + " multi-material(s)",
                "",
                "*Log:"
            };
            logs.InsertRange(0, initialLog);
        }

        string GetParentID(Transform transform)
        {
            if (transform.parent == null)
            {
                return null;
            }
            return GetID(transform.parent.gameObject);
        }

        string GetID(GameObject gameObject)
        {
            var key = gameObject.GetInstanceID();
            if (!uniqueGuids.ContainsKey(key))
            {
                uniqueGuids[key] = Guid.NewGuid().ToString();
            }
            return uniqueGuids[key];
        }

        public void ConvertFromUnity()
        {
            ExporterWindow.ReportProgress(0, "Starting exportation process...");
            gameObjects = Object.FindObjectsOfType(typeof(GameObject)) as GameObject[];
            if (gameObjects.Length == 0)
            {
                ExporterWindow.ShowMessage("No gameobject! - Please add at least a gameobject to export");
                return;
            }

            // Create scene metadata
            SceneBuilder.Metadata = new SceneMetaData();

            // Parse all scene game objects
            var index = 0;
            var itemsCount = gameObjects.Length;
            var particleSystems = new List<BabylonExport.Entities.BabylonParticleSystem>();
            var lensFlareSystems = new List<UnityFlareSystem>();
            ExporterWindow.ReportProgress(0, "Exporting game objects from scene...");
            babylonScene.physicsEngine = (exportationOptions.DefaultPhysicsEngine == 1) ? "oimo" : "cannon";
            try
            {
                bool foundController = false;
                foreach (var gameObject in gameObjects)
                {
                    var progress = ((float)index / itemsCount);
                    index++;

                    // Unity metadata
                    var metaData = new UnityMetaData();
                    metaData.objectId = GetID(gameObject);
                    metaData.objectName = gameObject.name;
                    metaData.tagName = gameObject.tag;
                    metaData.layerIndex = gameObject.layer;
                    metaData.layerName = LayerMask.LayerToName(gameObject.layer);

                    // Export hooking
                    var exportObject = gameObject;
                    var exportOptions = exportationOptions;
                    BabylonScene sceneBuilder = babylonScene;
                    if (SceneController != null)
                    {
                        SceneController.OnExportGameObject(ref exportOptions, ref exportObject, ref metaData, ref sceneBuilder, OutputPath);
                    }

                    // Components tags
                    string componentTags = String.Empty;
                    if (!String.IsNullOrEmpty(gameObject.tag) && !gameObject.tag.Equals("Untagged", StringComparison.OrdinalIgnoreCase))
                    {
                        componentTags = gameObject.tag;
                    }

                    // Navigation area
                    metaData.areaIndex = -1;
                    bool navigationStatic = GameObjectUtility.AreStaticEditorFlagsSet(gameObject, StaticEditorFlags.NavigationStatic);
                    if (navigationStatic)
                    {
                        metaData.areaIndex = GameObjectUtility.GetNavMeshArea(gameObject);
                    }

                    // Navigation agent
                    metaData.navAgent = null;
                    var navigationAgent = gameObject.GetComponent<NavMeshAgent>();
                    if (navigationAgent != null)
                    {
                        componentTags += " [NAVAGENT]";
                        Dictionary<string, object> agentInfo = new Dictionary<string, object>();
                        agentInfo.Add("name", navigationAgent.name);
                        agentInfo.Add("radius", navigationAgent.radius);
                        agentInfo.Add("height", navigationAgent.height);
                        agentInfo.Add("speed", navigationAgent.speed);
                        agentInfo.Add("acceleration", navigationAgent.acceleration);
                        agentInfo.Add("angularSpeed", navigationAgent.angularSpeed);
                        agentInfo.Add("areaMask", navigationAgent.areaMask);
                        agentInfo.Add("autoBraking", navigationAgent.autoBraking);
                        agentInfo.Add("autoTraverseOffMeshLink", navigationAgent.autoTraverseOffMeshLink);
                        agentInfo.Add("avoidancePriority", navigationAgent.avoidancePriority);
                        agentInfo.Add("baseOffset", navigationAgent.baseOffset);
                        agentInfo.Add("obstacleAvoidanceType", navigationAgent.obstacleAvoidanceType.ToString());
                        agentInfo.Add("stoppingDistance", navigationAgent.stoppingDistance);
                        metaData.navAgent = agentInfo;
                    }

                    // Navigation link
                    metaData.meshLink = null;
                    var navigationLink = gameObject.GetComponent<OffMeshLink>();
                    if (navigationLink != null)
                    {
                        componentTags += " [MESHLINK]";
                        Dictionary<string, object> linkInfo = new Dictionary<string, object>();
                        linkInfo.Add("name", navigationLink.name);
                        linkInfo.Add("activated", navigationLink.activated);
                        linkInfo.Add("area", navigationLink.area);
                        linkInfo.Add("autoUpdatePositions", navigationLink.autoUpdatePositions);
                        linkInfo.Add("biDirectional", navigationLink.biDirectional);
                        linkInfo.Add("costOverride", navigationLink.costOverride);
                        linkInfo.Add("occupied", navigationLink.occupied);
                        linkInfo.Add("start", GetTransformPropertyValue(navigationLink.startTransform));
                        linkInfo.Add("end", GetTransformPropertyValue(navigationLink.endTransform));
                        metaData.meshLink = linkInfo;
                    }

                    // Navigation obstacle
                    metaData.meshObstacle = null;
                    var navigationObstacle = gameObject.GetComponent<NavMeshObstacle>();
                    if (navigationObstacle != null)
                    {
                        componentTags += " [MESHOBSTACLE]";
                        Dictionary<string, object> obstacleInfo = new Dictionary<string, object>();
                        obstacleInfo.Add("name", navigationObstacle.name);
                        obstacleInfo.Add("carving", navigationObstacle.carving);
                        obstacleInfo.Add("carveOnlyStationary", navigationObstacle.carveOnlyStationary);
                        obstacleInfo.Add("carvingMoveThreshold", navigationObstacle.carvingMoveThreshold);
                        obstacleInfo.Add("carvingTimeToStationary", navigationObstacle.carvingTimeToStationary);
                        obstacleInfo.Add("shape", navigationObstacle.shape.ToString());
                        obstacleInfo.Add("radius", navigationObstacle.radius);
                        obstacleInfo.Add("center", navigationObstacle.center.ToFloat());
                        obstacleInfo.Add("size", navigationObstacle.size.ToFloat());
                        metaData.meshObstacle = obstacleInfo;
                    }

                    // Tags component
                    var tagsComponent = gameObject.GetComponent<BabylonTagsComponent>();
                    if (tagsComponent != null)
                    {
                        if (!String.IsNullOrEmpty(tagsComponent.babylonTags))
                        {
                            componentTags += (" " + tagsComponent.babylonTags);
                        }
                    }

                    // Script components
                    var gameComponents = gameObject.GetComponents<BabylonScriptComponent>();
                    if (gameComponents != null)
                    {
                        var components = new List<object>();
                        foreach (var gameComponent in gameComponents)
                        {
                            Type componentType = gameComponent.GetType();
                            string componentName = componentType.FullName;
                            var component = new UnityScriptComponent();
                            MonoScript componentScript = MonoScript.FromMonoBehaviour(gameComponent);
                            component.order = MonoImporter.GetExecutionOrder(componentScript);
                            component.name = componentName;
                            component.klass = gameComponent.babylonClass;
                            component.update = (gameComponent.updateOption == BabylonTickOptions.EnableTick);
                            component.controller = (gameComponent is BabylonSceneController);
                            if (component.controller == true)
                            {
                                component.order = -1;
                                if (foundController == false)
                                {
                                    foundController = true;
                                    componentTags += " [CONTROLLER]";
                                    object userInterface = null;
                                    BabylonSceneController scx = (gameComponent as BabylonSceneController);
                                    EmbeddedAsset guiAsset = scx.sceneOptions.graphicUserInterface;
                                    if (guiAsset != null && scx.sceneOptions.userInterfaceMode != BabylonGuiMode.None)
                                    {
                                        userInterface = GetEmbeddedAssetPropertyValue(guiAsset);
                                    }
                                    SceneBuilder.Metadata.properties.Add("autoDraw", scx.sceneOptions.autoDrawInterface);
                                    SceneBuilder.Metadata.properties.Add("interfaceMode", scx.sceneOptions.userInterfaceMode.ToString());
                                    SceneBuilder.Metadata.properties.Add("userInterface", userInterface);
                                    SceneBuilder.Metadata.properties.Add("controllerPresent", true);
                                    SceneBuilder.Metadata.properties.Add("controllerObjectId", metaData.objectId);
                                }
                                else
                                {
                                    Debug.LogError("Duplicate scene controller detected: " + component.name);
                                }
                            }
                            FieldInfo[] componentFields = componentType.GetFields();
                            if (componentFields != null)
                            {
                                foreach (var componentField in componentFields)
                                {
                                    var componentAttribute = (BabylonPropertyAttribute)Attribute.GetCustomAttribute(componentField, typeof(BabylonPropertyAttribute));
                                    if (componentAttribute != null && componentField.Name != "babylonClass")
                                    {
                                        component.properties.Add(componentField.Name, GetComponentPropertyValue(componentField, gameComponent));
                                    }
                                }
                            }
                            gameComponent.OnExportProperties(ref exportOptions, ref exportObject, ref component.properties, OutputPath);
                            components.Add(component);
                        }
                        if (components.Count > 0)
                        {
                            metaData.components = components;
                        }
                    }

                    // Format tags
                    if (!String.IsNullOrEmpty(componentTags))
                    {
                        componentTags = componentTags.Trim();
                    }

                    // Audio sources
                    var audioComponents = gameObject.GetComponents<BabylonAudioSource>();
                    if (audioComponents != null)
                    {
                        foreach (var item in audioComponents)
                        {
                            if (item != null && item.exportAudio && item.sound != null)
                            {
                                string soundPath = AssetDatabase.GetAssetPath(item.sound);
                                if (!String.IsNullOrEmpty(soundPath))
                                {
                                    string soundName = Path.GetFileName(soundPath).Replace(" ", "");
                                    string outputFile = Path.Combine(OutputPath, soundName);
                                    if (File.Exists(soundPath))
                                    {
                                        File.Copy(soundPath, outputFile, true);
                                        var sound = new BabylonSound();
                                        sound.name = soundName;
                                        sound.volume = item.options.volume;
                                        sound.playbackRate = item.options.playbackRate;
                                        sound.autoplay = item.options.autoplay;
                                        sound.loop = item.options.loop;
                                        sound.soundTrackId = item.options.soundTrackId;
                                        sound.spatialSound = item.options.spatialSound;
                                        sound.position = item.options.position.ToFloat();
                                        sound.refDistance = item.options.refDistance;
                                        sound.rolloffFactor = item.options.rolloffFactor;
                                        sound.maxDistance = item.options.maxDistance;
                                        sound.distanceModel = item.options.distanceModel;
                                        sound.panningModel = item.options.panningModel;
                                        sound.isDirectional = item.options.isDirectional;
                                        sound.coneInnerAngle = item.options.coneInnerAngle;
                                        sound.coneOuterAngle = item.options.coneOuterAngle;
                                        sound.coneOuterGain = item.options.coneOuterGain;
                                        sound.localDirectionToMesh = item.options.directionToMesh.ToFloat();
                                        babylonScene.SoundsList.Add(sound);
                                    }
                                    else
                                    {
                                        Debug.LogError("Fail to locate audio file: " + soundPath);
                                    }
                                }
                                else
                                {
                                    Debug.LogError("Null audio clip path for: " + item.sound.name);
                                }
                            }
                        }
                    }

                    // Terrain meshes
                    var terrainMesh = gameObject.GetComponent<Terrain>();
                    if (terrainMesh != null)
                    {
                        ConvertUnityTerrainToBabylon(terrainMesh, gameObject, progress, ref metaData, ref particleSystems, ref lensFlareSystems, ref componentTags);
                        continue;
                    }

                    // Collision meshes
                    BabylonMesh collisionMesh = null;
                    var collider = gameObject.GetComponent<Collider>();
                    if (collider != null)
                    {
                        if (collider.enabled)
                        {
                            int segments = 12;
                            BabylonColliderDetail detail = (BabylonColliderDetail)exportationOptions.DefaultColliderDetail;
                            var collisionData = new UnityMetaData();
                            collisionData.objectId = Guid.NewGuid().ToString();
                            collisionData.objectName = gameObject.name + "_Metadata";
                            if (collider is MeshCollider)
                            {
                                var meshCollider = collider as MeshCollider;
                                collisionMesh = new BabylonMesh();
                                collisionMesh.tags = "[MESHCOLLIDER]";
                                // Generate Mesh Collider Geometry
                                if(!meshCollider.sharedMesh)
                                {
                                    UnityEngine.Debug.LogWarning(meshCollider.gameObject+" has a Mesh Collider component without a mesh");
                                }
                                else
                                {
                                    Tools.GenerateBabylonMeshData(meshCollider.sharedMesh, collisionMesh);
                                }
                                collisionMesh.position = Vector3.zero.ToFloat();
                                collisionMesh.rotation = Vector3.zero.ToFloat();
                                float factorX = 1f, factorY = 1f, factorZ = 1f;
                                if (meshCollider.inflateMesh && meshCollider.skinWidth > 0f)
                                {
                                    Vector3 localScale = gameObject.transform.localScale;
                                    factorX += (meshCollider.skinWidth / localScale.x);
                                    factorY += (meshCollider.skinWidth / localScale.y);
                                    factorZ += (meshCollider.skinWidth / localScale.z);
                                }
                                collisionMesh.scaling = new Vector3(factorX, factorY, factorZ).ToFloat();
                                // Export Mesh Collider Metadata
                                collisionData.tagName = "MeshCollider";
                                collisionData.properties.Add("type", "Mesh");
                                collisionData.properties.Add("convex", meshCollider.convex);
                                collisionData.properties.Add("inflateMesh", meshCollider.inflateMesh);
                                collisionData.properties.Add("skinWidth", meshCollider.skinWidth);
                            }
                            else if (collider is CapsuleCollider)
                            {
                                var capsuleCollider = collider as CapsuleCollider;
                                collisionMesh = new BabylonMesh();
                                collisionMesh.tags = "[CAPSULECOLLIDER]";
                                switch (detail)
                                {
                                    case BabylonColliderDetail.FullResolution:
                                        segments = 48;
                                        break;
                                    case BabylonColliderDetail.HighResolution:
                                        segments = 32;
                                        break;
                                    case BabylonColliderDetail.MediumResolution:
                                        segments = 24;
                                        break;
                                    case BabylonColliderDetail.LowResolution:
                                        segments = 12;
                                        break;
                                    case BabylonColliderDetail.VeryLowResolution:
                                        segments = 8;
                                        break;
                                    case BabylonColliderDetail.MinimumResolution:
                                        segments = 6;
                                        break;
                                    default:
                                        segments = 12;
                                        break;
                                }
                                // Generate Capsule Collider Geometry
                                Mesh capsuleMesh = Tools.CreateCapsuleMesh(capsuleCollider.height, capsuleCollider.radius, segments);
                                Tools.GenerateBabylonMeshData(capsuleMesh, collisionMesh);
                                collisionMesh.position = new float[3];
                                collisionMesh.position[0] = capsuleCollider.center.x;
                                collisionMesh.position[1] = capsuleCollider.center.y;
                                collisionMesh.position[2] = capsuleCollider.center.z;
                                collisionMesh.rotation = new float[3];
                                collisionMesh.rotation[0] = (capsuleCollider.direction == 2) ? 90f * (float)Math.PI / 180f : 0f;
                                collisionMesh.rotation[1] = 0f;
                                collisionMesh.rotation[2] = (capsuleCollider.direction == 0) ? 90f * (float)Math.PI / 180f : 0f;
                                collisionMesh.scaling = new Vector3(1, 1, 1).ToFloat();
                                // Export Capsule Collider Metadata
                                collisionData.tagName = "CapsuleCollider";
                                collisionData.properties.Add("type", "Capsule");
                                collisionData.properties.Add("center", capsuleCollider.center.ToFloat());
                                collisionData.properties.Add("radius", capsuleCollider.radius);
                                collisionData.properties.Add("height", capsuleCollider.height);
                                collisionData.properties.Add("direction", capsuleCollider.direction);
                            }
                            else if (collider is SphereCollider)
                            {
                                var sphereCollider = collider as SphereCollider;
                                collisionMesh = new BabylonMesh();
                                collisionMesh.tags = "[SPHERECOLLIDER]";
                                switch (detail)
                                {
                                    case BabylonColliderDetail.FullResolution:
                                        segments = 48;
                                        break;
                                    case BabylonColliderDetail.HighResolution:
                                        segments = 32;
                                        break;
                                    case BabylonColliderDetail.MediumResolution:
                                        segments = 24;
                                        break;
                                    case BabylonColliderDetail.LowResolution:
                                        segments = 12;
                                        break;
                                    case BabylonColliderDetail.VeryLowResolution:
                                        segments = 8;
                                        break;
                                    case BabylonColliderDetail.MinimumResolution:
                                        segments = 6;
                                        break;
                                    default:
                                        segments = 12;
                                        break;
                                }
                                // Generate Sphere Collider Geometry
                                Mesh sphereMesh = Tools.CreateSphereMesh(sphereCollider.radius, segments);
                                Tools.GenerateBabylonMeshData(sphereMesh, collisionMesh);
                                collisionMesh.position = new float[3];
                                collisionMesh.position[0] = sphereCollider.center.x;
                                collisionMesh.position[1] = sphereCollider.center.y;
                                collisionMesh.position[2] = sphereCollider.center.z;
                                collisionMesh.rotation = Vector3.zero.ToFloat();
                                collisionMesh.scaling = new Vector3(1f, 1f, 1f).ToFloat();
                                // Export Sphere Collider Metadata
                                collisionData.tagName = "SphereCollider";
                                collisionData.properties.Add("type", "Sphere");
                                collisionData.properties.Add("center", sphereCollider.center.ToFloat());
                                collisionData.properties.Add("radius", sphereCollider.radius);
                            }
                            else if (collider is WheelCollider)
                            {
                                var wheelCollider = collider as WheelCollider;
                                collisionMesh = new BabylonMesh();
                                collisionMesh.tags = "[WHEELCOLLIDER]";
                                switch (detail)
                                {
                                    case BabylonColliderDetail.FullResolution:
                                        segments = 128;
                                        break;
                                    case BabylonColliderDetail.HighResolution:
                                        segments = 64;
                                        break;
                                    case BabylonColliderDetail.MediumResolution:
                                        segments = 48;
                                        break;
                                    case BabylonColliderDetail.LowResolution:
                                        segments = 32;
                                        break;
                                    case BabylonColliderDetail.VeryLowResolution:
                                        segments = 24;
                                        break;
                                    case BabylonColliderDetail.MinimumResolution:
                                        segments = 16;
                                        break;
                                    default:
                                        segments = 32;
                                        break;
                                }
                                // Generate Wheel Collider Geometry
                                Mesh wheelMesh = Tools.CreateWheelMesh(wheelCollider.suspensionDistance, wheelCollider.radius, segments);
                                Tools.GenerateBabylonMeshData(wheelMesh, collisionMesh);
                                collisionMesh.position = new float[3];
                                collisionMesh.position[0] = wheelCollider.center.x;
                                collisionMesh.position[1] = wheelCollider.center.y;
                                collisionMesh.position[2] = wheelCollider.center.z;
                                collisionMesh.rotation = new float[3];
                                collisionMesh.rotation[0] = 0f;
                                collisionMesh.rotation[1] = 0f;
                                collisionMesh.rotation[2] = 90f * (float)Math.PI / 180;
                                collisionMesh.scaling = new Vector3(1f, 1f, 1f).ToFloat();
                                // Export Wheel Collider Metadata
                                collisionData.tagName = "WheelCollider";
                                collisionData.properties.Add("type", "Wheel");
                                collisionData.properties.Add("center", wheelCollider.center.ToFloat());
                                collisionData.properties.Add("radius", wheelCollider.radius);
                            }
                            else if (collider is BoxCollider)
                            {
                                var boxCollider = collider as BoxCollider;
                                collisionMesh = new BabylonMesh();
                                collisionMesh.tags = "[BOXCOLLIDER]";
                                // Generate Box Collider Geometry
                                Mesh boxMesh = Tools.CreateBoxMesh(boxCollider.size.x, boxCollider.size.y, boxCollider.size.z);
                                Tools.GenerateBabylonMeshData(boxMesh, collisionMesh);
                                collisionMesh.position = new float[3];
                                collisionMesh.position[0] = boxCollider.center.x;
                                collisionMesh.position[1] = boxCollider.center.y;
                                collisionMesh.position[2] = boxCollider.center.z;
                                collisionMesh.rotation = Vector3.zero.ToFloat();
                                collisionMesh.scaling = new Vector3(1f, 1f, 1f).ToFloat();
                                // Export Box Collider Metadata
                                collisionData.tagName = "BoxCollider";
                                collisionData.properties.Add("type", "Box");
                                collisionData.properties.Add("center", boxCollider.center.ToFloat());
                                collisionData.properties.Add("size", boxCollider.size.ToFloat());
                            }
                            if (collisionMesh != null)
                            {
                                collisionMesh.id = Guid.NewGuid().ToString();
                                collisionMesh.name = gameObject.name + "_Collider";
                                // Default Check Collisions False
                                collisionMesh.checkCollisions = false;
                                collisionMesh.isVisible = false;
                                collisionData.properties.Add("parrentId", metaData.objectId);
                                collisionData.properties.Add("transform", GetTransformPropertyValue(gameObject.transform));
                                collisionMesh.metadata = collisionData;
                                babylonScene.MeshesList.Add(collisionMesh);
                                SceneBuilder.Metadata.properties["hasCollisionMeshes"] = true;
                            }
                        }
                    }

                    // Static meshes
                    var meshFilter = gameObject.GetComponent<MeshFilter>();
                    if (meshFilter != null)
                    {
                        ConvertUnityMeshToBabylon(meshFilter.sharedMesh, meshFilter.transform, gameObject, progress, ref metaData, ref particleSystems, ref lensFlareSystems, ref componentTags, collisionMesh, collider);
                        continue;
                    }

                    // Skinned meshes
                    var skinnedMesh = gameObject.GetComponent<SkinnedMeshRenderer>();
                    if (skinnedMesh != null)
                    {
                        var babylonMesh = ConvertUnityMeshToBabylon(skinnedMesh.sharedMesh, skinnedMesh.transform, gameObject, progress, ref metaData, ref particleSystems, ref lensFlareSystems, ref componentTags, collisionMesh, collider);
                        var skeleton = ConvertUnitySkeletonToBabylon(skinnedMesh.bones, skinnedMesh.sharedMesh.bindposes, skinnedMesh.transform, gameObject, progress);
                        babylonMesh.skeletonId = skeleton.id;
                        ExportSkeletonAnimation(skinnedMesh, babylonMesh, skeleton);
                        continue;
                    }

                    // Scene lights
                    var light = gameObject.GetComponent<Light>();
                    if (light != null)
                    {
                        ConvertUnityLightToBabylon(light, gameObject, progress, ref metaData, ref particleSystems, ref lensFlareSystems, ref componentTags);
                        continue;
                    }

                    // Scene cameras
                    var camera = gameObject.GetComponent<Camera>();
                    if (camera != null)
                    {
                        ConvertUnityCameraToBabylon(camera, gameObject, progress, ref metaData, ref particleSystems, ref lensFlareSystems, ref componentTags);
                        if (SceneController != null && SceneController.skyboxOptions.exportSkybox)
                        {
                            ConvertUnitySkyboxToBabylon(camera, progress);
                        }
                        continue;
                    }

                    // Empty objects
                    ConvertUnityEmptyObjectToBabylon(gameObject, ref metaData, ref particleSystems, ref lensFlareSystems, ref componentTags, collisionMesh, collider);
                }

                // Materials
                foreach (var mat in materialsDictionary)
                {
                    babylonScene.MaterialsList.Add(mat.Value);
                }
                foreach (var multiMat in multiMatDictionary)
                {
                    babylonScene.MultiMaterialsList.Add(multiMat.Value);
                }

                // Collisions
                if (exportationOptions.ExportCollisions)
                {
                    babylonScene.workerCollisions = exportationOptions.WorkerCollisions;
                    if (SceneController != null) {
                        babylonScene.gravity = SceneController.sceneOptions.defaultGravity.ToFloat();
                    }
                }

                // Babylon Physics
                if (exportationOptions.ExportPhysics)
                {
                    babylonScene.physicsEnabled = true;
                    if (SceneController != null) {
                        babylonScene.physicsGravity = SceneController.sceneOptions.defaultGravity.ToFloat();
                    }
                }

                // Scene Controller
                if (SceneController != null)
                {
                    Color ambientColor = SceneController.sceneOptions.ambientColor;
                    float ambientLevel = SceneController.lightingOptions.lightLevel;
                    Color ambientSpecular = SceneController.lightingOptions.specularColor;
                    babylonScene.autoClear = SceneController.sceneOptions.autoClear;
                    int fogmode = 0;
                    if (RenderSettings.fog)
                    {
                        switch (RenderSettings.fogMode)
                        {
                            case FogMode.Exponential:
                                fogmode = 1;
                                break;
                            case FogMode.ExponentialSquared:
                                fogmode = 2;
                                break;
                            case FogMode.Linear:
                                fogmode = 3;
                                break;
                        }
                    }
                    babylonScene.fogMode = fogmode;
                    babylonScene.fogDensity = RenderSettings.fogDensity;
                    babylonScene.fogColor = RenderSettings.fogColor.ToFloat();
                    babylonScene.fogStart = RenderSettings.fogStartDistance;
                    babylonScene.fogEnd = RenderSettings.fogEndDistance;
                    if (exportationOptions.DefaultLightmapMode != (int)BabylonLightmapMode.FullLightBaking && SceneController.lightingOptions.lightMode == BabylonAmbientLighting.UnityAmbientLighting)
                    {
                        var ambientLight = new BabylonLight
                        {
                            name = "Ambient Light",
                            id = Guid.NewGuid().ToString(),
                            parentId = null,
                            metadata = null,
                            position = null,
                            exponent = 1.0f,
                            angle = 0.0f,
                            type = 3
                        };
                        var ambientDirection = new Vector3(0.0f, 1.0f, 0.0f);
                        Color ambientDiffuse = (RenderSettings.ambientMode == UnityEngine.Rendering.AmbientMode.Skybox) ? RenderSettings.ambientSkyColor : RenderSettings.ambientLight;
                        ambientLight.intensity = RenderSettings.ambientIntensity * ambientLevel;
                        ambientLight.direction = ambientDirection.ToFloat(); ;
                        ambientLight.diffuse = ambientDiffuse.ToFloat();
                        ambientLight.specular = ambientSpecular.ToFloat();
                        ambientLight.groundColor = RenderSettings.ambientGroundColor.ToFloat();
                        babylonScene.ambientColor = ambientColor.ToFloat();
                        babylonScene.LightsList.Add(ambientLight);
                        ExporterWindow.ReportProgress(0, "Exporting ambient light intensity at: " + ambientLight.intensity.ToString());
                    }
                    if (SceneController.sceneOptions.navigationMesh == BabylonNavigationMesh.EnableNavigation)
                    {
                        ExporterWindow.ReportProgress(0, "Parsing scene navigation mesh...");
                        NavMeshTriangulation triangulatedNavMesh = NavMesh.CalculateTriangulation();
                        if (triangulatedNavMesh.vertices != null && triangulatedNavMesh.vertices.Length > 0 && triangulatedNavMesh.indices != null && triangulatedNavMesh.indices.Length > 0)
                        {
                            int vertexCount = triangulatedNavMesh.vertices.Length;
                            if (vertexCount <= SceneBuilder.MAX_VERTEX_COUNT)
                            {
                                ExporterWindow.ReportProgress(0, "Generating navigation mesh vertices: " + vertexCount.ToString());
                                var navData = new UnityMetaData();
                                navData.type = "NavMesh";
                                navData.objectId = Guid.NewGuid().ToString();
                                navData.objectName = "Navigation_Mesh";
                                var areaTable = new List<object>();
                                string[] areaNavigation = GameObjectUtility.GetNavMeshAreaNames();
                                foreach (string areaName in areaNavigation)
                                {
                                    var bag = new Dictionary<string, object>();
                                    int areaIndex = NavMesh.GetAreaFromName(areaName);
                                    float areaCost = NavMesh.GetAreaCost(areaIndex);
                                    bag.Add("index", areaIndex);
                                    bag.Add("area", areaName);
                                    bag.Add("cost", areaCost);
                                    areaTable.Add(bag);
                                }
                                navData.properties.Add("table", areaTable);
                                navData.properties.Add("areas", triangulatedNavMesh.areas);

                                Mesh mesh = new Mesh();
                                mesh.name = "sceneNavigationMesh";
                                mesh.vertices = triangulatedNavMesh.vertices;
                                mesh.triangles = triangulatedNavMesh.indices;
                                mesh.RecalculateNormals();

                                BabylonMesh babylonMesh = new BabylonMesh();
                                babylonMesh.tags = "[NAVMESH]";
                                babylonMesh.metadata = navData;
                                babylonMesh.name = mesh.name;
                                babylonMesh.id = Guid.NewGuid().ToString();
                                babylonMesh.parentId = null;
                                babylonMesh.position = Vector3.zero.ToFloat();
                                babylonMesh.rotation = Vector3.zero.ToFloat();
                                babylonMesh.scaling = new Vector3(1, 1, 1).ToFloat();
                                babylonMesh.isVisible = false;
                                babylonMesh.visibility = 0.75f;
                                babylonMesh.checkCollisions = false;
                                Tools.GenerateBabylonMeshData(mesh, babylonMesh);
                                babylonScene.MeshesList.Add(babylonMesh);
                                SceneBuilder.Metadata.properties["hasNavigationMesh"] = true;
                            }
                            else
                            {
                                UnityEngine.Debug.LogError("Navigation mesh exceeds max (65000) vertex limit: " + vertexCount.ToString());
                            }
                        }
                    }
                    if (SceneController.sceneOptions.particleSystems)
                    {
                        if (particleSystems != null && particleSystems.Count > 0)
                        {
                            babylonScene.particleSystems = particleSystems.ToArray();
                        }
                    }
                    if (SceneController.sceneOptions.lensFlareSystems)
                    {
                        if (lensFlareSystems != null && lensFlareSystems.Count > 0)
                        {
                            var lfs_buffer = new List<BabylonLensFlareSystem>();
                            foreach (var ulfs in lensFlareSystems)
                            {
                                var lfs = new BabylonLensFlareSystem();
                                lfs.borderLimit = ulfs.borderLimit;
                                lfs.emitterId = ulfs.emitterId;
                                var lfx = new List<BabylonLensFlare>();
                                foreach (var ulf in ulfs.lensFlares)
                                {
                                    var lf = new BabylonLensFlare();
                                    lf.textureName = ulf.textureName;
                                    lf.position = ulf.position;
                                    lf.color = ulf.color;
                                    lf.size = ulf.size;
                                    lfx.Add(lf);
                                }
                                lfs.flares = lfx.ToArray();
                                lfs_buffer.Add(lfs);
                            }
                            babylonScene.lensFlareSystems = lfs_buffer.ToArray();
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.LogException(ex);
            }
            finally
            {
                babylonScene.metadata = SceneBuilder.Metadata;
            }
        }

        private void ParseLensFlares(GameObject gameObject, string emitterId, ref List<UnityFlareSystem> lens)
        {
            var flare = gameObject.GetComponent<BabylonFlareSystem>();
            if (flare != null && flare.exportFlare && flare.lensFlares != null && flare.lensFlares.Length > 0)
            {
                var flareSystem = new UnityFlareSystem();
                flareSystem.name = (!String.IsNullOrEmpty(flare.flareName)) ? flare.flareName : String.Format("lensFlareSystem#" + Guid.NewGuid().ToString());
                flareSystem.emitterId = emitterId;
                flareSystem.borderLimit = flare.borderLimit;
                var flareBuffer = new List<UnityFlareItem>();
                foreach (var flareItem in flare.lensFlares)
                {
                    var item = new UnityFlareItem();
                    item.size = flareItem.size;
                    item.position = flareItem.position;
                    item.color = flareItem.color.ToFloat();
                    if (flareItem.texture != null)
                    {
                        var babylonTexture = new BabylonTexture();
                        var texturePath = AssetDatabase.GetAssetPath(flareItem.texture);
                        CopyTexture(texturePath, flareItem.texture, babylonTexture);
                        item.textureName = Path.GetFileName(texturePath);
                    }
                    flareBuffer.Add(item);
                }
                flareSystem.lensFlares = flareBuffer.ToArray();
                lens.Add(flareSystem);
            }
        }

        private void ParseParticleSystems(GameObject gameObject, string emitterId, ref List<BabylonExport.Entities.BabylonParticleSystem> particles)
        {
            var particle = gameObject.GetComponent<UnityEditor.BabylonParticleSystem>();
            if (particle != null && particle.exportParticle)
            {
                var particleSystem = new BabylonExport.Entities.BabylonParticleSystem();
                particleSystem.name = (!String.IsNullOrEmpty(particle.particleName)) ? particle.particleName : String.Format("particalSystem#" + Guid.NewGuid().ToString());
                particleSystem.emitterId = emitterId;
                particleSystem.linkToEmitter = true;
                particleSystem.preventAutoStart = !particle.autoStart;
                particleSystem.textureMask = particle.textureMask.ToFloat();
                particleSystem.updateSpeed = particle.updateSpeed;
                particleSystem.emitRate = particle.emitRate;
                particleSystem.gravity = particle.gravity.ToFloat();
                particleSystem.blendMode = (int)particle.blendMode;
                particleSystem.capacity = particle.capacity;
                particleSystem.color1 = particle.color1.ToFloat();
                particleSystem.color2 = particle.color2.ToFloat();
                particleSystem.colorDead = particle.colorDead.ToFloat();
                particleSystem.direction1 = particle.direction1.ToFloat();
                particleSystem.direction2 = particle.direction2.ToFloat();
                particleSystem.minEmitBox = particle.minEmitBox.ToFloat();
                particleSystem.maxEmitBox = particle.maxEmitBox.ToFloat();
                particleSystem.minEmitPower = particle.minEmitPower;
                particleSystem.maxEmitPower = particle.maxEmitPower;
                particleSystem.minLifeTime = particle.minLifeTime;
                particleSystem.maxLifeTime = particle.maxLifeTime;
                particleSystem.minSize = particle.minSize;
                particleSystem.maxSize = particle.maxSize;
                particleSystem.minAngularSpeed = particle.minAngularSpeed;
                particleSystem.maxAngularSpeed = particle.maxAngularSpeed;
                particleSystem.targetStopFrame = particle.targetStopFrame;
                particleSystem.deadAlpha = particle.deadAlpha;
                if (particle.texture != null)
                {
                    var babylonTexture = new BabylonTexture();
                    var texturePath = AssetDatabase.GetAssetPath(particle.texture);
                    CopyTexture(texturePath, particle.texture, babylonTexture);
                    particleSystem.textureName = Path.GetFileName(texturePath);
                }
                particles.Add(particleSystem);
            }
        }

        private object GetComponentPropertyValue(FieldInfo field, BabylonScriptComponent component)
        {
            object result = null;
            object fvalue = field.GetValue(component);
            if (fvalue != null)
            {
                Type ftype = fvalue.GetType();
                if (typeof(System.Enum).IsAssignableFrom(ftype))
                {
                    result = Convert.ToInt32((System.Enum)fvalue);
                }
                else if (typeof(Boolean).IsAssignableFrom(ftype) || typeof(Byte).IsAssignableFrom(ftype) || typeof(SByte).IsAssignableFrom(ftype) || typeof(Int16).IsAssignableFrom(ftype) || typeof(UInt16).IsAssignableFrom(ftype) || typeof(Int32).IsAssignableFrom(ftype) || typeof(UInt32).IsAssignableFrom(ftype) || typeof(Int64).IsAssignableFrom(ftype) || typeof(UInt64).IsAssignableFrom(ftype) || typeof(IntPtr).IsAssignableFrom(ftype) || typeof(UIntPtr).IsAssignableFrom(ftype) || typeof(Char).IsAssignableFrom(ftype) || typeof(Double).IsAssignableFrom(ftype) || typeof(Single).IsAssignableFrom(ftype))
                {
                    result = fvalue;
                }
                else if (typeof(System.String).IsAssignableFrom(ftype))
                {
                    result = fvalue;
                }
                else if (typeof(Color).IsAssignableFrom(ftype))
                {
                    var color = (Color)fvalue;
                    result = new UnityBabylonColor { r = color.r, g = color.g, b = color.b, a = color.a };
                }
                else if (typeof(Vector2).IsAssignableFrom(ftype))
                {
                    var vec2 = (Vector2)fvalue;
                    result = new UnityBablylonVector2 { x = vec2.x, y = vec2.y };
                }
                else if (typeof(Vector3).IsAssignableFrom(ftype))
                {
                    var vec3 = (Vector3)fvalue;
                    result = new UnityBablylonVector3 { x = vec3.x, y = vec3.y, z = vec3.z };
                }
                else if (typeof(Vector4).IsAssignableFrom(ftype))
                {
                    var vec4 = (Vector4)fvalue;
                    result = new UnityBablylonVector4 { x = vec4.x, y = vec4.y, z = vec4.z, w = vec4.w };
                }
                else if (typeof(Transform).IsAssignableFrom(ftype))
                {
                    var transform = (Transform)fvalue;
                    result = GetTransformPropertyValue(transform);
                }
                else if (typeof(Texture2D).IsAssignableFrom(ftype))
                {
                    var texture = (Texture2D)fvalue;
                    result = GetTexturePropertyValue(texture);
                }
                else if (typeof(Cubemap).IsAssignableFrom(ftype))
                {
                    var cubemap = (Cubemap)fvalue;
                    result = GetCubemapPropertyValue(cubemap);
                }
                else if (typeof(Material).IsAssignableFrom(ftype))
                {
                    var material = (Material)fvalue;
                    result = GetMaterialPropertyValue(material);
                }
                else if (typeof(Shader).IsAssignableFrom(ftype))
                {
                    var shader = (Shader)fvalue;
                    result = GetShaderPropertyValue(shader);
                }
                else if (typeof(GameObject).IsAssignableFrom(ftype))
                {
                    var gobject = (GameObject)fvalue;
                    result = GetGamePropertyValue(gobject);
                }
                else if (typeof(AudioClip).IsAssignableFrom(ftype))
                {
                    var aclip = (AudioClip)fvalue;
                    result = GetAudioClipPropertyValue(aclip);
                }
                else if (typeof(EmbeddedAsset).IsAssignableFrom(ftype))
                {
                    var easset = (EmbeddedAsset)fvalue;
                    result = GetEmbeddedAssetPropertyValue(easset);
                }
                else if (typeof(TextAsset).IsAssignableFrom(ftype))
                {
                    var tasset = (TextAsset)fvalue;
                    result = GetTextAssetPropertyValue(tasset);
                }
                else if (typeof(DefaultAsset).IsAssignableFrom(ftype))
                {
                    var dasset = (DefaultAsset)fvalue;
                    result = GetDefaultAssetPropertyValue(dasset);
                }
                else if (ftype.IsArray)
                {
                    if (typeof(Boolean[]).IsAssignableFrom(ftype) || typeof(Byte[]).IsAssignableFrom(ftype) || typeof(SByte[]).IsAssignableFrom(ftype) || typeof(Int16[]).IsAssignableFrom(ftype) || typeof(UInt16[]).IsAssignableFrom(ftype) || typeof(Int32[]).IsAssignableFrom(ftype) || typeof(UInt32[]).IsAssignableFrom(ftype) || typeof(Int64[]).IsAssignableFrom(ftype) || typeof(UInt64[]).IsAssignableFrom(ftype) || typeof(IntPtr[]).IsAssignableFrom(ftype) || typeof(UIntPtr[]).IsAssignableFrom(ftype) || typeof(Char[]).IsAssignableFrom(ftype) || typeof(Double[]).IsAssignableFrom(ftype) || typeof(Single[]).IsAssignableFrom(ftype))
                    {
                        result = fvalue;
                    }
                    else if (typeof(System.String[]).IsAssignableFrom(ftype))
                    {
                        result = fvalue;
                    }
                    else if (typeof(Color[]).IsAssignableFrom(ftype))
                    {
                        var colors = (Color[])fvalue;
                        var colors_list = new List<UnityBabylonColor>();
                        foreach (var color in colors)
                        {
                            colors_list.Add(new UnityBabylonColor { r = color.r, g = color.g, b = color.b, a = color.a });
                        }
                        result = colors_list.ToArray();
                    }
                    else if (typeof(Vector2[]).IsAssignableFrom(ftype))
                    {
                        var vecs2 = (Vector2[])fvalue;
                        var vecs2_list = new List<UnityBablylonVector2>();
                        foreach (var vec2 in vecs2)
                        {
                            vecs2_list.Add(new UnityBablylonVector2 { x = vec2.x, y = vec2.y });
                        }
                        result = vecs2_list.ToArray();
                    }
                    else if (typeof(Vector3[]).IsAssignableFrom(ftype))
                    {
                        var vecs3 = (Vector3[])fvalue;
                        var vecs3_list = new List<UnityBablylonVector3>();
                        foreach (var vec3 in vecs3)
                        {
                            vecs3_list.Add(new UnityBablylonVector3 { x = vec3.x, y = vec3.y, z = vec3.z });
                        }
                        result = vecs3_list.ToArray();
                    }
                    else if (typeof(Vector4[]).IsAssignableFrom(ftype))
                    {
                        var vecs4 = (Vector4[])fvalue;
                        var vecs4_list = new List<UnityBablylonVector4>();
                        foreach (var vec4 in vecs4)
                        {
                            vecs4_list.Add(new UnityBablylonVector4 { x = vec4.x, y = vec4.y, z = vec4.z, w = vec4.w });
                        }
                        result = vecs4_list.ToArray();
                    }
                    else if (typeof(Transform[]).IsAssignableFrom(ftype))
                    {
                        var transforms = (Transform[])fvalue;
                        var transform_list = new List<object>();
                        foreach (var transform in transforms)
                        {
                            transform_list.Add(GetTransformPropertyValue(transform));
                        }
                        result = transform_list.ToArray();
                    }
                    else if (typeof(Texture2D[]).IsAssignableFrom(ftype))
                    {
                        var textures = (Texture2D[])fvalue;
                        var texture_list = new List<object>();
                        foreach (var texture in textures)
                        {
                            texture_list.Add(GetTexturePropertyValue(texture));
                        }
                        result = texture_list.ToArray();
                    }
                    else if (typeof(Cubemap[]).IsAssignableFrom(ftype))
                    {
                        var cubemaps = (Cubemap[])fvalue;
                        var cubemap_list = new List<object>();
                        foreach (var cubemap in cubemaps)
                        {
                            cubemap_list.Add(GetCubemapPropertyValue(cubemap));
                        }
                        result = cubemap_list.ToArray();
                    }
                    else if (typeof(Material[]).IsAssignableFrom(ftype))
                    {
                        var materials = (Material[])fvalue;
                        var material_list = new List<object>();
                        foreach (var material in materials)
                        {
                            material_list.Add(GetMaterialPropertyValue(material));
                        }
                        result = material_list.ToArray();
                    }
                    else if (typeof(Shader[]).IsAssignableFrom(ftype))
                    {
                        var shaders = (Shader[])fvalue;
                        var shader_list = new List<object>();
                        foreach (var shader in shaders)
                        {
                            shader_list.Add(GetShaderPropertyValue(shader));
                        }
                        result = shader_list.ToArray();
                    }
                    else if (typeof(GameObject[]).IsAssignableFrom(ftype))
                    {
                        var gobjects = (GameObject[])fvalue;
                        var gobject_list = new List<object>();
                        foreach (var gobject in gobjects)
                        {
                            gobject_list.Add(GetGamePropertyValue(gobject));
                        }
                        result = gobject_list.ToArray();
                    }
                    else if (typeof(AudioClip[]).IsAssignableFrom(ftype))
                    {
                        var aclips = (AudioClip[])fvalue;
                        var aclip_list = new List<object>();
                        foreach (var aclip in aclips)
                        {
                            aclip_list.Add(GetAudioClipPropertyValue(aclip));
                        }
                        result = aclip_list.ToArray();
                    }
                    else if (typeof(EmbeddedAsset[]).IsAssignableFrom(ftype))
                    {
                        var eassets = (EmbeddedAsset[])fvalue;
                        var easset_list = new List<object>();
                        foreach (var easset in eassets)
                        {
                            easset_list.Add(GetEmbeddedAssetPropertyValue(easset));
                        }
                        result = easset_list.ToArray();
                    }
                    else if (typeof(TextAsset[]).IsAssignableFrom(ftype))
                    {
                        var tassets = (TextAsset[])fvalue;
                        var tasset_list = new List<object>();
                        foreach (var tasset in tassets)
                        {
                            tasset_list.Add(GetTextAssetPropertyValue(tasset));
                        }
                        result = tasset_list.ToArray();
                    }
                    else if (typeof(DefaultAsset[]).IsAssignableFrom(ftype))
                    {
                        var dassets = (DefaultAsset[])fvalue;
                        var dasset_list = new List<object>();
                        foreach (var dasset in dassets)
                        {
                            dasset_list.Add(GetDefaultAssetPropertyValue(dasset));
                        }
                        result = dasset_list.ToArray();
                    }
                }
            }
            return result;
        }

        private object GetGamePropertyValue(GameObject game)
        {
            if (game == null) return null;
            Dictionary<string, object> objectInfo = new Dictionary<string, object>();
            objectInfo.Add("type", game.GetType().FullName);
            objectInfo.Add("id", GetID(game));
            objectInfo.Add("tag", game.tag);
            objectInfo.Add("name", game.name);
            objectInfo.Add("layer", game.layer);
            objectInfo.Add("isStatic", game.isStatic);
            objectInfo.Add("hideFlags", game.hideFlags.ToString());
            return objectInfo;
        }

        private object GetTransformPropertyValue(Transform transform)
        {
            if (transform == null) return null;
            Dictionary<string, object> position = new Dictionary<string, object>();
            position.Add("x", transform.localPosition.x);
            position.Add("y", transform.localPosition.y);
            position.Add("z", transform.localPosition.z);
            Dictionary<string, object> rotation = new Dictionary<string, object>();
            rotation.Add("x", transform.localRotation.x);
            rotation.Add("y", transform.localRotation.y);
            rotation.Add("z", transform.localRotation.z);
            Dictionary<string, object> scale = new Dictionary<string, object>();
            scale.Add("x", transform.localScale.x);
            scale.Add("y", transform.localScale.y);
            scale.Add("z", transform.localScale.z);
            Dictionary<string, object> transformInfo = new Dictionary<string, object>();
            transformInfo.Add("type", transform.GetType().FullName);
            transformInfo.Add("id", GetID(transform.gameObject));
            transformInfo.Add("position", position);
            transformInfo.Add("rotation", rotation);
            transformInfo.Add("scale", scale);
            return transformInfo;
        }

        private object GetMaterialPropertyValue(Material material)
        {
            if (material == null) return null;
            BabylonMaterial babylonMaterial = DumpMaterial(material);
            Dictionary<string, object> materialInfo = new Dictionary<string, object>();
            materialInfo.Add("type", material.GetType().FullName);
            materialInfo.Add("id", babylonMaterial.id);
            materialInfo.Add("name", babylonMaterial.name);
            materialInfo.Add("alpha", babylonMaterial.alpha);
            materialInfo.Add("wireframe", babylonMaterial.wireframe);
            materialInfo.Add("backFaceCulling", babylonMaterial.backFaceCulling);
            return materialInfo;
        }

        private object GetTexturePropertyValue(Texture2D texture)
        {
            if (texture == null) return null;
            var texturePath = AssetDatabase.GetAssetPath(texture);
            if (String.IsNullOrEmpty(texturePath)) return null;

            var babylonTexture = new BabylonTexture();
            CopyTexture(texturePath, texture, babylonTexture);
            Dictionary<string, object> textureInfo = new Dictionary<string, object>();
            textureInfo.Add("type", texture.GetType().FullName);
            textureInfo.Add("name", babylonTexture.name);
            textureInfo.Add("level", babylonTexture.level);
            textureInfo.Add("isCube", babylonTexture.isCube);
            textureInfo.Add("hasAlpha", babylonTexture.hasAlpha);
            textureInfo.Add("coordinatesMode", babylonTexture.coordinatesMode);
            textureInfo.Add("coordinatesIndex", babylonTexture.coordinatesIndex);
            return textureInfo;
        }

        private object GetCubemapPropertyValue(Cubemap cubemap)
        {
            if (cubemap == null) return null;
            var texturePath = AssetDatabase.GetAssetPath(cubemap);
            if (String.IsNullOrEmpty(texturePath)) return null;

            var textureName = Path.GetFileName(texturePath);
            var outputPath = Path.Combine(babylonScene.OutputPath, textureName);
            File.Copy(texturePath, outputPath, true);
            Dictionary<string, object> textureInfo = new Dictionary<string, object>();
            textureInfo.Add("type", cubemap.GetType().FullName);
            textureInfo.Add("name", textureName);
            textureInfo.Add("width", cubemap.width);
            textureInfo.Add("height", cubemap.height);
            textureInfo.Add("anisoLevel", cubemap.anisoLevel);
            textureInfo.Add("texelSizeX", cubemap.texelSize.x);
            textureInfo.Add("texelSizeY", cubemap.texelSize.y);
            textureInfo.Add("dimension", cubemap.dimension.ToString());
            textureInfo.Add("filterMode", cubemap.filterMode.ToString());
            textureInfo.Add("format", cubemap.format.ToString());
            textureInfo.Add("hideFlags", cubemap.hideFlags.ToString());
            textureInfo.Add("mipMapBias", cubemap.mipMapBias.ToString());
            textureInfo.Add("mipmapCount", cubemap.mipmapCount.ToString());
            textureInfo.Add("wrapMode", cubemap.wrapMode.ToString());
            return textureInfo;
        }

        private object GetEmbeddedAssetPropertyValue(EmbeddedAsset embedded)
        {
            if (embedded == null) return null;
            var assetPath = AssetDatabase.GetAssetPath(embedded.textAsset);
            if (String.IsNullOrEmpty(assetPath)) return null;

            var assetName = Path.GetFileName(assetPath);
            Dictionary<string, object> assetInfo = new Dictionary<string, object>();
            assetInfo.Add("type", embedded.GetType().FullName);
            assetInfo.Add("filename", assetName);
            assetInfo.Add("embedded", true);
            if (embedded.encoding == BabylonTextEncoding.RawBytes)
            {
                assetInfo.Add("base64", Convert.ToBase64String(embedded.textAsset.bytes));
            }
            else
            {
                assetInfo.Add("base64", Tools.FormatBase64(embedded.textAsset.text));
            }
            return assetInfo;
        }

        private object GetTextAssetPropertyValue(TextAsset asset)
        {
            if (asset == null) return null;
            var assetPath = AssetDatabase.GetAssetPath(asset);
            if (String.IsNullOrEmpty(assetPath)) return null;

            var assetName = Path.GetFileName(assetPath);
            var outputPath = Path.Combine(babylonScene.OutputPath, assetName);
            File.Copy(assetPath, outputPath, true);
            Dictionary<string, object> assetInfo = new Dictionary<string, object>();
            assetInfo.Add("type", asset.GetType().FullName);
            assetInfo.Add("filename", assetName);
            assetInfo.Add("embedded", false);
            assetInfo.Add("base64", null);
            return assetInfo;
        }

        private object GetAudioClipPropertyValue(AudioClip clip)
        {
            if (clip == null) return null;
            var assetPath = AssetDatabase.GetAssetPath(clip);
            if (String.IsNullOrEmpty(assetPath)) return null;

            var assetName = Path.GetFileName(assetPath);
            var outputPath = Path.Combine(babylonScene.OutputPath, assetName);
            File.Copy(assetPath, outputPath, true);
            Dictionary<string, object> assetInfo = new Dictionary<string, object>();
            assetInfo.Add("type", clip.GetType().FullName);
            assetInfo.Add("filename", assetName);
            assetInfo.Add("length", clip.length);
            assetInfo.Add("channels", clip.channels);
            assetInfo.Add("frequency", clip.frequency);
            assetInfo.Add("samples", clip.samples);
            return assetInfo;
        }

        private object GetDefaultAssetPropertyValue(DefaultAsset asset)
        {
            if (asset == null) return null;
            var assetPath = AssetDatabase.GetAssetPath(asset);
            if (String.IsNullOrEmpty(assetPath)) return null;

            var assetName = Path.GetFileName(assetPath);
            var outputPath = Path.Combine(babylonScene.OutputPath, assetName);
            File.Copy(assetPath, outputPath, true);
            Dictionary<string, object> assetInfo = new Dictionary<string, object>();
            assetInfo.Add("type", asset.GetType().FullName);
            assetInfo.Add("filename", assetName);
            return assetInfo;
        }

        private object GetShaderPropertyValue(Shader shader)
        {
            if (shader == null || shader.name.Substring(0, 10) != "BabylonJS/") return null;
            string filename = AssetDatabase.GetAssetPath(shader);
            if (String.IsNullOrEmpty(filename)) return null;

            List<string> attributeList = new List<string>();
            List<string> uniformList = new List<string>();
            List<string> samplerList = new List<string>();
            List<string> defineList = new List<string>();
            var result = new Dictionary<string, object>();
            string program = Tools.LoadTextAsset(filename);
            string basename = shader.name.Replace("BabylonJS/", "").Replace("/", "_").Replace(" ", "");
            string babylonOptions = GetShaderProgramSection(basename, program, BabylonProgramSection.Babylon);
            string[] babylonLines = babylonOptions.Split('\n');
            foreach (string babylonLine in babylonLines)
            {
                if (babylonLine.IndexOf("attributes", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    string[] attributes = babylonLine.Split(':');
                    if (attributes != null && attributes.Length > 1)
                    {
                        string abuffer = attributes[1].Replace("[", "").Replace("]", "").Replace("\"", "");
                        if (!String.IsNullOrEmpty(abuffer))
                        {
                            abuffer = abuffer.Trim();
                            string[] adata = abuffer.Split(',');
                            if (adata != null && adata.Length > 0)
                            {
                                foreach (string aoption in adata)
                                {
                                    string aoption_buffer = aoption.Trim();
                                    if (!String.IsNullOrEmpty(aoption_buffer))
                                    {
                                        attributeList.Add(aoption_buffer);
                                    }
                                }
                            }
                        }
                    }
                }
                else if (babylonLine.IndexOf("uniforms", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    string[] uniforms = babylonLine.Split(':');
                    if (uniforms != null && uniforms.Length > 1)
                    {
                        string ubuffer = uniforms[1].Replace("[", "").Replace("]", "").Replace("\"", "");
                        if (!String.IsNullOrEmpty(ubuffer))
                        {
                            ubuffer = ubuffer.Trim();
                            string[] udata = ubuffer.Split(',');
                            if (udata != null && udata.Length > 0)
                            {
                                foreach (string uoption in udata)
                                {
                                    string uoption_buffer = uoption.Trim();
                                    if (!String.IsNullOrEmpty(uoption_buffer))
                                    {
                                        uniformList.Add(uoption_buffer);
                                    }
                                }
                            }
                        }
                    }
                }
                else if (babylonLine.IndexOf("samplers", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    string[] samplers = babylonLine.Split(':');
                    if (samplers != null && samplers.Length > 1)
                    {
                        string sbuffer = samplers[1].Replace("[", "").Replace("]", "").Replace("\"", "");
                        if (!String.IsNullOrEmpty(sbuffer))
                        {
                            sbuffer = sbuffer.Trim();
                            string[] sdata = sbuffer.Split(',');
                            if (sdata != null && sdata.Length > 0)
                            {
                                foreach (string soption in sdata)
                                {
                                    string soption_buffer = soption.Trim();
                                    if (!String.IsNullOrEmpty(soption_buffer))
                                    {
                                        samplerList.Add(soption_buffer);
                                    }
                                }
                            }
                        }
                    }
                }
                else if (babylonLine.IndexOf("defines", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    string[] defines = babylonLine.Split(':');
                    if (defines != null && defines.Length > 1)
                    {
                        string dbuffer = defines[1].Replace("[", "").Replace("]", "").Replace("\"", "");
                        if (!String.IsNullOrEmpty(dbuffer))
                        {
                            dbuffer = dbuffer.Trim();
                            string[] ddata = dbuffer.Split(',');
                            if (ddata != null && ddata.Length > 0)
                            {
                                foreach (string doption in ddata)
                                {
                                    string doption_buffer = doption.Trim();
                                    if (!String.IsNullOrEmpty(doption_buffer))
                                    {
                                        defineList.Add(doption_buffer);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            var shaderPath = new Dictionary<string, object>();
            string vertexProgram = GetShaderProgramSection(basename, program, BabylonProgramSection.Vertex);
            shaderPath.Add("vertexElement", ("base64:" + Tools.FormatBase64(vertexProgram)));
            string fragmentProgram = GetShaderProgramSection(basename, program, BabylonProgramSection.Fragment);
            shaderPath.Add("fragmentElement", ("base64:" + Tools.FormatBase64(fragmentProgram)));
            result.Add("shaderPath", shaderPath);

            var options = new BabylonShaderOptions();
            options.attributes = attributeList.ToArray();
            options.uniforms = uniformList.ToArray();
            options.samplers = samplerList.ToArray();
            options.defines = defineList.ToArray();

            var shaderOptions = new Dictionary<string, object>();
            shaderOptions.Add("attributes", options.attributes);
            shaderOptions.Add("needAlphaBlending", false);
            shaderOptions.Add("needAlphaTesting", false);
            shaderOptions.Add("uniforms", options.uniforms);
            shaderOptions.Add("samplers", options.samplers);
            shaderOptions.Add("defines", options.defines);
            result.Add("shaderOptions", shaderOptions);

            return result;
        }

        private static void ExportSkeletonAnimation(SkinnedMeshRenderer skinnedMesh, BabylonMesh babylonMesh, BabylonSkeleton skeleton)
        {
            var animator = skinnedMesh.rootBone.gameObject.GetComponent<Animator>();
            if (animator != null)
            {
                ExportSkeletonAnimationClips(animator, true, skeleton, skinnedMesh.bones, babylonMesh);
            }
            else
            {
                var parent = skinnedMesh.rootBone.parent;
                while (parent != null)
                {
                    animator = parent.gameObject.GetComponent<Animator>();
                    if (animator != null)
                    {
                        ExportSkeletonAnimationClips(animator, true, skeleton, skinnedMesh.bones, babylonMesh);
                        break;
                    }

                    parent = parent.parent;
                }
            }
        }
    }
}
