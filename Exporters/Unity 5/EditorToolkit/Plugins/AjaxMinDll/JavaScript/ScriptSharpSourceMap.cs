// ScriptSharpSourceMap.cs
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
using System.Security.Cryptography;
using System.Xml;

namespace Microsoft.Ajax.Utilities
{
    public sealed class ScriptSharpSourceMap : ISourceMap
    {
        private readonly XmlWriter m_writer;
        private string m_currentPackagePath;
        private string m_mapPath;
        private Dictionary<string, int> m_sourceFileIndexMap = new Dictionary<string, int>();
        private int currentIndex;
        private int m_lineOffset;
        private int m_columnOffset;

        /// <summary>
        /// Gets or sets an optional source root URI that will be added to the map object as the sourceRoot property if set
        /// </summary>
        public string SourceRoot
        {
            get;
            set;
        }

        /// <summary>
        /// Gets or sets a flag indicating whether or not to add a "safe" header to the map output file
        /// (not used by this implementation)
        /// </summary>
        public bool SafeHeader
        {
            get;
            set;
        }

        public static string ImplementationName
        {
            get { return "XML"; }
        }

        public string Name
        {
            get { return ImplementationName; }
        }

        public ScriptSharpSourceMap(TextWriter writer)
        {
            if (writer == null)
            {
                throw new ArgumentNullException("writer");
            }

            var settings = new XmlWriterSettings()
                {
                    CloseOutput = true,
                    Indent = true
                };
            m_writer = XmlWriter.Create(writer, settings);

            m_writer.WriteStartDocument();
            m_writer.WriteStartElement("map");
            JavaScriptSymbol.WriteHeadersTo(m_writer);
            m_writer.WriteStartElement("scriptFiles");
        }

