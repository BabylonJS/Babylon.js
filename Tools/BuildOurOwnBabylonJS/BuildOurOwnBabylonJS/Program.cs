using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using System.Reflection;
using System.Xml.Linq;
using System.Diagnostics;
using Mvp.Xml.XInclude;
using System.Xml;

namespace BuildOurOwnBabylonJS
{
    class Program
    {
        static void Main(string[] args)
        {
            if (args.Length < 3)
            {
                DisplayUsage();
                Environment.Exit(1);
                return;
            }

            // Parsing arguments
            var ourOwnBabylonJSXmlFilePath = "";
            var scriptsFolderPath = "";
            var shadersFolderPath = "";
            var outputFolderPath = "";
            var JSKompactorFolderPath = "";

            foreach (var arg in args)
            {
                var order = arg.Substring(0, 3);

                switch (order)
                {
                    case "/i:":
                        ourOwnBabylonJSXmlFilePath = arg.Substring(3);
                        break;
                    case "/w:":
                        scriptsFolderPath = arg.Substring(3);
                        break;
                    case "/s:":
                        shadersFolderPath = arg.Substring(3);
                        break;
                    case "/o:":
                        outputFolderPath = arg.Substring(3);
                        break;
                    case "/k:":
                        JSKompactorFolderPath = arg.Substring(3);
                        break;
                    default:
                        DisplayUsage();
                        Environment.Exit(1);
                        return;
                }
            }

            if (String.IsNullOrEmpty(ourOwnBabylonJSXmlFilePath)
                || String.IsNullOrEmpty(scriptsFolderPath)
                || String.IsNullOrEmpty(shadersFolderPath)
                || String.IsNullOrEmpty(outputFolderPath))
            {
                DisplayUsage();
                Environment.Exit(1);
                return;
            }

            try
            {
                ParseListOfFiles(ourOwnBabylonJSXmlFilePath);

                if (String.IsNullOrEmpty(JSKompactorFolderPath))
                    JSKompactorFolderPath = "executables";

                var batchFilePath = WriteBatchFile(scriptsFolderPath, ComupteDependencies(),
                    shadersFolderPath, outputFolderPath, JSKompactorFolderPath);

                CallBatchFile(batchFilePath);
            }
            catch (Exception ex)
            {
                Error(ex);
                Environment.Exit(1);
            }

            Environment.Exit(0);
        }

        private static void ParseListOfFiles(string path)
        {
            var reader = new XIncludingReader(XmlReader.Create(path));
         
            var document = XDocument.Load(reader);

            var files = document.Root;

            var scriptElements = files.Elements(Script.TAGNAME);

            foreach (var scriptElement in scriptElements)
            {
                Script.Load(scriptElement, scriptElements);
            }
        }

        private static IEnumerable<string> ComupteDependencies()
        {
            var scripts = Script.Scripts;

            var result = new List<string>(scripts.Count);

            foreach (var script in scripts)
            {
                var v = script.Value;
                if (v == null)
                    continue;

                v.GetDependenciesList(ref result);
            }

            return result;
        }

        private static string WriteBatchFile(string scriptsFolderPath, IEnumerable<string> scripts, 
            string shadersFolderPath, string outputFolderPath, string jskompactorPath)
        {
            if (scripts == null || scripts.Count() == 0)
                throw new Exception("A list of files was not provided.");

            var count = scripts.Count();

            var output = "";

            for (var i = count - 1; i >= 0; --i)
            {
                output += "," + scripts.ElementAt(i);
            }

            output = output.Substring(1);

            var batchFilePath = "jskompactor.bat";

            using (var batchFile = new StreamWriter(batchFilePath, false))
            {
                batchFile.Write("\"" + jskompactorPath + "\\JSKompactor.exe\" /i:\"" + output
                    + "\" /o:\"" + outputFolderPath + "\\ourOwnBabylon.js\" /w:\"" + scriptsFolderPath + "\" /s:\"" + shadersFolderPath + "\"");
            }

            return batchFilePath;
        }

        private static void CallBatchFile(string batchFilePath)
        {
            if (String.IsNullOrEmpty(batchFilePath) || !File.Exists(batchFilePath))
                throw new Exception("No batch file");
            
            Process.Start(batchFilePath);
        }

        private static void DisplayUsage()
        {
            Console.WriteLine("BuildOurOwnBabylonJS usage: BuildOurOwnBabylonJS.exe /w:\"Working folder\" /i:\"Path of the xml file containing list of files to merge\" /s:\"Shaders folder\" /o:\"Output folder\" [/k:\"Path to JSKompactor.exe\"]");
        }

        private static void Error(Exception ex)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine();
            Console.WriteLine(ex.Message);
            Console.ResetColor();
        }
    }
}
