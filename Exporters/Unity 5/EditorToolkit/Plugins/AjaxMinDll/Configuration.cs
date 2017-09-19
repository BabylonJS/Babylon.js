// AjaxMinBuild.cs
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

namespace Microsoft.Ajax.Utilities.Configuration
{
    using System;
    using System.Collections.Generic;
    using System.Xml;

    public static class ManifestFactory
    {
        #region constants

        private const string ArgumentsElementName = "arguments";
        private const string OutputElementName = "output";
        private const string ResourceElementName = "resource";
        private const string InputElementName = "input";
        private const string SymbolMapElementName = "symbolMap";
        private const string RenameElementName = "rename";
        private const string NoRenameElementName = "norename";

        private const string PathAttributeName = "path";
        private const string EncodingAttributeName = "encoding";
        private const string EncodingAttributeShortName = "enc";
        private const string TypeAttributeName = "type";
        private const string OriginAttributeName = "origin";
        private const string MapPathAttributeName = "mappath";
        private const string SourceRootAttributeName = "sourceRoot";
        private const string SafeAttributeName = "safe";
        private const string NameAttributeName = "name";
        private const string OptionalAttributeName = "optional";
        private const string ConfigAttributeName = "config";
        private const string FromAttributeName = "from";
        private const string ToAttributeName = "to";
        private const string IdentifierAttributeName = "id";

        #endregion

        #region public methods

        public static Manifest Create(XmlReader reader)
        {
            if (reader == null)
            {
                throw new ArgumentNullException("reader");
            }

            var configurationNode = new Manifest();
            // no attributes on the root node; just process child elements
            while (reader.Read())
            {
                if (reader.NodeType == XmlNodeType.Element)
                {
                    switch (reader.Name)
                    {
                        case ArgumentsElementName:
                            ReadArgumentsElement(reader.ReadSubtree(), configurationNode.DefaultArguments);
                            break;

                        case OutputElementName:
                            configurationNode.Outputs.Add(ReadOutputElement(reader.ReadSubtree()));
                            break;

                        case RenameElementName:
                            ReadRenameElement(reader.ReadSubtree(), configurationNode.RenameIdentifiers);
                            break;

                        case NoRenameElementName:
                            ReadNoRenameElement(reader.ReadSubtree(), configurationNode.NoRenameIdentifiers);
                            break;
                    }
                }
            }

            reader.Close();
            return configurationNode;
        }

        #endregion

        #region private read methods

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1502:AvoidExcessiveComplexity")]
        private static OutputGroup ReadOutputElement(XmlReader reader)
        {
            var outputNode = new OutputGroup();
            while (reader.Read())
            {
                // get the attributes
                if (reader.Name == OutputElementName && reader.HasAttributes)
                {
                    while (reader.MoveToNextAttribute())
                    {
                        switch (reader.Name)
                        {
                            case PathAttributeName:
                                outputNode.Path = reader.Value;
                                break;

                            case EncodingAttributeName:
                            case EncodingAttributeShortName:
                                outputNode.EncodingName = reader.Value;
                                break;

                            case TypeAttributeName:
                                switch (reader.Value.ToUpperInvariant())
                                {
                                    case "JS":
                                    case "JAVASCRIPT":
                                    case "JSCRIPT":
                                        outputNode.CodeType = CodeType.JavaScript;
                                        break;

                                    case "CSS":
                                    case "STYLESHEET":
                                    case "STYLESHEETS":
                                        outputNode.CodeType = CodeType.StyleSheet;
                                        break;
                                }
                                break;

                            case MapPathAttributeName:
                                outputNode.SymbolMap = new SymbolMap()
                                {
                                    Path = reader.Value
                                };
                                break;
                        }
                    }

                    // back to element
                    reader.MoveToElement();
                }

                // process child elements
                if (reader.NodeType == XmlNodeType.Element)
                {
                    switch (reader.Name)
                    {
                        case ArgumentsElementName:
                            ReadArgumentsElement(reader.ReadSubtree(), outputNode.Arguments);
                            break;

                        case RenameElementName:
                            ReadRenameElement(reader.ReadSubtree(), outputNode.RenameIdentifiers);
                            break;

                        case NoRenameElementName:
                            ReadNoRenameElement(reader.ReadSubtree(), outputNode.NoRenameIdentifiers);
                            break;

                        case SymbolMapElementName:
                            outputNode.SymbolMap = ReadSymbolMapElement(reader.ReadSubtree());
                            break;

                        case ResourceElementName:
                            outputNode.Resources.Add(ReadResourceElement(reader.ReadSubtree()));
                            break;

                        case InputElementName:
                            outputNode.Inputs.Add(ReadInputElement(reader.ReadSubtree()));
                            break;
                    }
                }
            }

            reader.Close();
            return outputNode;
        }

