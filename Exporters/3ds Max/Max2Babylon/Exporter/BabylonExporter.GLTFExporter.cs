using BabylonExport.Entities;
using GLTFExport.Entities;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Text;
using Color = System.Drawing.Color;

namespace Max2Babylon
{
    internal partial class BabylonExporter
    {
        List<BabylonMaterial> babylonMaterialsToExport;

        private List<BabylonNode> babylonNodes;

        public void ExportGltf(BabylonScene babylonScene, string outputFile, bool generateBinary, bool exportGltfImagesAsBinary)
        {
            RaiseMessage("GLTFExporter | Export outputFile=" + outputFile + " generateBinary=" + generateBinary);
            RaiseMessage("GLTFExporter | Exportation started", Color.Blue);

            float progressionStep;
            var progression = 0.0f;
            ReportProgressChanged((int)progression);

            // Initialization
            initBabylonNodes(babylonScene);
            babylonMaterialsToExport = new List<BabylonMaterial>();

            var gltf = new GLTF(outputFile);

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

            // Meshes
            RaiseMessage("GLTFExporter | Exporting meshes");
            progression = 10.0f;
            ReportProgressChanged((int)progression);
            progressionStep = 40.0f / babylonScene.meshes.Length;
            foreach (var babylonMesh in babylonScene.meshes)
            {
                ExportMesh(babylonMesh, gltf, babylonScene);
                progression += progressionStep;
                ReportProgressChanged((int)progression);
                CheckCancelled();
            }

            // Root nodes
            RaiseMessage("GLTFExporter | Exporting nodes");
            List<BabylonNode> babylonRootNodes = babylonNodes.FindAll(node => node.parentId == null);
            progressionStep = 40.0f / babylonRootNodes.Count;
            babylonRootNodes.ForEach(babylonNode =>
            {
                exportNodeRec(babylonNode, gltf, babylonScene);
                progression += progressionStep;
                ReportProgressChanged((int)progression);
                CheckCancelled();
            });

            // TODO - Choose between this method and the reverse of X axis
            // Switch from left to right handed coordinate system
            RaiseMessage("GLTFExporter | Exporting root node");
            var tmpNodesList = new List<int>(scene.NodesList);
            var rootNode = new BabylonMesh
            {
                name = "root",
                rotation = new float[] { 0, (float)Math.PI, 0 },
                scaling = new float[] { 1, 1, -1 },
                idGroupInstance = -1
            };
            scene.NodesList.Clear();
            GLTFNode gltfRootNode = ExportAbstractMesh(rootNode, gltf, null);
            gltfRootNode.ChildrenList.AddRange(tmpNodesList);

            // Materials
            RaiseMessage("GLTFExporter | Exporting materials");
            foreach (var babylonMaterial in babylonMaterialsToExport)
            {
                ExportMaterial(babylonMaterial, gltf);
                CheckCancelled();
            };
            RaiseMessage(string.Format("GLTFExporter | Nb materials exported: {0}", gltf.MaterialsList.Count), Color.Gray, 1);
            
            if (exportGltfImagesAsBinary)
            {
                SwitchImagesFromUriToBinary(gltf);
            }

            // Cast lists to arrays
            gltf.Prepare();

            // Output
            RaiseMessage("GLTFExporter | Saving to output file");
            
            string outputGltfFile = Path.ChangeExtension(outputFile, "gltf");
            File.WriteAllText(outputGltfFile, gltfToJson(gltf));

            // Write data to binary file
            string outputBinaryFile = Path.ChangeExtension(outputFile, "bin");
            using (BinaryWriter writer = new BinaryWriter(File.Open(outputBinaryFile, FileMode.Create)))
            {
                gltf.BuffersList.ForEach(buffer =>
                {
                    buffer.bytesList = new List<byte>();
                    gltf.BufferViewsList.FindAll(bufferView => bufferView.buffer == buffer.index).ForEach(bufferView =>
                    {
                        bufferView.bytesList.ForEach(b => writer.Write(b));
                        buffer.bytesList.AddRange(bufferView.bytesList);
                    });
                });
            }

            // Binary
            if (generateBinary)
            {
                // Export glTF data to binary format .glb
                RaiseMessage("GLTFExporter | Generating .glb file");

                // Header
                UInt32 magic = 0x46546C67; // ASCII code for glTF
                UInt32 version = 2;
                UInt32 length = 12; // Header length

                // --- JSON chunk ---
                UInt32 chunkTypeJson = 0x4E4F534A; // ASCII code for JSON
                // Remove buffers uri
                foreach (GLTFBuffer gltfBuffer in gltf.BuffersList)
                {
                    gltfBuffer.uri = null;
                }
                // Switch images to binary if not already done
                // TODO - make it optional
                if (!exportGltfImagesAsBinary)
                {
                    var imageBufferViews = SwitchImagesFromUriToBinary(gltf);
                    imageBufferViews.ForEach(imageBufferView =>
                    {
                        imageBufferView.Buffer.bytesList.AddRange(imageBufferView.bytesList);
                    });
                }
                gltf.Prepare();
                // Serialize gltf data to JSON string then convert it to bytes
                byte[] chunkDataJson = Encoding.ASCII.GetBytes(gltfToJson(gltf));
                // JSON chunk must be padded with trailing Space chars (0x20) to satisfy alignment requirements 
                var nbSpaceToAdd = chunkDataJson.Length % 4 == 0 ? 0 : (4 - chunkDataJson.Length % 4);
                var chunkDataJsonList = new List<byte>(chunkDataJson);
                for (int i = 0; i < nbSpaceToAdd; i++)
                {
                    chunkDataJsonList.Add(0x20);
                }
                chunkDataJson = chunkDataJsonList.ToArray();
                UInt32 chunkLengthJson = (UInt32)chunkDataJson.Length;
                length += chunkLengthJson + 8; // 8 = JSON chunk header length
                
                // bin chunk
                UInt32 chunkTypeBin = 0x004E4942; // ASCII code for BIN
                UInt32 chunkLengthBin = 0;
                if (gltf.BuffersList.Count > 0)
                {
                    foreach (GLTFBuffer gltfBuffer in gltf.BuffersList)
                    {
                        chunkLengthBin += (uint)gltfBuffer.byteLength;
                    }
                    length += chunkLengthBin + 8; // 8 = bin chunk header length
                }
                

                // Write binary file
                string outputGlbFile = Path.ChangeExtension(outputFile, "glb");
                using (BinaryWriter writer = new BinaryWriter(File.Open(outputGlbFile, FileMode.Create)))
                {
                    // Header
                    writer.Write(magic);
                    writer.Write(version);
                    writer.Write(length);
                    
                    // JSON chunk
                    writer.Write(chunkLengthJson);
                    writer.Write(chunkTypeJson);
                    writer.Write(chunkDataJson);

                    // bin chunk
                    if (gltf.BuffersList.Count > 0)
                    {
                        writer.Write(chunkLengthBin);
                        writer.Write(chunkTypeBin);
                        gltf.BuffersList[0].bytesList.ForEach(b => writer.Write(b));
                    }
                };
            }

            ReportProgressChanged(100);
        }

