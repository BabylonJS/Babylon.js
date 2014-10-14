using System;
using System.IO;
using System.Linq;
using System.Web;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Collections.Generic;
using System.Net;

namespace ConvertToBinary
{
    public enum DataType { Int32, Float };

    class Program
    {
        static void Main(string[] args)
        {
            if (args.Length < 1)
            {
                DisplayUsage();
                return;
            }

            // Parsing arguments
            string srcFilename = "";
            string dstPath = "";

            foreach (var arg in args)
            {
                var order = arg.Substring(0, 3);

                switch (order)
                {
                    case "/i:":
                        srcFilename = arg.Substring(3);
                        break;
                    case "/o:":
                        dstPath = arg.Substring(3);
                        break;
                    default:
                        DisplayUsage();
                        return;
                }
            }

            if (string.IsNullOrEmpty(srcFilename) || string.IsNullOrEmpty(dstPath))
            {
                DisplayUsage();
                return;
            }

            ProcessSourceFile(srcFilename, dstPath);
        }

        static void ProcessSourceFile(string srcFilename, string dstPath)
        {
            try
            {
                if (!Directory.Exists(dstPath))
                    Directory.CreateDirectory(dstPath);

                string srcPath = Path.GetDirectoryName(srcFilename);
                string dstFilename = Path.Combine(dstPath, Path.GetFileNameWithoutExtension(srcFilename) + ".binary.babylon");

                dynamic scene;

                // Loading
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("Loading " + srcFilename);
                Console.WriteLine();
                Console.ResetColor();

                using (var streamReader = new StreamReader(srcFilename))
                {
                    using (var reader = new JsonTextReader(streamReader))
                    {
                        scene = JObject.Load(reader);
                    }
                }

                // Marking scene
                string objName = scene.name;

                if(string.IsNullOrEmpty(objName))
                    objName = Path.GetFileNameWithoutExtension(srcFilename);

                int atDot = objName.IndexOf(".incremental");
                if(atDot > 0)
                    objName = objName.Substring(0, atDot);

                scene["autoClear"] = true;
                scene["useDelayedTextureLoading"] = true;

                var doNotDelayLoadingForGeometries = new List<string>();

                // Parsing meshes
                bool isMesh = true;
                var meshes = (JArray)scene.meshes;
                foreach (dynamic mesh in meshes)
                {
                    if (mesh.checkCollisions.Value) // Do not delay load collisions object
                    {
                        if (mesh.geometryId != null)
                            doNotDelayLoadingForGeometries.Add(mesh.geometryId.Value);
                        continue;
                    }

                    isMesh = true;

                    Extract(srcPath, dstPath, objName, mesh, isMesh);
                }


                // Parsing vertexData
                var geometries = scene.geometries;
                if (geometries != null)
                {
                    var vertexData = (JArray)geometries.vertexData;
                    foreach (dynamic geometry in vertexData)
                    {
                        var id = geometry.id.Value;

                        if (doNotDelayLoadingForGeometries.Any(g => g == id))
                            continue;

                        isMesh = false;

                        Extract(srcPath, dstPath, objName, geometry, isMesh);
                    }
                }

                // Saving
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("Saving " + dstFilename);
                string json = scene.ToString(Formatting.Indented);

                using (var writer = new StreamWriter(WebUtility.UrlDecode(dstFilename)))
                {
                    writer.Write(json);
                }

                Console.WriteLine();
                Console.ResetColor();
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("Fatal error encountered:");
                Console.WriteLine(ex.Message);
                Console.ResetColor();
            }
        }

        
        static void Extract(string srcPath, string dstPath, string objName, dynamic meshObj, bool isMesh)
        {
            try
            {
                string dstFilename = meshObj.delayLoadingFile;
                string dstExt = (isMesh ? ".babylonbinarymeshdata" : ".babylonbinarygeometrydata");
                
                if(!string.IsNullOrEmpty(dstFilename))
                {
                    string filename = WebUtility.UrlDecode(Path.Combine(srcPath, (string)meshObj.delayLoadingFile));

                    using (var streamReader = new StreamReader(filename))
                    {
                        using (var reader = new JsonTextReader(streamReader))
                        {
                            var meshData = JObject.Load(reader);
                            meshObj.positions = meshData["positions"];
                            meshObj.normals = meshData["normals"];
                            meshObj.indices = meshData["indices"];
                            meshObj.uvs = meshData["uvs"];
                            meshObj.uvs2 = meshData["uvs2"];
                            meshObj.colors = meshData["colors"];
                            meshObj.matricesIndices = meshData["matricesIndices"];
                            meshObj.matricesWeights = meshData["matricesWeights"];
                            meshObj.subMeshes = meshData["subMeshes"];
                        }
                    }
                }

                if (meshObj.positions == null || meshObj.normals == null || meshObj.indices == null)
                    return;

                Console.WriteLine("Extracting " + (isMesh ? meshObj.name : meshObj.id));

                ComputeBoundingBox(meshObj);

                string meshName = meshObj.name.ToString();
                meshName = meshName.Trim();
                if (meshName.Length > 40)
                    meshName = meshName.Substring(0, 40);

                if (isMesh && !string.IsNullOrEmpty(meshName))
                    dstFilename = objName + "." + meshName + "." + meshObj.id.ToString() + dstExt;
                else
                    dstFilename = objName + meshObj.id.ToString() + dstExt;

                dstFilename = dstFilename.Replace("+", "_").Replace(" ", "_").Replace("/", "_").Replace("\\", "_");

                meshObj.delayLoadingFile = WebUtility.UrlEncode(dstFilename);
                Console.WriteLine("Creating delayLoadingFile: " + meshObj.delayLoadingFile);


                var binaryInfo = new JObject();

                using (var stream = File.Open(WebUtility.UrlDecode(Path.Combine(dstPath, dstFilename)), FileMode.Create))
                {
                    BinaryWriter writer = new BinaryWriter(stream);

                    if (meshObj.positions != null && meshObj.positions.Count > 0)
                    {
                        var attrData = new JObject();
                        attrData["count"] = meshObj.positions.Count;
                        attrData["stride"] = 3;
                        attrData["offset"] = stream.Length;
                        attrData["dataType"] = (int)DataType.Float;

                        binaryInfo["positionsAttrDesc"] = attrData;

                        for (int x = 0; x < meshObj.positions.Count; x++)
                            writer.Write((float)meshObj.positions[x]);

                        meshObj.positions = null;
                    }


                    if (meshObj.colors != null && meshObj.colors.Count > 0)
                    {
                        var attrData = new JObject();
                        attrData["count"] = meshObj.colors.Count;
                        attrData["stride"] = 3;
                        attrData["offset"] = stream.Length;
                        attrData["dataType"] = (int)DataType.Float;

                        binaryInfo["colorsAttrDesc"] = attrData;

                        for (int x = 0; x < meshObj.colors.Count; x++)
                            writer.Write((float)meshObj.colors[x]);

                        meshObj["hasColors"] = true;
                        meshObj.colors = null;
                    }


                    if (meshObj.normals != null && meshObj.normals.Count > 0)
                    {
                        var attrData = new JObject();
                        attrData["count"] = meshObj.normals.Count;
                        attrData["stride"] = 3;
                        attrData["offset"] = stream.Length;
                        attrData["dataType"] = (int)DataType.Float;

                        binaryInfo["normalsAttrDesc"] = attrData;

                        for (int x = 0; x < meshObj.normals.Count; x++)
                            writer.Write((float)meshObj.normals[x]);

                        meshObj.normals = null;
                    }


                    if (meshObj.uvs != null && meshObj.uvs.Count > 0)
                    {
                        var attrData = new JObject();
                        attrData["count"] = meshObj.uvs.Count;
                        attrData["stride"] = 2;
                        attrData["offset"] = stream.Length;
                        attrData["dataType"] = (int)DataType.Float;

                        binaryInfo["uvsAttrDesc"] = attrData;

                        for (int x = 0; x < meshObj.uvs.Count; x++)
                            writer.Write((float)meshObj.uvs[x]);

                        meshObj["hasUVs"] = true;
                        meshObj.uvs = null;
                    }


                    if (meshObj.uvs2 != null && meshObj.uvs2.Count > 0)
                    {
                        var attrData = new JObject();
                        attrData["count"] = meshObj.uvs2.Count;
                        attrData["stride"] = 2;
                        attrData["offset"] = stream.Length;
                        attrData["dataType"] = (int)DataType.Float;

                        binaryInfo["uvs2AttrDesc"] = attrData;

                        for (int x = 0; x < meshObj.uvs2.Count; x++)
                            writer.Write((float)meshObj.uvs2[x]);

                        meshObj["hasUVs2"] = true;
                        meshObj.uvs2 = null;
                    }


                    if (meshObj.indices != null && meshObj.indices.Count > 0)
                    {
                        var attrData = new JObject();
                        attrData["count"] = meshObj.indices.Count;
                        attrData["stride"] = 1;
                        attrData["offset"] = stream.Length;
                        attrData["dataType"] = (int)DataType.Int32;

                        binaryInfo["indicesAttrDesc"] = attrData;

                        for (int x = 0; x < meshObj.indices.Count; x++)
                            writer.Write((int)meshObj.indices[x]);

                        meshObj.indices = null;
                    }


                    if (meshObj.matricesIndices != null && meshObj.matricesIndices.Count > 0)
                    {
                        var attrData = new JObject();
                        attrData["count"] = meshObj.matricesIndices.Count;
                        attrData["stride"] = 1;
                        attrData["offset"] = stream.Length;
                        attrData["dataType"] = (int)DataType.Int32;

                        binaryInfo["matricesIndicesAttrDesc"] = attrData;

                        for (int x = 0; x < meshObj.matricesIndices.Count; x++)
                            writer.Write((int)meshObj.matricesIndices[x]);

                        meshObj["hasMatricesIndices"] = true;
                        meshObj.matricesIndices = null;
                    }


                    if (meshObj.matricesWeights != null && meshObj.matricesWeights.Count > 0)
                    {
                        var attrData = new JObject();
                        attrData["count"] = meshObj.matricesWeights.Count;
                        attrData["stride"] = 2;
                        attrData["offset"] = stream.Length;
                        attrData["dataType"] = (int)DataType.Float;

                        binaryInfo["matricesWeightsAttrDesc"] = attrData;

                        for (int x = 0; x < meshObj.matricesWeights.Count; x++)
                            writer.Write((float)meshObj.matricesWeights[x]);

                        meshObj["hasMatricesWeights"] = true;
                        meshObj.matricesWeights = null;
                    }


                    if (isMesh && meshObj.subMeshes != null && meshObj.subMeshes.Count > 0)
                    {
                        var attrData = new JObject();
                        attrData["count"] = meshObj.subMeshes.Count;
                        attrData["stride"] = 5;
                        attrData["offset"] = stream.Length;
                        attrData["dataType"] = (int)DataType.Int32;

                        binaryInfo["subMeshesAttrDesc"] = attrData;

                        int[] smData = new int[5];

                        for (int x = 0; x < meshObj.subMeshes.Count; x++)
                        {
                            smData[0] = meshObj.subMeshes[x].materialIndex;
                            smData[1] = meshObj.subMeshes[x].verticesStart;
                            smData[2] = meshObj.subMeshes[x].verticesCount;
                            smData[3] = meshObj.subMeshes[x].indexStart;
                            smData[4] = meshObj.subMeshes[x].indexCount;

                            for (int y = 0; y < smData.Length; y++)
                                writer.Write((int)smData[y]);
                        }

                        meshObj.subMeshes = null;
                    }
                }

                meshObj["_binaryInfo"] = binaryInfo;
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine();
                Console.WriteLine(ex.Message);
                Console.ForegroundColor = ConsoleColor.DarkCyan;
                Console.WriteLine(ex);
                Console.ResetColor();
            }
        }
        
        
        static void ComputeBoundingBox(dynamic meshOrGeometry)
        {
            // Compute bounding boxes
            var positions = ((JArray)meshOrGeometry.positions).Select(v => v.Value<float>()).ToArray();
            var minimum = new[] { float.MaxValue, float.MaxValue, float.MaxValue };
            var maximum = new[] { float.MinValue, float.MinValue, float.MinValue };

            for (var index = 0; index < positions.Length; index += 3)
            {
                var x = positions[index];
                var y = positions[index + 1];
                var z = positions[index + 2];

                if (x < minimum[0])
                {
                    minimum[0] = x;
                }
                if (x > maximum[0])
                {
                    maximum[0] = x;
                }

                if (y < minimum[1])
                {
                    minimum[1] = y;
                }
                if (y > maximum[1])
                {
                    maximum[1] = y;
                }

                if (z < minimum[2])
                {
                    minimum[2] = z;
                }
                if (z > maximum[2])
                {
                    maximum[2] = z;
                }
            }

            meshOrGeometry["boundingBoxMinimum"] = new JArray(minimum);
            meshOrGeometry["boundingBoxMaximum"] = new JArray(maximum);
        }


        static void DisplayUsage()
        {
            Console.WriteLine("ConvertToBinary usage: ConvertToBinary.exe /i:\"sourceFilename\" /o:\"dstinationFolder\"");
        }
    }
}
