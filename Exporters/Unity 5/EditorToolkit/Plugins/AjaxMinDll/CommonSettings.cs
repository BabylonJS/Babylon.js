// CommonSettings.cs
//
// Copyright 2010 Microsoft Corporation
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
using System.Diagnostics;
using System.Text;

namespace Microsoft.Ajax.Utilities
{
    /// <summary>
    /// Output mode setting
    /// </summary>
    public enum OutputMode
    {
        /// <summary>
        /// Output the minified code on a single line for maximum minification.
        /// LineBreakThreshold may still break the single line into multiple lines
        /// at a syntactically correct point after the given line length is reached.
        /// Not easily human-readable.
        /// </summary>
        SingleLine,

        /// <summary>
        /// Output the minified code on multiple lines to increase readability
        /// </summary>
        MultipleLines,

        /// <summary>
        /// Supress code output; typically used for linting or analysis of source code
        /// </summary>
        None
    }

    /// <summary>
    /// Describes how to output the opening curly-brace for blocks when the OutputMode
    /// is set to MultipleLines. 
    /// </summary>
    public enum BlockStart
    {
        /// <summary>
        /// Output the opening curly-brace block-start character on its own new line. Ex:
        /// if (condition)
        /// {
        ///     ...
        /// }
        /// </summary>
        NewLine = 0,

        /// <summary>
        /// Output the opening curly-brace block-start character at the end of the previous line. Ex:
        /// if (condition) {
        ///     ...
        /// }
        /// </summary>
        SameLine,

        /// <summary>
        /// Output the opening curly-brace block-start character on the same line or a new line
        /// depending on how it was specified in the sources. 
        /// </summary>
        UseSource
    }

    /// <summary>
    /// Common settings shared between CSS and JS settings objects
    /// </summary>
    public class CommonSettings
    {
        protected CommonSettings()
        {
            // defaults
            IndentSize = 4;
            OutputMode = OutputMode.SingleLine;
            TermSemicolons = false;
            KillSwitch = 0;
            LineBreakThreshold = int.MaxValue - 1000;
            AllowEmbeddedAspNetBlocks = false;

            IgnoreErrorCollection = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            PreprocessorValues = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            ResourceStrings = new List<ResourceStrings>();
            ReplacementTokens = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            ReplacementFallbacks = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        }

        #region properties

        /// <summary>
        /// Gets or sets a boolean value indicating whether embedded asp.net blocks (&lt;% %>) should be recognized and output as is. Default is false.
        /// </summary>
        public bool AllowEmbeddedAspNetBlocks
        {
            get;
            set;
        }

        /// <summary>
        /// Gets or sets a value indicating whether the opening curly brace for blocks is
        /// on its own line (NewLine, default) or on the same line as the preceding code (SameLine)
        /// or taking a hint from the source code position (UseSource). Only relevant when OutputMode is 
        /// set to MultipleLines.
        /// </summary>
        public BlockStart BlocksStartOnSameLine
        {
            get;
            set;
        }

        /// <summary>
        /// Gets or sets a flag for whether to ignore ALL errors found in the input code.
        /// Default is false.
        /// </summary>
        public bool IgnoreAllErrors 
        { 
            get; 
            set; 
        }

        /// <summary>
        /// Gets or sets an integer value specifying the number of spaces per indent level when in MultipleLines output mode. (Default = 4)
        /// </summary>
        public int IndentSize
        {
            get;
            set;
        }

        /// <summary>
        /// Gets or sets the column position at which the line will be broken at the next available opportunity.
        /// Default value is int.MaxValue - 1000.
        /// </summary>
        public int LineBreakThreshold
        {
            get;
            set;
        }

        /// <summary>
        /// Gets or sets a value indicating the output mode:
        /// SingleLine (default) - output all code on a single line;
        /// MultipleLines - break the output into multiple lines to be more human-readable;
        /// SingleLine mode may still result in multiple lines if the LineBreakThreshold is set to a small enough value.
        /// </summary>
        public OutputMode OutputMode
        {
            get;
            set;
        }

