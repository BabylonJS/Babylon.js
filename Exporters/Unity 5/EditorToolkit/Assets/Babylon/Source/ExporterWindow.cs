using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using UnityEditor;
using UnityEngine;
using UnityEngine.SceneManagement;

using JsonFx.Json;
using JsonFx.Json.Resolvers;
using JsonFx.Serialization;
using JsonFx.Serialization.Resolvers;

using BabylonHosting;

namespace Unity3D2Babylon
{
    public class ExporterWindow : EditorWindow
    {
        public const double BabylonVersion = 2.5;
        public const string ToolkitVersion = "1.0";
        public const string DefaultHost = "localhost";
        public const int DefaultPort = 8888;

        public static ExportationOptions exportationOptions = null;
        public static readonly List<string> logs = new List<string>();
        Vector2 scrollPosMain;
        bool showLighting = false;
        bool showCollision = false;
        bool showShader = false;
        bool showPreview = false;
        EditorWindow assetStore = null;

        public static void ReportProgress(float value, string message = "")
        {
            EditorUtility.DisplayProgressBar("Babylon.js", message, value);

            if (!string.IsNullOrEmpty(message))
            {
                logs.Add(message);
            }
        }

        public static bool ShowMessage(string message, string title = "Babylon.js", string ok = "OK", string cancel = "Cancel")
        {
            return EditorUtility.DisplayDialog(title, message, ok, cancel);
        }

        public ExportationOptions CreateSettings()
        {
            ExportationOptions result = new ExportationOptions();
            string apath = Application.dataPath.Replace("/Assets", "");
            string ufile = Path.Combine(apath, "UnityBabylonOptions.ini");
            if (File.Exists(ufile))
            {
                var readText = File.ReadAllText(ufile);
                var jsReader = new JsonReader();
                result = jsReader.Read<ExportationOptions>(readText);
            }
            return result;
        }

        public void SaveSettings(bool refresh = false)
        {
            if (refresh) GetSceneInfomation(false);
            string apath = Application.dataPath.Replace("/Assets", "");
            string ufile = Path.Combine(apath, "UnityBabylonOptions.ini");
            var settings = new DataWriterSettings() { PrettyPrint = true };
            var jsWriter = new JsonWriter(settings);
            File.WriteAllText(ufile, jsWriter.Write(exportationOptions));
        }

        [MenuItem("BabylonJS/Scene Exporter", false, 0)]
        public static void InitExporter()
        {
            var exporter = (ExporterWindow)GetWindow(typeof(ExporterWindow));
            exporter.minSize = new Vector2(420.0f, 480.0f);
            exporter.OnInitialize();
        }

        [MenuItem("BabylonJS/Output Window", false, 1)]
        public static void InitOutput()
        {
            var output = (ExporterOutput)GetWindow(typeof(ExporterOutput));
            output.OnInitialize();
        }

