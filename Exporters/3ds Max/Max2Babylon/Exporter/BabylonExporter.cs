using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
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
        public event Action<string, bool> OnWarning;
        public event Action<string, bool, bool, bool, Color> OnMessage;
        public event Action<string, bool> OnError;

        readonly List<string> alreadyExportedTextures = new List<string>();

        void ReportProgressChanged(int progress)
        {
            if (OnImportProgressChanged != null)
            {
                OnImportProgressChanged(progress);
            }
        }

        void RaiseError(string error, bool asChild = true)
        {
            if (OnError != null)
            {
                OnError(error, asChild);
            }
        }

        void RaiseWarning(string warning, bool asChild = false)
        {
            if (OnWarning != null)
            {
                OnWarning(warning, asChild);
            }
        }

        void RaiseMessage(string message, bool asChild = false, bool emphasis = false, bool embed = false)
        {
            RaiseMessage(message, Color.Black, asChild, emphasis, embed);
        }

        void RaiseMessage(string message, Color color, bool asChild = false, bool emphasis = false, bool embed = false)
        {
            if (OnMessage != null)
            {
                OnMessage(message, asChild, emphasis, embed, color);
            }
        }

        public void Export(string outputFile, CancellationToken token)
        {
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

            // Global
            babylonScene.autoClear = true;
            babylonScene.clearColor = Loader.Core.GetBackGround(0, Interval.Forever._IInterval).ToArray();
            babylonScene.ambientColor = Loader.Core.GetAmbient(0, Interval.Forever._IInterval).ToArray();

            babylonScene.gravity = maxScene.RootNode._Node.GetVector3Property("babylonjs_gravity");

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
                    RaiseMessage("Active camera set to " + mainCamera.name, true, true);
                }
            }

            if (mainCamera == null)
            {
                RaiseWarning("No camera defined", true);
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
                ExportMesh(meshNode, babylonScene, token);
                Tools.PreparePipeline(meshNode._Node, false);

                progression += progressionStep;
                ReportProgressChanged((int)progression);

                if (token.IsCancellationRequested) token.ThrowIfCancellationRequested();
            }

            // Materials
            RaiseMessage("Exporting materials");
            var matsToExport = referencedMaterials.ToArray(); // Snapshot because multimaterials can export new materials
            foreach (var mat in matsToExport)
            {
                ExportMaterial(mat, babylonScene);
                if (token.IsCancellationRequested) token.ThrowIfCancellationRequested();
            }

            // Lights
            RaiseMessage("Exporting lights");
            foreach (var lightNode in maxScene.NodesListBySuperClass(SuperClassID.Light))
            {
                ExportLight(lightNode, babylonScene);
                if (token.IsCancellationRequested) token.ThrowIfCancellationRequested();
            }

            if (babylonScene.LightsList.Count == 0)
            {
                RaiseWarning("No light defined", true);
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

            ReportProgressChanged(100);

            RaiseMessage("Exportation done");
        }
    }
}