        /// <summary>
        /// Gets or sets a boolean value indicting whether to add a semicolon at the end of the parsed code (true) or not (false, default)
        /// </summary>
        public bool TermSemicolons
        {
            get;
            set;
        }

        /// <summary>
        /// Gets or sets a long integer value containing kill switch flags for each individual mod to the parsed code tree. Allows for
        /// callers to turn off specific modifications if desired. Default is 0, meaning no kill switches are set.
        /// </summary>
        public long KillSwitch
        {
            get;
            set;
        }

        /// <summary>
        /// Gets an appropriate line-terminator string given the output mode
        /// </summary>
        public string LineTerminator
        {
            get
            {
                return OutputMode == Utilities.OutputMode.MultipleLines ? "\r\n" : "\n";
            }
        }

        #endregion

        #region Indent methods

        // this is the indent level and size for the pretty-print
        private int m_indentLevel;// = 0;

        internal void Indent()
        {
            ++m_indentLevel;
        }

        internal void Unindent()
        {
            Debug.Assert(m_indentLevel > 0);
            if (m_indentLevel > 0)
            {
                --m_indentLevel;
            }
        }

        internal string TabSpaces
        {
            get
            {
                return new string(' ', m_indentLevel * IndentSize);
            }
        }

        #endregion

        #region IgnoreErrors list

        /// <summary>
        /// Gets a collection of errors to ignore
        /// </summary>
        public ICollection<string> IgnoreErrorCollection { get; private set; }

        /// <summary>
        /// Set the collection of errors to ignore
        /// </summary>
        /// <param name="definedNames">collection of error code strings</param>
        /// <returns>number of error codes successfully added to the collection</returns>
        public int SetIgnoreErrors(IEnumerable<string> ignoreErrors)
        {
            IgnoreErrorCollection.Clear();
            if (ignoreErrors != null)
            {
                foreach (var ignoreError in ignoreErrors)
                {
                    IgnoreErrorCollection.Add(ignoreError.Trim());
                }
            }

            return IgnoreErrorCollection.Count;
        }

        /// <summary>
        /// string representation of the list of debug lookups, comma-separated
        /// </summary>
        public string IgnoreErrorList
        {
            get
            {
                // createa string builder and add each of the debug lookups to it
                // one-by-one, separating them with a comma
                var sb = StringBuilderPool.Acquire();
                try
                {
                    foreach (var errorCode in IgnoreErrorCollection)
                    {
                        if (sb.Length > 0)
                        {
                            sb.Append(',');
                        }
                        sb.Append(errorCode);
                    }

                    return sb.ToString();
                }
                finally
                {
                    sb.Release();
                }
            }
            set
            {
                if (!string.IsNullOrEmpty(value))
                {
                    foreach (var error in value.Split(','))
                    {
                        IgnoreErrorCollection.Add(error);
                    }
                }
                else
                {
                    IgnoreErrorCollection.Clear();
                }
            }
        }

        #endregion

        #region Preprocessor defines

        /// <summary>
        /// dictionary of defines and their values
        /// </summary>
        public IDictionary<string, string> PreprocessorValues { get; private set; }

        /// <summary>
        /// Set the collection of defined names for the preprocessor
        /// </summary>
        /// <param name="definedNames">array of defined name strings</param>
        /// <returns>number of names successfully added to the collection</returns>
        public int SetPreprocessorDefines(params string[] definedNames)
        {
            PreprocessorValues.Clear();
            if (definedNames != null && definedNames.Length > 0)
            {
                // validate that each name in the array is a valid JS identifier
                foreach (var define in definedNames)
                {
                    string trimmedName;
                    var ndxEquals = define.IndexOf('=');
                    if (ndxEquals < 0)
                    {
                        trimmedName = define.Trim();
                    }
                    else
                    {
                        trimmedName = define.Substring(0, ndxEquals).Trim();
                    }

                    // must be a valid JS identifier
                    if (JSScanner.IsValidIdentifier(trimmedName))
                    {
                        PreprocessorValues.Add(trimmedName, ndxEquals < 0 ? string.Empty : define.Substring(ndxEquals + 1));
                    }
                }
            }

            return PreprocessorValues.Count;
        }