        [MenuItem("BabylonJS/Update Libraries", false, 2)]
        public static void InitUpdate()
        {
            Tools.EnableRemoteCertificates();
            
            string prodVersion = ExporterWindow.exportationOptions.ProductionVersion.ToString();
            if (prodVersion.IndexOf(".", StringComparison.OrdinalIgnoreCase) < 0)
            {
                prodVersion += ".0";
            }
            string updateMsg = (exportationOptions.DefaultUpdateOptions == (int)BabylonUpdateOptions.PreviewRelease) ? "Are you sure you want to update libraries using the github preview release version?" : "Are you sure you want to update libraries using the github stable release version " + prodVersion + "?";
            if (ExporterWindow.ShowMessage(updateMsg, "Babylon.js", "Update"))
            {
                EditorUtility.DisplayProgressBar("Babylon.js", "Updating github editor toolkit library files...", 1);

                string libPath = Path.Combine(Application.dataPath, "Babylon/Library/");
                string bjsPath = (exportationOptions.DefaultUpdateOptions == (int)BabylonUpdateOptions.PreviewRelease) ? "https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/dist/preview%20release/babylon.js" : "https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/dist/babylon." + prodVersion + ".js";
                string bjsTsPath = (exportationOptions.DefaultUpdateOptions == (int)BabylonUpdateOptions.PreviewRelease) ? "https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/dist/preview%20release/babylon.d.ts" : "https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/dist/babylon." + prodVersion + ".d.ts";

                string c2dPath = (exportationOptions.DefaultUpdateOptions == (int)BabylonUpdateOptions.PreviewRelease) ? "https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/dist/preview%20release/canvas2D/babylon.canvas2d.js" : "https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/dist/babylon." + prodVersion + ".canvas2d.js";
                string c2dTsPath = (exportationOptions.DefaultUpdateOptions == (int)BabylonUpdateOptions.PreviewRelease) ? "https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/dist/preview%20release/canvas2D/babylon.canvas2d.d.ts" : "https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/dist/babylon." + prodVersion + ".canvas2d.d.ts";

                string cannonPath = (exportationOptions.DefaultUpdateOptions == (int)BabylonUpdateOptions.PreviewRelease) ? "https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/dist/preview%20release/cannon.js" : "https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/dist/cannon.js";
                string oimoPath = (exportationOptions.DefaultUpdateOptions == (int)BabylonUpdateOptions.PreviewRelease) ? "https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/dist/preview%20release/Oimo.js" : "https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/dist/Oimo.js";

                try
                {
                    EditorUtility.DisplayProgressBar("Babylon.js", "Updating babylon.bjs...", 0.10f);
                    Tools.DownloadFile(bjsPath, Path.Combine(libPath, "babylon.bjs"));
                    EditorUtility.DisplayProgressBar("Babylon.js", "Updating babylon.d.ts...", 0.20f);
                    Tools.DownloadFile(bjsTsPath, Path.Combine(libPath, "babylon.d.ts"));

                    EditorUtility.DisplayProgressBar("Babylon.js", "Updating canvas2d.bjs...", 0.30f);
                    Tools.DownloadFile(c2dPath, Path.Combine(libPath, "canvas2d.bjs"));
                    EditorUtility.DisplayProgressBar("Babylon.js", "Updating canvas2d.d.ts...", 0.40f);
                    Tools.DownloadFile(c2dTsPath, Path.Combine(libPath, "canvas2d.d.ts"));

                    EditorUtility.DisplayProgressBar("Babylon.js", "Updating cannon.bjs...", 0.50f);
                    Tools.DownloadFile(cannonPath, Path.Combine(libPath, "cannon.bjs"));
                    EditorUtility.DisplayProgressBar("Babylon.js", "Updating oimo.bjs...", 0.60f);
                    Tools.DownloadFile(oimoPath, Path.Combine(libPath, "oimo.bjs"));

                    EditorUtility.DisplayProgressBar("Babylon.js", "Updating navmesh.bjs...", 0.70f);
                    Tools.DownloadFile("https://raw.githubusercontent.com/BabylonJS/Extensions/master/SceneManager/dist/babylon.navigation.mesh.js", Path.Combine(libPath, "navmesh.bjs"));
                    EditorUtility.DisplayProgressBar("Babylon.js", "Updating manager.bjs...", 0.80f);
                    Tools.DownloadFile("https://raw.githubusercontent.com/BabylonJS/Extensions/master/SceneManager/dist/babylon.scenemanager.js", Path.Combine(libPath, "manager.bjs"));
                    EditorUtility.DisplayProgressBar("Babylon.js", "Updating manager.d.ts...", 0.90f);
                    Tools.DownloadFile("https://raw.githubusercontent.com/BabylonJS/Extensions/master/SceneManager/dist/babylon.scenemanager.d.ts", Path.Combine(libPath, "manager.d.ts"));
                }
                catch (System.Exception ex)
                {
                    UnityEngine.Debug.LogException(ex);
                }
                finally
                {
                    EditorUtility.DisplayProgressBar("Babylon.js", "Refresing assets database...", 1.0f);
                    AssetDatabase.Refresh();
                    EditorUtility.ClearProgressBar();
                }
            }
        }

        [MenuItem("BabylonJS/Babylon Dashboard", false, 999)]
        public static void InitDashboard()
        {
            Application.OpenURL("http://www.babylonjs.com");
        }

        [MenuItem("Assets/Create/BabylonJS/Javascript Class", false, 101)]
        public static void CreateJavascript()
        {
            string path = AssetDatabase.GetAssetPath(Selection.activeObject);
            if (String.IsNullOrEmpty(path))
            {
                path = "Assets";
            }
            else if (!String.IsNullOrEmpty(Path.GetExtension(path)))
            {
                path = path.Replace(Path.GetFileName(AssetDatabase.GetAssetPath(Selection.activeObject)), "");
            }
            string filename = Path.Combine(path, "NewJavascript.bjs");
            string template = "Assets/Babylon/Templates/Scripts/javascript.template";
            if (!File.Exists(template))
            {
                string defaultTemplate = "// Babylon Javascript File";
                File.WriteAllText(template, defaultTemplate);
            }
            var icon = EditorGUIUtility.FindTexture("ScriptableObject Icon") as Texture2D;
            var DoCreateScriptAsset = Type.GetType("UnityEditor.ProjectWindowCallback.DoCreateScriptAsset, UnityEditor");
            ProjectWindowUtil.StartNameEditingIfProjectWindowExists(0, ScriptableObject.CreateInstance(DoCreateScriptAsset) as UnityEditor.ProjectWindowCallback.EndNameEditAction, filename, icon, template);
        }

        [MenuItem("Assets/Create/BabylonJS/Typescript Class", false, 102)]
        public static void CreateTypescript()
        {
            string path = AssetDatabase.GetAssetPath(Selection.activeObject);
            if (String.IsNullOrEmpty(path))
            {
                path = "Assets";
            }
            else if (!String.IsNullOrEmpty(Path.GetExtension(path)))
            {
                path = path.Replace(Path.GetFileName(AssetDatabase.GetAssetPath(Selection.activeObject)), "");
            }
            string filename = Path.Combine(path, "NewTypescript.ts");
            string template = "Assets/Babylon/Templates/Scripts/typescript.template";
            if (!File.Exists(template))
            {
                string defaultTemplate = "// Babylon Typescript File";
                File.WriteAllText(template, defaultTemplate);
            }
            var icon = EditorGUIUtility.FindTexture("ScriptableObject Icon") as Texture2D;
            var DoCreateScriptAsset = Type.GetType("UnityEditor.ProjectWindowCallback.DoCreateScriptAsset, UnityEditor");
            ProjectWindowUtil.StartNameEditingIfProjectWindowExists(0, ScriptableObject.CreateInstance(DoCreateScriptAsset) as UnityEditor.ProjectWindowCallback.EndNameEditAction, filename, icon, template);
        }

