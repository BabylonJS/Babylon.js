using BabylonExport.Entities;
using GLTFExport.Entities;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Text;
using Color = System.Drawing.Color;

namespace Max2Babylon
{
    internal partial class BabylonExporter
    {
        List<BabylonMaterial> babylonMaterialsToExport;
        GLTFNode gltfRootNode;

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

            // Nodes
            List<BabylonNode> babylonNodes = getNodes(babylonScene);

            // Root nodes
            RaiseMessage("GLTFExporter | Exporting nodes");
            List<BabylonNode> babylonRootNodes = babylonNodes.FindAll(node => node.parentId == null);
            var progressionStep = 80.0f / babylonRootNodes.Count;
            var progression = 10.0f;
            ReportProgressChanged((int)progression);
            babylonMaterialsToExport = new List<BabylonMaterial>();
            babylonRootNodes.ForEach(babylonNode =>
            {
                exportNodeRec(babylonNode, gltf, babylonScene);
                progression += progressionStep;
                ReportProgressChanged((int)progression);
                CheckCancelled();
            });

            // TODO - Choose between this method and the reverse of X axis
            // Switch from left to right handed coordinate system
            var tmpNodesList = new List<int>(scene.NodesList);
            var rootNode = new BabylonMesh
            {
                name = "root",
                rotation = new float[] { 0, (float)Math.PI, 0 },
                scaling = new float[] { 1, 1, -1 }
            };
            scene.NodesList.Clear();
            gltfRootNode = ExportMesh(rootNode as BabylonMesh, gltf, null, babylonScene);
            gltfRootNode.ChildrenList.AddRange(tmpNodesList);

            // Materials
            RaiseMessage("GLTFExporter | Exporting materials");
            foreach (var babylonMaterial in babylonMaterialsToExport)
            {
                ExportMaterial(babylonMaterial, gltf);
                CheckCancelled();
            };
            RaiseMessage(string.Format("GLTFExporter | Nb materials exported: {0}", gltf.MaterialsList.Count), Color.Gray, 1);

            // Output
            RaiseMessage("GLTFExporter | Saving to output file");
            // Cast lists to arrays
            gltf.Prepare();
            var jsonSerializer = JsonSerializer.Create(new JsonSerializerSettings());
            var sb = new StringBuilder();
            var sw = new StringWriter(sb, CultureInfo.InvariantCulture);

            // Do not use the optimized writer because it's not necessary to truncate values
            // Use the bounded writer in case some values are infinity ()
            using (var jsonWriter = new JsonTextWriterBounded(sw))
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
                gltfNode = ExportMesh(babylonNode as BabylonMesh, gltf, gltfParentNode, babylonScene);
            }
            else if (babylonNode.GetType() == typeof(BabylonCamera))
            {
                GLTFCamera gltfCamera = ExportCamera(babylonNode as BabylonCamera, gltf, gltfParentNode);
                gltfNode = gltfCamera.gltfNode;
            }
            else if (babylonNode.GetType() == typeof(BabylonLight))
            {
                if (isNodeRelevantToExport(babylonNode, babylonScene))
                {
                    // Export light nodes as empty nodes (no lights in glTF 2.0 core)
                    RaiseWarning($"GLTFExporter | Light named {babylonNode.name} has children but lights are not exported with glTF 2.0 core version. An empty node is used instead.", 1);
                    gltfNode = ExportLight(babylonNode as BabylonLight, gltf, gltfParentNode);
                }
                else
                {
                    RaiseMessage($"GLTFExporter | Light named {babylonNode.name} is not relevant to export", 1);
                }
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

        private List<BabylonNode> getNodes(BabylonScene babylonScene)
        {
            List<BabylonNode> babylonNodes = new List<BabylonNode>();
            if (babylonScene.meshes != null)
            {
                babylonNodes.AddRange(babylonScene.meshes);
            }
            if (babylonScene.lights != null)
            {
                babylonNodes.AddRange(babylonScene.lights);
            }
            if (babylonScene.cameras != null)
            {
                babylonNodes.AddRange(babylonScene.cameras);
            }
            return babylonNodes;
        }

        private List<BabylonNode> getDescendants(BabylonNode babylonNode, BabylonScene babylonScene)
        {
            List<BabylonNode> babylonNodes = getNodes(babylonScene);
            return babylonNodes.FindAll(node => node.parentId == babylonNode.id);
        }

        /// <summary>
        /// Return true if node descendant hierarchy has any Mesh or Camera to export
        /// </summary>
        private bool isNodeRelevantToExport(BabylonNode babylonNode, BabylonScene babylonScene)
        {
            var type = babylonNode.GetType();
            if (type == typeof(BabylonMesh) ||
                type == typeof(BabylonCamera))
            {
                return true;
            }

            // Descandant recursivity
            List<BabylonNode> babylonDescendants = getDescendants(babylonNode, babylonScene);
            int indexDescendant = 0;
            while (indexDescendant < babylonDescendants.Count) // while instead of for to stop as soon as a relevant node has been found
            {
                if (isNodeRelevantToExport(babylonDescendants[indexDescendant], babylonScene))
                {
                    return true;
                }
                indexDescendant++;
            }

            // No relevant node found in hierarchy
            return false;
        }
    }
}
