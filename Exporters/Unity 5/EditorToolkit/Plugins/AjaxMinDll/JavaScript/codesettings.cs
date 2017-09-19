// codesettings.cs
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
using System.Text;

namespace Microsoft.Ajax.Utilities
{
    /// <summary>
    /// Settings for how local variables and functions can be renamed
    /// </summary>
    public enum LocalRenaming
    {
        /// <summary>
        /// Keep all names; don't rename anything
        /// </summary>
        KeepAll,

        /// <summary>
        /// Rename all local variables and functions that do not begin with "L_"
        /// </summary>
        KeepLocalizationVars,

        /// <summary>
        /// Rename all local variables and functions. (default)
        /// </summary>
        CrunchAll
    }

    /// <summary>
    /// Settings for how to treat eval statements
    /// </summary>
    public enum EvalTreatment
    {
        /// <summary>
        /// Ignore all eval statements (default). This assumes that code that is eval'd will not attempt
        /// to access any local variables or functions, as those variables and function may be renamed.
        /// </summary>
        Ignore = 0,

        /// <summary>
        /// Assume any code that is eval'd will attempt to access local variables and functions declared
        /// in the same scope as the eval statement. This will turn off local variable and function renaming
        /// in any scope that contains an eval statement.
        /// </summary>
        MakeImmediateSafe,

        /// <summary>
        /// Assume that any local variable or function in any accessible scope chain may be referenced by 
        /// code that is eval'd. This will turn off local variable and function renaming for all scopes that
        /// contain an eval statement, and all their parent scopes up the chain to the global scope.
        /// </summary>
        MakeAllSafe
    }

    /// <summary>
    /// Enum describing the type of input expected
    /// </summary>
    public enum JavaScriptSourceMode
    {
        /// <summary>Default input mode: a program, a block of top-level global statements</summary>
        Program = 0,

        /// <summary>Input is a single JavaScript Expression</summary>
        Expression,

        /// <summary>Input is an implicit function block, as in the value of an HTML onclick attribute</summary>
        EventHandler,

        /// <summary>Input is an implicit module block, as referenced by an import statement</summary>
        Module,
    }

    /// <summary>
    /// Enum describing how to treat the output JavaScript
    /// </summary>
    public enum JavaScriptFormat
    {
        /// <summary>normal JavaScript code</summary>
        Normal = 0,

        /// <summary>JSON code</summary>
        JSON
    }

    /// <summary>
    /// Object used to store code settings for JavaScript parsing, minification, and output
    /// </summary>
    public class CodeSettings : CommonSettings
    {
        #region private fields

        private bool m_minify;
        private bool m_amdSupport;

        #endregion

        /// <summary>
        /// Instantiate a CodeSettings object with the default settings
        /// </summary>
        public CodeSettings()
        {
            // setting this property sets other fields as well
            this.MinifyCode = true;

            // other fields we want initialized
            this.EvalTreatment = EvalTreatment.Ignore;
            this.InlineSafeStrings = true;
            this.MacSafariQuirks = true;
            this.PreserveImportantComments = true;
            this.QuoteObjectLiteralProperties = false;
            this.StrictMode = false;
            this.StripDebugStatements = true;
            this.ManualRenamesProperties = true;
            this.OutputMode = OutputMode.SingleLine;

            // no default globals
            this.m_knownGlobals = new HashSet<string>();

            // default is no debug namespaces
            this.m_debugLookups = new HashSet<string>();

            // by default, let's NOT rename $super, so we don't break the Prototype library.
            // going to try to come up with a better solution, so this is just a stop-gap for now.
            this.m_noRenameSet = new HashSet<string>(new string[] { "$super" });

            // nothing renamed by default
            this.m_identifierReplacementMap = new Dictionary<string, string>();
        }