        [MenuItem("Assets/Create/BabylonJS/Scene Controller", false, 201)]
        public static void CreateSceneController_TS()
        {
            string path = AssetDatabase.GetAssetPath(Selection.activeObject);
            if (String.IsNullOrEmpty(path))
            {
                path = "Assets";
            }
            else if (!String.IsNullOrEmpty(Path.GetExtension(path)))
            {
                path = path.Replace(Path.GetFileName(AssetDatabase.GetAssetPath(Selection.activeObject)), "");
            }
            string filename = Path.Combine(path, "NewSceneController.ts");
            string template = "Assets/Babylon/Templates/Scripts/controller.template";
            if (!File.Exists(template))
            {
                string defaultTemplate = "// Babylon Scene Controller";
                File.WriteAllText(template, defaultTemplate);
            }
            var icon = EditorGUIUtility.FindTexture("ScriptableObject Icon") as Texture2D;
            var DoCreateScriptAsset = Type.GetType("UnityEditor.ProjectWindowCallback.DoCreateScriptAsset, UnityEditor");
            ProjectWindowUtil.StartNameEditingIfProjectWindowExists(0, ScriptableObject.CreateInstance(DoCreateScriptAsset) as UnityEditor.ProjectWindowCallback.EndNameEditAction, filename, icon, template);
        }

        [MenuItem("Assets/Create/BabylonJS/Mesh Component", false, 301)]
        public static void CreateMeshComponent_TS()
        {
            string path = AssetDatabase.GetAssetPath(Selection.activeObject);
            if (String.IsNullOrEmpty(path))
            {
                path = "Assets";
            }
            else if (!String.IsNullOrEmpty(Path.GetExtension(path)))
            {
                path = path.Replace(Path.GetFileName(AssetDatabase.GetAssetPath(Selection.activeObject)), "");
            }
            string filename = Path.Combine(path, "NewMeshComponent.ts");
            string template = "Assets/Babylon/Templates/Scripts/mesh.template";
            if (!File.Exists(template))
            {
                string defaultTemplate = "// Babylon Mesh Class";
                File.WriteAllText(template, defaultTemplate);
            }
            var icon = EditorGUIUtility.FindTexture("ScriptableObject Icon") as Texture2D;
            var DoCreateScriptAsset = Type.GetType("UnityEditor.ProjectWindowCallback.DoCreateScriptAsset, UnityEditor");
            ProjectWindowUtil.StartNameEditingIfProjectWindowExists(0, ScriptableObject.CreateInstance(DoCreateScriptAsset) as UnityEditor.ProjectWindowCallback.EndNameEditAction, filename, icon, template);
        }

        [MenuItem("Assets/Create/BabylonJS/Light Component", false, 302)]
        public static void CreateLightComponent_TS()
        {
            string path = AssetDatabase.GetAssetPath(Selection.activeObject);
            if (String.IsNullOrEmpty(path))
            {
                path = "Assets";
            }
            else if (!String.IsNullOrEmpty(Path.GetExtension(path)))
            {
                path = path.Replace(Path.GetFileName(AssetDatabase.GetAssetPath(Selection.activeObject)), "");
            }
            string filename = Path.Combine(path, "NewLightComponent.ts");
            string template = "Assets/Babylon/Templates/Scripts/light.template";
            if (!File.Exists(template))
            {
                string defaultTemplate = "// Babylon Light Class";
                File.WriteAllText(template, defaultTemplate);
            }
            var icon = EditorGUIUtility.FindTexture("ScriptableObject Icon") as Texture2D;
            var DoCreateScriptAsset = Type.GetType("UnityEditor.ProjectWindowCallback.DoCreateScriptAsset, UnityEditor");
            ProjectWindowUtil.StartNameEditingIfProjectWindowExists(0, ScriptableObject.CreateInstance(DoCreateScriptAsset) as UnityEditor.ProjectWindowCallback.EndNameEditAction, filename, icon, template);
        }

        [MenuItem("Assets/Create/BabylonJS/Camera Component", false, 303)]
        public static void CreateCameraComponent_TS()
        {
            string path = AssetDatabase.GetAssetPath(Selection.activeObject);
            if (String.IsNullOrEmpty(path))
            {
                path = "Assets";
            }
            else if (!String.IsNullOrEmpty(Path.GetExtension(path)))
            {
                path = path.Replace(Path.GetFileName(AssetDatabase.GetAssetPath(Selection.activeObject)), "");
            }
            string filename = Path.Combine(path, "NewCameraComponent.ts");
            string template = "Assets/Babylon/Templates/Scripts/camera.template";
            if (!File.Exists(template))
            {
                string defaultTemplate = "// Babylon Camera Class";
                File.WriteAllText(template, defaultTemplate);
            }
            var icon = EditorGUIUtility.FindTexture("ScriptableObject Icon") as Texture2D;
            var DoCreateScriptAsset = Type.GetType("UnityEditor.ProjectWindowCallback.DoCreateScriptAsset, UnityEditor");
            ProjectWindowUtil.StartNameEditingIfProjectWindowExists(0, ScriptableObject.CreateInstance(DoCreateScriptAsset) as UnityEditor.ProjectWindowCallback.EndNameEditAction, filename, icon, template);
        }

