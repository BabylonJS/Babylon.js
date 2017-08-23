using BabylonExport.Entities;
using GLTFExport.Entities;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Text;
using Color = System.Drawing.Color;

namespace Max2Babylon
{
    internal partial class BabylonExporter
    {
        public void ExportGltf(BabylonScene babylonScene, string outputFile, bool generateBinary)
        {
            RaiseMessage("GLTFExporter | Export outputFile=" + outputFile + " generateBinary=" + generateBinary);
            RaiseMessage("GLTFExporter | Exportation started", Color.Blue);

            ReportProgressChanged(0);
            var gltf = new GLTF(Path.GetDirectoryName(outputFile));

            // Asset
            gltf.asset = new GLTFAsset
            {
                version = "2.0",
                generator = "Babylon2Gltf2017",
                copyright = "2017 (c) BabylonJS"
                // no minVersion
            };

            // Scene
            gltf.scene = 0;

            // Scenes
            GLTFScene scene = new GLTFScene();
            GLTFScene[] scenes = { scene };
            gltf.scenes = scenes;

            // Materials
            RaiseMessage("GLTFExporter | Exporting materials");
            ReportProgressChanged(10);
            var babylonMaterials = babylonScene.MaterialsList;
            babylonMaterials.ForEach((babylonMaterial) =>
            {
                ExportMaterial(babylonMaterial, gltf);
                CheckCancelled();
            });
            // TODO - Handle multimaterials
            RaiseMessage(string.Format("GLTFExporter | Total: {0}", gltf.MaterialsList.Count /*+ glTF.MultiMaterialsList.Count*/), Color.Gray, 1);

            // Nodes
            List<BabylonNode> babylonNodes = new List<BabylonNode>();
            babylonNodes.AddRange(babylonScene.meshes);
            babylonNodes.AddRange(babylonScene.lights);
            babylonNodes.AddRange(babylonScene.cameras);

            // Root nodes
            RaiseMessage("GLTFExporter | Exporting root nodes");
            List<BabylonNode> babylonRootNodes = babylonNodes.FindAll(node => node.parentId == null);
            var progressionStep = 80.0f / babylonRootNodes.Count;
            var progression = 20.0f;
            ReportProgressChanged((int)progression);
            babylonRootNodes.ForEach(babylonNode =>
            {
                exportNodeRec(babylonNode, gltf, babylonScene);
                progression += progressionStep;
                ReportProgressChanged((int)progression);
                CheckCancelled();
            });

            // Output
            RaiseMessage("GLTFExporter | Saving to output file");
            // Cast lists to arrays
            gltf.Prepare();
            var jsonSerializer = JsonSerializer.Create(new JsonSerializerSettings()); // Standard serializer, not the optimized one
            var sb = new StringBuilder();
            var sw = new StringWriter(sb, CultureInfo.InvariantCulture);

            using (var jsonWriter = new JsonTextWriter(sw))
            {
                jsonWriter.Formatting = Formatting.None;
                jsonSerializer.Serialize(jsonWriter, gltf);
            }
            string outputGltfFile = Path.ChangeExtension(outputFile, "gltf");
            File.WriteAllText(outputGltfFile, sb.ToString());

            // Binary
            if (generateBinary)
            {
                // TODO - Export glTF data to binary format .glb
                RaiseError("GLTFExporter | TODO - Generating binary files");
            }

            ReportProgressChanged(100);
        }

        private void exportNodeRec(BabylonNode babylonNode, GLTF gltf, BabylonScene babylonScene, GLTFNode gltfParentNode = null)
        {
            GLTFNode gltfNode = null; 
            if (babylonNode.GetType() == typeof(BabylonMesh))
            {
                GLTFMesh gltfMesh = ExportMesh(babylonNode as BabylonMesh, gltf, gltfParentNode);
                if (gltfMesh != null)
                {
                    gltfNode = gltfMesh.gltfNode;
                }
            }
            else if (babylonNode.GetType() == typeof(BabylonCamera))
            {
                // TODO - Export camera nodes
                RaiseError($"TODO - Export camera node named {babylonNode.name}", 1);
            }
            else if (babylonNode.GetType() == typeof(BabylonLight))
            {
                // TODO - Export light nodes as empty nodes (no lights in glTF 2.0 core)
                RaiseError($"TODO - Export light node named {babylonNode.name}", 1);
                RaiseWarning($"GLTFExporter.Node | Light named {babylonNode.name} has children but lights are not exported with glTF 2.0 core version. An empty node is used instead.", 1);
            }
            else
            {
                RaiseError($"Node named {babylonNode.name} as no exporter", 1);
            }

            CheckCancelled();

            // If parent is exported successfully...
            if (gltfNode != null)
            {
                // ...export its children
                List<BabylonNode> babylonDescendants = getDescendants(babylonNode, babylonScene);
                babylonDescendants.ForEach(descendant => exportNodeRec(descendant, gltf, babylonScene, gltfNode));
            }
        }

        private List<BabylonNode> getDescendants(BabylonNode babylonNode, BabylonScene babylonScene)
        {
            List<BabylonNode> babylonNodes = new List<BabylonNode>();
            babylonNodes.AddRange(babylonScene.meshes);
            babylonNodes.AddRange(babylonScene.lights);
            babylonNodes.AddRange(babylonScene.cameras);

            return babylonNodes.FindAll(node => node.parentId == babylonNode.id);
        }
    }
}
