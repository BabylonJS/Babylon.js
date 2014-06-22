using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using Autodesk.Max;
using BabylonExport.Entities;
using MaxSharp;
using Newtonsoft.Json;
using Animatable = MaxSharp.Animatable;
using Color = System.Drawing.Color;

namespace Max2Babylon
{
    internal partial class BabylonExporter
    {
        public event Action<int> OnImportProgressChanged;
        public event Action<string, int> OnWarning;
        public event Action<string, Color, int, bool> OnMessage;
        public event Action<string, int> OnError;

        readonly List<string> alreadyExportedTextures = new List<string>();

        public bool ExportHiddenObjects { get; set; }
        public bool IsCancelled { get; set; }

        public bool CopyTexturesToOutput { get; set; }

        private bool exportQuaternionsInsteadOfEulers;

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

        public void Export(string outputFile, bool generateManifest, Form callerForm)
        {
            IsCancelled = false;
            RaiseMessage("Exportation started");
            ReportProgressChanged(0);
            var babylonScene = new BabylonScene(Path.GetDirectoryName(outputFile));
            var maxScene = Kernel.Scene;
            alreadyExportedTextures.Clear();

            if (!Directory.Exists(babylonScene.OutputPath))
            {
                RaiseError("Exportation stopped: Output folder does not exist");
                ReportProgressChanged(100);
                return;
            }

            // Save scene
            RaiseMessage("Saving 3ds max file");
            var forceSave = Loader.Core.FileSave;

            if (callerForm != null)
            {
                callerForm.BringToFront();
            }

            // Global
            babylonScene.autoClear = true;
            babylonScene.clearColor = Loader.Core.GetBackGround(0, Interval.Forever._IInterval).ToArray();
            babylonScene.ambientColor = Loader.Core.GetAmbient(0, Interval.Forever._IInterval).ToArray();

            babylonScene.gravity = maxScene.RootNode._Node.GetVector3Property("babylonjs_gravity");
            exportQuaternionsInsteadOfEulers = maxScene.RootNode._Node.GetBoolProperty("babylonjs_exportquaternions");

            // Cameras
            BabylonCamera mainCamera = null;

            RaiseMessage("Exporting cameras");
            foreach (var cameraNode in maxScene.NodesListBySuperClass(SuperClassID.Camera))
            {
                ExportCamera(cameraNode, babylonScene);

                if (mainCamera == null && babylonScene.CamerasList.Count > 0)
                {
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
                    RaiseMessage("Exporting fog");
                    var reference = atmospheric.GetReference(0);
                    var parameters = Animatable.CreateWrapper<ParameterBlock1>(reference);

                    babylonScene.fogColor = (parameters["fog color"].Value as IColor).ToArray();
                    babylonScene.fogDensity = (float)parameters["density"].Value;
                    babylonScene.fogMode = ((int)parameters["fog type"].Value) == 0 ? 3 : 1;

                    if (mainCamera != null)
                    {
                        babylonScene.fogStart = mainCamera.minZ * (float)parameters["near %"].Value;
                        babylonScene.fogEnd = mainCamera.maxZ * (float)parameters["far %"].Value;
                    }
                }
            }

            // Meshes
            ReportProgressChanged(10);
            RaiseMessage("Exporting meshes");
            var meshes = maxScene.NodesListBySuperClasses(new[] {SuperClassID.GeometricObject, SuperClassID.Helper});
            var progressionStep = 80.0f / meshes.Count();
            var progression = 10.0f;
            foreach (var meshNode in meshes)
            {
                Tools.PreparePipeline(meshNode._Node, true);
                ExportMesh(meshNode, babylonScene);
                Tools.PreparePipeline(meshNode._Node, false);

                progression += progressionStep;
                ReportProgressChanged((int)progression);

                CheckCancelled();
            }
            RaiseMessage(string.Format("Total: {0}", babylonScene.MeshesList.Count), Color.Gray, 1);

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
            foreach (var lightNode in maxScene.NodesListBySuperClass(SuperClassID.Light))
            {
                ExportLight(lightNode, babylonScene);
                CheckCancelled();
            }

            if (babylonScene.LightsList.Count == 0)
            {
                RaiseWarning("No light defined", 1);
            }
            else
            {
                RaiseMessage(string.Format("Total: {0}", babylonScene.LightsList.Count), Color.Gray, 1);
            }

            // Skeletons
            RaiseMessage("Exporting skeletons");
            foreach (var skin in skins)
            {
                ExportSkin(skin, babylonScene);
                skin.Dispose();
            }

            // Output
            babylonScene.Prepare(false);
            var jsonSerializer = JsonSerializer.Create();
            var sb = new StringBuilder();
            var sw = new StringWriter(sb, CultureInfo.InvariantCulture);
            using (var jsonWriter = new JsonTextWriterOptimized(sw))
            {
                jsonWriter.Formatting = Formatting.None;
                jsonSerializer.Serialize(jsonWriter, babylonScene);
            }
            File.WriteAllText(outputFile, sb.ToString());

            if (generateManifest)
            {
                File.WriteAllText(outputFile + ".manifest", "{\r\n\"version\" : 1,\r\n\"enableSceneOffline\" : true,\r\n\"enableTexturesOffline\" : true\r\n}");
            }

            ReportProgressChanged(100);

            RaiseMessage("Exportation done");
        }
    }
}