        [MenuItem("Assets/Create/BabylonJS/Unity Editor Script/Babylon Scene Controller (C#)", false, 901)]
        public static void CreateEditorController_CS()
        {
            string path = AssetDatabase.GetAssetPath(Selection.activeObject);
            if (String.IsNullOrEmpty(path))
            {
                path = "Assets";
            }
            else if (!String.IsNullOrEmpty(Path.GetExtension(path)))
            {
                path = path.Replace(Path.GetFileName(AssetDatabase.GetAssetPath(Selection.activeObject)), "");
            }
            string filename = Path.Combine(path, "NewSceneController.cs");
            string template = "Assets/Babylon/Templates/Scripts/editora.template";
            if (!File.Exists(template))
            {
                string defaultTemplate = "// Babylon Controller Class";
                File.WriteAllText(template, defaultTemplate);
            }
            var icon = EditorGUIUtility.FindTexture("ScriptableObject Icon") as Texture2D;
            var DoCreateScriptAsset = Type.GetType("UnityEditor.ProjectWindowCallback.DoCreateScriptAsset, UnityEditor");
            ProjectWindowUtil.StartNameEditingIfProjectWindowExists(0, ScriptableObject.CreateInstance(DoCreateScriptAsset) as UnityEditor.ProjectWindowCallback.EndNameEditAction, filename, icon, template);
        }

        [MenuItem("Assets/Create/BabylonJS/Unity Editor Script/Babylon Script Component (C#)", false, 902)]
        public static void CreateEditorComponent_CS()
        {
            string path = AssetDatabase.GetAssetPath(Selection.activeObject);
            if (String.IsNullOrEmpty(path))
            {
                path = "Assets";
            }
            else if (!String.IsNullOrEmpty(Path.GetExtension(path)))
            {
                path = path.Replace(Path.GetFileName(AssetDatabase.GetAssetPath(Selection.activeObject)), "");
            }
            string filename = Path.Combine(path, "NewScriptComponent.cs");
            string template = "Assets/Babylon/Templates/Scripts/editorb.template";
            if (!File.Exists(template))
            {
                string defaultTemplate = "// Babylon Script Class";
                File.WriteAllText(template, defaultTemplate);
            }
            var icon = EditorGUIUtility.FindTexture("ScriptableObject Icon") as Texture2D;
            var DoCreateScriptAsset = Type.GetType("UnityEditor.ProjectWindowCallback.DoCreateScriptAsset, UnityEditor");
            ProjectWindowUtil.StartNameEditingIfProjectWindowExists(0, ScriptableObject.CreateInstance(DoCreateScriptAsset) as UnityEditor.ProjectWindowCallback.EndNameEditAction, filename, icon, template);
        }

        [MenuItem("Assets/Create/BabylonJS/Unity Editor Script/Universal Shader Program (GLSL)", false, 999)]
        public static void CreateShader()
        {
            string path = AssetDatabase.GetAssetPath(Selection.activeObject);
            if (String.IsNullOrEmpty(path))
            {
                path = "Assets";
            }
            else if (!String.IsNullOrEmpty(Path.GetExtension(path)))
            {
                path = path.Replace(Path.GetFileName(AssetDatabase.GetAssetPath(Selection.activeObject)), "");
            }
            string filename = Path.Combine(path, "NewShaderProgram.shader");
            string template = "Assets/Babylon/Templates/Shaders/amiga.template";
            if (!File.Exists(template))
            {
                string defaultTemplate = "// Babylon Shader Class";
                File.WriteAllText(template, defaultTemplate);
            }
            var icon = EditorGUIUtility.FindTexture("ScriptableObject Icon") as Texture2D;
            var DoCreateScriptAsset = Type.GetType("UnityEditor.ProjectWindowCallback.DoCreateScriptAsset, UnityEditor");
            ProjectWindowUtil.StartNameEditingIfProjectWindowExists(0, ScriptableObject.CreateInstance(DoCreateScriptAsset) as UnityEditor.ProjectWindowCallback.EndNameEditAction, filename, icon, template);
        }

        public void OnInitialize() { }

        public void OnEnable()
        {
            this.titleContent = new GUIContent("Exporter");
            if (ExporterWindow.exportationOptions == null)
            {
                ExporterWindow.exportationOptions = CreateSettings();
            }
            // Attach unity editor buttons
            UnityEditor.EditorApplication.playmodeStateChanged = () =>
            {
                if (exportationOptions != null && exportationOptions.AttachUnityEditor)
                {
                    bool wantsToPlay = UnityEditor.EditorApplication.isPlayingOrWillChangePlaymode;
                    bool wantsToPause = UnityEditor.EditorApplication.isPaused;
                    if (wantsToPlay || wantsToPause)
                    {
                        UnityEditor.EditorApplication.isPlaying = false;
                        UnityEditor.EditorApplication.isPaused = false;
                    }
                    if (wantsToPlay) Execute();
                }
            };
            // Activate asset store window
            if (this.assetStore == null)
            {
                this.assetStore = Tools.GetAssetStoreWindow();
            }
            // Activate internl web server
            this.StartServer();
        }

