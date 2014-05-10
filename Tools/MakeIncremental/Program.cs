using System;
using System.IO;
using System.Linq;
using System.Web;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Collections.Generic;

namespace MakeIncremental
{
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
            string input = "";
            foreach (var arg in args)
            {
                var order = arg.Substring(0, 3);

                switch (order)
                {
                    case "/i:":
                        input = arg.Substring(3);
                        break;
                    default:
                        DisplayUsage();
                        return;
                }
            }

            if (string.IsNullOrEmpty(input))
            {
                DisplayUsage();
                return;
            }

            ProcessSourceFile(input);
        }

        static void Extract(dynamic meshOrGeometry, string outputDir, string rootFilename, bool mesh = true)
        {
            Console.WriteLine("Extracting " + (mesh ? meshOrGeometry.name : meshOrGeometry.id));

            if (meshOrGeometry.positions != null && meshOrGeometry.normals != null && meshOrGeometry.indices != null)
            {
                meshOrGeometry.delayLoadingFile = CreateDelayLoadingFile(meshOrGeometry, outputDir, rootFilename, mesh);
                Console.WriteLine("Delay loading file: " + meshOrGeometry.delayLoadingFile);

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

                // Erasing infos
                meshOrGeometry.positions = null;
                meshOrGeometry.normals = null;
                meshOrGeometry.indices = null;

                if (meshOrGeometry.uvs != null)
                {
                    meshOrGeometry["hasUVs"] = true;
                    meshOrGeometry.uvs = null;
                }

                if (meshOrGeometry.uvs2 != null)
                {
                    meshOrGeometry["hasUVs2"] = true;
                    meshOrGeometry.uvs2 = null;
                }

                if (meshOrGeometry.colors != null)
                {
                    meshOrGeometry["hasColors"] = true;
                    meshOrGeometry.colors = null;
                }

                if (meshOrGeometry.matricesIndices != null)
                {
                    meshOrGeometry["hasMatricesIndices"] = true;
                    meshOrGeometry.matricesIndices = null;
                }

                if (meshOrGeometry.matricesWeights != null)
                {
                    meshOrGeometry["hasMatricesWeights"] = true;
                    meshOrGeometry.matricesWeights = null;
                }

                if (mesh && meshOrGeometry.subMeshes != null)
                {
                    meshOrGeometry.subMeshes = null;
                }
            }
        }

        static string CreateDelayLoadingFile(dynamic meshOrGeometry, string outputDir, string rootFilename, bool mesh = true)
        {
            string encodedName;
            if(mesh)
                encodedName = meshOrGeometry.name.ToString();
            else
                encodedName = meshOrGeometry.id.ToString();

            encodedName = encodedName.Replace("+", "_").Replace(" ", "_");
            var outputPath = Path.Combine(outputDir, rootFilename + "." + encodedName + (mesh ? ".babylonmeshdata" : ".babylongeometrydata"));

            var result = new JObject();
            result["positions"] = meshOrGeometry.positions;
            result["indices"] = meshOrGeometry.indices;
            result["normals"] = meshOrGeometry.normals;

            if (meshOrGeometry.uvs != null)
            {
                result["uvs"] = meshOrGeometry.uvs;
            }

            if (meshOrGeometry.uvs2 != null)
            {
                result["uvs2"] = meshOrGeometry.uvs2;
            }

            if (meshOrGeometry.colors != null)
            {
                result["colors"] = meshOrGeometry.colors;
            }

            if (meshOrGeometry.matricesIndices != null)
            {
                result["matricesIndices"] = meshOrGeometry.matricesIndices;
            }

            if (meshOrGeometry.matricesWeights != null)
            {
                result["matricesWeights"] = meshOrGeometry.matricesWeights;
            }

            if (mesh && meshOrGeometry.subMeshes != null)
            {
                result["subMeshes"] = meshOrGeometry.subMeshes;
            }

            string json = result.ToString(Formatting.None);

            using (var writer = new StreamWriter(outputPath))
            {
                writer.Write(json);
            }

            return HttpUtility.UrlEncode(Path.GetFileName(outputPath));
        }

        static void ProcessSourceFile(string input)
        {
            try
            {
                dynamic scene;
                var outputDir = Path.GetDirectoryName(input);
                var rootFilename = Path.GetFileNameWithoutExtension(input);

                // Loading
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("Loading " + input);
                Console.WriteLine();
                Console.ResetColor();
                using (var streamReader = new StreamReader(input))
                {
                    using (var reader = new JsonTextReader(streamReader))
                    {
                        scene = JObject.Load(reader);
                    }
                }

                // Marking scene
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

                    Extract(mesh, outputDir, rootFilename);
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

                        Extract(geometry, outputDir, rootFilename, false);
                    }
                }

                // Saving
                var outputPath = Path.Combine(outputDir, rootFilename + ".incremental.babylon");
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("Saving " + outputPath);
                string json = scene.ToString(Formatting.None);

                using (var writer = new StreamWriter(outputPath))
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

        static void DisplayUsage()
        {
            Console.WriteLine("MakeIncremental usage: MakeIncremental.exe /i:\"source file\" [/textures]");
        }
    }
}
