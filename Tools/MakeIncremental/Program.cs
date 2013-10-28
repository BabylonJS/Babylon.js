using System;
using System.IO;
using System.Linq;
using System.Web;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

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

        static string CreateDelayLoadingFile(dynamic mesh, string outputDir, string rootFilename)
        {
            var encodedMeshName = mesh.name.ToString().Replace("+", "_").Replace(" ", "_");
            var outputPath = Path.Combine(outputDir, rootFilename + "." + encodedMeshName + ".babylonmeshdata");

            var result = new JObject();
            result["positions"] = mesh.positions;
            result["indices"] = mesh.indices;
            result["normals"] = mesh.normals;

            if (mesh.uvs != null)
            {
                result["uvs"] = mesh.uvs;
            }

            if (mesh.uvs2 != null)
            {
                result["uvs2"] = mesh.uvs2;
            }

            if (mesh.colors != null)
            {
                result["colors"] = mesh.colors;
            }

            if (mesh.matricesIndices != null)
            {
                result["matricesIndices"] = mesh.matricesIndices;
            }

            if (mesh.matricesWeights != null)
            {
                result["matricesWeights"] = mesh.matricesWeights;
            }

            if (mesh.subMeshes != null)
            {
                result["subMeshes"] = mesh.subMeshes;
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

                // Parsing meshes
                var meshes = (JArray)scene.meshes;
                foreach (dynamic mesh in meshes)
                {
                    if (mesh.checkCollisions.Value) // Do not delay load collisions object
                    {
                        continue;
                    }

                    Console.WriteLine("Extracting " + mesh.name);

                    if (mesh.positions != null && mesh.normals != null && mesh.indices != null)
                    {
                        mesh.delayLoadingFile = CreateDelayLoadingFile(mesh, outputDir, rootFilename);
                        Console.WriteLine("Delay loading file: " + mesh.delayLoadingFile);

                        // Compute bounding boxes
                        var positions = ((JArray) mesh.positions).Select(v=>v.Value<float>()).ToArray();
                        var minimum = new[] {float.MaxValue, float.MaxValue, float.MaxValue};
                        var maximum = new[] {float.MinValue, float.MinValue, float.MinValue};

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

                        mesh["boundingBoxMinimum"] = new JArray(minimum);
                        mesh["boundingBoxMaximum"] = new JArray(maximum);

                        // Erasing infos
                        mesh.positions = null;
                        mesh.normals = null;
                        mesh.indices = null;

                        if (mesh.uvs != null)
                        {
                            mesh["hasUVs"] = true;
                            mesh.uvs = null;
                        }

                        if (mesh.uvs2 != null)
                        {
                            mesh["hasUVs2"] = true;
                            mesh.uvs2 = null;
                        }

                        if (mesh.colors != null)
                        {
                            mesh["hasColors"] = true;
                            mesh.colors = null;
                        }

                        if (mesh.matricesIndices != null)
                        {
                            mesh["hasMatricesIndices"] = true;
                            mesh.matricesIndices = null;
                        }

                        if (mesh.matricesWeights != null)
                        {
                            mesh["hasMatricesWeights"] = true;
                            mesh.matricesWeights = null;
                        }

                        if (mesh.subMeshes != null)
                        {
                            mesh.subMeshes = null;
                        }
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