        public void StartServer()
        {
            if (exportationOptions.HostPreviewPage)
            {
                // Validate default project folder selected
                if (String.IsNullOrEmpty(exportationOptions.DefaultProjectFolder))
                {
                    UnityEngine.Debug.LogWarning("No default project file selected. Web server not started.");
                    return;
                }

                // Validate default project folder exists
                if (!Directory.Exists(exportationOptions.DefaultProjectFolder))
                {
                    UnityEngine.Debug.LogWarning("No default project file created. Web server not started.");
                    return;
                }

                bool supported = WebServer.IsSupported;
                string prefix = "http://*:";
                string root = exportationOptions.DefaultProjectFolder;
                int port = exportationOptions.DefaultServerPort;
                bool started = WebServer.Activate(prefix, root, port);
                if (started) UnityEngine.Debug.Log("Babylon.js web server started on port: " + port.ToString());
                if (!started && supported) UnityEngine.Debug.LogWarning("Babylon.js web server is available.");
                if (!started && !supported) UnityEngine.Debug.LogWarning("Babylon.js web server is not available.");
            }
        }

        public void OnGUI()
        {
            GUILayout.Label("BabylonJS Toolkit - Version: " + ExporterWindow.ToolkitVersion, EditorStyles.boldLabel);
            EditorGUI.BeginDisabledGroup(true);
            exportationOptions.DefaultProjectFolder = EditorGUILayout.TextField("", exportationOptions.DefaultProjectFolder);
            EditorGUI.EndDisabledGroup();
            if (GUILayout.Button("Select Project Folder"))
            {
                SelectFolder();
            }
            if (GUILayout.Button("Save Export Settings"))
            {
                SaveSettings();
                ShowMessage("Export settings saved.");
            }

            scrollPosMain = EditorGUILayout.BeginScrollView(scrollPosMain, GUILayout.ExpandWidth(false), GUILayout.ExpandHeight(true));
            EditorGUILayout.Space();
            exportationOptions.DefaultBuildPath = EditorGUILayout.TextField(" Project Build Path", exportationOptions.DefaultBuildPath);
            EditorGUILayout.Space();
            exportationOptions.DefaultScenePath = EditorGUILayout.TextField(" Project Scene Path", exportationOptions.DefaultScenePath);
            EditorGUILayout.Space();
            exportationOptions.DefaultScriptPath = EditorGUILayout.TextField(" Project Script Path", exportationOptions.DefaultScriptPath);
            EditorGUILayout.Space();
            exportationOptions.DefaultIndexPage = EditorGUILayout.TextField(" Project Index Page", exportationOptions.DefaultIndexPage);
            EditorGUILayout.Space();
            EditorGUILayout.BeginHorizontal();
            exportationOptions.ExportPhysics = EditorGUILayout.Toggle(" Enable Physics Engine", exportationOptions.ExportPhysics);
            exportationOptions.DefaultPhysicsEngine = (int)(BabylonPhysicsEngine)EditorGUILayout.EnumPopup("Default Physics Engine", (BabylonPhysicsEngine)exportationOptions.DefaultPhysicsEngine, GUILayout.ExpandWidth(true));
            EditorGUILayout.EndHorizontal();
            EditorGUILayout.Space();
            EditorGUILayout.BeginHorizontal();
            GUILayout.Label(" Light Rotation Offset");
            exportationOptions.LightRotationOffset = EditorGUILayout.Vector3Field("", exportationOptions.LightRotationOffset, GUILayout.ExpandWidth(false));
            EditorGUILayout.EndHorizontal();
            EditorGUILayout.Space();
            exportationOptions.LightIntensityFactor = EditorGUILayout.Slider(" Light Intensity Factor", exportationOptions.LightIntensityFactor, 0, 10.0f);
            EditorGUILayout.Space();
            exportationOptions.DefaultAspectRatio = EditorGUILayout.Slider(" Viewport Camera Ratio", exportationOptions.DefaultAspectRatio, 0, 10.0f);
            EditorGUILayout.Space();
            exportationOptions.ReflectionDefaultLevel = EditorGUILayout.Slider(" Default Reflection Level", exportationOptions.ReflectionDefaultLevel, 0, 1.0f);
            EditorGUILayout.Space();
            exportationOptions.DefaultQualityLevel = (int)EditorGUILayout.Slider(" Texture Image Quality", exportationOptions.DefaultQualityLevel, 0, 100);
            EditorGUILayout.Space();
            exportationOptions.DefaultImageFormat = (int)(BabylonImageFormat)EditorGUILayout.EnumPopup(" Prefered Texture Format", (BabylonImageFormat)exportationOptions.DefaultImageFormat, GUILayout.ExpandWidth(true));
            EditorGUILayout.Space();

            showShader = EditorGUILayout.Foldout(showShader, "Shader Program Options");
            if (showShader)
            {
                EditorGUILayout.Space();
                exportationOptions.EmbeddedShaders = EditorGUILayout.Toggle("   Embed Shader Files", exportationOptions.EmbeddedShaders);
                EditorGUILayout.Space();
                exportationOptions.DefaultShaderFolder = EditorGUILayout.TextField("   Output Src Shader Path", exportationOptions.DefaultShaderFolder);
                EditorGUILayout.Space();
            }

            showCollision = EditorGUILayout.Foldout(showCollision, "Collision Engine Options");
            if (showCollision)
            {
                EditorGUILayout.Space();
                exportationOptions.ExportCollisions = EditorGUILayout.Toggle("   Enable Collisions", exportationOptions.ExportCollisions);
                EditorGUILayout.Space();
                exportationOptions.WorkerCollisions = EditorGUILayout.Toggle("   Use Worker Threads", exportationOptions.WorkerCollisions);
                EditorGUILayout.Space();
                exportationOptions.DefaultColliderDetail = (int)(BabylonColliderDetail)EditorGUILayout.EnumPopup("   Default Collider Detail", (BabylonColliderDetail)exportationOptions.DefaultColliderDetail, GUILayout.ExpandWidth(true));
                EditorGUILayout.Space();
            }

            showLighting = EditorGUILayout.Foldout(showLighting, "Lightmap Baking Options");
            if (showLighting)
            {
                EditorGUILayout.Space();
                EditorGUILayout.BeginHorizontal();
                exportationOptions.ExportLightmaps = EditorGUILayout.Toggle("   Export Lightmaps", exportationOptions.ExportLightmaps);
                exportationOptions.DefaultLightmapBaking = (int)(BabylonLightmapBaking)EditorGUILayout.EnumPopup("    Synchronous Baking", (BabylonLightmapBaking)exportationOptions.DefaultLightmapBaking, GUILayout.ExpandWidth(true));
                EditorGUILayout.EndHorizontal();
                EditorGUILayout.Space();
                exportationOptions.DefaultLightmapMode = (int)(BabylonLightmapMode)EditorGUILayout.EnumPopup("   Light Mapper Mode", (BabylonLightmapMode)exportationOptions.DefaultLightmapMode, GUILayout.ExpandWidth(true));
                EditorGUILayout.Space();
                exportationOptions.DefaultCoordinatesIndex = (int)EditorGUILayout.Slider("   Coordinates Index", exportationOptions.DefaultCoordinatesIndex, 0, 1);
                EditorGUILayout.Space();
                EditorGUILayout.BeginHorizontal(GUILayout.ExpandWidth(true));
                exportationOptions.ExportShadows = EditorGUILayout.Toggle("   Enable Shadow Map", exportationOptions.ExportShadows);
                GUILayout.Label("   Default Shadow Map Size");
                exportationOptions.ShadowMapSize = EditorGUILayout.IntField("", exportationOptions.ShadowMapSize, GUILayout.Width(50));
                EditorGUILayout.EndHorizontal();
                EditorGUILayout.Space();
                exportationOptions.DefaultLightFilter = (int)(BabylonLightingFilter)EditorGUILayout.EnumPopup("   Shadow Map Filter", (BabylonLightingFilter)exportationOptions.DefaultLightFilter, GUILayout.ExpandWidth(true));
                EditorGUILayout.Space();
                exportationOptions.ShadowMapBias = EditorGUILayout.Slider("   Shadow Map Bias", exportationOptions.ShadowMapBias, 0, 1.0f);
                EditorGUILayout.Space();
                exportationOptions.ShadowBlurScale = EditorGUILayout.Slider("   Shadow Blur Scale", exportationOptions.ShadowBlurScale, 0, 5.0f);
                EditorGUILayout.Space();
            }

            showPreview = EditorGUILayout.Foldout(showPreview, "Default Exporting Options");
            if (showPreview)
            {
                EditorGUILayout.Space();
                exportationOptions.AttachUnityEditor = EditorGUILayout.Toggle("   Attach Unity Editor", exportationOptions.AttachUnityEditor);
                EditorGUILayout.Space();
                exportationOptions.HostPreviewPage = EditorGUILayout.Toggle("   Host Preview Server", exportationOptions.HostPreviewPage);
                EditorGUILayout.Space();
                exportationOptions.ShowDebugControls = EditorGUILayout.Toggle("   Show Debug Controls", exportationOptions.ShowDebugControls);
                EditorGUILayout.Space();
                exportationOptions.DefaultServerPort = EditorGUILayout.IntField("   Default Server Port", exportationOptions.DefaultServerPort);
                EditorGUILayout.Space();
                exportationOptions.DefaultPreviewWindow = (int)(BabylonPreviewWindow)EditorGUILayout.EnumPopup("   Default Preview Window", (BabylonPreviewWindow)exportationOptions.DefaultPreviewWindow, GUILayout.ExpandWidth(true));
                EditorGUILayout.Space();
                exportationOptions.BuildJavaScript = EditorGUILayout.Toggle("   Build Javascript Files", exportationOptions.BuildJavaScript);
                EditorGUILayout.Space();
                exportationOptions.CompileTypeScript = EditorGUILayout.Toggle("   Build Typescript Files", exportationOptions.CompileTypeScript);
                EditorGUILayout.Space();
                exportationOptions.DefaultTypeSriptPath = EditorGUILayout.TextField("   Typescript Compiler", exportationOptions.DefaultTypeSriptPath);
                EditorGUILayout.Space();
                exportationOptions.DefaultNodeRuntimePath = EditorGUILayout.TextField("   Node Runtime System", exportationOptions.DefaultNodeRuntimePath);
                EditorGUILayout.Space();
                exportationOptions.ProductionVersion = EditorGUILayout.FloatField("   Stable Babylon Version", exportationOptions.ProductionVersion);
                EditorGUILayout.Space();
                exportationOptions.DefaultUpdateOptions = (int)(BabylonUpdateOptions)EditorGUILayout.EnumPopup("   Github Update Version", (BabylonUpdateOptions)exportationOptions.DefaultUpdateOptions, GUILayout.ExpandWidth(true));
                EditorGUILayout.Space();
            }
            EditorGUILayout.EndScrollView();
            EditorGUILayout.Space();

            // Exporter buttons
            if (GUILayout.Button("Build Script"))
            {
                if (ExporterWindow.ShowMessage("Are you sure you want to build the project script files?", "Babylon.js", "Build"))
                {
                    Build(true);
                }
            }
            if (GUILayout.Button("Export Scene"))
            {
                Export(false);
            }
            if (GUILayout.Button("Export & Preview"))
            {
                Export(true);
            }
            if (ExporterWindow.exportationOptions.HostPreviewPage == true)
            {
                if (GUILayout.Button("Start Preview Server"))
                {
                    StartServer();
                }
            }
            if (GUILayout.Button("Launch Preview Window"))
            {
                Execute();
            }
            EditorGUILayout.Space();
        }

