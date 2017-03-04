using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace BabylonFileConverter
{
    public static class BinaryConverter
    {
        public enum DataType { Int32, Float };

        public static void Convert(string srcFilename, string dstPath, Action<string> onMessage, Action<string> onError)
        {
            try
            {
                if (!Directory.Exists(dstPath))
                    Directory.CreateDirectory(dstPath);

                string srcPath = Path.GetDirectoryName(srcFilename);
                string dstFilename = Path.Combine(dstPath, Path.GetFileNameWithoutExtension(srcFilename) + ".binary.babylon");

                dynamic scene;

                // Loading
                onMessage("Loading " + srcFilename);

                using (var streamReader = new StreamReader(srcFilename))
                {
                    using (var reader = new JsonTextReader(streamReader))
                    {
                        scene = JObject.Load(reader);
                    }
                }

                // Marking scene
                string objName = scene.name;

                if (string.IsNullOrEmpty(objName))
                    objName = Path.GetFileNameWithoutExtension(srcFilename);

                var atDot = objName.IndexOf(".incremental");
                if (atDot > 0)
                    objName = objName.Substring(0, atDot);

                scene["autoClear"] = true;
                scene["useDelayedTextureLoading"] = true;

                var doNotDelayLoadingForGeometries = new List<string>();

                // Parsing meshes
                var meshes = (JArray)scene.meshes;
                foreach (dynamic mesh in meshes)
                {
                    if (mesh.checkCollisions.Value) // Do not delay load collisions object
                    {
                        if (mesh.geometryId != null)
                            doNotDelayLoadingForGeometries.Add(mesh.geometryId.Value);
                        continue;
                    }

                    Extract(srcPath, dstPath, objName, mesh, true);
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

                        Extract(srcPath, dstPath, objName, geometry, false);
                    }
                }

                // Saving                
                onMessage("Saving " + dstFilename);
                string json = scene.ToString(Formatting.Indented);

                using (var writer = new StreamWriter(WebUtility.UrlDecode(dstFilename)))
                {
                    writer.Write(json);
                }
            }
            catch (Exception ex)
            {
                onError(ex.Message);
            }
        }


        static void Extract(string srcPath, string dstPath, string objName, dynamic meshObj, bool isMesh)
        {
            string dstFilename = meshObj.delayLoadingFile;
            string dstExt = (isMesh ? ".babylonbinarymeshdata" : ".babylonbinarygeometrydata");

            if (!string.IsNullOrEmpty(dstFilename))
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

            if (meshObj.positions == null || meshObj.positions.Count == 0 
                || meshObj.normals == null || meshObj.normals.Count == 0
                || meshObj.indices == null || meshObj.indices.Count == 0)
                return;

            ComputeBoundingBox(meshObj);

            string meshName = meshObj.name.ToString();
            meshName = meshName.Trim();
            if (meshName.Length > 40)
                meshName = meshName.Substring(0, 40);

            if (isMesh && !string.IsNullOrEmpty(meshName))
                dstFilename = objName + "." + meshName + "." + meshObj.id.ToString() + dstExt;
            else
                dstFilename = objName + meshObj.id.ToString() + dstExt;

            dstFilename = dstFilename.Replace("+", "_").Replace(" ", "_").Replace("/", "_").Replace("\\", "_").Replace(":", "_");

            meshObj.delayLoadingFile = WebUtility.UrlEncode(dstFilename);

            var binaryInfo = new JObject();

            using (var stream = File.Open(WebUtility.UrlDecode(Path.Combine(dstPath, dstFilename)), FileMode.Create))
            {
                var writer = new BinaryWriter(stream);

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

                    var smData = new int[5];

                    for (int x = 0; x < meshObj.subMeshes.Count; x++)
                    {
                        smData[0] = meshObj.subMeshes[x].materialIndex;
                        smData[1] = meshObj.subMeshes[x].verticesStart;
                        smData[2] = meshObj.subMeshes[x].verticesCount;
                        smData[3] = meshObj.subMeshes[x].indexStart;
                        smData[4] = meshObj.subMeshes[x].indexCount;

                        for (int y = 0; y < smData.Length; y++)
                            writer.Write(smData[y]);
                    }

                    meshObj.subMeshes = null;
                }
            }

            meshObj["_binaryInfo"] = binaryInfo;
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
    }
}