        private static void ReadRenameElement(XmlReader reader, IDictionary<string, string> renameIdentifiers)
        {
            string fromIdentifier = null;
            string toIdentifier = null;
            
            reader.Read();
            while (reader.MoveToNextAttribute())
            {
                switch (reader.Name)
                {
                    case FromAttributeName:
                        fromIdentifier = reader.Value;
                        break;

                    case ToAttributeName:
                        toIdentifier = reader.Value;
                        break;
                }
            }

            // must exist and be unique (ignore duplicates)
            if (!fromIdentifier.IsNullOrWhiteSpace() && !toIdentifier.IsNullOrWhiteSpace()
                && JSScanner.IsValidIdentifier(fromIdentifier)
                && JSScanner.IsValidIdentifier(toIdentifier))
            {
                renameIdentifiers[fromIdentifier] = toIdentifier;
            }

            reader.Close();
        }

        private static void ReadNoRenameElement(XmlReader reader, ICollection<string> noRenameIdentifiers)
        {
            string identifier = null;

            reader.Read();
            while (reader.MoveToNextAttribute())
            {
                switch (reader.Name)
                {
                    case IdentifierAttributeName:
                        identifier = reader.Value;
                        break;

                    case NameAttributeName:
                        identifier = reader.Value;
                        break;
                }
            }

            // must exist and be unique (ignore duplicates)
            if (!identifier.IsNullOrWhiteSpace()
                && JSScanner.IsValidIdentifier(identifier))
            {
                noRenameIdentifiers.Add(identifier);
            }

            reader.Close();
        }

        private static SymbolMap ReadSymbolMapElement(XmlReader reader)
        {
            bool flag;
            var symbolMapNode = new SymbolMap();
            while (reader.Read())
            {
                // attributes, no child elements
                if (reader.Name == SymbolMapElementName && reader.HasAttributes)
                {
                    while (reader.MoveToNextAttribute())
                    {
                        switch (reader.Name)
                        {
                            case NameAttributeName:
                                symbolMapNode.Name = reader.Value;
                                break;

                            case PathAttributeName:
                                symbolMapNode.Path = reader.Value;
                                break;

                            case SourceRootAttributeName:
                                symbolMapNode.SourceRoot = reader.Value;
                                break;

                            case SafeAttributeName:
                                if (bool.TryParse(reader.Value, out flag))
                                {
                                    symbolMapNode.SafeHeader = flag;
                                }
                                break;
                        }
                    }

                    // back to element
                    reader.MoveToElement();
                }
            }

            reader.Close();
            return symbolMapNode;
        }

        private static Resource ReadResourceElement(XmlReader reader)
        {
            bool optional;
            var resourceNode = new Resource();
            while (reader.Read())
            {
                // attributes, no child elements
                if (reader.Name == ResourceElementName && reader.HasAttributes)
                {
                    while (reader.MoveToNextAttribute())
                    {
                        switch (reader.Name)
                        {
                            case NameAttributeName:
                                resourceNode.Name = reader.Value;
                                break;

                            case PathAttributeName:
                                resourceNode.Path = reader.Value;
                                break;

                            case OptionalAttributeName:
                                if (bool.TryParse(reader.Value, out optional))
                                {
                                    resourceNode.Optional = optional;
                                }
                                break;
                        }
                    }

                    // back to element
                    reader.MoveToElement();
                }
            }

            reader.Close();
            return resourceNode;
        }