        public void StartPackage(string sourcePath, string mapPath)
        {
            m_currentPackagePath = sourcePath;
            m_mapPath = mapPath;

            m_writer.WriteStartElement("scriptFile");
            m_writer.WriteAttributeString("path", MakeRelative(sourcePath, m_mapPath) ?? string.Empty);
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Security.Cryptography", "CA5350:MD5CannotBeUsed", Justification="not using for encryption, just a checksum")]
        public void EndPackage()
        {
            if (m_currentPackagePath.IsNullOrWhiteSpace())
            {
                return;
            }

            // Compute and print the output script checksum and close the scriptFile element
            // the checksum can be used to determine whether the symbols map file is still valid
            // or if the script has been tempered with
            using (FileStream stream = new FileStream(m_currentPackagePath, FileMode.Open))
            {
                using (MD5 md5 = MD5.Create())
                {
                    byte[] checksum = md5.ComputeHash(stream);

                    m_writer.WriteStartElement("checksum");
                    m_writer.WriteAttributeString("value", BitConverter.ToString(checksum));
                    m_writer.WriteEndElement(); //checksum
                    m_writer.WriteEndElement(); //scriptFile
                }
            }

            m_currentPackagePath = null;
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
            if (node != null 
                && !node.Context.Document.IsGenerated)
            {
                return JavaScriptSymbol.StartNew(node, startLine + m_lineOffset, startColumn + m_columnOffset, GetSourceFileIndex(node.Context.Document.FileContext));
            }

            return null;
        }

        public void MarkSegment(AstNode node, int startLine, int startColumn, string name, Context context)
        {
            if (node == null || string.IsNullOrEmpty(name))
            {
                return;
            }

            // see if this is within a function object node, 
            // AND if this segment has the same name as the function name
            // AND this context isn't the same as the entire function context.
            // this should only be true for the function NAME segment.
            var functionObject = node as FunctionObject;
            if (functionObject != null 
                && functionObject.Binding != null
                && string.CompareOrdinal(name, functionObject.Binding.Name) == 0
                && context != functionObject.Context)
            {
                // adjust the offsets
                startLine += m_lineOffset;
                startColumn += m_columnOffset;

                // it does -- so this is the segment that corresponds to the function object's name, which
                // for this format we want to output a separate segment for. It used to be its own Lookup
                // node child of the function object, so we need to create a fake node here, start a new 
                // symbol from it, end the symbol, then write it.
                var fakeLookup = new Lookup(context) { Name = name };
                var nameSymbol = JavaScriptSymbol.StartNew(fakeLookup, startLine, startColumn, GetSourceFileIndex(functionObject.Context.Document.FileContext));

                // the name will never end on a different line -- it's a single unbreakable token. The length is just
                // the length of the name, so add that number to the column start. And the parent context is the function
                // name (again)
                nameSymbol.End(startLine, startColumn + name.Length, name);
                nameSymbol.WriteTo(m_writer);
            }
        }

        public void EndSymbol(object symbol, int endLine, int endColumn, string parentContext)
        {
            if (symbol == null)
            {
                return;
            }

            // adjust the offsets
            endLine += m_lineOffset;
            endColumn += m_columnOffset;

            var javaScriptSymbol = (JavaScriptSymbol)symbol;
            javaScriptSymbol.End(endLine, endColumn, parentContext);
            javaScriptSymbol.WriteTo(m_writer);
        }

        public void EndFile(TextWriter writer, string newLine)
        {
            // do nothing.
        }

        public void Dispose()
        {
            EndPackage();

            m_writer.WriteEndElement(); //scriptFiles
            m_writer.WriteStartElement("sourceFiles");

            foreach (KeyValuePair<string, int> kvp in m_sourceFileIndexMap)
            {
                m_writer.WriteStartElement("sourceFile");
                m_writer.WriteAttributeString("id", kvp.Value.ToStringInvariant());
                m_writer.WriteAttributeString("path", MakeRelative(kvp.Key, m_mapPath) ?? string.Empty);
                m_writer.WriteEndElement(); //file
            }

            m_writer.WriteEndElement(); //sourceFiles
            m_writer.WriteEndElement(); //map
            m_writer.WriteEndDocument();
            m_writer.Close();
        }

        private int GetSourceFileIndex(string fileName)
        {
            int index;
            if (!m_sourceFileIndexMap.TryGetValue(fileName, out index))
            {
                index = ++currentIndex;
                m_sourceFileIndexMap.Add(fileName, index);
            }

            return index;
        }

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

        #region internal symbol object class

        private class JavaScriptSymbol
        {
            private const string SymbolDataFormat = "{0},{1},{2},{3},{4},{5},{6},{7},{8},{9},{10},{11},{12}";
            private int m_startLine;
            private int m_endLine;
            private int m_startColumn;
            private int m_endColumn;
            private Context m_sourceContext;
            private int m_sourceFileId;
            private string m_symbolType;
            private string m_parentFunction;

            private JavaScriptSymbol() { }

            public static JavaScriptSymbol StartNew(AstNode node, int startLine, int startColumn, int sourceFileId)
            {
                if (startLine == int.MaxValue)
                {
                    throw new ArgumentOutOfRangeException("startLine");
                }

                if (startColumn == int.MaxValue)
                {
                    throw new ArgumentOutOfRangeException("startColumn");
                }

                return new JavaScriptSymbol
                {
                    // destination line/col number are fed to us as zero-based, so add one to get to
                    // the one-based values we desire. Context objects store the source line/col as
                    // one-based already.
                    m_startLine = startLine + 1,
                    m_startColumn = startColumn + 1,
                    m_sourceContext = node != null ? node.Context : null,
                    m_symbolType = node != null ? node.GetType().Name : "[UNKNOWN]",
                    m_sourceFileId = sourceFileId,
                };
            }

            public void End(int endLine, int endColumn, string parentFunction)
            {
                if (endLine == int.MaxValue)
                {
                    throw new ArgumentOutOfRangeException("endLine");
                }

                if (endColumn == int.MaxValue)
                {
                    throw new ArgumentOutOfRangeException("endColumn");
                }

                // destination line/col number are fed to us as zero-based, so add one to get to
                // the one-based values we desire.
                m_endLine = endLine + 1;
                m_endColumn = endColumn + 1;
                m_parentFunction = parentFunction;
            }

            public static void WriteHeadersTo(XmlWriter writer)
            {
                if (writer != null)
                {
                    writer.WriteStartElement("headers");
                    writer.WriteString(SymbolDataFormat.FormatInvariant(
                        "DstStartLine",
                        "DstStartColumn",
                        "DstEndLine",
                        "DstEndColumn",
                        "SrcStartPosition",
                        "SrcEndPosition",
                        "SrcStartLine",
                        "SrcStartColumn",
                        "SrcEndLine",
                        "SrcEndColumn",
                        "SrcFileId",
                        "SymbolType",
                        "ParentFunction"));

                    writer.WriteEndElement(); //headers
                }
            }

            public void WriteTo(XmlWriter writer)
            {
                if (writer != null)
                {
                    writer.WriteStartElement("s");
                    writer.WriteString(SymbolDataFormat.FormatInvariant(
                        m_startLine,
                        m_startColumn,
                        m_endLine,
                        m_endColumn,
                        m_sourceContext.StartPosition - m_sourceContext.SourceOffsetStart,
                        m_sourceContext.EndPosition - m_sourceContext.SourceOffsetEnd,
                        m_sourceContext.StartLineNumber,
                        m_sourceContext.StartColumn,
                        m_sourceContext.EndLineNumber,
                        m_sourceContext.EndColumn,
                        m_sourceFileId,
                        m_symbolType,
                        m_parentFunction));

                    writer.WriteEndElement(); //s
                }
            }
        }

        #endregion
    }
}