        /// <summary>
        /// Set the dictionary of preprocessor defines and values
        /// </summary>
        /// <param name="defines">dictionary to set</param>
        public int SetPreprocessorValues(IDictionary<string, string> defines)
        {
            PreprocessorValues.Clear();
            if (defines != null && defines.Count > 0)
            {
                foreach (var define in defines)
                {
                    if (JSScanner.IsValidIdentifier(define.Key))
                    {
                        PreprocessorValues.Add(define.Key, define.Value);
                    }
                }
            }

            return PreprocessorValues.Count;
        }

        /// <summary>
        /// string representation of the list of names defined for the preprocessor, comma-separated
        /// </summary>
        public string PreprocessorDefineList
        {
            get
            {
                // createa string builder and add each of the defined names to it
                // one-by-one, separating them with a comma
                var sb = StringBuilderPool.Acquire();
                try
                {
                    foreach (var defined in PreprocessorValues)
                    {
                        if (sb.Length > 0)
                        {
                            sb.Append(',');
                        }

                        sb.Append(defined.Key);
                        if (!string.IsNullOrEmpty(defined.Value))
                        {
                            sb.Append('=');

                            // TODO: how can I escape any commas?
                            sb.Append(defined.Value);
                        }
                    }

                    return sb.ToString();
                }
                finally
                {
                    sb.Release();
                }
            }
            set
            {
                if (!string.IsNullOrEmpty(value))
                {
                    SetPreprocessorDefines(value.Split(','));
                }
                else
                {
                    PreprocessorValues.Clear();
                }
            }
        }

        #endregion

        #region Resource Strings

        /// <summary>
        /// Collection of resource string objects
        /// </summary>
        public IList<ResourceStrings> ResourceStrings { get; private set; }

        public void AddResourceStrings(ResourceStrings resourceStrings)
        {
            // add it
            ResourceStrings.Add(resourceStrings);
        }

        public void AddResourceStrings(IEnumerable<ResourceStrings> collection)
        {
            // just add the whole collection
            if (collection != null)
            {
                foreach (var resourceStrings in collection)
                {
                    ResourceStrings.Add(resourceStrings);
                }
            }
        }

        public void ClearResourceStrings()
        {
            // clear it and set our pointer to null
            ResourceStrings.Clear();
        }

        public void RemoveResourceStrings(ResourceStrings resourceStrings)
        {
            // remove it
            ResourceStrings.Remove(resourceStrings);
        }

        #endregion

        #region ReplacementTokens

        /// <summary>
        /// Gets the mapping of replacement token to value
        /// </summary>
        public IDictionary<string, string> ReplacementTokens { get; private set; }

        /// <summary>
        /// Gets the mapping of replacement token fallback class to replacement value
        /// </summary>
        public IDictionary<string, string> ReplacementFallbacks { get; private set; }

        /// <summary>
        /// Only add items from the other set to the collection if the key doesn't already exist.
        /// (Previous sets are more specific than subsequent sets)
        /// </summary>
        /// <param name="otherSet">less-specific set of name/value replacement token pairs</param>
        public void ReplacementTokensApplyDefaults(IDictionary<string, string> otherSet)
        {
            if (otherSet != null)
            {
                foreach (var item in otherSet)
                {
                    if (!ReplacementTokens.ContainsKey(item.Key))
                    {
                        // add new value; ignore keys that already exist
                        ReplacementTokens.Add(item);
                    }
                }
            }
        }

        /// <summary>
        /// Always add items from the other set, replacing any pre-existing items in the collection.
        /// (Subsequent sets are more specific than previous sets)
        /// </summary>
        /// <param name="otherSet">more-specific set of name/value replacement token pairs</param>
        public void ReplacementTokensApplyOverrides(IDictionary<string, string> otherSet)
        {
            if (otherSet != null)
            {
                foreach (var item in otherSet)
                {
                    if (!ReplacementTokens.ContainsKey(item.Key))
                    {
                        // add new value
                        ReplacementTokens.Add(item);
                    }
                    else
                    {
                        // replace existing value
                        ReplacementTokens[item.Key] = item.Value;
                    }
                }
            }
        }

        #endregion
    }
}