        public void OnInspectorUpdate()
        {
            this.Repaint();
        }

        public void SelectFolder()
        {
            exportationOptions.DefaultProjectFolder = EditorUtility.SaveFolderPanel("Please select a folder", exportationOptions.DefaultProjectFolder, "");
        }

        public void Build(bool solo, string[] info = null)
        {
            if (solo)
            {
                // Validate default project folder selected
                if (String.IsNullOrEmpty(exportationOptions.DefaultProjectFolder))
                {
                    ShowMessage("No default project file selected.");
                    return;
                }

                // Validate default project folder exists
                if (!Directory.Exists(exportationOptions.DefaultProjectFolder))
                {
                    ShowMessage("No default project file created.");
                    return;
                }
            }

            try
            {
                var sceneInfo = info ?? GetSceneInfomation(false);
                string scriptPath = sceneInfo[2];
                string projectScript = sceneInfo[4];

                // Save and clear console
                if (solo)
                {
                    try { UnityEngine.Debug.ClearDeveloperConsole(); } catch { }
                    SaveSettings();
                }

                // Assemble javascript files
                string javascriptFile = Tools.FormatProjectJavaScript(scriptPath, projectScript);
                if (solo || exportationOptions.BuildJavaScript)
                {
                    ReportProgress(1, "Building project javascript files...");
                    Tools.BuildProjectJavaScript(scriptPath, projectScript, javascriptFile);
                }

                // Compile typescript files
                if (solo || exportationOptions.CompileTypeScript)
                {
                    ReportProgress(1, "Compiling project typescript files... This may take a while.");
                    string config = String.Empty;
                    string options = Path.Combine(Application.dataPath, "Babylon/Templates/Config/options.json");
                    if (File.Exists(options)) config = File.ReadAllText(options);
                    Tools.BuildProjectTypeScript(exportationOptions.DefaultNodeRuntimePath, exportationOptions.DefaultTypeSriptPath, scriptPath, javascriptFile, config);
                }
            }
            catch (Exception ex)
            {
                UnityEngine.Debug.LogException(ex);
            }
            finally
            {
                if (solo) EditorUtility.ClearProgressBar();
            }
        }

