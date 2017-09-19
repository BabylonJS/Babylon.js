// SwitchParser.cs
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
using System.Globalization;
using System.Text;
using System.Threading;

namespace Microsoft.Ajax.Utilities
{
    public class InvalidSwitchEventArgs : EventArgs
    {
        public string SwitchPart { get; set; }
        public string ParameterPart { get; set; }
    }

    public class UnknownParameterEventArgs : EventArgs
    {
        public IList<string> Arguments { get; private set; }

        public int Index { get; set; }
        public string SwitchPart { get; set; }
        public string ParameterPart { get; set; }

        public UnknownParameterEventArgs(IList<string> arguments)
        {
            Arguments = arguments;
        }
    }

    /// <summary>
    /// Enumeration indicating how existing files will be treated
    /// </summary>
    public enum ExistingFileTreatment
    {
        /// <summary>
        /// Existing files will be overwritten, but existing files marked with the read-only flag will not
        /// </summary>
        Auto = 0,
        
        /// <summary>
        /// Any existing file will be overwritten, regardless of the state of its read-only flag
        /// </summary>
        Overwrite,

        /// <summary>
        /// 
        /// Existing files will be preserved (not overwritten)
        /// </summary>
        Preserve
    }

    public class SwitchParser
    {
        #region private fields

        private bool m_isMono;
        private bool m_noPretty;

        #endregion

        #region properties

        /// <summary>
        /// Gets the parsed JavaScript code settings object
        /// </summary>
        public CodeSettings JSSettings { get; private set; }

        /// <summary>
        /// Gets the parsed CSS settings object
        /// </summary>
        public CssSettings CssSettings { get; private set; }

        /// <summary>
        /// Gets a boolean value indicating whether or not Analyze mode is specified (default is false)
        /// </summary>
        public bool AnalyzeMode { get; private set; }

        /// <summary>
        /// Gets a string value indication the report format specified for analyze more (default is null)
        /// </summary>
        public string ReportFormat { get; private set; }

        /// <summary>
        /// Gets the path for the analyze scope report file (default is null, output to console)
        /// </summary>
        public string ReportPath { get; private set; }

        /// <summary>
        /// Gets a boolean value indicating whether or not Pretty-Print mode is specified (default is false)
        /// </summary>
        public bool PrettyPrint { get; private set; }

        /// <summary>
        /// Gets or sets an integer value indicating the warning severity threshold for reporting. Default is zero (syntax errors only).
        /// </summary>
        public int WarningLevel { get; set; }

        /// <summary>
        /// Gets or sets a flag indicating how existing files should be treated.
        /// </summary>
        public ExistingFileTreatment Clobber { get; set; }

        /// <summary>
        /// Gets the string output encoding name. Default is null, indicating the default output encoding should be used.
        /// </summary>
        public string EncodingOutputName { get; private set; }

        /// <summary>
        /// Gets the string input encoding name. Default is null, indicating the default output encoding should be used.
        /// </summary>
        public string EncodingInputName { get; private set; }

        #endregion

        #region events

        // events that are fired under different circumstances while parsing the switches
        public event EventHandler<InvalidSwitchEventArgs> InvalidSwitch;
        public event EventHandler<UnknownParameterEventArgs> UnknownParameter;
        public event EventHandler JSOnlyParameter;
        public event EventHandler CssOnlyParameter;

        #endregion

        public SwitchParser()
        {
            // initialize with default values
            JSSettings = new CodeSettings();
            CssSettings = new CssSettings();

            // see if this is running under the Mono runtime (on UNIX)
            m_isMono = Type.GetType("Mono.Runtime") != null;
        }

        public SwitchParser(CodeSettings scriptSettings, CssSettings cssSettings)
        {
            // apply the switches to these two settings objects
            JSSettings = scriptSettings ?? new CodeSettings();
            CssSettings = cssSettings ?? new CssSettings();
        }

        public SwitchParser Clone()
        {
            // clone the settings
            var newParser = new SwitchParser(this.JSSettings.Clone(), this.CssSettings.Clone());

            // don't forget to copy the other properties
            newParser.AnalyzeMode = this.AnalyzeMode;
            newParser.EncodingInputName = this.EncodingInputName;
            newParser.EncodingOutputName = this.EncodingOutputName;
            newParser.PrettyPrint = this.PrettyPrint;
            newParser.ReportFormat = this.ReportFormat;
            newParser.ReportPath = this.ReportPath;
            newParser.WarningLevel = this.WarningLevel;

            return newParser;
        }

        #region command line to argument array

        public static string[] ToArguments(string commandLine)
        {
            List<string> args = new List<string>();

            if (!string.IsNullOrEmpty(commandLine))
            {
                var length = commandLine.Length;
                for (var ndx = 0; ndx < length; ++ndx)
                {
                    // skip initial spaces
                    while (ndx < length && char.IsWhiteSpace(commandLine[ndx]))
                    {
                        ++ndx;
                    }

                    // don't create it if we don't need it yet
                    StringBuilder sb = null;
                    try
                    {
                        // if not at the end yet
                        if (ndx < length)
                        {
                            // grab the first character
                            var firstCharacter = commandLine[ndx];

                            // see if starts with a double-quote
                            var inDelimiter = firstCharacter == '"';
                            if (inDelimiter)
                            {
                                // we found a delimiter -- we're going to need one
                                sb = StringBuilderPool.Acquire();
                            }

                            // if it is, start at the NEXT character
                            var start = inDelimiter ? ndx + 1 : ndx;

                            // skip the first character -- we already know it's not whitespace or a delimiter,
                            // so we don't really care what the heck it is at this point.
                            while (++ndx < length)
                            {
                                // get the current character
                                var ch = commandLine[ndx];

                                if (inDelimiter)
                                {
                                    // in delimiter mode.
                                    // we only care if we found the closing delimiter
                                    if (ch == '"')
                                    {
                                        // BUT if it's a double double-quote, then treat those two characters as
                                        // a single double-quote
                                        if (ndx + 1 < length && commandLine[ndx + 1] == '"')
                                        {
                                            // add what we have so far (if anything)
                                            if (ndx > start)
                                            {
                                                sb.Append(commandLine.Substring(start, ndx - start));
                                            }

                                            // insert a single double-quote into the string builder
                                            sb.Append('"');

                                            // skip over the quote and start on the NEXT character
                                            start = ++ndx + 1;
                                        }
                                        else
                                        {
                                            // found it; end delimiter mode
                                            inDelimiter = false;

                                            if (ndx > start)
                                            {
                                                // add what we have so far
                                                sb.Append(commandLine.Substring(start, ndx - start));
                                            }

                                            // start is the NEXT character after the quote
                                            start = ndx + 1;
                                        }
                                    }
                                }
                                else
                                {
                                    // not in delimiter mode.
                                    // if it's a whitespace, stop looping -- we found the end
                                    if (char.IsWhiteSpace(ch))
                                    {
                                        break;
                                    }
                                    else if (ch == '"')
                                    {
                                        // we found a start delimiter
                                        inDelimiter = true;

                                        // create the string builder now if we haven't already
                                        if (sb == null)
                                        {
                                            sb = StringBuilderPool.Acquire();
                                        }

                                        // add what we have up to the start delimiter into the string builder
                                        // because we're going to have to add this escaped string to it WITHOUT
                                        // the double-quotes
                                        sb.Append(commandLine.Substring(start, ndx - start));

                                        // and start this one at the next character -- not counting the quote
                                        start = ndx + 1;
                                    }
                                }
                            }

                            // we now have the start end end of the argument
                            // if the start and end character are the same delimiter characters, trim them off
                            // otherwise just use what's between them
                            if (sb != null)
                            {
                                // add what we have left (if any)
                                if (ndx > start)
                                {
                                    sb.Append(commandLine.Substring(start, ndx - start));
                                }

                                // and send the whole shebang to the list
                                args.Add(sb.ToString());
                            }
                            else
                            {
                                // no double-quotes encountered, so just pull the substring
                                // directly from the command line
                                args.Add(commandLine.Substring(start, ndx - start));
                            }
                        }
                    }
                    finally
                    {
                        sb.Release();
                    }
                }
            }

            return args.ToArray();
        }

