using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using Autodesk.Max;
using BabylonExport.Entities;
using Newtonsoft.Json;
using Color = System.Drawing.Color;
using System.Runtime.InteropServices;

namespace Max2Babylon
{
    internal partial class BabylonExporter
    {
        public event Action<int> OnImportProgressChanged;
        public event Action<string, int> OnWarning;
        public event Action<string, Color, int, bool> OnMessage;
        public event Action<string, int> OnError;

        public bool AutoSave3dsMaxFile { get; set; }
        public bool ExportHiddenObjects { get; set; }
        public bool IsCancelled { get; set; }

        public bool CopyTexturesToOutput { get; set; }

        public string MaxSceneFileName { get; set; }

        public bool ExportQuaternionsInsteadOfEulers { get; set; }

        void ReportProgressChanged(int progress)
        {
            if (OnImportProgressChanged != null)
            {
                OnImportProgressChanged(progress);
            }
        }

        void RaiseError(string error, int rank = 0)
        {
            if (OnError != null)
            {
                OnError(error, rank);
            }
        }

        void RaiseWarning(string warning, int rank = 0)
        {
            if (OnWarning != null)
            {
                OnWarning(warning, rank);
            }
        }

        void RaiseMessage(string message, int rank = 0, bool emphasis = false)
        {
            RaiseMessage(message, Color.Black, rank, emphasis);
        }

        void RaiseMessage(string message, Color color, int rank = 0, bool emphasis = false)
        {
            if (OnMessage != null)
            {
                OnMessage(message, color, rank, emphasis);
            }
        }

        void CheckCancelled()
        {
            Application.DoEvents();
            if (IsCancelled)
            {
                throw new OperationCanceledException();
            }
        }