        private List<BabylonNode> initBabylonNodes(BabylonScene babylonScene)
        {
            babylonNodes = new List<BabylonNode>();
            if (babylonScene.meshes != null)
            {
                int idGroupInstance = 0;
                foreach (var babylonMesh in babylonScene.meshes)
                {
                    var babylonAbstractMeshes = new List<BabylonAbstractMesh>();
                    babylonAbstractMeshes.Add(babylonMesh);
                    if (babylonMesh.instances != null)
                    {
                        babylonAbstractMeshes.AddRange(babylonMesh.instances);
                    }

                    // Add mesh and instances to node list
                    babylonNodes.AddRange(babylonAbstractMeshes);

                    // Tag mesh and instances with an identifier
                    babylonAbstractMeshes.ForEach(babylonAbstractMesh => babylonAbstractMesh.idGroupInstance = idGroupInstance);

                    idGroupInstance++;
                }
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

        private void exportNodeRec(BabylonNode babylonNode, GLTF gltf, BabylonScene babylonScene, GLTFNode gltfParentNode = null)
        {
            GLTFNode gltfNode = null;
            var type = babylonNode.GetType();
            if (type == typeof(BabylonAbstractMesh) ||
                type.IsSubclassOf(typeof(BabylonAbstractMesh)))
            {
                gltfNode = ExportAbstractMesh(babylonNode as BabylonAbstractMesh, gltf, gltfParentNode);
            }
            else if (type == typeof(BabylonCamera))
            {
                GLTFCamera gltfCamera = ExportCamera(babylonNode as BabylonCamera, gltf, gltfParentNode);
                gltfNode = gltfCamera.gltfNode;
            }
            else if (type == typeof(BabylonLight))
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

            // If node is exported successfully...
            if (gltfNode != null)
            {
                // ...export its children
                List<BabylonNode> babylonDescendants = getDescendants(babylonNode, babylonScene);
                babylonDescendants.ForEach(descendant => exportNodeRec(descendant, gltf, babylonScene, gltfNode));
            }
        }

        private List<BabylonNode> getDescendants(BabylonNode babylonNode, BabylonScene babylonScene)
        {
            return babylonNodes.FindAll(node => node.parentId == babylonNode.id);
        }

        /// <summary>
        /// Return true if node descendant hierarchy has any Mesh or Camera to export
        /// </summary>
        private bool isNodeRelevantToExport(BabylonNode babylonNode, BabylonScene babylonScene)
        {
            var type = babylonNode.GetType();
            if (type == typeof(BabylonAbstractMesh) ||
                type.IsSubclassOf(typeof(BabylonAbstractMesh)) ||
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

        private string gltfToJson(GLTF gltf)
        {
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
            return sb.ToString();
        }

        private List<GLTFBufferView> SwitchImagesFromUriToBinary(GLTF gltf)
        {
            var imageBufferViews = new List<GLTFBufferView>();

            foreach (GLTFImage gltfImage in gltf.ImagesList)
            {
                var path = Path.Combine(gltf.OutputFolder, gltfImage.uri);
                using (Image image = Image.FromFile(path))
                {
                    using (MemoryStream m = new MemoryStream())
                    {
                        var imageFormat = gltfImage.FileExtension == "jpeg" ? System.Drawing.Imaging.ImageFormat.Jpeg : System.Drawing.Imaging.ImageFormat.Png;
                        image.Save(m, imageFormat);
                        byte[] imageBytes = m.ToArray();

                        // JSON chunk must be padded with trailing Space chars (0x20) to satisfy alignment requirements 
                        var nbSpaceToAdd = imageBytes.Length % 4 == 0 ? 0 : (4 - imageBytes.Length % 4);
                        var imageBytesList = new List<byte>(imageBytes);
                        for (int i = 0; i < nbSpaceToAdd; i++)
                        {
                            imageBytesList.Add(0x00);
                        }
                        imageBytes = imageBytesList.ToArray();

                        // BufferView - Image
                        var buffer = gltf.buffer;
                        var bufferViewImage = new GLTFBufferView
                        {
                            name = "bufferViewImage",
                            buffer = buffer.index,
                            Buffer = buffer,
                            byteOffset = buffer.byteLength
                        };
                        bufferViewImage.index = gltf.BufferViewsList.Count;
                        gltf.BufferViewsList.Add(bufferViewImage);
                        imageBufferViews.Add(bufferViewImage);


                        gltfImage.uri = null;
                        gltfImage.bufferView = bufferViewImage.index;
                        gltfImage.mimeType = "image/" + gltfImage.FileExtension;

                        bufferViewImage.bytesList.AddRange(imageBytes);
                        bufferViewImage.byteLength += imageBytes.Length;
                        bufferViewImage.Buffer.byteLength += imageBytes.Length;
                    }
                }
            }
            return imageBufferViews;
        }
    }
}