        private static InputFile ReadInputElement(XmlReader reader)
        {
            bool optional;
            var inputNode = new InputFile();
            while (reader.Read())
            {
                // attributes, no child elements
                if (reader.Name == InputElementName && reader.HasAttributes)
                {
                    while (reader.MoveToNextAttribute())
                    {
                        switch (reader.Name)
                        {
                            case PathAttributeName:
                                inputNode.Path = reader.Value;
                                break;

                            case EncodingAttributeName:
                            case EncodingAttributeShortName:
                                inputNode.EncodingName = reader.Value;
                                break;

                            case OptionalAttributeName:
                                if (bool.TryParse(reader.Value, out optional))
                                {
                                    inputNode.Optional = optional;
                                }
                                break;

                            case OriginAttributeName:
                                // only supported value is "external" -- all others default to project
                                inputNode.Origin = reader.Value.Equals("EXTERNAL", StringComparison.OrdinalIgnoreCase)
                                    ? SourceOrigin.External
                                    : SourceOrigin.Project;
                                break;
                        }
                    }

                    // back to element
                    reader.MoveToElement();
                }
            }

            reader.Close();
            return inputNode;
        }

        private static void ReadArgumentsElement(XmlReader reader, IDictionary<string, string> configDictionary)
        {
            while (reader.Read())
            {
                string targetConfiguration = null;
                if (reader.Name == ArgumentsElementName)
                {
                    if (reader.HasAttributes)
                    {
                        while (reader.MoveToNextAttribute())
                        {
                            if (reader.Name == ConfigAttributeName)
                            {
                                targetConfiguration = reader.Value.Trim();
                                break;
                            }
                        }

                        // back to element
                        reader.MoveToElement();
                    }

                    // get the string content of the element and add it to the dictionary
                    // using the target config as the key (or an empty string if there was no target)
                    var arguments = reader.ReadString();
                    configDictionary[targetConfiguration ?? string.Empty] = arguments;
                    break;
                }
            }

            reader.Close();
        }

        #endregion
    }

    public class Manifest
    {
        public IDictionary<string,string> DefaultArguments { get; private set; }
        public IDictionary<string, string> RenameIdentifiers { get; private set; }
        public ICollection<string> NoRenameIdentifiers { get; private set; }
        public IList<OutputGroup> Outputs { get; private set; }

        public Manifest()
        {
            Outputs = new List<OutputGroup>();
            DefaultArguments = new Dictionary<string, string>();
            RenameIdentifiers = new Dictionary<string, string>();
            NoRenameIdentifiers = new HashSet<string>();
        }
    }

    public class OutputGroup
    {
        public string Path { get; set; }
        public string EncodingName { get; set; }
        public CodeType CodeType { get; set; }

        public SymbolMap SymbolMap { get; set; }

        public IDictionary<string, string> Arguments { get; private set; }
        public IDictionary<string, string> RenameIdentifiers { get; private set; }
        public ICollection<string> NoRenameIdentifiers { get; private set; }
        public IList<Resource> Resources { get; private set; }
        public IList<InputFile> Inputs { get; private set; }

        public OutputGroup()
        {
            Resources = new List<Resource>();
            Inputs = new List<InputFile>();
            Arguments = new Dictionary<string, string>();
            RenameIdentifiers = new Dictionary<string, string>();
            NoRenameIdentifiers = new HashSet<string>();
        }
    }

    public class SymbolMap
    {
        public string Path { get; set; }
        public string Name { get; set; }
        public string SourceRoot { get; set; }
        public bool? SafeHeader { get; set; }
    }

    public class Resource
    {
        public string Path { get; set; }
        public string Name { get; set; }
        public bool Optional { get; set; }
    }

    public class InputFile
    {
        public string Path { get; set; }
        public string EncodingName { get; set; }
        public bool Optional { get; set; }
        public SourceOrigin Origin { get; set; }
    }

    /// <summary>
    /// Type of code to process
    /// </summary>
    public enum CodeType
    {
        /// <summary>Unknown - cannot tell from output, input, or hint</summary>
        Unknown = 0,

        /// <summary>JavaScript source code</summary>
        JavaScript,

        /// <summary>CSS Stylesheet source code</summary>
        StyleSheet,

        /// <summary>A mix of input types; error condition</summary>
        Mix,
    }

    /// <summary>
    /// Source origin for the input file
    /// </summary>
    public enum SourceOrigin
    {
        /// <summary>Source file owned by the project</summary>
        Project = 0,

        /// <summary>Source file is external to the project</summary>
        External,
    }
}