        public void Export(bool preview)
        {
            try
            {
                // Validate lightmap bake in progress
                if (exportationOptions.ExportLightmaps && exportationOptions.DefaultLightmapBaking == (int)BabylonLightmapBaking.Enabled && Lightmapping.isRunning)
                {
                    ShowMessage("There is a bake already in progress.");
                    return;
                }

                // Validate default project folder selected
                if (String.IsNullOrEmpty(exportationOptions.DefaultProjectFolder))
                {
                    ShowMessage("No default project file selected.");
                    return;
                }

                // Validate default project folder exists
                if (!Directory.Exists(exportationOptions.DefaultProjectFolder))
                {
                    if (ExporterWindow.ShowMessage("Create default project folder: " + exportationOptions.DefaultProjectFolder, "Babylon.js - Project not found", "Create"))
                    {
                        Directory.CreateDirectory(exportationOptions.DefaultProjectFolder);
                    }
                    else
                    {
                        return;
                    }
                }

                // Get validate scene path info
                string[] sceneInfo = GetSceneInfomation(true);
                string sceneName = sceneInfo[0];
                string scenePath = sceneInfo[1];
                string scriptPath = sceneInfo[2];
                string outputFile = sceneInfo[3];
                string projectScript = sceneInfo[4];
                if (!ExporterWindow.ShowMessage("Export current scene to babylon: " + sceneName, "Babylon.js", "Export"))
                {
                    return;
                }

                // Save current scene info
                SaveSettings();
                ExporterWindow.logs.Clear();
                Stopwatch watch = new Stopwatch();
                watch.Start();
                ReportProgress(0, "Exporting " + scenePath);

                // Auto lightmap baking
                if (exportationOptions.ExportLightmaps && exportationOptions.DefaultLightmapBaking == (int)BabylonLightmapBaking.Enabled)
                {
                    ReportProgress(1, "Baking lightmap textures... This may take a while.");
                    Lightmapping.GIWorkflowMode workflow = Lightmapping.giWorkflowMode;
                    Lightmapping.giWorkflowMode = Lightmapping.GIWorkflowMode.OnDemand;
                    Lightmapping.Bake();
                    Lightmapping.giWorkflowMode = workflow;
                }

                // Save all open scenes
                ReportProgress(1, "Saving open scene information...");
                UnityEditor.SceneManagement.EditorSceneManager.SaveOpenScenes();

                // Build project preview
                if (preview)
                {
                    Tools.GenerateProjectIndexPage(exportationOptions.DefaultProjectFolder, exportationOptions.ShowDebugControls, exportationOptions.DefaultScenePath, Path.GetFileName(outputFile), exportationOptions.DefaultScriptPath, Path.GetFileName(projectScript));
                    if (exportationOptions.BuildJavaScript || exportationOptions.CompileTypeScript)
                    {
                        Build(false, sceneInfo);
                    }
                }

                // Build current scene
                BabylonSceneController sceneController = Tools.GetSceneController();
                var sceneBuilder = new SceneBuilder(scenePath, sceneName, exportationOptions, sceneController, scriptPath);
                sceneBuilder.ConvertFromUnity();

                ReportProgress(1, "Generating babylon scene... This may take a while.");
                sceneBuilder.WriteToBabylonFile(outputFile);

                watch.Stop();
                ReportProgress(1, string.Format("Exportation done in {0:0.00}s", watch.Elapsed.TotalSeconds));
                EditorUtility.ClearProgressBar();

                sceneBuilder.GenerateStatus(logs);

                string done = preview ? "Preview" : "OK";
                bool ok = ShowMessage("Scene exportation complete.", "Babylon.js", done);
                if (preview && ok)
                {
                    Preview();
                }
            }
            catch (Exception ex)
            {
                EditorUtility.ClearProgressBar();
                ShowMessage("A problem occurred: " + ex.Message + ex.StackTrace, "Error");
            }
        }