        #endregion

        #region Parse command line

        /// <summary>
        /// Takes a full command-line string and parses the switches into the appropriate settings objects
        /// </summary>
        /// <param name="commandLine"></param>
        public void Parse(string commandLine)
        {
            // no command line, then nothing to parse
            if (!string.IsNullOrEmpty(commandLine))
            {
                // convert the command line to an argument list and pass it
                // to the appropriate override
                Parse(ToArguments(commandLine));
            }
        }

        #endregion

        #region parse arguments

        /// <summary>
        /// Takes an array of arguments and parses the switches into the appropriate settings objects
        /// </summary>
        /// <param name="args"></param>
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1505:AvoidUnmaintainableCode", Justification="Big switch statement"), 
         System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1502:AvoidExcessiveComplexity", Justification = "Big switch statement")]
        public void Parse(string[] args)
        {
            var listSeparators = new[] { ',', ';' };
            if (args != null)
            {
                var levelSpecified = false;
                var renamingSpecified = false;
                var killSpecified = false;
                var minifySpecified = false;
                bool parameterFlag;
                for (var ndx = 0; ndx < args.Length; ++ndx)
                {
                    // parameter switch
                    var thisArg = args[ndx];

                    // don't use the forward-slash for switches if this is running under the Mono runtime. 
                    // Mono is a .NET for UNIX implementation, and the UNIX OS uses forward slashes as the directory separator.
                    if (thisArg.Length > 1
                      && (thisArg.StartsWith("-", StringComparison.Ordinal) // this is a normal hyphen (minus character)
                      || thisArg.StartsWith("–", StringComparison.Ordinal) // this character is what Word will convert a hyphen to
                      || (!m_isMono && thisArg.StartsWith("/", StringComparison.Ordinal))))
                    {
                        // general switch syntax is -switch:param
                        var parts = thisArg.Substring(1).Split(':');
                        var switchPart = parts[0].ToUpperInvariant();
                        var paramPart = parts.Length == 1 ? null : parts[1];
                        var paramPartUpper = paramPart == null ? null : paramPart.ToUpperInvariant();

                        // switch off the switch part
                        switch (switchPart)
                        {
                            case "AMD":
                                // amd support
                                if (BooleanSwitch(paramPartUpper, true, out parameterFlag))
                                {
                                    JSSettings.AmdSupport = parameterFlag;
                                }
                                else
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }
                                break;

                            case "ANALYZE":
                            case "A": // <-- old-style
                                // ignore any arguments
                                AnalyzeMode = true;

                                // by default, we have no report format
                                ReportFormat = null;
                                if (paramPartUpper != null)
                                {
                                    var items = paramPartUpper.Split(listSeparators, StringSplitOptions.RemoveEmptyEntries);
                                    foreach (var item in items)
                                    {
                                        if (string.CompareOrdinal(item, "OUT") == 0)
                                        {
                                            // if the analyze part is "out," then the NEXT arg string
                                            // is the output path the analyze scope report should be written to.
                                            if (ndx >= args.Length - 1)
                                            {
                                                // must be followed by a path
                                                OnInvalidSwitch(switchPart, paramPart);
                                            }
                                            else
                                            {
                                                ReportPath = args[++ndx];
                                            }
                                        }
                                        else
                                        {
                                            // must be a report format. There can be only one, so clobber whatever
                                            // is there from before -- last one listed wins.
                                            ReportFormat = item;
                                        }
                                    }
                                }

                                // if analyze was specified but no warning level, jack up the warning level
                                // so everything is shown
                                if (!levelSpecified)
                                {
                                    // we want to analyze, and we didn't specify a particular warning level.
                                    // go ahead and report all errors
                                    WarningLevel = int.MaxValue;
                                }

                                break;

                            case "ASPNET":
                                if (BooleanSwitch(paramPartUpper, true, out parameterFlag))
                                {
                                    // same setting for both CSS and JS
                                    JSSettings.AllowEmbeddedAspNetBlocks =
                                        CssSettings.AllowEmbeddedAspNetBlocks = parameterFlag;
                                }
                                else
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }
                                break;

                            case "BRACES":
                                if (paramPartUpper == "NEW")
                                {
                                    JSSettings.BlocksStartOnSameLine = 
                                        CssSettings.BlocksStartOnSameLine = BlockStart.NewLine;
                                }
                                else if (paramPartUpper == "SAME")
                                {
                                    JSSettings.BlocksStartOnSameLine =
                                        CssSettings.BlocksStartOnSameLine = BlockStart.SameLine;
                                }
                                else if (paramPartUpper == "SOURCE")
                                {
                                    JSSettings.BlocksStartOnSameLine =
                                        CssSettings.BlocksStartOnSameLine = BlockStart.UseSource;
                                }
                                else
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }
                                break;

                            case "CC":
                                if (BooleanSwitch(paramPartUpper, true, out parameterFlag))
                                {
                                    // actually, the flag is the opposite of the member -- turn CC ON and we DON'T
                                    // want to ignore them; turn CC OFF and we DO want to ignore them
                                    JSSettings.IgnoreConditionalCompilation = !parameterFlag;
                                }
                                else
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }
                                OnJSOnlyParameter();
                                break;

                            case "CLOBBER":
                                // just putting the clobber switch on the command line without any arguments
                                // is the same as putting -clobber:true and perfectly valid.
                                if (paramPartUpper == null)
                                {
                                    Clobber = ExistingFileTreatment.Overwrite;
                                }
                                else if (BooleanSwitch(paramPartUpper, true, out parameterFlag))
                                {
                                    Clobber = parameterFlag ? ExistingFileTreatment.Overwrite : ExistingFileTreatment.Auto;
                                }
                                else
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }

                                break;

                            case "COLORS":
                                // two options: hex or names
                                if (paramPartUpper == "HEX")
                                {
                                    CssSettings.ColorNames = CssColor.Hex;
                                }
                                else if (paramPartUpper == "STRICT")
                                {
                                    CssSettings.ColorNames = CssColor.Strict;
                                }
                                else if (paramPartUpper == "MAJOR")
                                {
                                    CssSettings.ColorNames = CssColor.Major;
                                }
                                else if (paramPartUpper == "NOSWAP")
                                {
                                    CssSettings.ColorNames = CssColor.NoSwap;
                                }
                                else
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }
                                OnCssOnlyParameter();
                                break;

