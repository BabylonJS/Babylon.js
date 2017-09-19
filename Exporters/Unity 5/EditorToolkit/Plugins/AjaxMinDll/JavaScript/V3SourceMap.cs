// V3SourceMap.cs
//
// Copyright 2012 Microsoft Corporation
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace Microsoft.Ajax.Utilities
{
    /// <summary>
    /// Standard JSON source map format, version 3
    /// </summary>
    public sealed class V3SourceMap : ISourceMap
    {
        #region private fields 

        private string m_minifiedPath;

        private string m_mapPath;

        private TextWriter m_writer;

        private int m_maxMinifiedLine;

        /// <summary>whether we have output a property yet</summary>
        private bool m_hasProperty;

        private HashSet<string> m_sourceFiles;

        private List<string> m_sourceFileList;

        private HashSet<string> m_names;

        private List<string> m_nameList;

        private List<Segment> m_segments;

        private int m_lastDestinationLine;

        private int m_lastDestinationColumn;

        private int m_lastSourceLine;

        private int m_lastSourceColumn;

        private int m_lastFileIndex;

        private int m_lastNameIndex;

        private int m_lineOffset;

        private int m_columnOffset;

        private static string s_base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

        #endregion

        /// <summary>
        /// Gets or sets an optional source root URI that will be added to the map object as the sourceRoot property if set
        /// </summary>
        public string SourceRoot
        {
            get;
            set;
        }

        /// <summary>
        /// Gets or sets a flag indicating whether or not to prepend the map file with an XSSI (cross-site script injection) protection string
        /// </summary>
        public bool SafeHeader
        {
            get;
            set;
        }

        public static string ImplementationName
        {
            get { return "V3"; }
        }

        public string Name
        {
            get { return ImplementationName; }
        }

        public V3SourceMap(TextWriter writer)
        {
            m_writer = writer;

            // source files normally aren't duplicated, so this is a bit of over-kill.
            // if we do get duplicated source files in the code, let's treat different
            // cases as different files for those folks who work on operating systems that care
            // about file-path case.
            m_sourceFiles = new HashSet<string>();
            m_sourceFileList = new List<string>();

            // names are case-sensitive
            m_names = new HashSet<string>();
            m_nameList = new List<string>();

            // segments is a list
            m_segments = new List<Segment>();

            // set all the "last" values to -1 to indicate that
            // we don't have a value from which to generate an offset.
            m_lastDestinationLine = -1;
            m_lastDestinationColumn = -1;
            m_lastSourceLine = -1;
            m_lastSourceColumn = -1;
            m_lastFileIndex = -1;
            m_lastNameIndex = -1;

            // offsets
            m_lineOffset = 0;
            m_columnOffset = 0;
        }

        #region ISourceMap implementation

        /// <summary>
        /// Called when we start a new minified output file
        /// </summary>
        /// <param name="sourcePath">output file path</param>
        public void StartPackage(string sourcePath, string mapPath)
        {
            m_minifiedPath = sourcePath;
            m_mapPath = mapPath;
        }

        /// <summary>
        /// Called when we end a minified output file. write all the accumulated 
        /// data to the stream.
        /// </summary>
        public void EndPackage()
        {
            // nothing to do
        }

        /// <summary>
        /// A new line has been inserted into the output code, so adjust the offsets accordingly
        /// for the next run.
        /// </summary>
        public void NewLineInsertedInOutput()
        {
            m_columnOffset = 0;
            ++m_lineOffset;
        }

        /// <summary>
        /// Signal the end of an output run by sending the NEXT position in the output
        /// </summary>
        /// <param name="lineNumber">0-based line number</param>
        /// <param name="columnPosition">0-based column position</param>
        public void EndOutputRun(int lineNumber, int columnPosition)
        {
            // the values are one-based, but we want a delta - so subtract one from them.
            // for example, if the run ends on line 35 column 12, when the next position comes 
            // in as line 0, column 0, we end up reporting that position at line 35 (0 + 35) column 12 (0 + 12).
            m_lineOffset += lineNumber;
            m_columnOffset += columnPosition;
        }

        public object StartSymbol(AstNode node, int startLine, int startColumn)
        {
            // we don't care about the start/end methods -- we only care about segments
            return null;
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2233:OperationsShouldNotOverflow", MessageId = "startLine+1")]
        public void MarkSegment(AstNode node, int startLine, int startColumn, string name, Context context)
        {
            if (startLine == int.MaxValue)
            {
                throw new ArgumentOutOfRangeException("startLine");
            }

            // add the offsets
            startLine += m_lineOffset;
            startColumn += m_columnOffset;

            // if we have a name, try adding it to the hash set of names. If it already exists, the call to Add
            // will return false. If it doesn't already exist, Add will return true and we'll append it to the list
            // of names. That way we have a nice list of names ordered by their first occurrence in the minified file.
            if (!string.IsNullOrEmpty(name) && m_names.Add(name))
            {
                m_nameList.Add(name);
            }

            // if this is a newline, the startline will be bigger than the largest line we've had so far
            m_maxMinifiedLine = Math.Max(m_maxMinifiedLine, startLine);

            // save the file context in our list of files
            if (context != null && context.Document != null && context.Document.FileContext != null)
            {
                // if this is the first instance of this file...
                if (m_sourceFiles.Add(context.Document.FileContext))
                {
                    // ...add it to the list, so we end up with a list of unique files
                    // sorted by their first occurence in the minified file.
                    m_sourceFileList.Add(MakeRelative(context.Document.FileContext, m_mapPath));
                }
            }

            // create the segment object and add it to the list.
            // the destination line/col numbers are zero-based. The format expects line to be 1-based and col 0-based.
            // the context line is one-based; col is zero-based. The format expects both to be zero-based.
            var segment = CreateSegment(
                startLine + 1,
                startColumn,
                context == null || context.StartLineNumber < 1 ? -1 : context.StartLineNumber - 1,
                context == null || context.StartColumn < 0 ? -1 : context.StartColumn,
                context.IfNotNull(c => MakeRelative(c.Document.FileContext, m_mapPath)),
                name);

            m_segments.Add(segment);
        }

        public void EndSymbol(object symbol, int endLine, int endColumn, string parentContext)
        {
            // not important
        }

        public void EndFile(TextWriter writer, string newLine)
        {
            // we want to output to the text stream a comment in the format of:
            //      //# sourceMappingURL=<uri>
            // where the URI is the relative uri from m_minifiedPath to the map file
            if (writer != null && !m_mapPath.IsNullOrWhiteSpace())
            {
                // make relative to output, don't just output the mapfile path as-is.
                // and it's supposed to be a URL anyway
                writer.Write(newLine);

                // the original spec called for //@ but that gets confused with IE's conditional-compilation
                // syntax. So wrap it in multi-line comments so it works everywhere.
                //writer.Write("/*");
                //writer.Write(newLine);
                //writer.Write("//@ sourceMappingURL={0}", MakeRelative(m_mapPath, m_minifiedPath));
                //writer.Write(newLine);
                //writer.Write("*/");

                // eventually, though, the spec changed to //# -- the tools appear to have caught up, so
                // let's use that syntax now.
                writer.Write("//# sourceMappingURL={0}", MakeRelative(m_mapPath, m_minifiedPath));
                writer.Write(newLine);
            }
        }

        public void Dispose()
        {
            // if we have a writer, output the JSON object now
            if (m_writer != null)
            {
                // if we want to add the cross-site script injection protection string,
                // do it now at the top of the file as it's own line
                if (SafeHeader)
                {
                    m_writer.WriteLine(")]}'");
                }

                // start the JSON object
                m_writer.WriteLine("{");

                WriteProperty("version", 3);
                WriteProperty("file", MakeRelative(m_minifiedPath, m_mapPath));

                // line number comes in zero-based, so add one to get the line count
                WriteProperty("lineCount", m_maxMinifiedLine + 1);

                WriteProperty("mappings", GenerateMappings(m_sourceFileList, m_nameList));

                // if we have a source root, add the property now
                if (!SourceRoot.IsNullOrWhiteSpace())
                {
                    WriteProperty("sourceRoot", SourceRoot);
                }

                WriteProperty("sources", m_sourceFileList);
                WriteProperty("names", m_nameList);

                // close the JSON object
                m_writer.WriteLine();
                m_writer.WriteLine("}");

                m_writer.Close();
                m_writer = null;
            }
        }

        #endregion

        #region GenerateMappings method

        private Segment CreateSegment(int destinationLine, int destinationColumn, int sourceLine, int sourceColumn, string fileName, string symbolName)
        {
            // create the segment with relative offsets for the destination column, source line, and source column.
            // destination line should be absolute. Destination column resets to absolute whenever the destination line advances.
            var segment = new Segment()
            {
                DestinationLine = destinationLine,
                DestinationColumn = m_lastDestinationColumn < 0 || m_lastDestinationLine < destinationLine ? destinationColumn : destinationColumn - m_lastDestinationColumn,
                SourceLine = fileName == null ? -1 : m_lastSourceLine < 0 ? sourceLine : sourceLine - m_lastSourceLine,
                SourceColumn = fileName == null ? -1 : m_lastSourceColumn < 0 ? sourceColumn : sourceColumn - m_lastSourceColumn,
                FileName = fileName,
                SymbolName = symbolName
            };

            // set the new "last" values
            m_lastDestinationLine = destinationLine;
            m_lastDestinationColumn = destinationColumn;

            // if there was a source location, set the last source line/col
            if (!string.IsNullOrEmpty(fileName))
            {
                m_lastSourceLine = sourceLine;
                m_lastSourceColumn = sourceColumn;
            }

            return segment;
        }

        private string GenerateMappings(IList<string> fileList, IList<string> nameList)
        {
            var sb = StringBuilderPool.Acquire();
            try
            {
                var currentLine = 1;
                foreach (var segment in m_segments)
                {
                    if (currentLine < segment.DestinationLine)
                    {
                        // we've jumped forward at least one line in the minified file.
                        // add a semicolon for each line we've advanced
                        do
                        {
                            sb.Append(';');
                        }
                        while (++currentLine < segment.DestinationLine);
                    }
                    else if (sb.Length > 0)
                    {
                        // same line; separate segments by comma. But only
                        // if we've already output something
                        sb.Append(',');
                    }

                    EncodeNumbers(sb, segment, fileList, nameList);
                }

                return sb.ToString();
            }
            finally
            {
                sb.Release();
            }
        }

        private void EncodeNumbers(StringBuilder sb, Segment segment, IList<string> files, IList<string> names)
        {
            // there should always be a destination column
            EncodeNumber(sb, segment.DestinationColumn);

            // if there's a source file...
            if (!segment.FileName.IsNullOrWhiteSpace())
            {
                // get the index from the list and encode it into the builder
                // relative to the last file index.
                var thisIndex = files.IndexOf(segment.FileName);
                EncodeNumber(sb, m_lastFileIndex < 0 ? thisIndex : thisIndex - m_lastFileIndex);
                m_lastFileIndex = thisIndex;

                // add the source line and column
                EncodeNumber(sb, segment.SourceLine);
                EncodeNumber(sb, segment.SourceColumn);

                // if there's a symbol name, get its index and encode it into the builder
                // relative to the last name index.
                if (!string.IsNullOrEmpty(segment.SymbolName))
                {
                    thisIndex = names.IndexOf(segment.SymbolName);
                    EncodeNumber(sb, m_lastNameIndex < 0 ? thisIndex : thisIndex - m_lastNameIndex);
                    m_lastNameIndex = thisIndex;
                }
            }
        }

        private static void EncodeNumber(StringBuilder sb, int value)
        {
            // first get the signed vlq value. it uses bit0 as the sign.
            // if the value is negative, shift the positive version over left one and OR a 1.
            // if the value is zero or positive, just shift it over one (bit0 will be zero).
            value = value < 0 ? (-value << 1) | 1 : (value << 1);

            do
            {
                // pull off the last 5 bits of the value. Because value is guaranteed to be
                // positive at this point, we don't have to worry about the int's sign bit
                // filling in the places as we shift right.
                var digit = value & 0x1f;
                value >>= 5;

                // if there is still something left, then we need to set the
                // continuation bit (bit6) to a 1
                if (value > 0)
                {
                    digit |= 0x20;
                }

                // this leaves us with a 6-bit value (between 0 and 63)
                // which we then BASE64 encode and add to the string builder.
                // and if there's anything left, loop around again.
                sb.Append(s_base64[digit]);
            }
            while (value > 0);
        }

        #endregion

        #region private helper methods

        private static string MakeRelative(string path, string relativeFrom)
        {
            // if either one is null or blank, just return the original path
            if (!path.IsNullOrWhiteSpace() && !relativeFrom.IsNullOrWhiteSpace())
            {
                try
                {
                    var fromUri = new Uri(Normalize(relativeFrom));
                    var toUri = new Uri(Normalize(path));
                    var relativeUrl = fromUri.MakeRelativeUri(toUri);

                    return relativeUrl.ToString();
                }
                catch (UriFormatException)
                {
                    // catch and return the original path
                }
            }

            return path;
        }

        private static string Normalize(string path)
        {
            return Path.IsPathRooted(path) ? path : Path.Combine(Environment.CurrentDirectory, path);
        }

        private void WriteProperty(string name, int number)
        {
            WritePropertyStart(name);
            m_writer.Write(number.ToStringInvariant());
        }

        private void WriteProperty(string name, string text)
        {
            WritePropertyStart(name);
            OutputEscapedString(text ?? string.Empty);
        }

        private void WriteProperty(string name, ICollection<string> collection)
        {
            WritePropertyStart(name);
            m_writer.Write('[');

            var first = true;
            foreach (var item in collection)
            {
                if (first)
                {
                    first = false;
                }
                else
                {
                    m_writer.Write(',');
                }

                OutputEscapedString(item);
            }

            m_writer.Write(']');
        }

        private void WritePropertyStart(string name)
        {
            if (m_hasProperty)
            {
                m_writer.WriteLine(',');
            }

            OutputEscapedString(name);
            m_writer.Write(':');
            m_hasProperty = true;
        }

        private void OutputEscapedString(string text)
        {
            m_writer.Write('"');
            for (var ndx = 0; ndx < text.Length; ++ndx)
            {
                var ch = text[ndx];
                switch (ch)
                {
                    case '\"':
                        m_writer.Write("\\\"");
                        break;

                    case '\b':
                        m_writer.Write("\\b");
                        break;

                    case '\f':
                        m_writer.Write("\\f");
                        break;

                    case '\n':
                        m_writer.Write("\\n");
                        break;

                    case '\r':
                        m_writer.Write("\\r");
                        break;

                    case '\t':
                        m_writer.Write("\\t");
                        break;

                    default:
                        if (ch < ' ')
                        {
                            // other control characters must be escaped as \uXXXX
                            m_writer.Write("\\u{0:x4}", (int)ch);
                        }
                        else
                        {
                            // just append it. The output encoding will take care of the rest
                            m_writer.Write(ch);
                        }
                        break;
                }
            }

            m_writer.Write('"');
        }

        #endregion

        private class Segment
        {
            public int DestinationLine { get; set; }
            public int DestinationColumn { get; set; }
            public int SourceLine { get; set; }
            public int SourceColumn { get; set; }

            public string FileName { get; set; }
            public string SymbolName { get; set; }
        }
    }
}