        public string[] GetSceneInfomation(bool validate)
        {
            string[] result = new string[6];
            string sceneName = SceneManager.GetActiveScene().name;
            if (String.IsNullOrEmpty(exportationOptions.DefaultBuildPath))
            {
                exportationOptions.DefaultBuildPath = "Build";
            }
            string buildPath = Tools.FormatSafePath(Path.Combine(exportationOptions.DefaultProjectFolder, exportationOptions.DefaultBuildPath));
            if (validate && !Directory.Exists(buildPath))
            {
                Directory.CreateDirectory(buildPath);
            }
            if (String.IsNullOrEmpty(exportationOptions.DefaultScenePath))
            {
                exportationOptions.DefaultScenePath = "Scenes";
            }
            string scenePath = Tools.FormatSafePath(Path.Combine(exportationOptions.DefaultProjectFolder, exportationOptions.DefaultScenePath));
            if (validate && !Directory.Exists(scenePath))
            {
                Directory.CreateDirectory(scenePath);
            }
            if (String.IsNullOrEmpty(exportationOptions.DefaultScriptPath))
            {
                exportationOptions.DefaultScriptPath = "Scripts";
            }
            string scriptPath = Tools.FormatSafePath(Path.Combine(exportationOptions.DefaultProjectFolder, exportationOptions.DefaultScriptPath));
            if (validate && !Directory.Exists(scriptPath))
            {
                Directory.CreateDirectory(scriptPath);
            }
            if (String.IsNullOrEmpty(exportationOptions.DefaultIndexPage))
            {
                exportationOptions.DefaultIndexPage = "Index.html";
            }
            if (String.IsNullOrEmpty(exportationOptions.DefaultTypeSriptPath))
            {
                exportationOptions.DefaultTypeSriptPath = Tools.GetDefaultTypeScriptPath();
            }
            if (String.IsNullOrEmpty(exportationOptions.DefaultNodeRuntimePath))
            {
                exportationOptions.DefaultNodeRuntimePath = Tools.GetDefaultNodeRuntimePath();
            }
            if (exportationOptions.DefaultServerPort < 1024)
            {
                exportationOptions.DefaultServerPort = ExporterWindow.DefaultPort;
            }
            string projectName = Application.productName;
            if (String.IsNullOrEmpty(projectName))
            {
                projectName = "Application";
            }
            string outputFile = Tools.FormatSafePath(Path.Combine(scenePath, sceneName.Replace(" ", "") + ".babylon"));
            string projectScript = Tools.FormatSafePath(Path.Combine(scenePath, projectName.Replace(" ", "") + ".babylon"));
            result[0] = sceneName;
            result[1] = scenePath;
            result[2] = buildPath;
            result[3] = outputFile;
            result[4] = projectScript;
            return result;
        }

        public void Preview()
        {
            string hostProtocol = "http://";
            string previewUrl = hostProtocol + "localhost:" + exportationOptions.DefaultServerPort.ToString() + "/" + exportationOptions.DefaultIndexPage;
            if (exportationOptions.DefaultPreviewWindow == (int)BabylonPreviewWindow.AttachUnityBrowser)
            {
                var browser = Tools.AttachToAssetStoreWindow("Babylon", previewUrl);
                if (browser == null)
                {
                    ShowMessage("The asset store browser must be opened. Please try your request again after the asset store has opened.", "Babylon.js - Failed to attach browser");
                }
            }
            else
            {
                Application.OpenURL(previewUrl);
            }
        }

        public void Execute()
        {
            Scene scene = SceneManager.GetActiveScene();
            string[] sceneInfo = GetSceneInfomation(true);
            string outputFile = sceneInfo[3];
            if (!scene.isDirty && File.Exists(outputFile))
            {
                Preview();
            }
            else
            {
                Export(true);
            }
        }
    }
}

