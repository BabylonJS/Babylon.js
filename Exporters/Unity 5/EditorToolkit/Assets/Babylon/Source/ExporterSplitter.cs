using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using UnityEditor;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Unity3D2Babylon
{
    public class ExporterSpliter : EditorWindow
    {
        Cubemap splitCube;

        [MenuItem("BabylonJS/Cubemap Splitter", false, 101)]
        public static void InitSpliter()
        {
            ExporterSpliter splitter = ScriptableObject.CreateInstance<ExporterSpliter>();
            splitter.OnInitialize();
            splitter.ShowUtility();
        }

        public void OnInitialize()
        {
            maxSize = new Vector2(512, 155);
            minSize = this.maxSize;
        }

        void OnEnable()
        {
            titleContent = new GUIContent("Cubemap Splitter");
        }

        public void OnGUI()
        {
            GUILayout.Label("Choose the Cubemap you want to split into 6 images", EditorStyles.boldLabel);
            EditorGUILayout.Space();
            splitCube = EditorGUILayout.ObjectField("Cubemap:", splitCube, typeof(Cubemap), false) as Cubemap;
            EditorGUILayout.Space();
            EditorGUILayout.Space();
            if (GUILayout.Button("Split Cubemap"))
            {
                if (splitCube)
                {
                    Split();
                }
                if (!splitCube)
                {
                    ExporterWindow.ShowMessage("You must select a cubemap");
                }
            }
        }

        public void Split()
        {
            ExporterWindow.ReportProgress(1, "Splitting cubemap textures... This may take a while.");
            var filePath = AssetDatabase.GetAssetPath(splitCube);
            int splitSize = splitCube.width;
            Color[] CubeMapColors;

            var faceTexturePath = Path.Combine(Path.GetDirectoryName(filePath), Path.GetFileNameWithoutExtension(filePath));
            bool png = (ExporterWindow.exportationOptions.DefaultImageFormat == (int)BabylonImageFormat.PNG);
            string fext = (png == true) ? ".png" : ".jpg";
            string filename = "";
            string preview = "";

            var importTool = new BabylonTextureImporter(filePath);
            bool isReadable = importTool.IsReadable();
            if (!isReadable)
            {
                importTool.SetReadable();
            }
            try
            {
                filename = (faceTexturePath + "_py" + fext);
                preview = Path.GetFileName(filename);
                ExporterWindow.ReportProgress(1, "Splitting texture face " + preview + " ... This may take a while.");
                Texture2D tex = new Texture2D(splitSize, splitSize, TextureFormat.RGB24, false);
                CubeMapColors = splitCube.GetPixels(CubemapFace.PositiveY);
                tex.SetPixels(CubeMapColors, 0);
                tex.Apply();
                WriteTextureFile(filename, tex, png);

                filename = (faceTexturePath + "_ny" + fext);
                preview = Path.GetFileName(filename);
                ExporterWindow.ReportProgress(1, "Splitting texture face " + preview + " ... This may take a while.");
                CubeMapColors = splitCube.GetPixels(CubemapFace.NegativeY);
                tex.SetPixels(CubeMapColors, 0);
                tex.Apply();
                WriteTextureFile(filename, tex, png);

                filename = (faceTexturePath + "_px" + fext);
                preview = Path.GetFileName(filename);
                ExporterWindow.ReportProgress(1, "Splitting texture face " + preview + " ... This may take a while.");
                CubeMapColors = splitCube.GetPixels(CubemapFace.PositiveX);
                tex.SetPixels(CubeMapColors, 0);
                tex.Apply();
                WriteTextureFile(filename, tex, png);

                filename = (faceTexturePath + "_nx" + fext);
                preview = Path.GetFileName(filename);
                ExporterWindow.ReportProgress(1, "Splitting texture face " + preview + " ... This may take a while.");
                CubeMapColors = splitCube.GetPixels(CubemapFace.NegativeX);
                tex.SetPixels(CubeMapColors, 0);
                tex.Apply();
                WriteTextureFile(filename, tex, png);

                filename = (faceTexturePath + "_pz" + fext);
                preview = Path.GetFileName(filename);
                ExporterWindow.ReportProgress(1, "Splitting texture face " + preview + " ... This may take a while.");
                CubeMapColors = splitCube.GetPixels(CubemapFace.PositiveZ);
                tex.SetPixels(CubeMapColors, 0);
                tex.Apply();
                WriteTextureFile(filename, tex, png);

                filename = (faceTexturePath + "_nz" + fext);
                preview = Path.GetFileName(filename);
                ExporterWindow.ReportProgress(1, "Splitting texture face " + preview + " ... This may take a while.");
                CubeMapColors = splitCube.GetPixels(CubemapFace.NegativeZ);
                tex.SetPixels(CubeMapColors, 0);
                tex.Apply();
                WriteTextureFile(filename, tex, png);

            }
            catch (Exception ex)
            {
                UnityEngine.Debug.LogException(ex);
            }
            finally
            {
                if (!isReadable)
                {
                    ExporterWindow.ReportProgress(1, "Finalizing assets database...");
                    importTool.ForceUpdate();
                }
            }
            ExporterWindow.ReportProgress(1, "Refresing assets database...");
            AssetDatabase.Refresh();

            ExporterWindow.ReportProgress(1, "Cubemap split complete.");
            EditorUtility.ClearProgressBar();
            this.Close();
        }

        private void WriteTextureFile(string filename, Texture2D texture, bool png)
        {
            if (png)
            {
                File.WriteAllBytes(filename, texture.EncodeToPNG());
            }
            else
            {
                File.WriteAllBytes(filename, texture.EncodeToJPG(ExporterWindow.exportationOptions.DefaultQualityLevel));
            }
        }

        public void OnInspectorUpdate()
        {
            this.Repaint();
        }
    }
}