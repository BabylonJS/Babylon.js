using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Runtime.InteropServices;
using System.Runtime.Serialization.Json;
using System.Text;
using Autodesk.Max;
using BabylonExport.Entities;
using MaxSharp;
using Newtonsoft.Json;
using Animatable = MaxSharp.Animatable;

namespace Max2Babylon
{
    internal partial class BabylonExporter
    {
        public event Action<int> OnImportProgressChanged;
        public event Action<string, bool> OnWarning;
        public event Action<string, bool, bool, bool> OnMessage;
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
            if (OnMessage != null)
            {
                OnMessage(message, asChild, emphasis, embed);
            }
        }

        public void Export(string outputFile)
        {
            RaiseMessage("Exportation started");
            ReportProgressChanged(25);
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
                var babylonCamera = ExportCamera(cameraNode, babylonScene);

                if (mainCamera == null)
                {
                    mainCamera = babylonCamera;
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
            RaiseMessage("Exporting meshes");
            foreach (var meshNode in maxScene.NodesListBySuperClass(SuperClassID.GeometricObject))
            {
                ExportMesh(meshNode, babylonScene);
            }

            // Materials
            RaiseMessage("Exporting materials");
            var matsToExport = referencedMaterials.ToArray(); // Snapshot because multimaterials can export new materials
            foreach (var mat in matsToExport)
            {
                ExportMaterial(mat, babylonScene);
            }

            // Lights
            RaiseMessage("Exporting lights");
            foreach (var lightNode in maxScene.NodesListBySuperClass(SuperClassID.Light))
            {
                ExportLight(lightNode, babylonScene);
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
