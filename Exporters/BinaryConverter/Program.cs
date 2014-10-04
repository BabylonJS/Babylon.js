using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Net;
using System.IO;

using Newtonsoft.Json;
using BabylonExport.Core;


namespace BabylonBinaryConverter
{
    class Program
    {
        static void Main(string[] args)
        {
            string srcFilename = "";
            string dstPath = "";
            bool formatted = false;

            try
            {
                if (args.Length < 2)
                {
                    DisplayUsage();
                    return;
                }

                foreach (var arg in args)
                {
                    if(arg.ToLower() == "/formatted")
                    {
                        formatted = true;
                    }
                    else if (arg.Substring(0, 3).ToLower() == "/i:")
                    {
                        srcFilename = arg.Substring(3);
                    }
                    else if (arg.Substring(0, 3).ToLower() == "/o:")
                    {
                        dstPath = arg.Substring(3);
                    }
                    else
                    {
                        DisplayUsage();
                    }
                }

                if (string.IsNullOrEmpty(srcFilename) || string.IsNullOrEmpty(dstPath))
                {
                    DisplayUsage();
                    return;
                }

                string srcPath = Path.GetDirectoryName(srcFilename);
                string dstFilename = "";
                
                if (!srcFilename.Contains(".incremental.babylon"))
                    dstFilename = Path.Combine(dstPath, Path.GetFileNameWithoutExtension(srcFilename) + ".incremental.babylon");
                else
                    dstFilename = Path.Combine(dstPath, Path.GetFileName(srcFilename));

                if (!Directory.Exists(dstPath))
                {
                    Directory.CreateDirectory(dstPath);
                }

                Console.WriteLine("Converting file " + WebUtility.UrlDecode(srcFilename) + " to binary in folder " + dstPath);

                ParseBabylonSceneFileAsJson(srcPath, srcFilename, dstPath, dstFilename, formatted);

                using (var debugFile = new StreamWriter(dstPath + @"\debug.txt", true))
                {
                    debugFile.Write("Generation of " + dstFilename + " successfull");
                }
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine();
                Console.WriteLine(ex.Message);
                Console.ResetColor();

                using (var debugFile = new StreamWriter(dstPath + @"\debug.txt", true))
                {
                    debugFile.Write(ex);
                }
            }
        }


        static void ParseBabylonSceneFileAsJson(string srcPath, string srcFilename, string dstPath, string dstFilename, bool formatted)
        {
            try
            {
                BabylonLodScene scene = JsonConvert.DeserializeObject<BabylonLodScene>(File.ReadAllText(WebUtility.UrlDecode(srcFilename)));
                scene.autoClear = true;
                scene.useDelayedTextureLoading = true;

                scene.Convert(srcPath, dstPath);

                File.WriteAllText(WebUtility.UrlDecode(dstFilename), JsonConvert.SerializeObject(scene, (formatted ? Formatting.Indented : Formatting.None)));
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
        
        
        static void DisplayUsage()
        {
            Console.WriteLine("Babylon binary converter usage: BabylonBinaryConverter.exe /i:\"source file\" /o:\"output folder\" /formatted");
            Console.WriteLine("   /formatted to write formatted Json. The default is compressed.");
        }
    }
}
