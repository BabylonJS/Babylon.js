using System;
using System.IO;
using System.Reflection;
using BabylonExport.Core.Exporters;
using BabylonExport.Core.Exporters.FBX;
using System.Windows.Forms;
using System.ServiceModel;
using BabylonExport.Interface;
using BabylonExport.Core;
using System.Linq;

namespace BabylonExport
{
    class Program
    {
        static void Main(string[] args)
        {
            string output = "";
            try
            {
                if ((args.Length == 1) && (args[0] == "/service"))
                {
                    
                    var serviceHost = new ServiceHost(typeof(Service), new Uri[] { new Uri("net.pipe://localhost/") });
                    serviceHost.AddServiceEndpoint(typeof(IService), new NetNamedPipeBinding(), "exportservice");
                    serviceHost.Open();

                    Console.WriteLine("Service started. Available in following endpoints");
                    foreach (var serviceEndpoint in serviceHost.Description.Endpoints)
                    {
                        Console.WriteLine(serviceEndpoint.ListenUri.AbsoluteUri);
                    }
                    Console.ReadLine();
                }
                else
                {
                    if (args.Length < 2)
                    {
                        DisplayUsage();
                        return;
                    }

                    // Parsing arguments
                    string input = "";
                    bool skinned = false;
                    bool rightToLeft = false;
                    foreach (var arg in args)
                    {
                        var order = arg.Substring(0, 3);

                        switch (order)
                        {
                            case "/i:":
                                input = arg.Substring(3);
                                break;
                            case "/o:":
                                output = arg.Substring(3);
                                break;
                            case "/sk":
                                skinned = true;
                                break;
                            case "/rl":
                                rightToLeft = true;
                                break;
                            default:
                                DisplayUsage();
                                return;
                        }
                    }

                    if (string.IsNullOrEmpty(input) || string.IsNullOrEmpty(output))
                    {
                        DisplayUsage();
                        return;
                    }
                    var extension = Path.GetExtension(input).ToLower();
                    var outputName = Path.Combine(output, Path.GetFileNameWithoutExtension(input) + ".babylon");
                    if (!Directory.Exists(output))
                    {
                        Directory.CreateDirectory(output);
                    }

                    // Browsing exporters
                    foreach (var type in Assembly.GetAssembly(typeof(NovaExporter)).GetTypes().Where(t => !t.IsAbstract))
                    {
                        var interf = type.GetInterface("BabylonExport.Core.IExporter");
                        if (interf != null)
                        {
                            var importer = (IExporter)Activator.CreateInstance(type);

                            if (!importer.SupportedExtensions.Contains(extension))
                            {
                                continue;
                            }

                            Console.WriteLine("Using " + type);

                            // Importation
                            try
                            {
                                importer.OnImportProgressChanged += progress =>
                                    {
                                        Console.CursorLeft = 0;
                                        Console.Write("Generation....{0} %", progress);
                                    };

                                Console.ForegroundColor = ConsoleColor.Green;
                                Console.WriteLine("Generation of " + outputName + " started");
                                Console.WriteLine();
                                Console.ResetColor();
                                importer.GenerateBabylonFile(input, outputName, skinned, rightToLeft);
                                Console.ForegroundColor = ConsoleColor.Green;
                                Console.WriteLine();
                                Console.WriteLine();
                                Console.WriteLine("Generation of " + outputName + " successfull");
                                Console.ResetColor();
                                using (var debugFile = new StreamWriter(output + @"\debug.txt", true))
                                {
                                    debugFile.Write("Generation of " + outputName + " successfull");
                                }
                 
                            }
                            catch (Exception ex)
                            {
                                Console.ForegroundColor = ConsoleColor.Red;
                                Console.WriteLine();
                                Console.WriteLine(ex.Message);
                                Console.ResetColor();
                                using (var debugFile = new StreamWriter(output + @"\debug.txt", true))
                                {
                                    debugFile.Write(ex.Message);
                                }
                            }
                        }
                    }
                }
            }
            catch (ReflectionTypeLoadException ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("Fatal error encountered:");
                Console.WriteLine(ex.LoaderExceptions[0].Message);
                Console.ResetColor();
                if (output != "")
                {
                    using (var debugFile = new StreamWriter(output + @"\debug.txt", true))
                    {
                        debugFile.Write(ex.Message);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("Fatal error encountered:");
                Console.WriteLine(ex.Message);
                Console.ResetColor();
                if (output != "")
                {
                    using (var debugFile = new StreamWriter(output + @"\debug.txt", true))
                    {
                        debugFile.Write(ex.Message);
                    }
                }
            } 
        }

        static void DisplayUsage()
        {
            Console.WriteLine("Babylon Import usage: BabylonImport.exe /i:\"source file\" /o:\"output folder\" [/sk] [/rl]");
        }
    }
}
