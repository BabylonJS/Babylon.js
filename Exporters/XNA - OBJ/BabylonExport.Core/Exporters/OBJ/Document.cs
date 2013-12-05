
using System.Collections.Generic;
using System.IO;
using System.Collections.ObjectModel;

namespace BabylonExport.Core
{
    internal class Document<T> where T : Line, new()
    {
        ReadOnlyCollection<List<T>> blocks;

        public Document(string text)
        {
            int lineIndex = 0;
            List<T> tempLines = null;
            List<List<T>> tempBlocks = new List<List<T>>();
            string previousHeader = "";
            var lines = text.Split('\n');

            for (int index = 0; index < lines.Length; index++)
            {
                T line = new T { Index = lineIndex++ };

                string lineContent = "";

                bool multiline;
                do
                {
                    multiline = false;
                    lineContent += lines[index].Trim();
                    if (lineContent.EndsWith("\\"))
                    {
                        multiline = true;
                        lineContent = lineContent.Substring(0, lineContent.Length - 1);
                        index++;
                    }
                }
                while (multiline);

                line.SetLine(lineContent);

                if (!line.IsValid)
                    continue;

                if ((line.Tokens[0] == line.BlockSperator && previousHeader != line.BlockSperator) || tempLines == null)
                {
                    tempLines = new List<T>();
                    tempBlocks.Add(tempLines);
                }
                tempLines.Add(line);
                previousHeader = line.Tokens[0];
            }

            blocks = new ReadOnlyCollection<List<T>>(tempBlocks);
        }

        public ReadOnlyCollection<List<T>> Blocks
        {
            get { return blocks; }
        }
    }
}