                            case "COMMENTS":
                                // four options for css: none, all, important, or hacks
                                // two options for js: none, important
                                // (default is important)
                                if (paramPartUpper == "NONE")
                                {
                                    CssSettings.CommentMode = CssComment.None;
                                    JSSettings.PreserveImportantComments = false;
                                }
                                else if (paramPartUpper == "ALL")
                                {
                                    CssSettings.CommentMode = CssComment.All;
                                    OnCssOnlyParameter();
                                }
                                else if (paramPartUpper == "IMPORTANT")
                                {
                                    CssSettings.CommentMode = CssComment.Important;
                                    JSSettings.PreserveImportantComments = true;
                                }
                                else if (paramPartUpper == "HACKS")
                                {
                                    CssSettings.CommentMode = CssComment.Hacks;
                                    OnCssOnlyParameter();
                                }
                                else
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }

                                break;

                            case "CONST":
                                // options: MOZ or ES6 (ES6 is the default)
                                if (paramPartUpper == "MOZ")
                                {
                                    JSSettings.ConstStatementsMozilla = true;
                                }
                                else if (paramPartUpper == "ES6")
                                {
                                    JSSettings.ConstStatementsMozilla = false;
                                }
                                else
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }

                                // this is a JS-only switch
                                OnJSOnlyParameter();
                                break;

                            case "CSS":
                                OnCssOnlyParameter();
                                if (paramPartUpper != null)
                                {
                                    switch (paramPartUpper)
                                    {
                                        case "FULL":
                                            CssSettings.CssType = CssType.FullStyleSheet;
                                            break;

                                        case "DECLS":
                                            CssSettings.CssType = CssType.DeclarationList;
                                            break;

                                        default:
                                            // not an expected value
                                            OnInvalidSwitch(switchPart, paramPart);
                                            break;
                                    }
                                }
                                break;

                            case "CULTURE":
                                if (paramPart.IsNullOrWhiteSpace())
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }
                                else
                                {
                                    CultureInfo cultureInfo;
                                    if (!TryCreateCultureInfo(paramPart, out cultureInfo))
                                    {
                                        // no such culture. Try just the language part, if there is one and it's
                                        // different than what we already tried
                                        var cultureParts = paramPart.Split(new[] { '-' }, StringSplitOptions.RemoveEmptyEntries);
                                        if (!cultureParts[0].Equals(paramPart, StringComparison.OrdinalIgnoreCase))
                                        {
                                            TryCreateCultureInfo(cultureParts[0], out cultureInfo);
                                        }
                                    }

                                    if (cultureInfo == null)
                                    {
                                        // not valid
                                        OnInvalidSwitch(switchPart, paramPart);
                                    }
                                    else
                                    {
                                        // set the thread's current culture to what was specified
                                        Thread.CurrentThread.CurrentCulture = cultureInfo;
                                    }
                                }
                                break;

                            case "DEBUG":
                                // if the -pretty switch has been specified, we have an incompatible set of switches.
                                // this seems to be a common one for people to wonder why it's not working properly.
                                m_noPretty = true;
                                if (PrettyPrint)
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }

                                // see if the param part is a comma-delimited list
                                if (paramPartUpper != null && paramPartUpper.IndexOf(',') >= 0)
                                {
                                    // we have a comma-separated list.
                                    // the first item is the flag (if any), and the rest (if any) are the "debug" lookup names
                                    var items = paramPart.Split(listSeparators);

                                    // use the first value as the debug boolean switch.
                                    // since we are splitting the non-uppercase param part, we need to 
                                    // make sure the first item is capitalized for our boolean test.
                                    if (BooleanSwitch(items[0].ToUpperInvariant(), true, out parameterFlag))
                                    {
                                        // actually the inverse - a TRUE on the -debug switch means we DON'T want to
                                        // strip debug statements, and a FALSE means we DO want to strip them
                                        JSSettings.StripDebugStatements = !parameterFlag;

                                        // make sure we align the DEBUG define to the new switch value
                                        AlignDebugDefine(JSSettings.StripDebugStatements, JSSettings.PreprocessorValues);
                                    }
                                    else
                                    {
                                        OnInvalidSwitch(switchPart, paramPart);
                                    }

                                    // clear out the existing debug list
                                    JSSettings.DebugLookupList = null;

                                    // start with index 1, since index 0 was the flag
                                    for (var item = 1; item < items.Length; ++item)
                                    {
                                        // get the identifier that was specified
                                        var identifier = items[item];
                                        if (!identifier.IsNullOrWhiteSpace())
                                        {
                                            if (!JSSettings.AddDebugLookup(identifier))
                                            {
                                                OnInvalidSwitch(switchPart, identifier);
                                            }
                                        }
                                    }
                                }
                                else if (BooleanSwitch(paramPartUpper, true, out parameterFlag))
                                {
                                    // no commas -- just use the entire param part as the boolean value.
                                    // just putting the debug switch on the command line without any arguments
                                    // is the same as putting -debug:true and perfectly valid.

                                    // actually the inverse - a TRUE on the -debug switch means we DON'T want to
                                    // strip debug statements, and a FALSE means we DO want to strip them
                                    JSSettings.StripDebugStatements = !parameterFlag;

                                    // make sure we align the DEBUG define to the new switch value
                                    AlignDebugDefine(JSSettings.StripDebugStatements, JSSettings.PreprocessorValues);
                                }

                                // this is a JS-only switch
                                OnJSOnlyParameter();
                                break;

                            case "DEFINE":
                                // the parts can be a comma-separate list of identifiers
                                if (string.IsNullOrEmpty(paramPartUpper))
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }
                                else
                                {
                                    foreach (string define in paramPart.Split(listSeparators, StringSplitOptions.RemoveEmptyEntries))
                                    {
                                        string trimmedName;
                                        string value;
                                        var ndxEquals = define.IndexOf('=');
                                        if (ndxEquals < 0)
                                        {
                                            trimmedName = define.Trim();
                                            value = string.Empty;
                                        }
                                        else
                                        {
                                            trimmedName = define.Substring(0, ndxEquals).Trim();
                                            value = define.Substring(ndxEquals + 1);
                                        }

                                        // better be a valid JavaScript identifier
                                        if (!JSScanner.IsValidIdentifier(trimmedName))
                                        {
                                            OnInvalidSwitch(switchPart, define);
                                        }
                                        else
                                        {
                                            // JS Settings
                                            JSSettings.PreprocessorValues[trimmedName] = value;

                                            // CSS settings
                                            CssSettings.PreprocessorValues[trimmedName] = value;
                                        }

                                        // if we're defining the DEBUG name, set the strip-debug-statements flag to false
                                        if (string.Compare(trimmedName, "DEBUG", StringComparison.OrdinalIgnoreCase) == 0)
                                        {
                                            JSSettings.StripDebugStatements = false;
                                        }
                                    }
                                }

                                break;

                            case "ENC":
                                // the encoding is the next argument
                                if (ndx >= args.Length - 1)
                                {
                                    // must be followed by an encoding
                                    OnInvalidSwitch(switchPart, paramPart);
                                }
                                else
                                {
                                    string encoding = args[++ndx];

                                    // whether this is an in or an out encoding
                                    if (paramPartUpper == "IN")
                                    {
                                        // save the name -- we'll create the encoding later because we may
                                        // override it on a file-by-file basis in an XML file
                                        EncodingInputName = encoding;
                                    }
                                    else if (paramPartUpper == "OUT")
                                    {
                                        // just save the name -- we'll create the encoding later because we need
                                        // to know whether we are JS or CSS to pick the right encoding fallback
                                        EncodingOutputName = encoding;
                                    }
                                    else
                                    {
                                        OnInvalidSwitch(switchPart, paramPart);
                                    }
                                }
                                break;

                            case "ESC":
                                if (BooleanSwitch(paramPartUpper, true, out parameterFlag))
                                {
                                    JSSettings.AlwaysEscapeNonAscii = parameterFlag;
                                }
                                else
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }
                                OnJSOnlyParameter();
                                break;

                            case "EVALS":
                                // three options: ignore, make immediate scope safe, or make all scopes safe
                                if (paramPartUpper == "IGNORE")
                                {
                                    JSSettings.EvalTreatment = EvalTreatment.Ignore;
                                }
                                else if (paramPartUpper == "IMMEDIATE")
                                {
                                    JSSettings.EvalTreatment = EvalTreatment.MakeImmediateSafe;
                                }
                                else if (paramPartUpper == "SAFEALL")
                                {
                                    JSSettings.EvalTreatment = EvalTreatment.MakeAllSafe;
                                }
                                else
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }

                                // this is a JS-only switch
                                OnJSOnlyParameter();
                                break;

                            case "EXPR":
                                // two options: minify (default) or raw
                                if (paramPartUpper == "MINIFY")
                                {
                                    CssSettings.MinifyExpressions = true;
                                }
                                else if (paramPartUpper == "RAW")
                                {
                                    CssSettings.MinifyExpressions = false;
                                }
                                else
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }

                                OnCssOnlyParameter();
                                break;

                            case "FNAMES":
                                // three options: 
                                // LOCK    -> keep all NFE names, don't allow renaming of function names
                                // KEEP    -> keep all NFE names, but allow function names to be renamed
                                // ONLYREF -> remove unref'd NFE names, allow function named to be renamed (DEFAULT)
                                if (paramPartUpper == "LOCK")
                                {
                                    // don't remove function expression names
                                    JSSettings.RemoveFunctionExpressionNames = false;

                                    // and preserve the names (don't allow renaming)
                                    JSSettings.PreserveFunctionNames = true;
                                }
                                else if (paramPartUpper == "KEEP")
                                {
                                    // don't remove function expression names
                                    JSSettings.RemoveFunctionExpressionNames = false;

                                    // but it's okay to rename them
                                    JSSettings.PreserveFunctionNames = false;
                                }
                                else if (paramPartUpper == "ONLYREF")
                                {
                                    // remove function expression names if they aren't referenced
                                    JSSettings.RemoveFunctionExpressionNames = true;

                                    // and rename them if we so desire
                                    JSSettings.PreserveFunctionNames = false;

                                    // if the -pretty switch has been specified, we have an incompatible set of switches.
                                    // this seems to be a common one for people to wonder why it's not working properly.
                                    m_noPretty = true;
                                    if (PrettyPrint)
                                    {
                                        OnInvalidSwitch(switchPart, paramPart);
                                    }
                                }
                                else
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }

                                // this is a JS-only switch
                                OnJSOnlyParameter();
                                break;

                            case "GLOBAL":
                            case "G": // <-- old style
                                // the parts can be a comma-separate list of identifiers
                                if (string.IsNullOrEmpty(paramPartUpper))
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }
                                else
                                {
                                    foreach (string global in paramPart.Split(listSeparators, StringSplitOptions.RemoveEmptyEntries))
                                    {
                                        // better be a valid JavaScript identifier
                                        if (!JSSettings.AddKnownGlobal(global))
                                        {
                                            OnInvalidSwitch(switchPart, global);
                                        }
                                    }
                                }

                                // this is a JS-only switch
                                OnJSOnlyParameter();
                                break;

                            case "IE8FIX":
                                if (BooleanSwitch(paramPartUpper, true, out parameterFlag))
                                {
                                    CssSettings.FixIE8Fonts = parameterFlag;
                                }
                                else
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }
                                OnCssOnlyParameter();
                                break;

                            case "IGNORE":
                                // list of error codes to ignore (not report)
                                // the parts can be a comma-separate list of identifiers
                                if (string.IsNullOrEmpty(paramPartUpper))
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }
                                else
                                {
                                    foreach (string errorCode in paramPart.Split(listSeparators, StringSplitOptions.RemoveEmptyEntries))
                                    {
                                        if (string.Compare(errorCode, "ALL", StringComparison.OrdinalIgnoreCase) == 0)
                                        {
                                            // we want to ignore ALL errors. So set the appropriate flag
                                            JSSettings.IgnoreAllErrors =
                                                CssSettings.IgnoreAllErrors = true;
                                        }
                                        else
                                        {
                                            // don't add duplicates
                                            JSSettings.IgnoreErrorCollection.Add(errorCode);
                                            CssSettings.IgnoreErrorCollection.Add(errorCode);
                                        }
                                    }
                                }
                                break;

                            case "INLINE":
                                if (string.IsNullOrEmpty(paramPart))
                                {
                                    // no param parts. This defaults to inline-safe
                                    JSSettings.InlineSafeStrings = true;
                                }
                                else
                                {
                                    // for each comma-separated part...
                                    foreach (var inlinePart in paramPartUpper.Split(listSeparators, StringSplitOptions.RemoveEmptyEntries))
                                    {
                                        if (string.CompareOrdinal(inlinePart, "FORCE") == 0)
                                        {
                                            // this is the force flag -- throw an error if any string literal
                                            // sources are not properly escaped AND make sure the output is 
                                            // safe
                                            JSSettings.ErrorIfNotInlineSafe = true;
                                            JSSettings.InlineSafeStrings = true;
                                        }
                                        else if (string.CompareOrdinal(inlinePart, "NOFORCE") == 0)
                                        {
                                            // this is the noforce flag; don't throw an error is the source isn't inline safe.
                                            // don't change whatever the output-inline-safe flag may happen to be, though
                                            JSSettings.ErrorIfNotInlineSafe = false;
                                        }
                                        else
                                        {
                                            // assume it must be the boolean flag.
                                            // if no param part, will return true (indicating the default)
                                            // if invalid param part, will throw error
                                            if (BooleanSwitch(inlinePart, true, out parameterFlag))
                                            {
                                                JSSettings.InlineSafeStrings = parameterFlag;
                                            }
                                            else
                                            {
                                                OnInvalidSwitch(switchPart, paramPart);
                                            }
                                        }
                                    }
                                }

                                // this is a JS-only switch
                                OnJSOnlyParameter();
                                break;

                            case "JS":
                                if (paramPart == null)
                                {
                                    // normal settings
                                    JSSettings.SourceMode = JavaScriptSourceMode.Program;
                                    JSSettings.Format = JavaScriptFormat.Normal;
                                }
                                else
                                {
                                    // comma-delimited list of JS settings
                                    var tokens = paramPartUpper.Split(',', ';');
                                    foreach (var token in tokens)
                                    {
                                        switch (token)
                                        {
                                            case "JSON":
                                                // JSON is incompatible with any other tokens, so throw an error
                                                // if it's not the only token
                                                if (tokens.Length > 1)
                                                {
                                                    OnInvalidSwitch(switchPart, paramPart);
                                                }

                                                // nothing to "minify" in the JSON format, so turn off the minify flag
                                                JSSettings.MinifyCode = false;

                                                // JSON affects both the input (it's an expression) and the output
                                                // (use the JSON-output visitor)
                                                JSSettings.SourceMode = JavaScriptSourceMode.Expression;
                                                JSSettings.Format = JavaScriptFormat.JSON;
                                                break;

                                            case "PROG":
                                            case "PROGRAM":
                                                // this is the default setting
                                                JSSettings.SourceMode = JavaScriptSourceMode.Program;
                                                break;

                                            case "MOD":
                                            case "MODULE":
                                                JSSettings.SourceMode = JavaScriptSourceMode.Module;
                                                break;

                                            case "EXPR":
                                            case "EXPRESSION":
                                                JSSettings.SourceMode = JavaScriptSourceMode.Expression;
                                                break;

                                            case "EVT":
                                            case "EVENT":
                                                JSSettings.SourceMode = JavaScriptSourceMode.EventHandler;
                                                break;

                                            case "ES5":
                                                // say we are targetting ECMAScript 5. ECMAScript 6 features won't
                                                // be disabled; future feature may change them to ES5-equivalents.
                                                JSSettings.ScriptVersion = ScriptVersion.EcmaScript5;
                                                break;

                                            case "ES6":
                                                // say we are targetting ECMAScript 6 so the parser will know ahead of
                                                // time and not be surprised by new syntax. Future feature may generate
                                                // ES6 syntax for optimizations.
                                                JSSettings.ScriptVersion = ScriptVersion.EcmaScript6;
                                                break;

                                            default:
                                                // later: ES5 to convert any ES6 syntax to ES5-compatible
                                                // later: ES6 to create ES6 syntax when optimizing
                                                // etc.
                                                // those two examples will affect the format property.
                                                // but for now, not supported
                                                OnInvalidSwitch(switchPart, paramPart);
                                                break;
                                        }
                                    }
                                }

                                OnJSOnlyParameter();
                                break;

                            case "KILL":
                                killSpecified = true;

                                // optional integer switch argument
                                if (paramPartUpper == null)
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }
                                else
                                {
                                    // get the numeric portion
                                    long killSwitch;
                                    if (paramPartUpper.StartsWith("0X", StringComparison.OrdinalIgnoreCase))
                                    {
                                        // it's hex -- convert the number after the "0x"
                                        if (paramPartUpper.Substring(2).TryParseLongInvariant(NumberStyles.AllowHexSpecifier, out killSwitch))
                                        {
                                            // save the switch for both JS and Css
                                            JSSettings.KillSwitch = CssSettings.KillSwitch = killSwitch;

                                            // for CSS, we only look at the first bit: preeserve important comments
                                            if ((killSwitch & 1) != 0)
                                            {
                                                // we set the kill, so make sure the comments are set to none
                                                CssSettings.CommentMode = CssComment.None;
                                            }
                                        }
                                        else
                                        {
                                            OnInvalidSwitch(switchPart, paramPart);
                                        }
                                    }
                                    else if (paramPartUpper.TryParseLongInvariant(NumberStyles.AllowLeadingSign, out killSwitch))
                                    {
                                        // save the switch for both JS and CSS
                                        JSSettings.KillSwitch = CssSettings.KillSwitch = killSwitch;

                                        // for CSS, we only look at the first bit: preeserve important comments
                                        if ((killSwitch & 1) != 0)
                                        {
                                            // we set the kill, so make sure the comments are set to none
                                            CssSettings.CommentMode = CssComment.None;
                                        }
                                    }
                                    else
                                    {
                                        OnInvalidSwitch(switchPart, paramPart);
                                    }
                                }

                                break;

                            case "LINE":
                            case "LINES":
                                if (string.IsNullOrEmpty(paramPartUpper))
                                {
                                    // if no number specified, use the max default threshold
                                    JSSettings.LineBreakThreshold =
                                        CssSettings.LineBreakThreshold = int.MaxValue - 1000;
                                    
                                    // single-line mode
                                    JSSettings.OutputMode = 
                                        CssSettings.OutputMode = OutputMode.SingleLine;

                                    // and four spaces per indent level
                                    JSSettings.IndentSize =
                                        CssSettings.IndentSize = 4;
                                }
                                else
                                {
                                    // split along commas (case-insensitive)
                                    var lineParts = paramPartUpper.Split(listSeparators, StringSplitOptions.RemoveEmptyEntries);

                                    // by default, the line-break index will be 1 (the second option).
                                    // we will change this index to 0 if the first parameter is multi/single
                                    // instead of the line-break character count.
                                    var breakIndex = 1;
                                    if (lineParts.Length <= 3)
                                    {
                                        // if the first optional part is numeric, then it's the line threshold.
                                        // might also be "multi" or "single", thereby skipping the line threshold.
                                        // (don't need to check length greater than zero -- will always be at least one element returned from Split)
                                        if (!string.IsNullOrEmpty(lineParts[0]))
                                        {
                                            // must be an unsigned decimal integer value
                                            int lineThreshold;
                                            if (lineParts[0].TryParseIntInvariant(NumberStyles.None, out lineThreshold))
                                            {
                                                JSSettings.LineBreakThreshold =
                                                    CssSettings.LineBreakThreshold = lineThreshold;
                                            }
                                            else if (lineParts[0][0] == 'S')
                                            {
                                                // single-line mode
                                                JSSettings.OutputMode =
                                                    CssSettings.OutputMode = OutputMode.SingleLine;

                                                // the line-break index was the first one (zero)
                                                breakIndex = 0;
                                            }
                                            else if (lineParts[0][0] == 'M')
                                            {
                                                // multiple-line mode
                                                JSSettings.OutputMode =
                                                    CssSettings.OutputMode = OutputMode.MultipleLines;

                                                // the line-break index was the first one (zero)
                                                breakIndex = 0;
                                            }
                                            else
                                            {
                                                OnInvalidSwitch(switchPart, lineParts[0]);
                                            }
                                        }
                                        else
                                        {
                                            // use the default
                                            JSSettings.LineBreakThreshold =
                                                CssSettings.LineBreakThreshold = int.MaxValue - 1000;
                                        }

                                        if (lineParts.Length > breakIndex)
                                        {
                                            // if the line-break index was zero, then we already processed it
                                            // and we can skip the logic
                                            if (breakIndex > 0)
                                            {
                                                // second optional part is single or multiple line output
                                                if (string.IsNullOrEmpty(lineParts[breakIndex]) || lineParts[breakIndex][0] == 'S')
                                                {
                                                    // single-line mode
                                                    JSSettings.OutputMode =
                                                        CssSettings.OutputMode = OutputMode.SingleLine;
                                                }
                                                else if (lineParts[breakIndex][0] == 'M')
                                                {
                                                    // multiple-line mode
                                                    JSSettings.OutputMode =
                                                        CssSettings.OutputMode = OutputMode.MultipleLines;
                                                }
                                                else
                                                {
                                                    // must either be missing, or start with S (single) or M (multiple)
                                                    OnInvalidSwitch(switchPart, lineParts[breakIndex]);
                                                }
                                            }

                                            // move on to the next part
                                            ++breakIndex;
                                            if (lineParts.Length > breakIndex)
                                            {
                                                // third optional part is the spaces-per-indent value
                                                if (!string.IsNullOrEmpty(lineParts[breakIndex]))
                                                {
                                                    // get the numeric portion; must be a decimal integer
                                                    int indentSize;
                                                    if (lineParts[breakIndex].TryParseIntInvariant(NumberStyles.None, out indentSize))
                                                    {
                                                        // same value for JS and CSS.
                                                        // don't need to check for negative, because the tryparse method above does NOT
                                                        // allow for a sign -- no sign, no negative.
                                                        JSSettings.IndentSize = CssSettings.IndentSize = indentSize;
                                                    }
                                                    else
                                                    {
                                                        OnInvalidSwitch(switchPart, lineParts[breakIndex]);
                                                    }
                                                }
                                                else
                                                {
                                                    // default of 4
                                                    JSSettings.IndentSize =
                                                        CssSettings.IndentSize = 4;
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        // only 1-3 parts allowed
                                        OnInvalidSwitch(switchPart, paramPart);
                                    }
                                }

                                break;

                            case "LITERALS":
                                // two areas with two options each: keep or combine and eval or noeval
                                if (paramPartUpper == "KEEP")
                                {
                                    // no longer supported....
                                    //JSSettings.CombineDuplicateLiterals = false;
                                }
                                else if (paramPartUpper == "COMBINE")
                                {
                                    // no longer supported....
                                    //JSSettings.CombineDuplicateLiterals = true;
                                }
                                else if (paramPartUpper == "EVAL")
                                {
                                    JSSettings.EvalLiteralExpressions = true;

                                    // if the -pretty switch has been specified, we have an incompatible set of switches.
                                    // this seems to be a common one for people to wonder why it's not working properly.
                                    m_noPretty = true;
                                    if (PrettyPrint)
                                    {
                                        OnInvalidSwitch(switchPart, paramPart);
                                    }
                                }
                                else if (paramPartUpper == "NOEVAL")
                                {
                                    JSSettings.EvalLiteralExpressions = false;
                                }
                                else
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }

                                // this is a JS-only switch
                                OnJSOnlyParameter();
                                break;

                            case "MAC":
                                // optional boolean switch
                                // no arg is valid scenario (default is true)
                                if (BooleanSwitch(paramPartUpper, true, out parameterFlag))
                                {
                                    JSSettings.MacSafariQuirks = parameterFlag;
                                }
                                else
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }

                                // this is a JS-only switch
                                OnJSOnlyParameter();
                                break;

                            case "MINIFY":
                                minifySpecified = true;
                                if (renamingSpecified && JSSettings.LocalRenaming != LocalRenaming.KeepAll)
                                {
                                    // minify can only exist if rename is set to KeepAll
                                    OnInvalidSwitch(switchPart, paramPart);
                                }
                                else if (BooleanSwitch(paramPartUpper, true, out parameterFlag))
                                {
                                    // optional boolean switch
                                    // no arg is a valid scenario (default is true)
                                    JSSettings.MinifyCode = parameterFlag;

                                    // if the -pretty switch has been specified, we have an incompatible set of switches.
                                    // this seems to be a common one for people to wonder why it's not working properly.
                                    if (parameterFlag)
                                    {
                                        m_noPretty = true;
                                        if (PrettyPrint)
                                        {
                                            OnInvalidSwitch(switchPart, paramPart);
                                        }
                                    }
                                }
                                else
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }

                                // this is a JS-only switch
                                OnJSOnlyParameter();
                                break;

                            case "NEW":
                                // two options: keep and collapse
                                if (paramPartUpper == "KEEP")
                                {
                                    JSSettings.CollapseToLiteral = false;
                                }
                                else if (paramPartUpper == "COLLAPSE")
                                {
                                    JSSettings.CollapseToLiteral = true;

                                    // if the -pretty switch has been specified, we have an incompatible set of switches.
                                    // this seems to be a common one for people to wonder why it's not working properly.
                                    m_noPretty = true;
                                    if (PrettyPrint)
                                    {
                                        OnInvalidSwitch(switchPart, paramPart);
                                    }
                                }
                                else
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }

                                // this is a JS-only switch
                                OnJSOnlyParameter();
                                break;

                            case "NFE": // <-- deprecate; use FNAMES option instead
                                if (paramPartUpper == "KEEPALL")
                                {
                                    JSSettings.RemoveFunctionExpressionNames = false;
                                }
                                else if (paramPartUpper == "ONLYREF")
                                {
                                    JSSettings.RemoveFunctionExpressionNames = true;

                                    // if the -pretty switch has been specified, we have an incompatible set of switches.
                                    // this seems to be a common one for people to wonder why it's not working properly.
                                    m_noPretty = true;
                                    if (PrettyPrint)
                                    {
                                        OnInvalidSwitch(switchPart, paramPart);
                                    }
                                }
                                else
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }

                                // this is a JS-only switch
                                OnJSOnlyParameter();
                                break;

                            case "NOCLOBBER":
                                // putting the noclobber switch on the command line without any arguments
                                // is the same as putting -noclobber:true and perfectly valid.
                                if (paramPartUpper == null)
                                {
                                    Clobber = ExistingFileTreatment.Preserve;
                                }
                                else if (BooleanSwitch(paramPartUpper, true, out parameterFlag))
                                {
                                    Clobber = parameterFlag ? ExistingFileTreatment.Preserve : ExistingFileTreatment.Auto;
                                }
                                else
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }
                                break;

                            case "NORENAME":
                                // the parts can be a comma-separate list of identifiers
                                if (string.IsNullOrEmpty(paramPartUpper))
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }
                                else
                                {
                                    foreach (string ident in paramPart.Split(listSeparators, StringSplitOptions.RemoveEmptyEntries))
                                    {
                                        // better be a valid JavaScript identifier
                                        if (!JSSettings.AddNoAutoRename(ident))
                                        {
                                            OnInvalidSwitch(switchPart, ident);
                                        }
                                    }
                                }

                                // this is a JS-only switch
                                OnJSOnlyParameter();
                                break;

                            case "NOVENDER":
                                if (string.IsNullOrEmpty(paramPartUpper))
                                {
                                    // if there's no param part, then we are being asked to clear the collection
                                    CssSettings.ExcludeVendorPrefixes.Clear();
                                }
                                else
                                {
                                    var vendorPrefixes = paramPart.Split(listSeparators, StringSplitOptions.RemoveEmptyEntries);
                                    foreach(var prefix in vendorPrefixes)
                                    {
                                        if (CssScanner.IsValidVendorPrefix(prefix))
                                        {
                                            CssSettings.ExcludeVendorPrefixes.Add(prefix);
                                        }
                                        else
                                        {
                                            OnInvalidSwitch(switchPart, paramPart);
                                        }
                                    }
                                }

                                OnCssOnlyParameter();
                                break;

                            case "OBJ":
                                // if the -pretty switch has been specified, we have an incompatible set of switches.
                                m_noPretty = true;
                                if (PrettyPrint)
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }

                                // two options: MINify or QUOTE
                                if (paramPartUpper == "MIN")
                                {
                                    JSSettings.QuoteObjectLiteralProperties = false;
                                }
                                else if (paramPartUpper == "QUOTE")
                                {
                                    JSSettings.QuoteObjectLiteralProperties = true;
                                }
                                else
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }

                                // this is a JS-only switch
                                OnJSOnlyParameter();
                                break;

                            case "PPONLY":
                                // if the -pretty switch has been specified, we have an incompatible set of switches.
                                m_noPretty = true;
                                if (PrettyPrint)
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }

                                // just putting the pponly switch on the command line without any arguments
                                // is the same as putting -pponly:true and perfectly valid.
                                if (paramPart == null)
                                {
                                    JSSettings.PreprocessOnly = true;
                                }
                                else if (BooleanSwitch(paramPartUpper, true, out parameterFlag))
                                {
                                    JSSettings.PreprocessOnly = parameterFlag;
                                }
                                else
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }

                                // this is a JS-only switch
                                OnJSOnlyParameter();
                                break;

                            case "PRETTY":
                            case "P": // <-- old style
                                // doesn't take a flag -- just set to pretty
                                PrettyPrint = true;
                                if (m_noPretty)
                                {
                                    // already encountered a switch that is incompatible with -pretty
                                    OnInvalidSwitch(switchPart, paramPart);
                                }

                                // by default, pretty mode turns off minification, which sets a bunch of other flags as well
                                JSSettings.MinifyCode = false;

                                // and some other flags for pretty-mode
                                JSSettings.OutputMode = CssSettings.OutputMode = OutputMode.MultipleLines;
                                CssSettings.KillSwitch = ~((long)TreeModifications.PreserveImportantComments);
                                CssSettings.RemoveEmptyBlocks = false;

                                // optional integer switch argument
                                if (paramPartUpper != null)
                                {
                                    // get the numeric portion; must be a decimal integer
                                    int indentSize;
                                    if (paramPart.TryParseIntInvariant(NumberStyles.None, out indentSize))
                                    {
                                        // same value for JS and CSS.
                                        // don't need to check for negative, because the tryparse method above does NOT
                                        // allow for a sign -- no sign, no negative.
                                        JSSettings.IndentSize = CssSettings.IndentSize = indentSize;
                                    }
                                    else 
                                    {
                                        OnInvalidSwitch(switchPart, paramPart);
                                    }
                                }
                                break;

                            case "RENAME":
                                if (paramPartUpper == null)
                                {
                                    // treat as if it's unknown
                                    ndx = OnUnknownParameter(args, ndx, switchPart, paramPart);
                                }
                                else if (paramPartUpper.IndexOf('=') > 0)
                                {
                                    // if the -pretty switch has been specified, we have an incompatible set of switches.
                                    m_noPretty = true;
                                    if (PrettyPrint)
                                    {
                                        OnInvalidSwitch(switchPart, paramPart);
                                    }

                                    // there is at least one equal sign -- treat this as a set of JS identifier
                                    // pairs. split on commas -- multiple pairs can be specified
                                    var paramPairs = paramPart.Split(listSeparators, StringSplitOptions.RemoveEmptyEntries);
                                    foreach (var paramPair in paramPairs)
                                    {
                                        // split on the equal sign -- each pair needs to have an equal sige
                                        var pairParts = paramPair.Split('=');
                                        if (pairParts.Length == 2)
                                        {
                                            // there is an equal sign. The first part is the source name and the
                                            // second part is the new name to which to rename those entities.
                                            string fromIdentifier = pairParts[0];
                                            string toIdentifier = pairParts[1];

                                            // make sure both parts are valid JS identifiers
                                            var fromIsValid = JSScanner.IsValidIdentifier(fromIdentifier);
                                            var toIsValid = JSScanner.IsValidIdentifier(toIdentifier);
                                            if (fromIsValid && toIsValid)
                                            {
                                                // create the map if it hasn't been created yet.
                                                var toExisting = JSSettings.GetNewName(fromIdentifier);
                                                if (toExisting == null)
                                                {
                                                    JSSettings.AddRenamePair(fromIdentifier, toIdentifier);
                                                }
                                                else if (string.CompareOrdinal(toIdentifier, toExisting) != 0)
                                                {
                                                    // from-identifier already exists, and the to-identifier doesn't match.
                                                    // can't rename the same name to two different names!
                                                    OnInvalidSwitch(switchPart, fromIdentifier);
                                                }
                                            }
                                            else
                                            {
                                                if (fromIsValid)
                                                {
                                                    // the toIdentifier is invalid!
                                                    OnInvalidSwitch(switchPart, toIdentifier);
                                                }

                                                if (toIsValid)
                                                {
                                                    // the fromIdentifier is invalid!
                                                    OnInvalidSwitch(switchPart, fromIdentifier);
                                                }
                                            }
                                        }
                                        else
                                        {
                                            // either zero or more than one equal sign. Invalid.
                                            OnInvalidSwitch(switchPart, paramPart);
                                        }
                                    }
                                }
                                else
                                {
                                    // no equal sign; just a plain option
                                    // three options: all, localization, none
                                    if (paramPartUpper == "ALL")
                                    {
                                        JSSettings.LocalRenaming = LocalRenaming.CrunchAll;

                                        // automatic renaming strategy has been specified by this option
                                        renamingSpecified = true;

                                        // if the -pretty switch has been specified, we have an incompatible set of switches.
                                        m_noPretty = true;
                                        if (PrettyPrint)
                                        {
                                            OnInvalidSwitch(switchPart, paramPart);
                                        }
                                    }
                                    else if (paramPartUpper == "LOCALIZATION")
                                    {
                                        JSSettings.LocalRenaming = LocalRenaming.KeepLocalizationVars;

                                        // automatic renaming strategy has been specified by this option
                                        renamingSpecified = true;

                                        // if the -pretty switch has been specified, we have an incompatible set of switches.
                                        m_noPretty = true;
                                        if (PrettyPrint)
                                        {
                                            OnInvalidSwitch(switchPart, paramPart);
                                        }
                                    }
                                    else if (paramPartUpper == "NONE")
                                    {
                                        JSSettings.LocalRenaming = LocalRenaming.KeepAll;

                                        // automatic renaming strategy has been specified by this option
                                        renamingSpecified = true;
                                    }
                                    else if (paramPartUpper == "NOPROPS")
                                    {
                                        // manual-renaming does not change property names
                                        JSSettings.ManualRenamesProperties = false;
                                    }
                                    else
                                    {
                                        OnInvalidSwitch(switchPart, paramPart);
                                    }
                                }

                                // since we specified a rename switch OTHER than none, 
                                // let's make sure we don't *automatically* turn off switches that would 
                                // stop renaming, which we have explicitly said we want.
                                if (JSSettings.LocalRenaming != LocalRenaming.KeepAll)
                                {
                                    ResetRenamingKill(killSpecified);

                                    // if minify was specified as turned off, then this is invalid
                                    if (minifySpecified && !JSSettings.MinifyCode)
                                    {
                                        OnInvalidSwitch(switchPart, paramPart);
                                    }
                                }

                                // this is a JS-only switch
                                OnJSOnlyParameter();
                                break;

                            case "REORDER":
                                // default is true
                                if (BooleanSwitch(paramPartUpper, true, out parameterFlag))
                                {
                                    JSSettings.ReorderScopeDeclarations = parameterFlag;

                                    // if the -pretty switch has been specified, we have an incompatible set of switches.
                                    if (parameterFlag)
                                    {
                                        m_noPretty = true;
                                        if (PrettyPrint)
                                        {
                                            OnInvalidSwitch(switchPart, paramPart);
                                        }
                                    }
                                }
                                else
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }

                                // this is a JS-only switch
                                OnJSOnlyParameter();
                                break;

                            case "STRICT":
                                // default is false, but if we specify this switch without a parameter, then
                                // we assume we are turning it ON
                                if (BooleanSwitch(paramPartUpper, true, out parameterFlag))
                                {
                                    JSSettings.StrictMode = parameterFlag;
                                }
                                else
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }

                                // this is a JS-only switch
                                OnJSOnlyParameter();
                                break;

                            case "TERM":
                                // optional boolean argument, defaults to true
                                if (BooleanSwitch(paramPartUpper, true, out parameterFlag))
                                {
                                    JSSettings.TermSemicolons =
                                        CssSettings.TermSemicolons = parameterFlag;
                                }
                                else
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }
                                break;

                            case "UNUSED":
                                // two options: keep and remove
                                if (paramPartUpper == "KEEP")
                                {
                                    JSSettings.RemoveUnneededCode = false;
                                    CssSettings.RemoveEmptyBlocks = false;
                                }
                                else if (paramPartUpper == "REMOVE")
                                {
                                    JSSettings.RemoveUnneededCode = true;
                                    CssSettings.RemoveEmptyBlocks = true;

                                    // if the -pretty switch has been specified, we have an incompatible set of switches.
                                    m_noPretty = true;
                                    if (PrettyPrint)
                                    {
                                        OnInvalidSwitch(switchPart, paramPart);
                                    }
                                }
                                else
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }

                                // this is a JS-only switch
                                OnJSOnlyParameter();
                                break;

                            case "VAR":
                                m_noPretty = true;
                                if (PrettyPrint || string.IsNullOrEmpty(paramPartUpper))
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }
                                else
                                {
                                    var firstLetters = paramPart;
                                    string partLetters = null;

                                    var commaPosition = paramPart.IndexOf(',');
                                    if (commaPosition == 0)
                                    {
                                        // no first letters; just part letters
                                        firstLetters = null;
                                        partLetters = paramPart.Substring(commaPosition + 1);
                                    }
                                    else if (commaPosition > 0)
                                    {
                                        // first letters and part letters
                                        firstLetters = paramPart.Substring(0, commaPosition);
                                        partLetters = paramPart.Substring(commaPosition + 1);
                                    }

                                    // if we specified first letters, set them now
                                    if (!string.IsNullOrEmpty(firstLetters))
                                    {
                                        CrunchEnumerator.FirstLetters = firstLetters;
                                    }

                                    // if we specified part letters, use it -- otherwise use the first letters.
                                    if (!string.IsNullOrEmpty(partLetters))
                                    {
                                        CrunchEnumerator.PartLetters = partLetters;
                                    }
                                    else if (!string.IsNullOrEmpty(firstLetters))
                                    {
                                        // we don't have any part letters, but we do have first letters. reuse.
                                        CrunchEnumerator.PartLetters = firstLetters;
                                    }
                                }

                                // this is a JS-only switch
                                OnJSOnlyParameter();
                                break;

                            case "WARN":
                            case "W": // <-- old style
                                if (string.IsNullOrEmpty(paramPartUpper))
                                {
                                    // just "-warn" without anything else means all errors and warnings
                                    WarningLevel = int.MaxValue;
                                }
                                else
                                {
                                    // must be an unsigned decimal integer value
                                    int warningLevel;
                                    if (paramPart.TryParseIntInvariant(NumberStyles.None, out warningLevel))
                                    {
                                        WarningLevel = warningLevel;
                                    }
                                    else
                                    {
                                        OnInvalidSwitch(switchPart, paramPart);
                                    }
                                }
                                levelSpecified = true;
                                break;

                            //
                            // Backward-compatibility switches different from new switches
                            //

                            case "D":
                                // if the -pretty switch has been specified, we have an incompatible set of switches.
                                m_noPretty = true;
                                if (PrettyPrint)
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }

                                // equivalent to -debug:false (default behavior)
                                JSSettings.StripDebugStatements = true;
                                OnJSOnlyParameter();
                                break;

                            case "E":
                            case "EO":
                                // equivalent to -enc:out <encoding>
                                if (parts.Length < 2)
                                {
                                    // must be followed by an encoding
                                    OnInvalidSwitch(switchPart, paramPart);
                                }

                                // just save the name -- we'll create the encoding later because we need
                                // to know whether we are JS or CSS to pick the right encoding fallback
                                EncodingOutputName = paramPart;
                                break;

                            case "EI":
                                // equivalent to -enc:in <encoding>
                                if (parts.Length < 2)
                                {
                                    // must be followed by an encoding
                                    OnInvalidSwitch(switchPart, paramPart);
                                }

                                // save the name
                                EncodingInputName = paramPart;
                                break;

                            case "H":
                                // if the -pretty switch has been specified, we have an incompatible set of switches.
                                m_noPretty = true;
                                if (PrettyPrint)
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }

                                // equivalent to -rename:all -unused:remove (default behavior)
                                JSSettings.LocalRenaming = LocalRenaming.CrunchAll;
                                JSSettings.RemoveUnneededCode = true;
                                OnJSOnlyParameter();

                                // renaming is specified by this option
                                renamingSpecified = true;

                                // since we specified a rename switch OTHER than none, 
                                // let's make sure we don't *automatically* turn off switches that would 
                                // stop renaming, which we have explicitly said we want.
                                ResetRenamingKill(killSpecified);

                                // if minify was specified as turned off, then this is invalid
                                if (minifySpecified && !JSSettings.MinifyCode)
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }
                                break;

                            case "HL":
                                // if the -pretty switch has been specified, we have an incompatible set of switches.
                                m_noPretty = true;
                                if (PrettyPrint)
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }

                                // equivalent to -rename:localization -unused:remove
                                JSSettings.LocalRenaming = LocalRenaming.KeepLocalizationVars;
                                JSSettings.RemoveUnneededCode = true;
                                OnJSOnlyParameter();

                                // renaming is specified by this option
                                renamingSpecified = true;

                                // since we specified a rename switch OTHER than none, 
                                // let's make sure we don't *automatically* turn off switches that would 
                                // stop renaming, which we have explicitly said we want.
                                ResetRenamingKill(killSpecified);

                                // if minify was specified as turned off, then this is invalid
                                if (minifySpecified && !JSSettings.MinifyCode)
                                {
                                    OnInvalidSwitch(switchPart, paramPart);
                                }
                                break;

                            case "HC":
                                // equivalent to -literals:combine -rename:all -unused:remove
                                // literal-combining no longer supported....
                                //JSSettings.CombineDuplicateLiterals = true;
                                goto case "H";

                            case "HLC":
                            case "HCL":
                                // equivalent to -literals:combine -rename:localization -unused:remove
                                // literal-combining no longer supported....
                                //JSSettings.CombineDuplicateLiterals = true;
                                goto case "HL";

                            case "J":
                                // equivalent to -evals:ignore (default behavior)
                                JSSettings.EvalTreatment = EvalTreatment.Ignore;
                                OnJSOnlyParameter();
                                break;

                            case "K":
                                // equivalent to -inline:true (default behavior)
                                JSSettings.InlineSafeStrings = true;
                                OnJSOnlyParameter();
                                break;

                            case "L":
                                // equivalent to -new:keep (default is collapse)
                                JSSettings.CollapseToLiteral = false;
                                OnJSOnlyParameter();
                                break;

                            case "M":
                                // equivalent to -mac:true (default behavior)
                                JSSettings.MacSafariQuirks = true;
                                OnJSOnlyParameter();
                                break;

                            case "Z":
                                // equivalent to -term:true (default is false)
                                JSSettings.TermSemicolons =
                                    CssSettings.TermSemicolons = true;
                                break;

                            // end backward-compatible section

                            default:
                                ndx = OnUnknownParameter(args, ndx, switchPart, paramPart);
                                break;
                        }
                    }
                    else
                    {
                        // not a switch -- it's an unknown parameter
                        ndx = OnUnknownParameter(args, ndx, null, null);
                    }
                }
            }
        }

        #endregion

        #region event handler overrides

        protected virtual int OnUnknownParameter(IList<string> arguments, int index, string switchPart, string parameterPart)
        {
            if (UnknownParameter != null)
            {
                // create our event args that we'll pass to the listeners and read the index field back from
                var ea = new UnknownParameterEventArgs(arguments)
                {
                    Index = index,
                    SwitchPart = switchPart,
                    ParameterPart = parameterPart,
                };

                // fire the event
                UnknownParameter(this, ea);

                // get the index from the event args, in case the listeners changed it
                // BUT ONLY if it's become greater. Can go backwards and get into an infinite loop.
                if (ea.Index > index)
                {
                    index = ea.Index;
                }
            }
            return index;
        }

        protected virtual void OnInvalidSwitch(string switchPart, string parameterPart)
        {
            if (InvalidSwitch != null)
            {
                InvalidSwitch(this, new InvalidSwitchEventArgs() { SwitchPart = switchPart, ParameterPart = parameterPart });
            }
        }

        protected virtual void OnJSOnlyParameter()
        {
            if (JSOnlyParameter != null)
            {
                JSOnlyParameter(this, new EventArgs());
            }
        }

        protected virtual void OnCssOnlyParameter()
        {
            if (CssOnlyParameter != null)
            {
                CssOnlyParameter(this, new EventArgs());
            }
        }

        #endregion

        #region helper methods

        private static bool TryCreateCultureInfo(string name, out CultureInfo cultureInfo)
        {
            try
            {
                cultureInfo = CultureInfo.GetCultureInfo(name);
                return true;
            }
#if NET_20 || NET_35
            catch (ArgumentException)
#else
            catch (CultureNotFoundException)
#endif
            {
                // nope
                cultureInfo = null;
                return false;
            }
        }

        private static void AlignDebugDefine(bool stripDebugStatements, IDictionary<string, string> defines)
        {
            // if we are setting the debug switch on, then make sure we 
            // add the DEBUG value to the defines
            if (stripDebugStatements)
            {
                // we are turning debug off.
                // make sure we DON'T have the DEBUG define in the list
                if (defines.ContainsKey("DEBUG"))
                {
                    defines.Remove("DEBUG");
                }
            }
            else if (!defines.ContainsKey("DEBUG"))
            {
                // turning debug on, we have already created the list,
                // and debug is not already in it -- add it now.
                defines.Add("debug", string.Empty);
            }
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Design", "CA1021:AvoidOutParameters", MessageId = "2#", Justification="duly noted")]
        public static bool BooleanSwitch(string booleanText, bool defaultValue, out bool booleanValue)
        {
            // assume it's valid unless proven otherwise
            var isValid = true;

            switch (booleanText)
            {
                case "Y":
                case "YES":
                case "T":
                case "TRUE":
                case "ON":
                case "1":
                    booleanValue = true;
                    break;

                case "N":
                case "NO":
                case "NONE":
                case "F":
                case "FALSE":
                case "OFF":
                case "0":
                    booleanValue = false;
                    break;

                case "":
                case null:
                    booleanValue = defaultValue;
                    break;

                default:
                    // not a valid value
                    booleanValue = defaultValue;
                    isValid = false;
                    break;
            }

            return isValid;
        }

        private void ResetRenamingKill(bool killSpecified)
        {
            // Reset the LocalRenaming kill bit IF the kill switch hadn't been specified
            // and it's also not zero. If that's the case, that's because we set it to something
            // automatically based on other switched, but now we're explcitly turning ON renaming,
            // so we need to reset that switch so renaming will occur. Of course, might be overridden
            // later with an explcit kill switch.
            if (!killSpecified && JSSettings.KillSwitch != 0)
            {
                JSSettings.KillSwitch &= ~((long)TreeModifications.LocalRenaming);
            }
        }

        #endregion
    }
}
