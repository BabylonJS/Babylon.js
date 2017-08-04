using BabylonExport.Entities;
using LegoConvertDat.Helpers;
using LegoConvertDat.Models;
using LegoConvertDat.Services;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LegoConvertDat
{
    class Program
    {

        static string[] FileNames;
        static string Path;
        static string RootPath;
        static string OutputPath;
        static bool HiQuality = true;
        static string ColorFileName;

        static void Main(string[] args)
        {
            CheckArgs(args);

            var pathcol = @".\";
            if (!File.Exists(pathcol + ColorFileName))
            {
                if (File.Exists(Path + ColorFileName))
                    pathcol = Path;
                else
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("Error: can't find the color description file");
                    Console.ResetColor();
                    WriteUsage();
                    return;
                }
            }
            // LoadColors myColor = new LoadColors(@"C:\Repos\LegoConvertDat\LegoConvertDat", @"ldconfig.ldr");
            LoadColors myColor = new LoadColors(pathcol, ColorFileName);

            if (FileNames == null)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("Error: no file to convert");
                Console.ResetColor();
                WriteUsage();
                return;
            }

            foreach(var FileName in FileNames)
            {
                if (FileName == "")
                    continue;
                var loader = new Loader(RootPath, Path, FileName, HiQuality);

                var poly = loader.Polygones; 

                Console.WriteLine("Creating babylon object");
                BabylonScene babylonScene = new BabylonScene(Path);
                babylonScene.producer = new BabylonProducer
                {
                    name = "LDraw2Babylon",
                    exporter_version = "1.0",
                    file = FileName,
                    version = "1.0"
                };

                babylonScene.autoClear = true;

                babylonScene.clearColor = new float[] { 0.2f, 0.2f, 0.3f };
                babylonScene.ambientColor = new float[] { 0.0f, 0.0f, 0.0f };

                babylonScene.gravity = new float[] { 0, 0, -0.9f };
                //Camera
                //BabylonCamera mainCamera = new BabylonCamera();
                //mainCamera.name = "Default";
                //mainCamera.id = mainCamera.name;
                //babylonScene.cameras = new BabylonCamera[] { mainCamera };
                //babylonScene.activeCameraID = mainCamera.id;

                //fog
                babylonScene.fogColor = null;
                babylonScene.fogDensity = 0;
                babylonScene.fogEnd = 0;
                babylonScene.fogMode = 0;
                babylonScene.fogStart = 0;

                //light
                //dBabylonLight babylonLight = new BabylonLight();
                //babylonScene.lights = new BabylonLight[] { babylonLight };
                Console.WriteLine("Creating lights and cameras");
                babylonScene.Prepare(true, true);
                Console.WriteLine("Creating colors and textures");
                // Materials
                //Create 1 material per Lego color
                // TODO : need to test specific materials and create the right material
                List<BabylonStandardMaterial> babMaterial = new List<BabylonStandardMaterial>();
                var MatCol = poly.Select(x => x.Color).Distinct();
                foreach (var col in MatCol)
                {
                    BabylonStandardMaterial babylonMaterial = new BabylonStandardMaterial();
                    babylonMaterial.name = $"Mat_{col.ToString()}";
                    babylonMaterial.backFaceCulling = false;
                    babylonMaterial.id = babylonMaterial.name;
                    babylonMaterial.specular = new float[] { 0.2f, 0.2f, 0.2f };
                    babylonMaterial.diffuse = new float[] { (float)(myColor.Colors.Where(x => x.Code == col).First().Color.R / 255.0), (float)(myColor.Colors.Where(x => x.Code == col).First().Color.G / 255.0), (float)(myColor.Colors.Where(x => x.Code == col).First().Color.B / 255.0) };
                    if (myColor.Colors.Where(x => x.Code == col).First()?.Alpha == 1)
                        babylonMaterial.alpha = 0.5f;
                    babylonMaterial.twoSidedLighting = true;
                    babMaterial.Add(babylonMaterial);
                }
                babylonScene.materials = babMaterial.ToArray();

                Console.WriteLine("Creating meshes");
                //Mesh
                List<BabylonMesh> babMesh = new List<BabylonMesh>();
                foreach (var col in MatCol)
                {
#if DEBUG
                    float minX = float.MaxValue;
                    float minY = float.MaxValue;
                    float minZ = float.MaxValue;
                    float maxX = float.MinValue;
                    float maxY = float.MinValue;
                    float maxZ = float.MinValue;
#endif

                    BabylonMesh mesh = new BabylonMesh();
                    mesh.id = FileName + col.ToString();
                    mesh.name = FileName + col.ToString();
                    mesh.billboardMode = 0;
                    //linking the material with the color
                    mesh.materialId = $"Mat_{col.ToString()}"; 

                    var polcol = poly.Where(x => x.Color == col).ToList();
                    if (!polcol.Any())
                        continue;
                    //Create the points, indices and normales
                    //please note the code is not optimized to suppress non necessary points
                    mesh.positions = new float[polcol.Count * 9];
                    mesh.indices = new int[polcol.Count * 3 * 2];
                    mesh.normals = new float[polcol.Count * 9 * 2];
                    //Create all the vertice for the specific color
                    for (int i = 0; i < polcol.Count; i++)
                    {
                        var normal = polcol[i].GetNormal();
                        for (int j = 0; j < 3; j++)
                        {
#if DEBUG
                            if (polcol[i].Points(j).X < minX)
                                minX = polcol[i].Points(j).X;
                            if (polcol[i].Points(j).Y < minY)
                                minY = polcol[i].Points(j).Y;
                            if (polcol[i].Points(j).Z < minZ)
                                minZ = polcol[i].Points(j).Z;
                            if (polcol[i].Points(j).X > maxX)
                                maxX = polcol[i].Points(j).X;
                            if (polcol[i].Points(j).Y > maxY)
                                maxY = polcol[i].Points(j).Y;
                            if (polcol[i].Points(j).Z > maxZ)
                                maxZ = polcol[i].Points(j).Z;
#endif
                            //Get the point positions
                            mesh.positions[i * 9 + j * 3] = polcol[i].Points(j).X;
                            mesh.positions[i * 9 + 1 + j * 3] = -polcol[i].Points(j).Y;
                            mesh.positions[i * 9 + 2 + j * 3] = polcol[i].Points(j).Z;
                            //add the  normals
                            mesh.normals[i * 9 + j * 3] = normal.X;
                            mesh.normals[i * 9 + 1 + j * 3] = normal.Y;
                            mesh.normals[i * 9 + 2 + j * 3] = normal.Z;
                        }
                        //create indices
                        mesh.indices[i * 3] = i * 3;
                        mesh.indices[i * 3 + 1] = i * 3 + 1;
                        mesh.indices[i * 3 + 2] = i * 3 + 2;
                    }
                    babMesh.Add(mesh);
#if DEBUG
                    Console.WriteLine($"Min X: {minX} Y: {minY} Z:{minZ}");
                    Console.WriteLine($"Max X: {maxX} Y: {maxY} Z:{maxZ}");
#endif
                }
                //create the Array
                babylonScene.meshes = babMesh.ToArray();
                Console.WriteLine("Serializing babylon file");
                var filewithoutext = FileName.Substring(0, FileName.Length - FileName.LastIndexOf('.'));
                var ser = JsonConvert.SerializeObject(babylonScene);
                Console.WriteLine("Saving babylon file");
                StreamWriter firstfile = new StreamWriter(OutputPath + filewithoutext + ".babylon");
                //Saving the file
                firstfile.Write(ser);
                firstfile.Close();
                firstfile.Dispose();

                //System.Diagnostics.Process.Start($"http://localhost:21175/index-2.html?file={filewithoutext}.babylon");
                //Console.ReadKey();
            }
        }

        static void CheckArgs(string[] args)
        {
            Path = @".\";
            RootPath = @".\";
            OutputPath = @".\";
            ColorFileName = "ldconfig.ldr";
            for (int i = 0; i < args.Length; i++)
            {
                //list of files to convert
                if (args[i].ToLower().IndexOf("f=") == 0)
                {
                    FileNames = args[i].Substring(2).Split(';');
                } //the main path of LDraw parts
                else if (args[i].ToLower().IndexOf("r=") == 0)
                {
                    RootPath = args[i].Substring(2).CheckSlashPath();
                } // the path of the files to convert
                else if (args[i].ToLower().IndexOf("p=") == 0)
                {
                    Path = args[i].Substring(2).CheckSlashPath();
                } // output path
                else if (args[i].ToLower().IndexOf("o=") == 0)
                {
                    OutputPath = args[i].Substring(2).CheckSlashPath();
                } // hi quality
                else if (args[i].ToLower().IndexOf("h=") == 0)
                {
                    var strqual = args[i].Substring(2);
                    if (strqual.Length > 0)
                        if (strqual[0] == '0')
                            HiQuality = false;

                } // color file
                else if (args[i].ToLower().IndexOf("c=") == 0)
                {
                    ColorFileName = args[i].Substring(2);
                } // help
                else if (args[i].ToLower().IndexOf("help") == 0)
                {
                    WriteUsage();
                }
            }

        }

        static void WriteUsage()
        {
            Console.WriteLine("Use the following settings:");
            Console.WriteLine("f= list file names to convert separated by ;");
            Console.WriteLine("r= give the root path for LDraw parts, default is same as the converter");
            Console.WriteLine("p= path of files to convert, default is same as the converter");
            Console.WriteLine("o= output directory for the babylon file");
            Console.WriteLine("h= 1 for hi or 0 for low quality images, default is hi");
            Console.WriteLine("c= name of color file, path default is either LDraw or app. Defautl name is ldconfig.ldr");
            Console.WriteLine("Example:");
            Console.WriteLine(@"r=c\Ldraw f=3456.dat;Mybuild.ldr;SuperSet.mpd;axle.dat o=C:\tmp");
        }
    }
}
