using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using JsonFx;
using UnityEditor;
using UnityEngine;
using JsonFx.Json;
using UnityEditor.SceneManagement;

namespace Unity3D2Babylon
{
    public class ExporterWindow : EditorWindow
    {
        private static readonly List<string> logs = new List<string>();
        Vector2 scrollPos;

        ExportationOptions exportationOptions;

        public static void ReportProgress(float value, string message = "")
        {
            EditorUtility.DisplayProgressBar("Babylon.js", message, value);

            if (!string.IsNullOrEmpty(message))
            {
                logs.Add(message);
            }
        }

        public static void ShowMessage(string message, string title = "Babylon.js")
        {
            EditorUtility.DisplayDialog(title, message, "OK");
        }

        [MenuItem("BabylonJS/Export to .babylon")]
        public static void Init()
        {
            var window = (ExporterWindow)GetWindow(typeof(ExporterWindow));
            window.Initialize();
        }

        void Initialize()
        {
            titleContent = new GUIContent("Babylon.js");
        }

        void OnGUI()
        {
            if (exportationOptions == null)
            {
                exportationOptions = new ExportationOptions();

                if (File.Exists("Unity3D2Babylon.ini"))
                {
                    var readText = File.ReadAllText("Unity3D2Babylon.ini");
                    var jsReader = new JsonReader();
                    exportationOptions = jsReader.Read<ExportationOptions>(readText);
                }
            }

            GUILayout.Label("Exportation options", EditorStyles.boldLabel);
            exportationOptions.ReflectionDefaultLevel = EditorGUILayout.Slider("Reflection default level", exportationOptions.ReflectionDefaultLevel, 0, 1.0f);

            EditorGUILayout.Space();
            GUILayout.Label("Collisions options", EditorStyles.boldLabel);
            exportationOptions.ExportCollisions = EditorGUILayout.Toggle("Collisions", exportationOptions.ExportCollisions);

            EditorGUILayout.BeginHorizontal(GUILayout.ExpandHeight(false));
            GUILayout.Label("Camera's Ellipsoid");
            exportationOptions.CameraEllipsoid = EditorGUILayout.Vector3Field("", exportationOptions.CameraEllipsoid, GUILayout.ExpandWidth(false));
            EditorGUILayout.EndHorizontal();
            GUILayout.Space(-16);
            EditorGUILayout.BeginHorizontal();
            GUILayout.Label("Gravity");
            exportationOptions.Gravity = EditorGUILayout.Vector3Field("", exportationOptions.Gravity, GUILayout.ExpandWidth(false));
            EditorGUILayout.EndHorizontal();
            GUILayout.Space(-16);
            EditorGUILayout.Space();
            GUILayout.Label("Physics options", EditorStyles.boldLabel);
            exportationOptions.ExportPhysics = EditorGUILayout.Toggle("Physics", exportationOptions.ExportPhysics);

            EditorGUILayout.Space();
            EditorGUILayout.Space();

            if (GUILayout.Button("Export"))
            {
                Export(false);
            }

            if (WebServer.IsSupported)
            {
                if (GUILayout.Button("Export & Run"))
                {
                    Export(true);
                }
            }

            EditorGUILayout.Space();

            scrollPos = EditorGUILayout.BeginScrollView(scrollPos);

            foreach (var log in logs)
            {
                var bold = log.StartsWith("*");

                GUILayout.Label(bold ? log.Remove(0, 1) : log, bold ? (EditorStyles.boldLabel) : EditorStyles.label);
            }
            EditorGUILayout.EndScrollView();

            Repaint();
        }

        public void Export(bool run)
        {
            try
            {
                string sceneName = EditorSceneManager.GetActiveScene().name;

                exportationOptions.DefaultFolder = EditorUtility.SaveFolderPanel("Please select a folder", exportationOptions.DefaultFolder, "");

                if (string.IsNullOrEmpty(exportationOptions.DefaultFolder))
                {
                    return;
                }

                Stopwatch watch = new Stopwatch();

                watch.Start();

                var jsWriter = new JsonWriter();
                File.WriteAllText("Unity3D2Babylon.ini", jsWriter.Write(exportationOptions));
                logs.Clear();

                ReportProgress(0);

                var sceneBuilder = new SceneBuilder(exportationOptions.DefaultFolder, sceneName, exportationOptions);

                sceneBuilder.ConvertFromUnity();

                ReportProgress(1, "Generating output file");
                var outputFile = sceneBuilder.WriteToBabylonFile();

                watch.Stop();
                ReportProgress(1, string.Format("Exportation done in {0:0.00}s", watch.Elapsed.TotalSeconds));
                EditorUtility.ClearProgressBar();

                sceneBuilder.GenerateStatus(logs);

                ShowMessage("Exportation done");

                if (run)
                {
                    WebServer.SceneFolder = Path.GetDirectoryName(outputFile);
                    WebServer.SceneFilename = Path.GetFileName(outputFile);

                    Process.Start("http://localhost:" + WebServer.Port);
                }
            }
            catch (Exception ex)
            {
                EditorUtility.ClearProgressBar();
                ShowMessage("A problem occurred: " + ex.Message + ex.StackTrace, "Error");
            }
        }
    }
}