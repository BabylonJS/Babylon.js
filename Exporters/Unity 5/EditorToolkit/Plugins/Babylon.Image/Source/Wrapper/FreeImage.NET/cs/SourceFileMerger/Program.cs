using System;
using System.Collections.Generic;
using System.Text;
using System.IO;
using System.Text.RegularExpressions;

namespace FreeImageNET_SFM
{
	class Program
	{
		static private Regex searchPattern = new Regex("#include[ \\t]*\"(.*)\"", RegexOptions.Compiled);
		static private FileStream fStream = null;
		static private TextWriter textOut = null;
		private const string baseFolder = @"..\..\..\Library\";
		private const string templateName = @"FreeImage.cs.template";

		static int Main(string[] args)
		{
			try
			{
				if (!File.Exists(templateName))
				{
					Console.WriteLine(templateName + " not found."); return 1;
				}

				try
				{
					fStream = new FileStream(@"FreeImage.cs", FileMode.Create);
				}
				catch
				{
					Console.WriteLine("Unable to create output file."); return 2;
				}

				textOut = new StreamWriter(fStream);

				string[] content = File.ReadAllLines(templateName);

				for (int lineNumber = 0; lineNumber < content.Length; lineNumber++)
				{
					string line = content[lineNumber].Trim();
					Match match = searchPattern.Match(line);

					if (match.Success && match.Groups.Count == 2 && match.Groups[1].Value != null)
					{
						if (!File.Exists(baseFolder + match.Groups[1].Value))
						{
							throw new FileNotFoundException(baseFolder + match.Groups[1].Value + " does not exist.");
						}

						ParseFile(baseFolder + match.Groups[1].Value);
					}
					else
					{
						textOut.WriteLine(content[lineNumber]);
					}
				}

				return 0;
			}
			catch (Exception ex)
			{
				Console.WriteLine(ex.ToString());
				//Console.WriteLine("Error while parsing.");
				return 3;
			}
			finally
			{
				if (textOut != null)
				{
					textOut.Flush();
					textOut.Close();
				}
			}
		}

		private static void ParseFile(string fileName)
		{
			int lineNumber = 0;
			string line;
			Match match;
			string[] content = File.ReadAllLines(fileName);

            if (fileName.Contains("AssemblyInfo.cs"))
            {
				while (content[lineNumber].Trim().StartsWith("using") && lineNumber < content.Length)
				{
					lineNumber++;
				}
                lineNumber++;
            }
            else
            {
				while (!(content[lineNumber].Trim().StartsWith("namespace")) && lineNumber < content.Length)
				{
					lineNumber++;
				}
                //lineNumber += 2;
            }

			for (; lineNumber < content.Length; lineNumber++)
			{
				line = content[lineNumber].Trim();
				match = searchPattern.Match(line);

				if (match.Success && match.Groups.Count == 2 && match.Groups[1].Value != null)
				{
					if (!File.Exists(baseFolder + match.Groups[1].Value))
					{
						throw new FileNotFoundException(baseFolder + match.Groups[1].Value + " does not exist.");
					}

					ParseFile(baseFolder + match.Groups[1].Value);
				}
				else
				{
					textOut.WriteLine(content[lineNumber]);
				}
			}
		}
	}
}