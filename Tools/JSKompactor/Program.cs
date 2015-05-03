using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;

namespace JSKompactor
{
    class Program
    {
        static string Extends = "var __extends = this.__extends || function (d, b) {\r\n" +
                        "    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];\r\n" +
                        "    function __() { this.constructor = d; }\r\n" +
                        "    __.prototype = b.prototype;\r\n" +
                        "    d.prototype = new __();\r\n" +
                        "};";

        static void Main(string[] args)
        {
            if (args.Length != 4)
            {
                DisplayUsage();
                return;
            }

            // Parsing arguments
            string output = "";
            string inputFilenames = "";
            string workingFolder = "";
            string shadersFolder = "";

            foreach (var arg in args)
            {
                var order = arg.Substring(0, 3);

                switch (order)
                {
                    case "/i:":
                        inputFilenames = arg.Substring(3);
                        break;
                    case "/o:":
                        output = arg.Substring(3);
                        break;
                    case "/w:":
                        workingFolder = arg.Substring(3);
                        break;
                    case "/s:":
                        shadersFolder = arg.Substring(3);
                        break;
                    default:
                        DisplayUsage();
                        return;
                }
            }

            if (string.IsNullOrEmpty(workingFolder) || string.IsNullOrEmpty(output) || string.IsNullOrEmpty(inputFilenames))
            {
                DisplayUsage();
                return;
            }


            // Merges files            
            var inputs = inputFilenames.Split(',');

            var builder = new StringBuilder();
            foreach (var input in inputs)
            {
                try
                {
                    builder.Append(File.ReadAllText(Path.Combine(workingFolder, input)));
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("Merging " + input);
                    Console.ResetColor();
                }
                catch (Exception ex)
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("Unable to load " + input);
                    Console.WriteLine(ex.Message);
                    Console.ResetColor();
                }
            }

            var result = builder.ToString();

            // Remove all extends
            result = result.Replace(Extends, "");

            // Add only one __extends
            result = Extends + result;

            // Compress
            result = RemoveUseStrict(result);
            //result = RemoveComments(result);
            //result = RemoveNewLines(result);
            //result = RemoveWhiteSpaces(result);

            // Integrate shaders
            if (!string.IsNullOrEmpty(shadersFolder))
            {
                var shaders = Directory.GetFiles(Path.Combine(workingFolder, shadersFolder), "*.fx");
                var shadersString = "";
                foreach (var shader in shaders)
                {
                    shadersString += Path.GetFileName(shader).Replace(".fragment.fx", "PixelShader").Replace(".vertex.fx", "VertexShader") + ":";
                    var lines = File.ReadAllLines(shader);
                    var selectedLines = new List<string>();

                    for (var index = 0; index < lines.Length; index++)
                    {
                        var val = lines[index].Trim();

                        if (!val.StartsWith("//"))
                        {
                            selectedLines.Add(val);
                        }
                    }

                    shadersString += "\"" + string.Join("\\n", selectedLines.ToArray()) + "\",\n";
                }


                result = result.Replace("Effect.ShadersStore = {};", "Effect.ShadersStore={" + shadersString + "};");
            }

            // Output file
            File.WriteAllText(output, result);
        }

        static string RemoveUseStrict(string source)
        {
            return source.Replace("\"use strict\";", "");
        }

        static string RemoveComments(string source)
        {
            var regExp = new Regex(@"\s*?//.+?$", RegexOptions.Multiline);

            return regExp.Replace(source, "");
        }

        static string RemoveNewLines(string source)
        {
            var regExp = new Regex("(\r|\n|\t)", RegexOptions.Multiline);

            return regExp.Replace(source, "");
        }

        static bool IsValidChar(char c)
        {
            return Char.IsLetterOrDigit(c) || c == '_';
        }

        static string RemoveWhiteSpaces(string source)
        {
            var builder = new StringBuilder(source.Length);

            var isInString = false;

            for (var index = 0; index < source.Length; index++)
            {
                var previous = source[Math.Max(0, index - 1)];
                var current = source[index];
                var next = source[Math.Min(source.Length - 1, index + 1)];

                if (current == '"' && previous != '\\')
                {
                    isInString = !isInString;
                }
                else if (current == ' ' && !isInString)
                {
                    if (!IsValidChar(previous) || !IsValidChar(next))
                    {
                        continue;
                    }
                }

                builder.Append(current);
            }

            return builder.ToString();
        }

        static void DisplayUsage()
        {
            Console.WriteLine("JSKompactor usage: JSKompactor.exe /w:\"Working folder\" /i:\"Comma separated list of files to merge\" /s:\"Shaders folder\" /o:\"output file\"");
        }
    }
}