        /// <summary>
        /// Instantiate a new CodeSettings object with the same settings as the current object.
        /// </summary>
        /// <returns>a copy CodeSettings object</returns>
        public CodeSettings Clone()
        {
            // create a new settings object and set all the properties using this settings object
            var newSettings = new CodeSettings()
            {
                // set the field, not the property. Setting the property will set a bunch of
                // other properties, which may not represent their actual values.
                m_minify = this.m_minify,

                AllowEmbeddedAspNetBlocks = this.AllowEmbeddedAspNetBlocks,
                AlwaysEscapeNonAscii = this.AlwaysEscapeNonAscii,
                AmdSupport = this.AmdSupport,
                CollapseToLiteral = this.CollapseToLiteral,
                ConstStatementsMozilla = this.ConstStatementsMozilla,
                DebugLookupList = this.DebugLookupList,
                EvalLiteralExpressions = this.EvalLiteralExpressions,
                EvalTreatment = this.EvalTreatment,
                Format = this.Format,
                IgnoreConditionalCompilation = this.IgnoreConditionalCompilation,
                IgnoreAllErrors = this.IgnoreAllErrors,
                IgnoreErrorList = this.IgnoreErrorList,
                IgnorePreprocessorDefines = this.IgnorePreprocessorDefines,
                IndentSize = this.IndentSize,
                InlineSafeStrings = this.InlineSafeStrings,
                KillSwitch = this.KillSwitch,
                KnownGlobalNamesList = this.KnownGlobalNamesList,
                LineBreakThreshold = this.LineBreakThreshold,
                LocalRenaming = this.LocalRenaming,
                MacSafariQuirks = this.MacSafariQuirks,
                ManualRenamesProperties = this.ManualRenamesProperties,
                NoAutoRenameList = this.NoAutoRenameList,
                OutputMode = this.OutputMode,
                PreprocessOnly = this.PreprocessOnly,
                PreprocessorDefineList = this.PreprocessorDefineList,
                PreserveFunctionNames = this.PreserveFunctionNames,
                PreserveImportantComments = this.PreserveImportantComments,
                QuoteObjectLiteralProperties = this.QuoteObjectLiteralProperties,
                RemoveFunctionExpressionNames = this.RemoveFunctionExpressionNames,
                RemoveUnneededCode = this.RemoveUnneededCode,
                RenamePairs = this.RenamePairs,
                ReorderScopeDeclarations = this.ReorderScopeDeclarations,
                SourceMode = this.SourceMode,
                StrictMode = this.StrictMode,
                StripDebugStatements = this.StripDebugStatements,
                TermSemicolons = this.TermSemicolons,
                BlocksStartOnSameLine = this.BlocksStartOnSameLine,
                ErrorIfNotInlineSafe = this.ErrorIfNotInlineSafe,
                SymbolsMap = this.SymbolsMap,
            };

            // set the resource strings if there are any
            newSettings.AddResourceStrings(this.ResourceStrings);

            foreach (var item in this.ReplacementTokens)
            {
                newSettings.ReplacementTokens.Add(item);
            }

            foreach (var item in this.ReplacementFallbacks)
            {
                newSettings.ReplacementTokens.Add(item);
            }

            return newSettings;
        }

        #region Manually rename

        /// <summary>
        /// dictionary of identifiers we want to manually rename
        /// </summary>
        private Dictionary<string, string> m_identifierReplacementMap;

        /// <summary>
        /// Add a rename pair to the identifier rename map
        /// </summary>
        /// <param name="sourceName">name of the identifier in the source code</param>
        /// <param name="newName">new name with which to replace the source name</param>
        /// <returns>true if added; false if either name is not a valid JavaScript identifier</returns>
        public bool AddRenamePair(string sourceName, string newName)
        {
            bool successfullyAdded = false;

            // both names MUST be valid JavaScript identifiers
            if (JSScanner.IsValidIdentifier(sourceName) && JSScanner.IsValidIdentifier(newName))
            {
                if (m_identifierReplacementMap.ContainsKey(sourceName))
                {
                    // just replace the value
                    m_identifierReplacementMap[sourceName] = newName;
                }
                else
                {
                    // add the new pair
                    m_identifierReplacementMap.Add(sourceName, newName);
                }

                // if we get here, we added it (or updated it if it's a dupe)
                successfullyAdded = true;
            }

            return successfullyAdded;
        }

        /// <summary>
        /// Clear any rename pairs from the identifier rename map
        /// </summary>
        public void ClearRenamePairs()
        {
            m_identifierReplacementMap.Clear();
        }

        /// <summary>
        /// returns whether or not there are any rename pairs in this settings object
        /// </summary>
        public bool HasRenamePairs
        {
            get
            {
                return m_identifierReplacementMap.Count > 0;
            }
        }

        /// <summary>
        /// Given a source identifier, return a new name for it, if one has already been added
        /// </summary>
        /// <param name="sourceName">source name to check</param>
        /// <returns>new name if it exists, null otherwise</returns>
        public string GetNewName(string sourceName)
        {
            string newName;
            if (!m_identifierReplacementMap.TryGetValue(sourceName, out newName))
            {
                newName = null;
            }

            return newName;
        }