        public async Task ExportAsync(string outputFile, bool generateManifest, bool onlySelected, bool generateBinary, Form callerForm)
        {
            var gameConversionManger = Loader.Global.ConversionManager;
            gameConversionManger.CoordSystem = Autodesk.Max.IGameConversionManager.CoordSystem.D3d;

            var gameScene = Loader.Global.IGameInterface;
            gameScene.InitialiseIGame(onlySelected);
            gameScene.SetStaticFrame(0);

            MaxSceneFileName = gameScene.SceneFileName;

            IsCancelled = false;
            RaiseMessage("Exportation started", Color.Blue);
            ReportProgressChanged(0);
            var babylonScene = new BabylonScene(Path.GetDirectoryName(outputFile));
            var rawScene = Loader.Core.RootNode;

            if (!Directory.Exists(babylonScene.OutputPath))
            {
                RaiseError("Exportation stopped: Output folder does not exist");
                ReportProgressChanged(100);
                return;
            }

            var watch = new Stopwatch();
            watch.Start();

            // Save scene
            RaiseMessage("Saving 3ds max file");

            if (AutoSave3dsMaxFile)
            {
                var forceSave = Loader.Core.FileSave;

                if (callerForm != null)
                {
                    callerForm.BringToFront();
                }
            }

            // Global
            babylonScene.autoClear = true;
            babylonScene.clearColor = Loader.Core.GetBackGround(0, Tools.Forever).ToArray();
            babylonScene.ambientColor = Loader.Core.GetAmbient(0, Tools.Forever).ToArray();

            babylonScene.gravity = rawScene.GetVector3Property("babylonjs_gravity");
            ExportQuaternionsInsteadOfEulers = rawScene.GetBoolProperty("babylonjs_exportquaternions", 1);

            // Sounds
            var soundName = rawScene.GetStringProperty("babylonjs_sound_filename", "");

            if (!string.IsNullOrEmpty(soundName))
            {
                var filename = Path.GetFileName(soundName);

                var globalSound = new BabylonSound
                {
                    autoplay = rawScene.GetBoolProperty("babylonjs_sound_autoplay", 1),
                    loop = rawScene.GetBoolProperty("babylonjs_sound_loop", 1),
                    name = filename
                };

                babylonScene.SoundsList.Add(globalSound);

                try
                {
                    File.Copy(soundName, Path.Combine(babylonScene.OutputPath, filename), true);
                }
                catch
                {
                }
            }

            // Cameras
            BabylonCamera mainCamera = null;
            ICameraObject mainCameraNode = null;

            RaiseMessage("Exporting cameras");
            var camerasTab = gameScene.GetIGameNodeByType(Autodesk.Max.IGameObject.ObjectTypes.Camera);
            for (int ix = 0; ix < camerasTab.Count; ++ix)
            {
                var indexer = new IntPtr(ix);
                var cameraNode = camerasTab[indexer];
                Marshal.FreeHGlobal(indexer);
                ExportCamera(gameScene, cameraNode, babylonScene);

                if (mainCamera == null && babylonScene.CamerasList.Count > 0)
                {
                    mainCameraNode = (cameraNode.MaxNode.ObjectRef as ICameraObject);
                    mainCamera = babylonScene.CamerasList[0];
                    babylonScene.activeCameraID = mainCamera.id;
                    RaiseMessage("Active camera set to " + mainCamera.name, Color.Green, 1, true);
                }
            }

            if (mainCamera == null)
            {
                RaiseWarning("No camera defined", 1);
            }
            else
            {
                RaiseMessage(string.Format("Total: {0}", babylonScene.CamerasList.Count), Color.Gray, 1);
            }

            // Fog
            for (var index = 0; index < Loader.Core.NumAtmospheric; index++)
            {
                var atmospheric = Loader.Core.GetAtmospheric(index);

                if (atmospheric.Active(0) && atmospheric.ClassName == "Fog")
                {
                    var fog = atmospheric as IStdFog;

                    RaiseMessage("Exporting fog");

                    if (fog != null)
                    {
                        babylonScene.fogColor = fog.GetColor(0).ToArray();
                        babylonScene.fogMode = 3;
                    }
#if !MAX2015 && !MAX2016
                    else
                    {
                        var paramBlock = atmospheric.GetReference(0) as IIParamBlock;

                        babylonScene.fogColor = Tools.GetParamBlockValueColor(paramBlock, "Fog Color");
                        babylonScene.fogMode = 3;
                    }
#endif
                    if (mainCamera != null)
                    {
                        babylonScene.fogStart = mainCameraNode.GetEnvRange(0, 0, Tools.Forever);
                        babylonScene.fogEnd = mainCameraNode.GetEnvRange(0, 1, Tools.Forever);
                    }
                }
            }

            // Meshes
            ReportProgressChanged(10);
            RaiseMessage("Exporting meshes");
            var meshes = gameScene.GetIGameNodeByType(Autodesk.Max.IGameObject.ObjectTypes.Mesh);
            var progressionStep = 80.0f / meshes.Count;
            var progression = 10.0f;
            for (int ix = 0; ix < meshes.Count; ++ix)
            {
                var indexer = new IntPtr(ix);
                var meshNode = meshes[indexer];
                Marshal.FreeHGlobal(indexer);
                ExportMesh(gameScene, meshNode, babylonScene);


                ReportProgressChanged((int)progression);

                progression += progressionStep;

                CheckCancelled();
            }


            // Materials
            RaiseMessage("Exporting materials");
            var matsToExport = referencedMaterials.ToArray(); // Snapshot because multimaterials can export new materials
            foreach (var mat in matsToExport)
            {
                ExportMaterial(mat, babylonScene);
                CheckCancelled();
            }
            RaiseMessage(string.Format("Total: {0}", babylonScene.MaterialsList.Count + babylonScene.MultiMaterialsList.Count), Color.Gray, 1);

            // Lights
            RaiseMessage("Exporting lights");
            var lightNodes = gameScene.GetIGameNodeByType(Autodesk.Max.IGameObject.ObjectTypes.Light);
            for (var i = 0; i < lightNodes.Count; ++i)
            {
                ExportLight(gameScene, lightNodes[new IntPtr(i)], babylonScene);
                CheckCancelled();
            }


            if (babylonScene.LightsList.Count == 0)
            {
                RaiseWarning("No light defined", 1);
                RaiseWarning("A default hemispheric light was added for your convenience", 1);
                ExportDefaultLight(babylonScene);
            }
            else
            {
                RaiseMessage(string.Format("Total: {0}", babylonScene.LightsList.Count), Color.Gray, 1);
            }

            // Skeletons
            if (skins.Count > 0)
            {
                RaiseMessage("Exporting skeletons");
                foreach (var skin in skins)
                {
                    ExportSkin(skin, babylonScene);
                }
            }

            // Actions
            babylonScene.actions = ExportNodeAction(gameScene.GetIGameNode(rawScene));

            // Output
            RaiseMessage("Saving to output file");
            babylonScene.Prepare(false);
            var jsonSerializer = JsonSerializer.Create(new JsonSerializerSettings());
            var sb = new StringBuilder();
            var sw = new StringWriter(sb, CultureInfo.InvariantCulture);

            await Task.Run(() =>
            {
                using (var jsonWriter = new JsonTextWriterOptimized(sw))
                {
                    jsonWriter.Formatting = Formatting.None;
                    jsonSerializer.Serialize(jsonWriter, babylonScene);
                }
                File.WriteAllText(outputFile, sb.ToString());

                if (generateManifest)
                {
                    File.WriteAllText(outputFile + ".manifest",
                        "{\r\n\"version\" : 1,\r\n\"enableSceneOffline\" : true,\r\n\"enableTexturesOffline\" : true\r\n}");
                }
            });

            // Binary
            if (generateBinary)
            {
                RaiseMessage("Generating binary files");
                BabylonFileConverter.BinaryConverter.Convert(outputFile, Path.GetDirectoryName(outputFile) + "\\Binary",
                    message => RaiseMessage(message, 1),
                    error => RaiseError(error, 1));
            }

            ReportProgressChanged(100);
            watch.Stop();
            RaiseMessage(string.Format("Exportation done in {0:0.00}s", watch.ElapsedMilliseconds / 1000.0), Color.Blue);
        }


    }
}