        /// <summary>
        /// Gets or sets a string representation of all the indentifier replacements as a comma-separated
        /// list of "source=target" identifiers.
        /// </summary>
        public string RenamePairs
        {
            get
            {
                var sb = StringBuilderPool.Acquire();
                try
                {
                    foreach (var entry in m_identifierReplacementMap)
                    {
                        if (sb.Length > 0)
                        {
                            sb.Append(',');
                        }

                        sb.Append(entry.Key);
                        sb.Append('=');
                        sb.Append(entry.Value);
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
                    // pairs are comma-separated
                    foreach (var pair in value.Split(',', ';'))
                    {
                        // source name and new name are separated by an equal sign
                        var parts = pair.Split('=');

                        // must be exactly one equal sign
                        if (parts.Length == 2)
                        {
                            // try adding the trimmed pair to the collection
                            AddRenamePair(parts[0].Trim(), parts[1].Trim());
                        }
                    }
                }
                else
                {
                    m_identifierReplacementMap.Clear();
                }
            }
        }

        #endregion

        #region No automatic rename

        private HashSet<string> m_noRenameSet;

        public IEnumerable<string> NoAutoRenameCollection { get { return m_noRenameSet; } }

        /// <summary>
        /// sets the collection of known global names to the enumeration of strings passed to this method
        /// </summary>
        /// <param name="globalArray">array of known global names</param>
        public int SetNoAutoRenames(IEnumerable<string> noRenameNames)
        {
            m_noRenameSet.Clear();
            if (noRenameNames != null)
            {
                // validate that each name in the array is a valid JS identifier
                foreach (var name in noRenameNames)
                {
                    AddNoAutoRename(name);
                }
            }

            return m_noRenameSet.Count;
        }

        public bool AddNoAutoRename(string noRename)
        {
            if (!JSScanner.IsValidIdentifier(noRename))
            {
                return false;
            }

            m_noRenameSet.Add(noRename);
            return true;
        }

        /// <summary>
        /// Get or sets the no-automatic-renaming list as a single string of comma-separated identifiers
        /// </summary>
        public string NoAutoRenameList
        {
            get
            {
                var sb = StringBuilderPool.Acquire();
                try
                {
                    foreach (var noRename in m_noRenameSet)
                    {
                        if (sb.Length > 0)
                        {
                            sb.Append(',');
                        }
                        sb.Append(noRename);
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
                    foreach (var noRename in value.Split(',', ';'))
                    {
                        AddNoAutoRename(noRename);
                    }
                }
                else
                {
                    m_noRenameSet.Clear();
                }
            }
        }

        #endregion

        #region known globals

        private HashSet<string> m_knownGlobals;

        /// <summary>
        /// Gets the known global name collection
        /// </summary>
        public IEnumerable<string> KnownGlobalCollection { get { return m_knownGlobals; } }

        /// <summary>
        /// sets the collection of known global names to the array of string passed to this method
        /// </summary>
        /// <param name="globalArray">collection of known global names</param>
        public int SetKnownGlobalIdentifiers(IEnumerable<string> globalArray)
        {
            m_knownGlobals.Clear();
            if (globalArray != null)
            {
                foreach (var name in globalArray)
                {
                    AddKnownGlobal(name);
                }
            }

            return m_knownGlobals.Count;
        }

        /// <summary>
        /// Add a known global identifier to the list
        /// </summary>
        /// <param name="identifier">global identifier</param>
        /// <returns>true if valid identifier; false if invalid identifier</returns>
        public bool AddKnownGlobal(string identifier)
        {
            if (JSScanner.IsValidIdentifier(identifier))
            {
                m_knownGlobals.Add(identifier);
                return true;
            }

            return false;
        }

        /// <summary>
        /// Gets or sets the known global names list as a single comma-separated string
        /// </summary>
        public string KnownGlobalNamesList
        {
            get
            {
                var sb = StringBuilderPool.Acquire();
                try
                {
                    foreach (var knownGlobal in m_knownGlobals)
                    {
                        if (sb.Length > 0)
                        {
                            sb.Append(',');
                        }
                        sb.Append(knownGlobal);
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
                    foreach (var knownGlobal in value.Split(',', ';'))
                    {
                        AddKnownGlobal(knownGlobal);
                    }
                }
                else
                {
                    m_knownGlobals.Clear();
                }
            }
        }

        #endregion

        #region Debug lookups

        private HashSet<string> m_debugLookups;

        /// <summary>
        /// Gets the set of debug lookups
        /// </summary>
        public IEnumerable<string> DebugLookupCollection { get { return m_debugLookups; } }

        /// <summary>
        /// Set the collection of debug "lookup" identifiers
        /// </summary>
        /// <param name="definedNames">collection of debug lookup identifier strings</param>
        /// <returns>number of names successfully added to the collection</returns>
        public int SetDebugNamespaces(IEnumerable<string> debugLookups)
        {
            m_debugLookups.Clear();
            if (debugLookups != null)
            {
                // validate that each name in the array is a valid JS identifier
                foreach (var lookup in debugLookups)
                {
                    AddDebugLookup(lookup);
                }
            }

            return m_debugLookups.Count;
        }

        public bool AddDebugLookup(string debugNamespace)
        {
            // a blank identifier is okay -- we just ignore it
            if (!string.IsNullOrEmpty(debugNamespace))
            {
                // but if it's not blank, it better be a valid JavaScript identifier or member chain
                if (debugNamespace.IndexOf('.') > 0)
                {
                    // it's a member chain -- check that each part is a valid JS identifier
                    var names = debugNamespace.Split('.');
                    foreach (var name in names)
                    {
                        if (!JSScanner.IsValidIdentifier(name))
                        {
                            return false;
                        }
                    }
                }
                else
                {
                    // no dot -- just an identifier
                    if (!JSScanner.IsValidIdentifier(debugNamespace))
                    {
                        return false;
                    }
                }

                m_debugLookups.Add(debugNamespace);
                return true;
            }

            return false;
        }

        /// <summary>
        /// string representation of the list of debug lookups, comma-separated
        /// </summary>
        public string DebugLookupList
        {
            get
            {
                // createa string builder and add each of the debug lookups to it
                // one-by-one, separating them with a comma
                var sb = StringBuilderPool.Acquire();
                try
                {
                    foreach (var debugLookup in m_debugLookups)
                    {
                        if (sb.Length > 0)
                        {
                            sb.Append(',');
                        }
                        sb.Append(debugLookup);
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
                m_debugLookups.Clear();
                if (!string.IsNullOrEmpty(value))
                {
                    foreach(var debugLookup in value.Split(',', ';'))
                    {
                        AddDebugLookup(debugLookup);
                    }
                }
            }
        }

        #endregion

        #region properties

        /// <summary>
        /// Gets or sets a flag indicating whether to always escape non-ASCII characters as \uXXXX
        /// or to let the output encoding object handle that via the JsEncoderFallback object for the
        /// specified output encoding format. Default is false (let the Encoding object handle it).
        /// </summary>
        public bool AlwaysEscapeNonAscii
        {
            get;
            set;
        }

        /// <summary>
        /// Gets or sets a value indicating whether to perform extra tasks on AMD-style defines.
        /// </summary>
        public bool AmdSupport
        {
            get
            {
                return m_amdSupport;
            }
            set
            {
                m_amdSupport = value;
                if (m_amdSupport)
                {
                    // make sure define and require are added to the known globals list
                    m_knownGlobals.Add("define");
                    m_knownGlobals.Add("require");
                }
                else
                {
                    // remove define and require from the known globals list (if they are there already)
                    m_knownGlobals.Remove("define");
                    m_knownGlobals.Remove("require");
                }
            }
        }

        /// <summary>
        /// collapse new Array() to [] and new Object() to {} [true]
        /// or leave ais [false]. Default is true.
        /// </summary>
        public bool CollapseToLiteral
        {
            get; set;
        }

        /// <summary>
        /// Gets or sets a boolean value indicating whether to use old-style const statements (just var-statements that
        /// define unchangeable fields) or new EcmaScript 6 lexical declarations.
        /// </summary>
        public bool ConstStatementsMozilla
        {
            get;
            set;
        }

        /// <summary>
        /// Throw an error if a source string is not safe for inclusion 
        /// in an HTML inline script block. Default is false.
        /// </summary>
        public bool ErrorIfNotInlineSafe
        {
            get;
            set;
        }

        /// <summary>
        /// Evaluate expressions containing only literal bool, string, numeric, or null values [true]
        /// Leave literal expressions alone and do not evaluate them [false]. Default is true.
        /// </summary>
        public bool EvalLiteralExpressions
        {
            get;
            set;
        }

        /// <summary>
        /// Gets or sets a settings value indicating how "safe" eval-statements are to be assumed.
        /// Ignore (default) means we can assume eval-statements will not reference any local variables and functions.
        /// MakeImmediateSafe assumes eval-statements will reference local variables and function within the same scope.
        /// MakeAllSafe assumes eval-statements will reference any accessible local variable or function.
        /// Local variables that we assume may be referenced by eval-statements cannot be automatically renamed.
        /// </summary>
        public EvalTreatment EvalTreatment
        {
            get; set;
        }

        /// <summary>
        /// Gets or sets the format to use for the JavaScript processing.
        /// </summary>
        public JavaScriptFormat Format
        {
            get; set;
        }

        /// <summary>
        /// Gets or sets a boolean value indicating whether or not to ignore conditional-compilation comment syntax (true) or
        /// to try to retain the comments in the output (false; default)
        /// </summary>
        public bool IgnoreConditionalCompilation { get; set; }

        /// <summary>
        /// Gets or sets a boolean value indicating whether or not to ignore preprocessor defines comment syntax (true) or
        /// to evaluate them (false; default)
        /// </summary>
        public bool IgnorePreprocessorDefines { get; set; }

        /// <summary>
        /// Gets or sets a boolean value indicating whether to break up string literals containing &lt;/script&gt; so inline code won't break [true, default]
        /// or to leave string literals as-is [false]
        /// </summary>
        public bool InlineSafeStrings
        {
            get; set;
        }

        /// <summary>
        /// Gets or sets a boolean value indicating whether/how local variables and functions should be automatically renamed:
        /// KeepAll - do not rename local variables and functions; 
        /// CrunchAll - rename all local variables and functions to shorter names; 
        /// KeepLocalizationVars - rename all local variables and functions that do NOT start with L_
        /// </summary>
        public LocalRenaming LocalRenaming
        {
            get; set;
        }

        /// <summary>
        /// Gets or sets a boolean value indicating whether to add characters to the output to make sure Mac Safari bugs are not generated [true, default], or to
        /// disregard potential known Mac Safari bugs in older versions [false]
        /// </summary>
        public bool MacSafariQuirks
        {
            get; set;
        }

        /// <summary>
        /// Gets or sets a boolean value indicating whether any operations are to be applied to the parsed tree [true, default],
        /// or whether to return it as-is [false]. 
        /// </summary>
        public bool MinifyCode
        {
            get 
            {
                // just return the minify flag
                return m_minify;
            }
            set 
            { 
                // when we set this flag, we want to turn other things on and off at the same time
                m_minify = value;

                // aligned properties
                this.CollapseToLiteral = m_minify;
                this.EvalLiteralExpressions = m_minify;
                this.RemoveFunctionExpressionNames = m_minify;
                this.RemoveUnneededCode = m_minify;
                this.ReorderScopeDeclarations = m_minify;

                // opposite properties
                this.PreserveFunctionNames = !m_minify;

                // dependent switches
                this.LocalRenaming = m_minify ? LocalRenaming.CrunchAll : LocalRenaming.KeepAll;
                this.KillSwitch = m_minify ? 0 : ~((long)TreeModifications.PreserveImportantComments);
            }
        }

        /// <summary>
        /// Gets or sets a boolean value indicating whether object property names with the specified "from" names will
        /// get renamed to the corresponding "to" names (true, default) when using the manual-rename feature, or left alone (false)
        /// </summary>
        public bool ManualRenamesProperties
        {
            get; set;
        }

        /// <summary>
        /// Gets or sets a boolean value indicating whether or not the input files should be preprocessed only (default is false)
        /// </summary>
        public bool PreprocessOnly 
        { 
            get; 
            set; 
        }

        /// <summary>
        /// Gets or sets a value indicating whether all function names must be preserved and remain as-named (true),
        /// or can be automatically renamed (false, default).
        /// </summary>
        public bool PreserveFunctionNames
        {
            get; set;
        }

        /// <summary>
        /// Gets or sets a value indicating whether to preserve important comments in the output.
        /// Default is true, preserving important comments. Important comments have an exclamation
        /// mark as the very first in-comment character (//! or /*!).
        /// </summary>
        public bool PreserveImportantComments
        {
            get; set;
        }

        /// <summary>
        /// Gets or sets a value indicating whether to always quote object literal property names.
        /// Default is false.
        /// </summary>
        public bool QuoteObjectLiteralProperties
        {
            get; set;
        }

        /// <summary>
        /// Gets or sets a value indicating whether or not to reorder function and variable
        /// declarations within scopes (true, default), or to leave the order as specified in 
        /// the original source.
        /// </summary>
        public bool ReorderScopeDeclarations
        {
            get; set;
        }

        /// <summary>
        /// Gets or sets a value indicating whether or not to remove unreferenced function expression names (true, default)
        /// or to leave the names of function expressions, even if they are unreferenced (false).
        /// </summary>
        public bool RemoveFunctionExpressionNames
        {
            get; set;
        }

        /// <summary>
        /// Gets or sets a boolean value indicating whether to remove unneeded code, such as uncalled local functions or unreachable code [true, default], 
        /// or to keep such code in the output [false].
        /// </summary>
        public bool RemoveUnneededCode
        {
            get; set;
        }

        /// <summary>
        /// Gets or sets an enumeration that gives the parser a hint as to which version of EcmaScript standards to parse the source as.
        /// See <see cref="JSParser.ParsedVersion"/> after parsing for which version the parser thought it had based on features found in the script.
        /// Errors/warnings, and optimized output may change based on this settings value.
        /// </summary>
        public ScriptVersion ScriptVersion
        {
            get;
            set;
        }

        /// <summary>
        /// Gets or sets the source mode
        /// </summary>
        public JavaScriptSourceMode SourceMode
        {
            get; set;
        }

        /// <summary>
        /// Gets or sets a boolean value indicating whether or not to force the input code into strict mode (true)
        /// or rely on the sources to turn on strict mode via the "use strict" prologue directive (false, default).
        /// </summary>
        public bool StrictMode
        {
            get;
            set;
        }

        /// <summary>
        /// Gets or sets a boolean value indicating whether to strip debug statements [true, default],
        /// or leave debug statements in the output [false]
        /// </summary>
        public bool StripDebugStatements
        {
            get; set;
        }

        /// <summary>
        /// Gets or sets the <see cref="ISourceMap"/> instance. Default is null, which won't output a symbol map.
        /// </summary>
        public ISourceMap SymbolsMap
        {
            get;
            set;
        }

        #endregion

        #region public methods

        /// <summary>
        /// Determine whether a particular AST tree modification is allowed, or has
        /// been squelched (regardless of any other settings)
        /// </summary>
        /// <param name="modification">one or more tree modification settings</param>
        /// <returns>true only if NONE of the passed modifications have their kill bits set</returns>
        public bool IsModificationAllowed(TreeModifications modification)
        {
            return (KillSwitch & (long)modification) == 0;
        }

        #endregion
    }

    [Flags]
    public enum TreeModifications : long
    {
        /// <summary>
        /// Default. No specific tree modification
        /// </summary>
        None                                        = 0x0000000000000000,

        /// <summary>
        /// Preserve "important" comments in output: /*! ... */
        /// </summary>
        PreserveImportantComments                   = 0x0000000000000001,

        /// <summary>
        /// Replace a member-bracket call with a member-dot construct if the member
        /// name is a string literal that can be an identifier.
        /// A["B"] ==&gt; A.B
        /// </summary>
        BracketMemberToDotMember                    = 0x0000000000000002,

        /// <summary>
        /// Replace a new Object constructor call with an object literal
        /// new Object() ==&gt; {}
        /// </summary>
        NewObjectToObjectLiteral                    = 0x0000000000000004,

        /// <summary>
        /// Change Array constructor calls with array literals.
        /// Does not replace constructors called with a single numeric parameter
        /// (could be a capacity contructor call).
        /// new Array() ==&gt; []
        /// new Array(A,B,C) ==&gt; [A,B,C]
        /// </summary>
        NewArrayToArrayLiteral                      = 0x0000000000000008,

        /// <summary>
        /// Remove the default case in a switch statement if the block contains
        /// only a break statement.
        /// remove default:break;
        /// </summary>
        RemoveEmptyDefaultCase                      = 0x0000000000000010,

        /// <summary>
        /// If there is no default case, remove any case statements that contain
        /// only a single break statement.
        /// remove case A:break;
        /// </summary>
        RemoveEmptyCaseWhenNoDefault                = 0x0000000000000020,

        /// <summary>
        /// Remove the break statement from the last case block of a switch statement.
        /// switch(A){case B: C;break;} ==&gt; switch(A){case B:C;}
        /// </summary>
        RemoveBreakFromLastCaseBlock                = 0x0000000000000040,

        /// <summary>
        /// Remove an empty finally statement if there is a non-empty catch block.
        /// try{...}catch(E){...}finally{} ==&gt; try{...}catch(E){...}
        /// </summary>
        RemoveEmptyFinally                          = 0x0000000000000080,

        /// <summary>
        /// Remove duplicate var declarations in a var statement that have no initializers.
        /// var A,A=B  ==&gt;  var A=B
        /// var A=B,A  ==&gt;  var A=B
        /// </summary>
        RemoveDuplicateVar                          = 0x0000000000000100,

        /// <summary>
        /// Combine adjacent var statements.
        /// var A;var B  ==&gt;  var A,B
        /// </summary>
        CombineVarStatements                        = 0x0000000000000200,

        /// <summary>
        /// Move preceeding var statement into the initializer of the for statement.
        /// var A;for(var B;;);  ==&gt;  for(var A,B;;);
        /// var A;for(;;)  ==&gt; for(var A;;)
        /// </summary>
        MoveVarIntoFor                              = 0x0000000000000400,

        /// <summary>
        /// Combine adjacent var statement and return statement to a single return statement
        /// var A=B;return A  ==&gt; return B
        /// </summary>
        VarInitializeReturnToReturnInitializer      = 0x0000000000000800,

        /// <summary>
        /// Replace an if-statement that has empty true and false branches with just the 
        /// condition expression.
        /// if(A);else;  ==&gt; A;
        /// </summary>
        IfEmptyToExpression                         = 0x0000000000001000,

        /// <summary>
        /// replace if-statement that only has a single call statement in the true branch
        /// with a logical-and statement
        /// if(A)B() ==&gt; A&amp;&amp;B()
        /// </summary>
        IfConditionCallToConditionAndCall           = 0x0000000000002000,

        /// <summary>
        /// Replace an if-else-statement where both branches are only a single return
        /// statement with a single return statement and a conditional operator.
        /// if(A)return B;else return C  ==&gt;  return A?B:C 
        /// </summary>
        IfElseReturnToReturnConditional             = 0x0000000000004000,

        /// <summary>
        /// If a function ends in an if-statement that only has a true-branch containing
        /// a single return statement with no operand, replace the if-statement with just
        /// the condition expression.
        /// function A(...){...;if(B)return}  ==&gt; function A(...){...;B}
        /// </summary>
        IfConditionReturnToCondition                = 0x0000000000008000,

        /// <summary>
        /// If the true-block of an if-statment is empty and the else-block is not,
        /// negate the condition and move the else-block to the true-block.
        /// if(A);else B  ==&gt;  if(!A)B
        /// </summary>
        IfConditionFalseToIfNotConditionTrue        = 0x0000000000010000,

        /// <summary>
        /// Combine adjacent string literals.
        /// "A"+"B"  ==&gt; "AB"
        /// </summary>
        CombineAdjacentStringLiterals               = 0x0000000000020000,

        /// <summary>
        /// Remove unary-plus operators when the operand is a numeric literal
        /// +123  ==&gt;  123
        /// </summary>
        RemoveUnaryPlusOnNumericLiteral             = 0x0000000000040000,

        /// <summary>
        /// Apply (and cascade) unary-minus operators to the value of a numeric literal
        /// -(4)  ==&gt;  -4   (unary minus applied to a numeric 4 ==&gt; numeric -4)
        /// -(-4)  ==&gt;  4   (same as above, but cascading)
        /// </summary>
        ApplyUnaryMinusToNumericLiteral             = 0x0000000000080000,

        /// <summary>
        /// Apply minification technics to string literals
        /// </summary>
        MinifyStringLiterals                        = 0x0000000000100000,

        /// <summary>
        /// Apply minification techniques to numeric literals
        /// </summary>
        MinifyNumericLiterals                       = 0x0000000000200000,

        /// <summary>
        /// Remove unused function parameters
        /// </summary>
        RemoveUnusedParameters                      = 0x0000000000400000,

        /// <summary>
        /// remove "debug" statements
        /// </summary>
        StripDebugStatements                        = 0x0000000000800000,

        /// <summary>
        /// Rename local variables and functions
        /// </summary>
        LocalRenaming                               = 0x0000000001000000,

        /// <summary>
        /// Remove unused function expression names
        /// </summary>
        RemoveFunctionExpressionNames               = 0x0000000002000000,

        /// <summary>
        /// Remove unnecessary labels from break or continue statements
        /// </summary>
        RemoveUnnecessaryLabels                     = 0x0000000004000000,

        /// <summary>
        /// Remove unnecessary @cc_on statements
        /// </summary>
        RemoveUnnecessaryCCOnStatements             = 0x0000000008000000,

        /// <summary>
        /// Convert (new Date()).getTime() to +new Date
        /// </summary>
        DateGetTimeToUnaryPlus                      = 0x0000000010000000,

        /// <summary>
        /// Evaluate numeric literal expressions.
        /// 1 + 2  ==&gt; 3
        /// </summary>
        EvaluateNumericExpressions                  = 0x0000000020000000,

        /// <summary>
        /// Simplify a common method on converting string to numeric: 
        /// lookup - 0  ==&gt; +lookup
        /// (Subtracting zero converts lookup to number, then doesn't modify
        /// it; unary plus also converts operand to numeric)
        /// </summary>
        SimplifyStringToNumericConversion           = 0x0000000040000000,

        /// <summary>
        /// Rename properties in object literals, member-dot, and member-bracket operations
        /// </summary>
        PropertyRenaming                            = 0x0000000080000000,

        /// <summary>
        /// Use preprocessor defines and the ///#IFDEF directive
        /// </summary>
        // WAY too dangerous to have this a kill-switch. Made a separate CodeSettings property: IgnorePreprocessorDefines.
        // people put -kill:-1 thinking they're just turning off minification, but they were ALSO turning off all the ///#IF processing
        // and getting unexpected errors when both paths make the output.
        //PreprocessorDefines                         = 0x0000000100000000,

        /// <summary>
        /// Remove the quotes arounf objectl literal property names when
        /// the names are valid identifiers.
        /// </summary>
        RemoveQuotesFromObjectLiteralNames          = 0x0000000200000000,

        /// <summary>
        /// Change boolean literals to not operators.
        /// true  -> !0
        /// false -> !1
        /// </summary>
        BooleanLiteralsToNotOperators               = 0x0000000400000000,

        /// <summary>
        /// Change if-statements with expression statements as their branches to expressions
        /// </summary>
        IfExpressionsToExpression                   = 0x0000000800000000,

        /// <summary>
        /// Combine adjacent expression statements into a single expression statement
        /// using the comma operator
        /// </summary>
        CombineAdjacentExpressionStatements         = 0x0000001000000000,

        /// <summary>
        /// If the types of both sides of a strict operator (=== or !==) are known
        /// to be the same, we can reduce the operators to == or !=
        /// </summary>
        ReduceStrictOperatorIfTypesAreSame          = 0x0000002000000000,

        /// <summary>
        /// If the types of both sides of a strict operator (=== or !==) are known
        /// to be different, than we can reduct the binary operator to false or true (respectively)
        /// </summary>
        ReduceStrictOperatorIfTypesAreDifferent     = 0x0000004000000000,

        /// <summary>
        /// Move function declarations to the top of the containing scope
        /// </summary>
        MoveFunctionToTopOfScope                    = 0x0000008000000000,

        /// <summary>
        /// Combine var statements at the top of the containing scope
        /// </summary>
        CombineVarStatementsToTopOfScope            = 0x0000010000000000,

        /// <summary>
        /// If the condition of an if-statement or conditional starts with a not-operator,
        /// get rid of the not-operator and swap the true/false branches.
        /// </summary>
        IfNotTrueFalseToIfFalseTrue                 = 0x0000020000000000,

        /// <summary>
        /// Whether it's okay to move an expression containing an in-operator into a for-statement.
        /// </summary>
        MoveInExpressionsIntoForStatement           = 0x0000040000000000,

        /// <summary>
        /// Whether it's okay to convert function...{...if(cond)return;s1;s2} to function...{...if(!cond){s1;s2}}
        /// </summary>
        InvertIfReturn                              = 0x0000080000000000,

        /// <summary>
        /// Whether it's okay to combine nested if-statments if(cond1)if(cond2){...} to if(cond1&amp;&amp;cond2){...}
        /// </summary>
        CombineNestedIfs                            = 0x0000100000000000,

        /// <summary>
        /// Whether it's okay to combine equivalent if-statments that return the same expression.
        /// if(cond1)return expr;if(cond2)return expr; =&gt; if(cond1||cond2)return expr;
        /// </summary>
        CombineEquivalentIfReturns                  = 0x0000200000000000,

        /// <summary>
        /// Whether to convert certain while-statements to for-statements.
        /// while(1)... => for(;;)...
        /// var ...;while(1)... => for(var ...;;)
        /// var ...;while(cond)... => for(var ...;cond;)...
        /// </summary>
        ChangeWhileToFor                            = 0x0000400000000000,

        /// <summary>
        /// Whether to invert iterator{if(cond)continue;st1;st2} to iterator{if(!cond){st1;st2}}
        /// </summary>
        InvertIfContinue                            = 0x0000800000000000,

        /// <summary>
        /// Whether to convert [a,b,c].join(s) to "asbsc" if all items are constants.
        /// </summary>
        EvaluateLiteralJoins                        = 0x0001000000000000,

        /// <summary>
        /// Whether we should remove unused variable, or variables assigned a constant in their
        /// initializer and referenced only once.
        /// </summary>
        RemoveUnusedVariables                       = 0x0002000000000000,

        /// <summary>
        /// Whether we should unfold comma-separated expressions statements into separate statements
        /// as a final minification step (if it doesn't create more bytes)
        /// </summary>
        UnfoldCommaExpressionStatements             = 0x0004000000000000,

        /// <summary>
        /// Whether to convert [a,b,c].length to 3 (if all items are constants)
        /// and "123".length to 3 
        /// </summary>
        EvaluateLiteralLengths                      = 0x0008000000000000,

        /// <summary>
        /// Whether to remove the "window." portion of a typeof operand
        /// </summary>
        RemoveWindowDotFromTypeOf                   = 0x0010000000000000,

        /// <summary>
        /// Whether to perform CultureInfo.CurrentCulture replacements on stand-alone and full-string tokens
        /// </summary>
        CultureInfoTokenReplacement                 = 0x0020000000000000,
    }
}
