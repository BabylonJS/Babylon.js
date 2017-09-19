// CssParser.cs
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

namespace Microsoft.Ajax.Utilities
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.IO;
    using System.Text;
    using System.Text.RegularExpressions;

    /// <summary>
    /// Parser takes Tokens and parses them into rules and statements
    /// </summary>
    public class CssParser
    {
        #region state fields

        private CssScanner m_scanner;
        private CssToken m_currentToken;
        private bool m_noOutput;
        private string m_lastOutputString;
        private bool m_mightNeedSpace;
        private bool m_skippedSpace;
        private int m_lineLength;
        private bool m_noColorAbbreviation;
        private bool m_encounteredNewLine;
        private Stack<StringBuilder> m_builders;

        // this is used to make sure we don't output two newlines in a row.
        // start it as true so we don't start off with a blank line
        private bool m_outputNewLine = true;

        // set this to true to force a newline before any other output
        private bool m_forceNewLine = false;

        public CssSettings Settings
        {
            get; set;
        }

        // sets a text writer that gets raw tokens written to it
        public TextWriter EchoWriter { get; set; }

        private readonly HashSet<string> m_namespaces;

        public string FileContext { get; set; }

        private CodeSettings m_jsSettings;
        public CodeSettings JSSettings
        {
            get
            {
                return m_jsSettings;
            }
            set
            {
                if (value != null)
                {
                    // clone the settings
                    m_jsSettings = value.Clone();

                    // and then make SURE the source format is Expression
                    m_jsSettings.SourceMode = JavaScriptSourceMode.Expression;
                }
                else
                {
                    m_jsSettings = new CodeSettings()
                        {
                            KillSwitch = (long)TreeModifications.MinifyStringLiterals,
                            SourceMode = JavaScriptSourceMode.Expression
                        };
                }
            }
        }

        #endregion

        private static Regex s_vendorSpecific = new Regex(
            @"^(\-(?<vendor>[^\-]+)\-)?(?<root>.+)$",
            RegexOptions.CultureInvariant | RegexOptions.Singleline | RegexOptions.Compiled);

        // IE8 @font-face directive has an issue with src properties that are URLs ending with .EOT
        // that don't have any querystring. They end up sending a malformed HTTP request to the server,
        // which is bad for the server. So we want to automatically fix this for developers: if ANY URL
        // ends in .EOT without a querystring parameters, just add a question mark in the appropriate 
        // location. This fixes the IE8 issue.
        private static Regex s_eotIE8Fix = new Regex(
            @"\.eot([^?\\/\w])",
            RegexOptions.IgnoreCase | RegexOptions.Singleline | RegexOptions.Compiled | RegexOptions.CultureInvariant);

        #region Comment-related fields

        /// <summary>
        /// regular expression for matching css comments
        /// Format: /*(anything or nothing inside)*/
        /// </summary>
        ////private static Regex s_regexComments = new Regex(
        ////    @"/\*([^*]|(\*+[^*/]))*\*+/",
        ////    RegexOptions.CultureInvariant | RegexOptions.Singleline | RegexOptions.Compiled);

        /// <summary>
        /// regular expression for matching first comment hack
        /// This is the MacIE ignore bug: /*(anything or nothing inside)\*/.../*(anything or nothing inside)*/
        /// </summary>
        private static Regex s_regexHack1 = new Regex(
            @"/\*([^*]|(\*+[^*/]))*\**\\\*/(?<inner>.*?)/\*([^*]|(\*+[^*/]))*\*+/",
            RegexOptions.CultureInvariant | RegexOptions.Singleline | RegexOptions.Compiled);

        /// <summary>
        /// Regular expression for matching second comment hack
        /// Hide from everything EXCEPT Netscape 4 and Opera 5
        /// Format: /*/*//*/.../*(anything or nothing inside)*/
        /// </summary>
        private static Regex s_regexHack2 = new Regex(
            @"/\*/\*//\*/(?<inner>.*?)/\*([^*]|(\*+[^*/]))*\*+/",
            RegexOptions.CultureInvariant | RegexOptions.Singleline | RegexOptions.Compiled);

        /// <summary>
        /// Regular expression for matching third comment hack
        /// Hide from Netscape 4
        /// Format: /*/*/.../*(anything or nothing inside)*/
        /// </summary>
        private static Regex s_regexHack3 = new Regex(
            @"/\*/\*/(?<inner>.*?)/\*([^*]|(\*+[^*/]))*\*+/",
            RegexOptions.CultureInvariant | RegexOptions.Singleline | RegexOptions.Compiled);

        /// <summary>
        /// Regular expression for matching fourth comment hack
        /// Hide from IE6
        /// Format: property /*(anything or nothing inside)*/:value
        /// WARNING: This does not actually parse the property/value -- it simply looks for a
        /// word character followed by at least one whitespace character, followed
        /// by a simple comment, followed by optional space, followed by a colon.
        /// Does not match the simple word, the space or the colon (just the comment) 
        /// </summary>
        private static Regex s_regexHack4 = new Regex(
            @"(?<=\w\s+)/\*([^*]|(\*+[^*/]))*\*+/\s*(?=:)",
            RegexOptions.CultureInvariant | RegexOptions.Singleline | RegexOptions.Compiled);

        /// <summary>
        /// Regular expression for matching fifth comment hack
        /// Hide from IE5.5
        /// Format: property:/* (anything or nothing inside) */value
        /// WARNING: This does not actually parse the property/value -- it simply looks for a
        /// word character followed by optional whitespace character, followed
        /// by a colon, followed by optional whitespace, followed by a simple comment.
        /// Does not match initial word or the colon, just the comment.
        /// </summary>
        private static Regex s_regexHack5 = new Regex(
            @"(?<=[\w/]\s*:)\s*/\*([^*]|(\*+[^*/]))*\*+/",
            RegexOptions.CultureInvariant | RegexOptions.Singleline | RegexOptions.Compiled);

        /// <summary>
        /// Regular expression for matching sixth comment hack -- although not a real hack
        /// Hide from IE6, NOT
        /// Format: property/*(anything or nothing inside)*/:value
        /// NOTE: This doesn't actually hide from IE6; it needs a space before the comment to actually work.
        /// but enoough people code this in their CSS and expect it to be output that I recieved enough
        /// requests to add it to the allowed "hacks"
        /// WARNING: This does not actually parse the property/value -- it simply looks for a
        /// word character followed by a simple comment, followed by optional space, followed by a colon.
        /// Does not match the simple word or the colon (just initial whitespace and comment) 
        /// </summary>
        private static Regex s_regexHack6 = new Regex(
            @"(?<=\w)/\*([^*]|(\*+[^*/]))*\*+/\s*(?=:)",
            RegexOptions.CultureInvariant | RegexOptions.Singleline | RegexOptions.Compiled);

        /// <summary>
        /// Regular expression for empty comments
        /// These comments don't really do anything. But if the developer wrote an empty
        /// comment (/**/ or /* */), then it has no documentation value and might possibly be
        /// an attempted comment hack.
        /// Format: /**/ or /* */ (single space)
        /// </summary>
        private static Regex s_regexHack7 = new Regex(
            @"/\*(\s?)\*/",
            RegexOptions.CultureInvariant | RegexOptions.Singleline | RegexOptions.Compiled);

        #endregion

        #region color-related fields

        /// <summary>
        /// matches 6-digit RGB color value where both r digits are the same, both
        /// g digits are the same, and both b digits are the same (but r, g, and b
        /// values are not necessarily the same). Used to identify #rrggbb values
        /// that can be collapsed to #rgb
        /// </summary>
        private static Regex s_rrggbb = new Regex(
            @"^\#(?<r>[0-9a-fA-F])\k<r>(?<g>[0-9a-fA-F])\k<g>(?<b>[0-9a-fA-F])\k<b>$",
            RegexOptions.CultureInvariant | RegexOptions.Compiled);

        // whether we are currently parsing the value for a property that might
        // use color names
        private bool m_parsingColorValue;

        #endregion

        #region value-replacement fields

        /// <summary>
        /// regular expression for matching css comments containing special formatted identifiers
        /// for value-replacement matching
        /// Format: /* [id] */
        /// </summary>
        private static Regex s_valueReplacement = new Regex(
            @"/\*\s*\[(?<id>\w+)\]\s*\*/",
            RegexOptions.CultureInvariant | RegexOptions.Singleline | RegexOptions.Compiled);

        // this variable will be set whenever we encounter a value-replacement comment
        // and have a string to replace it with
        private string m_valueReplacement;// = null;

        #endregion

        #region Sharepoint replacement comment regex

        /// <summary>
        /// regular expression for matching Sharepoint Theme css comments
        /// Format: /* [ReplaceBGImage] */
        ///         /* [id(parameters)] */
        ///     where id is one of: ReplaceColor, ReplaceFont, or RecolorImage
        ///     and parameters is anything other than a close square-bracket
        /// </summary>
        private static Regex s_sharepointReplacement = new Regex(
            @"/\*\s*\[(ReplaceBGImage|((ReplaceColor|ReplaceFont|RecolorImage)\([^\]]*))\]\s*\*/",
            RegexOptions.IgnoreCase | RegexOptions.Singleline | RegexOptions.Compiled | RegexOptions.CultureInvariant);

        #endregion

        #region token-related properties

        private TokenType CurrentTokenType
        {
            get
            {
                return m_currentToken != null
                    ? m_currentToken.TokenType
                    : TokenType.None;
            }
        }

        private string CurrentTokenText
        {
            get
            {
                return m_currentToken != null
                    ? m_currentToken.Text
                    : string.Empty;
            }
        }

        #endregion

        public CssParser()
        {
            // default settings
            Settings = new CssSettings();

            // create the default settings we'll use for JS expression minification
            // use the defaults, other than to set the kill switch so that it leaves
            // string literals alone (so we don't inadvertently change any delimiter chars)
            JSSettings = null;

            // create a list of strings that represent the namespaces declared
            // in a @namespace statement. We will clear this every time we parse a new source string.
            m_namespaces = new HashSet<string>();
        }

        public string Parse(string source)
        {
            // clear out the list of namespaces
            m_namespaces.Clear();

            if (source.IsNullOrWhiteSpace())
            {
                // null or blank - return an empty string
                source = string.Empty;
            }
            else
            {
                // pre-process the comments
                var resetToHacks = false;
                try
                {
                    // see if we need to re-encode the text based on a @charset rule
                    // at the front.
                    source = HandleCharset(source);

                    if (Settings.CommentMode == CssComment.Hacks)
                    {
                        // change the various hacks to important comments so they will be kept
                        // in the output
                        source = s_regexHack1.Replace(source, "/*! \\*/${inner}/*!*/");
                        source = s_regexHack2.Replace(source, "/*!/*//*/${inner}/**/");
                        source = s_regexHack3.Replace(source, "/*!/*/${inner}/*!*/");
                        source = s_regexHack4.Replace(source, "/*!*/");
                        source = s_regexHack5.Replace(source, "/*!*/");
                        source = s_regexHack6.Replace(source, "/*!*/");
                        source = s_regexHack7.Replace(source, "/*!*/");

                        // now that we've changed all our hack comments to important comments, we can
                        // change the flag to Important so all non-important hacks are removed. 
                        // And set a flag to remind us to change it back before we exit, or the NEXT
                        // file we process will have the wrong setting.
                        Settings.CommentMode = CssComment.Important;
                        resetToHacks = true;
                    }

                    // set up for the parse
                    using (StringReader reader = new StringReader(source))
                    {
                        m_scanner = new CssScanner(reader);
                        m_scanner.AllowEmbeddedAspNetBlocks = this.Settings.AllowEmbeddedAspNetBlocks;
                        m_scanner.ScannerError += (sender, ea) =>
                            {
                                ea.Error.File = this.FileContext;
                                OnCssError(ea.Error);
                            };
                        m_scanner.ContextChange += (sender, ea) =>
                            {
                                FileContext = ea.FileContext;
                            };

                        // create the initial string builder into which we will be 
                        // building our crunched stylesheet.
                        m_builders = new Stack<StringBuilder>();
                        m_builders.Push(StringBuilderPool.Acquire(source.Length / 2));

                        // get the first token
                        NextToken();

                        switch (Settings.CssType)
                        {
                            case CssType.FullStyleSheet:
                                // parse a style sheet!
                                ParseStylesheet();
                                break;

                            case CssType.DeclarationList:
                                SkipIfSpace();
                                ParseDeclarationList(false);
                                break;

                            default:
                                Debug.Fail("UNEXPECTED CSS TYPE");
                                goto case CssType.FullStyleSheet;
                        }

                        if (!m_scanner.EndOfFile)
                        {
                            int errorNumber = (int)CssErrorCode.ExpectedEndOfFile;
                            OnCssError(new ContextError()
                                {
                                    IsError = true,
                                    Severity = 0,
                                    Subcategory = ContextError.GetSubcategory(0),
                                    File = FileContext,
                                    ErrorNumber = errorNumber,
                                    ErrorCode = "CSS{0}".FormatInvariant(errorNumber & (0xffff)),
                                    StartLine = m_currentToken.Context.Start.Line,
                                    StartColumn = m_currentToken.Context.Start.Char,
                                    Message = CssStrings.ExpectedEndOfFile,
                                });
                        }

                        // get the crunched string and dump the string builder
                        // (we don't need it anymore)
                        source = UnwindStackCompletely();
                        m_builders = null;
                    }
                }
                finally
                {
                    // if we had changed our setting object...
                    if (resetToHacks)
                    {
                        // ...be sure to change it BACK for next time.
                        Settings.CommentMode = CssComment.Hacks;
                    }
                }
            }

            return source;
        }

        #region output builders stack methods

        /// <summary>
        /// Push a new string builder onto the builders stack
        /// </summary>
        private void PushWaypoint()
        {
            m_builders.Push(StringBuilderPool.Acquire());
        }

        /// <summary>
        /// Pop the top waypoint off the stack.
        /// If the Settings RemoveEmptyBlocks property is false, will keep the text, regardless of the passed-in setting.
        /// </summary>
        /// <param name="keepText">true if push the text of the popped waypoint onto the new top waypoint; false to discard</param>
        /// <returns>true if the popped builder has any text within it</returns>
        private bool PopWaypoint(bool keepText)
        {
            var topBuilder = m_builders.Pop();
            if (keepText || !Settings.RemoveEmptyBlocks)
            {
                m_builders.Peek().Append(topBuilder.ToString());
            }

            var isNotEmpty = topBuilder.Length > 0;
            topBuilder.Release();
            return isNotEmpty;
        }

        /// <summary>
        /// Get all the text that has been accumulting in the string builders
        /// on the stack, unwinding the stack until it's empty
        /// </summary>
        /// <returns>string representation of all parsed text</returns>
        private string UnwindStackCompletely()
        {
            if (m_builders == null || m_builders.Count == 0)
            {
                // no builders - return an empty string
                return string.Empty;
            }

            if (m_builders.Count == 1)
            {
                // just one builder - return it's string after releasing it.
                var topBuilder = m_builders.Pop();
                var code = topBuilder.ToString();
                topBuilder.Release();
                return code;
            }

            // multiple builders in the stack. Rather than unwinding the stack and
            // pushing each builder onto the previous one, which could add take extra 
            // buffer allocations for each one, instead create an array (we know how big it should be),
            // and stuff each builder's string into the array in reverse order. Then use 
            // string.concat for a single new string allocation.
            var codeList = new string[m_builders.Count];
            var ndx = codeList.Length - 1;
            while(ndx >= 0)
            {
                // pop the topmost builder from the stack and get the text that
                // has been built up inside it and add it to the array in reverse order.
                var topBuilder = m_builders.Pop();
                codeList[ndx--] = topBuilder.ToString();
                topBuilder.Release();
            }

            return string.Concat(codeList);
        }

        #endregion

        #region Character set rule handling

        private string HandleCharset(string source)
        {
            // normally we let the encoding switch decode the input file for us, so every character in
            // the source string has already been decoded into the proper UNICODE character point.
            // HOWEVER, that doesn't mean the person passing us the source string has used the right encoding
            // to read the file. Check to see if there's a BOM that hasn't been decoded properly. If so, then
            // that indicates a potential error condition. And if we have a proper BOM, then everything was okay,
            // but we want to strip it off the source so it doesn't interfere with the parsing.
            // We SHOULD also check for a @charset rule to see if we need to re-decode the string. But for now, just
            // throw a low-pri warning if we see an improperly-decided BOM.

            // but first, if it starts with a source comment that we probably added, then we need to pull it off
            // and save it for later.
            var initialSourceDirective = string.Empty;
            if (source.StartsWith("/*/#SOURCE", StringComparison.OrdinalIgnoreCase))
            {
                // find the end of the comment
                var endOfComment = source.IndexOf("*/", 10, StringComparison.Ordinal);
                if (endOfComment > 0)
                {
                    // now skip the first line break if there is one
                    endOfComment += 2;
                    if (source[endOfComment] == '\r')
                    {
                        ++endOfComment;
                        if (source[endOfComment] == '\n')
                        {
                            ++endOfComment;
                        }
                    }
                    else if (source[endOfComment] == '\n' || source[endOfComment] == '\f')
                    {
                        ++endOfComment;
                    }

                    // save the comment and strip it off the source (for now)
                    initialSourceDirective = source.Substring(0, endOfComment);
                    source = source.Substring(endOfComment);
                }
            }

            if (source.StartsWith("\u00ef\u00bb\u00bf", StringComparison.Ordinal))
            {
                // if the first three characters are EF BB BF, then the source file had a UTF-8 BOM in it, but 
                // the BOM didn't get stripped. We MIGHT have some issues: the file indicated it's UTF-8 encoded,
                // but if we didn't properly decode the BOM, then other non-ASCII character sequences might also be
                // improperly decoded. Because that's an IF, we will only throw a pri-1 "programmer may not have intended this"
                // error. However, first check to see if there's a @charset "ascii"; statement at the front. If so,
                // then don't throw any error at all because everything should be ascii, in which case we're most-likely
                // good to go. The quote may be single or double, and the ASCII part should be case-insensentive.
                var charsetAscii = "@charset ";
                if (string.CompareOrdinal(source, 3, charsetAscii, 0, charsetAscii.Length) != 0
                    || (source[3 + charsetAscii.Length] != '"' && source[3 + charsetAscii.Length] != '\'')
                    || string.Compare(source, 4 + charsetAscii.Length, "ascii", 0, 5, StringComparison.OrdinalIgnoreCase) != 0)
                {
                    // we either don't have a @charset statement, or it's pointing to something other than ASCII, in which
                    // case we might have a problem here. But because that's a "MIGHT," let's make it a pri-1 instead of
                    // a pri-0. If there are any problems, the output will be wonky and the developer can up the warning-level
                    // and see this error, then use the proper encoding to read the source. 
                    ReportError(1, CssErrorCode.PossibleCharsetError);
                }

                // remove the BOM
                source = source.Substring(3);
            }
            else if (source.StartsWith("\u00fe\u00ff\u0000\u0000", StringComparison.Ordinal)
                || source.StartsWith("\u0000\u0000\u00ff\u00fe", StringComparison.Ordinal))
            {
                // apparently we had a UTF-32 BOM (either BE or LE) that wasn't stripped. Remove it now.
                // throw a syntax-level error because the rest of the file is probably whack.
                ReportError(0, CssErrorCode.PossibleCharsetError);
                source = source.Substring(4);
            }
            else if (source.StartsWith("\u00fe\u00ff", StringComparison.Ordinal)
                || source.StartsWith("\u00ff\u00fe", StringComparison.Ordinal))
            {
                // apparently we had a UTF-16 BOM (either BE or LE) that wasn't stripped. Remove it now.
                // throw a syntax-level error because the rest of the file is probably whack.
                ReportError(0, CssErrorCode.PossibleCharsetError);
                source = source.Substring(2);
            }
            else if (source.Length > 0 && source[0] == '\ufeff')
            {
                // properly-decoded UNICODE BOM was at the front. Everything should be okay, but strip it
                // so it doesn't interfere with the rest of the processing.
                source = source.Substring(1);
            }

            return string.Concat(initialSourceDirective, source);
        }

        /// <summary>
        /// Returns true if the given property is vendor-specific and the vendor prefix
        /// is in the list of excluded prefixes.
        /// </summary>
        /// <param name="propertyName">The property name</param>
        /// <returns>true if excluded; false otherwise</returns>
        private bool IsExcludedVendorPrefix(string propertyName)
        {
            bool isExcluded = false;
            var match = s_vendorSpecific.Match(propertyName);
            if (match.Success)
            {
                isExcluded = Settings.ExcludeVendorPrefixes.Contains(match.Result("$vendor"));
            }

            return isExcluded;
        }

        #endregion

        #region Parse... methods

        private Parsed ParseStylesheet()
        {
            Parsed parsed = Parsed.False;

            // ignore any semicolons that may be the result of concatenation on the part of AjaxMin
            SkipSemicolons();

            // the @charset token can ONLY be at the top of the file
            if (CurrentTokenType == TokenType.CharacterSetSymbol)
            {
                ParseCharset();
            }

            // any number of S, Comment, CDO, or CDC elements
            // (or semicolons possibly introduced via concatenation)
            ParseSCDOCDCComments();

            // any number of imports followed by S, Comment, CDO or CDC
            while (ParseImport() == Parsed.True)
            {
                // any number of S, Comment, CDO, or CDC elements
                // (or semicolons possibly introduced via concatenation)
                ParseSCDOCDCComments();
            }

            // any number of namespaces followed by S, Comment, CDO or CDC
            while (ParseNamespace() == Parsed.True)
            {
                // any number of S, Comment, CDO, or CDC elements
                // (or semicolons possibly introduced via concatenation)
                ParseSCDOCDCComments();
            }

            // the main guts of stuff
            while (ParseRule() == Parsed.True
              || ParseMedia() == Parsed.True
              || ParsePage() == Parsed.True
              || ParseFontFace() == Parsed.True
              || ParseKeyFrames() == Parsed.True
              || ParseAtKeyword() == Parsed.True
              || ParseAspNetBlock() == Parsed.True)
            {
                // any number of S, Comment, CDO or CDC elements
                // (or semicolons possibly introduced via concatenation)
                ParseSCDOCDCComments();
            }

            // if there weren't any errors, we SHOULD be at the EOF state right now.
            // if we're not, we may have encountered an invalid, unexpected character.
            while (!m_scanner.EndOfFile)
            {
                // throw an exception
                ReportError(0, CssErrorCode.UnexpectedToken, CurrentTokenText);

                // skip the token
                NextToken();

                // might be a comment again; check just in case
                // (or semicolons possibly introduced via concatenation)
                ParseSCDOCDCComments();

                // try the guts again
                while (ParseRule() == Parsed.True
                  || ParseMedia() == Parsed.True
                  || ParsePage() == Parsed.True
                  || ParseFontFace() == Parsed.True
                  || ParseAtKeyword() == Parsed.True
                  || ParseAspNetBlock() == Parsed.True)
                {
                    // any number of S, Comment, CDO or CDC elements
                    // (or semicolons possibly introduced via concatenation)
                    ParseSCDOCDCComments();
                }
            }

            return parsed;
        }

        private Parsed ParseCharset()
        {
            AppendCurrent();
            SkipSpace();

            if (CurrentTokenType != TokenType.String)
            {
                ReportError(0, CssErrorCode.ExpectedCharset, CurrentTokenText);
                SkipToEndOfStatement();
                AppendCurrent();
            }
            else
            {
                Append(' ');
                AppendCurrent();
                SkipSpace();

                if (CurrentTokenType != TokenType.Character || CurrentTokenText != ";")
                {
                    ReportError(0, CssErrorCode.ExpectedSemicolon, CurrentTokenText);
                    SkipToEndOfStatement();
                    // be sure to append the closing token (; or })
                    AppendCurrent();
                }
                else
                {
                    Append(';');
                    NextToken();
                }
            }

            return Parsed.True;
        }

        private void ParseSCDOCDCComments()
        {
            while (CurrentTokenType == TokenType.Space
              || CurrentTokenType == TokenType.Comment
              || CurrentTokenType == TokenType.CommentOpen
              || CurrentTokenType == TokenType.CommentClose
              || (CurrentTokenType == TokenType.Character && CurrentTokenText == ";"))
            {
                // don't output any space we encounter here, but do output comments.
                // we also want to skip over any semicolons we may encounter at this point
                if (CurrentTokenType != TokenType.Space && CurrentTokenType != TokenType.Character)
                {
                    AppendCurrent();
                }
                NextToken();
            }
        }

        /*
        private void ParseUnknownBlock()
        {
            // output the opening brace and move to the next
            AppendCurrent();
            // skip space -- there shouldn't need to be space after the opening brace
            SkipSpace();

            // loop until we find the closing breace
            while (!m_scanner.EndOfFile
              && (CurrentTokenType != TokenType.Character || CurrentTokenText != "}"))
            {
                // see if we are recursing unknown blocks
                if (CurrentTokenType == TokenType.Character && CurrentTokenText == "{")
                {
                    // recursive block
                    ParseUnknownBlock();
                }
                else if (CurrentTokenType == TokenType.AtKeyword)
                {
                    // parse the at-keyword
                    ParseAtKeyword();
                }
                else if (CurrentTokenType == TokenType.Character && CurrentTokenText == ";")
                {
                    // append a semi-colon and skip any space after it
                    AppendCurrent();
                    SkipSpace();
                }
                else
                {
                    // whatever -- just append the token and move on
                    AppendCurrent();
                    NextToken();
                }
            }

            // output the closing brace and skip any trailing space
            AppendCurrent();
            SkipSpace();
        }
        */

        private Parsed ParseAtKeyword()
        {
            Parsed parsed = Parsed.False;
            if (CurrentTokenType == TokenType.AtKeyword)
            {
                // only report an unexpected at-keyword IF the identifier doesn't start 
                // with a hyphen, because that would be a vendor-specific at-keyword,
                // which is theoretically okay.
                if (!CurrentTokenText.StartsWith("@-", StringComparison.OrdinalIgnoreCase))
                {
                    ReportError(2, CssErrorCode.UnexpectedAtKeyword, CurrentTokenText);
                }

                SkipToEndOfStatement();
                AppendCurrent();
                SkipSpace();
                NewLine();
                parsed = Parsed.True;
            }
            else if (CurrentTokenType == TokenType.CharacterSetSymbol)
            {
                // we found a charset at-rule. Problem is, @charset can only be the VERY FIRST token
                // in the file, and we process it special. So if we get here, then it's NOT the first
                // token, and clients will ignore it. Throw a warning, but still process it.
                ReportError(2, CssErrorCode.UnexpectedCharset, CurrentTokenText);
                parsed = ParseCharset();
            }

            return parsed;
        }

        private Parsed ParseAspNetBlock()
        {
            Parsed parsed = Parsed.False;
            if (Settings.AllowEmbeddedAspNetBlocks &&
                CurrentTokenType == TokenType.AspNetBlock)
            {
                AppendCurrent();
                SkipSpace();
                parsed = Parsed.True;
            }
            return parsed;
        }

        private Parsed ParseNamespace()
        {
            Parsed parsed = Parsed.False;
            if (CurrentTokenType == TokenType.NamespaceSymbol)
            {
                NewLine();
                AppendCurrent();
                SkipSpace();

                if (CurrentTokenType == TokenType.Identifier)
                {
                    Append(' ');
                    AppendCurrent();

                    // if the namespace is not already in the list, 
                    // save current text as a declared namespace value 
                    // that can be used in the rest of the code
                    if (!m_namespaces.Add(CurrentTokenText))
                    {
                        // error -- we already have this namespace in the list
                        ReportError(1, CssErrorCode.DuplicateNamespaceDeclaration, CurrentTokenText);
                    }

                    SkipSpace();
                }

                if (CurrentTokenType != TokenType.String
                  && CurrentTokenType != TokenType.Uri)
                {
                    ReportError(0, CssErrorCode.ExpectedNamespace, CurrentTokenText);
                    SkipToEndOfStatement();
                    AppendCurrent();
                }
                else
                {
                    Append(' ');
                    AppendCurrent();
                    SkipSpace();

                    if (CurrentTokenType == TokenType.Character
                      && CurrentTokenText == ";")
                    {
                        Append(';');
                        SkipSpace();
                        NewLine();
                    }
                    else
                    {
                        ReportError(0, CssErrorCode.ExpectedSemicolon, CurrentTokenText);
                        SkipToEndOfStatement();
                        AppendCurrent();
                    }
                }

                parsed = Parsed.True;
            }
            return parsed;
        }

        private void ValidateNamespace(string namespaceIdent)
        {
            // check it against list of all declared @namespace names
            if (!string.IsNullOrEmpty(namespaceIdent)
                && namespaceIdent != "*"
                && !m_namespaces.Contains(namespaceIdent))
            {
                ReportError(0, CssErrorCode.UndeclaredNamespace, namespaceIdent);
            }
        }

        private Parsed ParseKeyFrames()
        {
            // '@keyframes' IDENT '{' keyframes-blocks '}'
            Parsed parsed = Parsed.False;
            if (CurrentTokenType == TokenType.KeyFramesSymbol)
            {
                // found the @keyframes at-rule
                parsed = Parsed.True;

                NewLine();
                AppendCurrent();
                SkipSpace();

                // needs to be followed by an identifier
                if (CurrentTokenType == TokenType.Identifier || CurrentTokenType == TokenType.String)
                {
                    // if this is an identifier, then we need to make sure we output a space
                    // character so the identifier doesn't get attached to the previous @-rule
                    if (CurrentTokenType == TokenType.Identifier || Settings.OutputMode == OutputMode.MultipleLines)
                    {
                        Append(' ');
                    }

                    AppendCurrent();
                    SkipSpace();
                }
                else
                {
                    ReportError(0, CssErrorCode.ExpectedIdentifier, CurrentTokenText);
                }

                // followed by keyframe blocks surrounded with curly-braces
                if (CurrentTokenType == TokenType.Character && CurrentTokenText == "{")
                {
                    if (Settings.BlocksStartOnSameLine == BlockStart.NewLine
                        || Settings.BlocksStartOnSameLine == BlockStart.UseSource && m_encounteredNewLine)
                    {
                        NewLine();
                    }
                    else if (Settings.OutputMode == OutputMode.MultipleLines)
                    {
                        Append(' ');
                    }

                    AppendCurrent();
                    Indent();
                    NewLine();
                    SkipSpace();

                    ParseKeyFrameBlocks();

                    // better end with a curly-brace
                    Unindent();
                    NewLine();
                    if (CurrentTokenType == TokenType.Character && CurrentTokenText == "}")
                    {
                        NewLine();
                        AppendCurrent();
                        SkipSpace();
                    }
                    else
                    {
                        ReportError(0, CssErrorCode.ExpectedClosingBrace, CurrentTokenText);
                        SkipToEndOfDeclaration();
                    }
                }
                else
                {
                    ReportError(0, CssErrorCode.ExpectedOpenBrace, CurrentTokenText);
                    SkipToEndOfStatement();
                }
            }
            return parsed;
        }

        private void ParseKeyFrameBlocks()
        {
            // [ keyframe-selectors block ]*
            while (ParseKeyFrameSelectors() == Parsed.True)
            {
                ParseDeclarationBlock(false);

                // set the force-newline flag to true so that any selectors we may find next
                // will start on a new line
                m_forceNewLine = true;
            }

            // reset the flag
            m_forceNewLine = false;
        }

        private Parsed ParseKeyFrameSelectors()
        {
            // [ 'from' | 'to' | PERCENTAGE ] [ ',' [ 'from' | 'to' | PERCENTAGE ] ]*
            Parsed parsed = Parsed.False;

            // see if we start with a percentage or the words "from" or "to"
            if (CurrentTokenType == TokenType.Percentage)
            {
                AppendCurrent();
                SkipSpace();
                parsed = Parsed.True;
            }
            else if (CurrentTokenType == TokenType.Identifier)
            {
                var upperIdent = CurrentTokenText.ToUpperInvariant();
                if (string.CompareOrdinal(upperIdent, "FROM") == 0
                    || string.CompareOrdinal(upperIdent, "TO") == 0)
                {
                    AppendCurrent();
                    SkipSpace();
                    parsed = Parsed.True;
                }
            }

            // if we found one, keep going as long as there are others comma-separated
            while (parsed == Parsed.True && CurrentTokenType == TokenType.Character && CurrentTokenText == ",")
            {
                // append the comma, and if this is multiline mode, follow it with a space for readability
                AppendCurrent();
                if (Settings.OutputMode == OutputMode.MultipleLines)
                {
                    Append(' ');
                }
                SkipSpace();

                // needs to be either a percentage or "from" or "to"
                if (CurrentTokenType == TokenType.Percentage)
                {
                    AppendCurrent();
                    SkipSpace();
                }
                else if (CurrentTokenType == TokenType.Identifier)
                {
                    var upperIdent = CurrentTokenText.ToUpperInvariant();
                    if (string.CompareOrdinal(upperIdent, "FROM") == 0
                        || string.CompareOrdinal(upperIdent, "TO") == 0)
                    {
                        AppendCurrent();
                        SkipSpace();
                    }
                }
                else
                {
                    ReportError(0, CssErrorCode.ExpectedPercentageFromOrTo, CurrentTokenText);
                }
            }

            return parsed;
        }

        private Parsed ParseImport()
        {
            Parsed parsed = Parsed.False;
            if (CurrentTokenType == TokenType.ImportSymbol)
            {
                NewLine();
                AppendCurrent();
                SkipSpace();

                if (CurrentTokenType != TokenType.String
                  && CurrentTokenType != TokenType.Uri)
                {
                    ReportError(0, CssErrorCode.ExpectedImport, CurrentTokenText);
                    SkipToEndOfStatement();
                    AppendCurrent();
                }
                else
                {
                    // only need a space if this is a Uri -- a string starts with a quote delimiter
                    // and won't get parsed as teh end of the @import token
                    if (CurrentTokenType == TokenType.Uri || Settings.OutputMode == OutputMode.MultipleLines)
                    {
                        Append(' ');
                    }

                    // append the file (string or uri)
                    AppendCurrent();
                    SkipSpace();

                    // optional comma-separated list of media queries
                    // won't need a space because the ending is either a quote or a paren
                    ParseMediaQueryList(false);

                    if (CurrentTokenType == TokenType.Character && CurrentTokenText == ";")
                    {
                        Append(';');
                        NewLine();
                    }
                    else
                    {
                        ReportError(0, CssErrorCode.ExpectedSemicolon, CurrentTokenText);
                        SkipToEndOfStatement();
                        AppendCurrent();
                    }
                }
                SkipSpace();
                parsed = Parsed.True;
            }

            return parsed;
        }

        private Parsed ParseMedia()
        {
            Parsed parsed = Parsed.False;
            if (CurrentTokenType == TokenType.MediaSymbol)
            {
                // push a waypoint. We're not going to want to output this @media directive
                // if the rule collection is empty
                var keepDirective = true;
                PushWaypoint();

                NewLine();
                AppendCurrent();
                SkipSpace();

                var indented = false;

                // might need a space because the last token was @media
                if (ParseMediaQueryList(true) == Parsed.True)
                {
                    if (CurrentTokenType == TokenType.Character && CurrentTokenText == "{")
                    {
                        if (Settings.BlocksStartOnSameLine == BlockStart.NewLine
                            || Settings.BlocksStartOnSameLine == BlockStart.UseSource && m_encounteredNewLine)
                        {
                            NewLine();
                        }
                        else if (Settings.OutputMode == OutputMode.MultipleLines)
                        {
                            Append(' ');
                        }

                        AppendCurrent();
                        Indent();
                        indented = true;
                        SkipSpace();

                        // push a waypoint for the rules inside the @media directive
                        PushWaypoint();

                        // the main guts of stuff
                        while (ParseRule() == Parsed.True
                          || ParseMedia() == Parsed.True
                          || ParsePage() == Parsed.True
                          || ParseFontFace() == Parsed.True
                          || ParseAtKeyword() == Parsed.True
                          || ParseAspNetBlock() == Parsed.True)
                        {
                            // any number of S, Comment, CDO or CDC elements
                            ParseSCDOCDCComments();
                        }

                        // we want to keep this directive if we've actually parsed anything;
                        // otherwise we'll throw out the whole thing.
                        keepDirective = PopWaypoint(true);
                    }
                    else
                    {
                        SkipToEndOfStatement();
                    }

                    if (CurrentTokenType == TokenType.Character)
                    {
                        if (CurrentTokenText == ";")
                        {
                            AppendCurrent();
                            if (indented)
                            {
                                Unindent();
                            }
                            
                            NewLine();
                        }
                        else if (CurrentTokenText == "}")
                        {
                            if (indented)
                            {
                                Unindent();
                            }

                            NewLine();
                            AppendCurrent();
                        }
                        else
                        {
                            SkipToEndOfStatement();
                            AppendCurrent();
                        }
                    }
                    else
                    {
                        SkipToEndOfStatement();
                        AppendCurrent();
                    }

                    SkipSpace();
                    parsed = Parsed.True;
                }
                else
                {
                    SkipToEndOfStatement();
                }

                PopWaypoint(keepDirective);
            }

            return parsed;
        }

        private Parsed ParseMediaQueryList(bool mightNeedSpace)
        {
            // see if we have a media query
            Parsed parsed = ParseMediaQuery(mightNeedSpace);

            // it's a comma-separated list, so as long as we find a comma, keep parsing queries
            while(CurrentTokenType == TokenType.Character && CurrentTokenText == ",")
            {
                // output the comma and skip any space
                AppendCurrent();
                SkipSpace();

                if (ParseMediaQuery(false) != Parsed.True)
                {
                    // fail
                    ReportError(0, CssErrorCode.ExpectedMediaQuery, CurrentTokenText);
                }
            }

            return parsed;
        }

        private Parsed ParseMediaQuery(bool firstQuery)
        {
            var parsed = Parsed.False;
            var mightNeedSpace = firstQuery;

            // we have an optional word ONLY or NOT -- they will show up as identifiers here
            if (CurrentTokenType == TokenType.Identifier &&
                (string.Compare(CurrentTokenText, "ONLY", StringComparison.OrdinalIgnoreCase) == 0
                || string.Compare(CurrentTokenText, "NOT", StringComparison.OrdinalIgnoreCase) == 0))
            {
                // if this is the first query, the last thing we output was @media, which will need a separator.
                // if it's not the first, the last thing was a comma, so no space is needed.
                // but if we're expanding the output, we always want a space
                if (firstQuery || Settings.OutputMode == OutputMode.MultipleLines)
                {
                    Append(' ');
                }

                // output the only/not string and skip any subsequent space
                AppendCurrent();
                SkipSpace();
                
                // we might need a space since the last thing was the only/not
                mightNeedSpace = true;
            }

            // we should be at a either a media type or an expression
            if (CurrentTokenType == TokenType.Identifier)
            {
                // media type
                // if we might need a space, output it now
                if (mightNeedSpace || Settings.OutputMode == OutputMode.MultipleLines)
                {
                    Append(' ');
                }

                // output the media type
                AppendCurrent();
                SkipSpace();

                // the media type is an identifier, so we might need a space
                mightNeedSpace = true;

                // the next item should be either AND or the start of the block
                parsed = Parsed.True;
            }
            else if (CurrentTokenType == TokenType.Character && CurrentTokenText == "(")
            {
                // no media type -- straight to an expression
                ParseMediaQueryExpression();

                // The straight-up spec says the whitespace is optional, so at this point you'd
                // THINK we wouldn't need whitespace between a close-paren and the word "and."
                // However, there is an errata published:
                // http://www.w3.org/Style/2012/REC-mediaqueries-20120619-errata.html
                // that makes whitespace before the AND mandatory.
                // The errata is completely correct with regards to making the whitespace AFTER
                // the "and" mandatory -- we need to be disambiguous: is it "and" followed by a "(",
                // or is it the FUNCTION "and("? Not sure the before is strictly mandatory, but
                // let's roll with it.
                mightNeedSpace = true;

                // the next item should be either AND or the start of the block
                parsed = Parsed.True;
            }
            else if (CurrentTokenType != TokenType.Character || CurrentTokenText != ";")
            {
                // expected a media type
                ReportError(0, CssErrorCode.ExpectedMediaIdentifier, CurrentTokenText);
            }

            // either we have no more and-delimited expressions,
            // OR we have an *identifier* AND (and followed by space)
            // OR we have a *function* AND (and followed by the opening paren, scanned as a function)
            while ((CurrentTokenType == TokenType.Identifier
                && string.Compare(CurrentTokenText, "AND", StringComparison.OrdinalIgnoreCase) == 0)
                || (CurrentTokenType == TokenType.Function
                && string.Compare(CurrentTokenText, "AND(", StringComparison.OrdinalIgnoreCase) == 0))
            {
                // if we might need a space, output it now
                if (mightNeedSpace || Settings.OutputMode == OutputMode.MultipleLines)
                {
                    Append(' ');
                }

                // output the AND text.
                // MIGHT be AND( if it was a function, so first set a flag so we will know
                // wether or not to expect the opening paren
                if (CurrentTokenType == TokenType.Function)
                {
                    // this is not strictly allowed by the CSS3 spec!
                    // we are going to throw an error
                    ReportError(1, CssErrorCode.MediaQueryRequiresSpace, CurrentTokenText);

                    //and then fix what the developer wrote and make sure there is a space
                    // between the AND and the (. The CSS3 spec says it is invalid to not have a
                    // space there.
                    Append("and (");
                    SkipSpace();

                    // included the paren
                    ParseMediaQueryExpression();
                }
                else
                {
                    // didn't include the paren -- it BETTER be the next token 
                    // (after we output the AND token)
                    AppendCurrent();
                    SkipSpace();
                    if (CurrentTokenType == TokenType.Character
                        && CurrentTokenText == "(")
                    {
                        // put a space between the AND and the (
                        Append(' ');

                        ParseMediaQueryExpression();
                    }
                    else
                    {
                        // error -- we expected another media query expression
                        ReportError(0, CssErrorCode.ExpectedMediaQueryExpression, CurrentTokenText);

                        // break out of the loop so we can exit
                        break;
                    }
                }
            }

            return parsed;
        }

        private void ParseMediaQueryExpression()
        {
            // expect current token to be the opening paren when calling
            if (CurrentTokenType == TokenType.Character && CurrentTokenText == "(")
            {
                // output the paren and skip any space
                AppendCurrent();
                SkipSpace();
            }

            // media feature is required, and it's an ident
            if (CurrentTokenType == TokenType.Identifier)
            {
                // output the media feature and skip any space
                AppendCurrent();
                SkipSpace();

                // the next token should either be a colon (followed by an expression) or the closing paren
                if (CurrentTokenType == TokenType.Character && CurrentTokenText == ":")
                {
                    // got an expression.
                    // output the colon and skip any whitespace
                    AppendCurrent();
                    SkipSpace();

                    // if we are expanding the output, we want a space after the colon
                    if (Settings.OutputMode == OutputMode.MultipleLines)
                    {
                        Append(' ');
                    }

                    // parse the expression -- it's not optional
                    if (ParseExpr() != Parsed.True)
                    {
                        ReportError(0, CssErrorCode.ExpectedExpression, CurrentTokenText);
                    }

                    // better be the closing paren
                    if (CurrentTokenType == TokenType.Character && CurrentTokenText == ")")
                    {
                        // output the closing paren and skip any whitespace
                        AppendCurrent();
                        SkipSpace();
                    }
                    else
                    {
                        ReportError(0, CssErrorCode.ExpectedClosingParenthesis, CurrentTokenText);
                    }
                }
                else if (CurrentTokenType == TokenType.Character && CurrentTokenText == ")")
                {
                    // end of the expressions -- output the closing paren and skip any whitespace
                    AppendCurrent();
                    SkipSpace();
                }
                else
                {
                    ReportError(0, CssErrorCode.ExpectedClosingParenthesis, CurrentTokenText);
                }
            }
            else
            {
                ReportError(0, CssErrorCode.ExpectedMediaFeature, CurrentTokenText);
            }
        }

        private Parsed ParseDeclarationBlock(bool allowMargins)
        {
            var parsed = Parsed.True;

            // expect current token to be the opening brace when calling
            if (CurrentTokenType != TokenType.Character || CurrentTokenText != "{")
            {
                ReportError(0, CssErrorCode.ExpectedOpenBrace, CurrentTokenText);
                SkipToEndOfStatement();
                AppendCurrent();
                SkipSpace();
            }
            else
            {
                if (Settings.BlocksStartOnSameLine == BlockStart.NewLine
                    || Settings.BlocksStartOnSameLine == BlockStart.UseSource && m_encounteredNewLine)
                {
                    NewLine();
                }
                else if (Settings.OutputMode == OutputMode.MultipleLines)
                {
                    Append(' ');
                }

                Append('{');

                Indent();
                SkipSpace();

                if (CurrentTokenType == TokenType.Character && CurrentTokenText == "}")
                {
                    // shortcut nothing in the block to have the close on the same line
                    Unindent();
                    AppendCurrent();
                    SkipSpace();

                    // return parsed empty to indicate that the block is a valid, empty block
                    parsed = Parsed.Empty;
                }
                else
                {
                    ParseDeclarationList(allowMargins);
                    if (CurrentTokenType == TokenType.Character && CurrentTokenText == "}")
                    {
                        // append the closing brace
                        Unindent();
                        NewLine();
                        Append('}');
                        // skip past it
                        SkipSpace();
                    }
                    else if (m_scanner.EndOfFile)
                    {
                        // no closing brace, just the end of the file
                        ReportError(0, CssErrorCode.UnexpectedEndOfFile);
                    }
                    else
                    {
                        // I'm pretty sure ParseDeclarationList will only return on two situations:
                        //   1. closing brace (}), or
                        //   2. EOF.
                        // shouldn't get here, but just in case.
                        ReportError(0, CssErrorCode.ExpectedClosingBrace, CurrentTokenText);
                        Debug.Fail("UNEXPECTED CODE");
                    }
                }
            }

            return parsed;
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1502:AvoidExcessiveComplexity")]
        private Parsed ParseDeclarationList(bool allowMargins)
        {
            var parsed = Parsed.Empty;
            while (!m_scanner.EndOfFile)
            {
                // check the line length before each new declaration -- if we're past the threshold, start a new line
                if (m_lineLength >= Settings.LineBreakThreshold)
                {
                    AddNewLine();
                }

                Parsed parsedDecl = ParseDeclaration();
                if (parsed == Parsed.Empty && parsedDecl != Parsed.Empty)
                {
                    parsed = parsedDecl;
                }

                // if we are allowed to have margin at-keywords in this block, and
                // we didn't find a declaration, check to see if it's a margin
                var parsedMargin = false;
                if (allowMargins && parsedDecl == Parsed.Empty)
                {
                    parsedMargin = ParseMargin() == Parsed.True;
                }

                // if we parsed a margin, we DON'T expect there to be a semi-colon.
                // if we didn't parse a margin, then there better be either a semicolon or a closing brace.
                if (!parsedMargin)
                {
                    if ((CurrentTokenType != TokenType.Character
                        || (CurrentTokenText != ";" && CurrentTokenText != "}"))
                        && !m_scanner.EndOfFile)
                    {
                        ReportError(0, CssErrorCode.ExpectedSemicolonOrClosingBrace, CurrentTokenText);

                        // we'll get here if we decide to ignore the error and keep trudging along. But we still
                        // need to skip to the end of the declaration.
                        SkipToEndOfDeclaration();
                    }
                }

                // if we're at the end, close it out
                if (m_scanner.EndOfFile)
                {
                    // if we want to force a terminating semicolon, add it now
                    if (Settings.TermSemicolons)
                    {
                        Append(';');
                    }
                }
                else if (CurrentTokenText == "}")
                {
                    // if we want terminating semicolons but the source
                    // didn't have one (evidenced by a non-empty declaration)...
                    if (Settings.TermSemicolons && parsedDecl == Parsed.True)
                    {
                        // ...then add one now.
                        Append(';');
                    }

                    break;
                }
                else if (CurrentTokenText == ";")
                {
                    // token is a semi-colon
                    // if we always want to add the semicolons, add it now
                    if (Settings.TermSemicolons)
                    {
                        Append(';');
                        SkipSpace();
                    }
                    else
                    {
                        // we have a semicolon, but we don't know if we can
                        // crunch it out or not. If the NEXT token is a closing brace, then
                        // we can crunch out the semicolon.
                        // PROBLEM: if there's a significant comment AFTER the semicolon, then the 
                        // comment gets output before we output the semicolon, which could
                        // reverse the intended code.

                        // skip any whitespace to see if we need to add a semicolon
                        // to the end, or if we can crunch it out, but use a special function
                        // that doesn't send any comments to the stream yet -- it batches them
                        // up and returns them (if any)
                        string comments = NextSignificantToken();

                        if (m_scanner.EndOfFile)
                        {
                            // if we have an EOF after the semicolon and no comments, then we don't want
                            // to output anything else.
                            if (comments.Length > 0)
                            {
                                // but if we have comments after the semicolon....
                                // if there's a non-empty comment, it might be a significant hack, so add the semi-colon just in case.
                                if (comments != "/* */" && comments != "/**/")
                                {
                                    Append(';');
                                }

                                // and comments always end on a new line
                                Append(comments);
                                m_outputNewLine = true;
                                m_lineLength = 0;
                            }
                            break;
                        }
                        else if (CurrentTokenType != TokenType.Character
                            || (CurrentTokenText != "}" && CurrentTokenText != ";")
                            || (comments.Length > 0 && comments != "/* */" && comments != "/**/"))
                        {
                            // if the significant token after the 
                            // semicolon is not a cosing brace, then we'll add the semicolon.
                            // if there are two semi-colons in a row, don't add it because we'll double it.
                            // if there's a non-empty comment, it might be a significant hack, so add the semi-colon just in case.
                            Append(';');
                        }

                        // now that we've possibly added our semi-colon, we're safe
                        // to add any comments we may have found before the current token
                        if (comments.Length > 0)
                        {
                            Append(comments);

                            // and comments always end on a new line
                            m_outputNewLine = true;
                            m_lineLength = 0;
                        }
                    }
                }
            }

            return parsed;
        }

        private Parsed ParsePage()
        {
            Parsed parsed = Parsed.False;
            if (CurrentTokenType == TokenType.PageSymbol)
            {
                var keepDirective = true;
                PushWaypoint();

                NewLine();
                AppendCurrent();
                SkipSpace();

                if (CurrentTokenType == TokenType.Identifier)
                {
                    Append(' ');
                    AppendCurrent();
                    NextToken();
                }
                // optional
                ParsePseudoPage();

                if (CurrentTokenType == TokenType.Space)
                {
                    SkipSpace();
                }

                if (CurrentTokenType == TokenType.Character && CurrentTokenText == "{")
                {
                    // allow margin at-keywords
                    parsed = ParseDeclarationBlock(true);
                    if (parsed == Parsed.Empty)
                    {
                        keepDirective = false;
                        parsed = Parsed.True;
                    }

                    NewLine();
                }
                else
                {
                    SkipToEndOfStatement();
                    AppendCurrent();
                    SkipSpace();
                }

                PopWaypoint(keepDirective);
            }
            return parsed;
        }

        private Parsed ParsePseudoPage()
        {
            Parsed parsed = Parsed.False;
            if (CurrentTokenType == TokenType.Character && CurrentTokenText == ":")
            {
                Append(':');
                NextToken();

                if (CurrentTokenType != TokenType.Identifier)
                {
                    ReportError(0, CssErrorCode.ExpectedIdentifier, CurrentTokenText);
                }

                AppendCurrent();
                NextToken();
                parsed = Parsed.True;
            }
            return parsed;
        }

        private Parsed ParseMargin()
        {
            var parsed = Parsed.Empty;
            var keepDirective = true;
            switch (CurrentTokenType)
            {
                case TokenType.TopLeftCornerSymbol:
                case TokenType.TopLeftSymbol:
                case TokenType.TopCenterSymbol:
                case TokenType.TopRightSymbol:
                case TokenType.TopRightCornerSymbol:
                case TokenType.BottomLeftCornerSymbol:
                case TokenType.BottomLeftSymbol:
                case TokenType.BottomCenterSymbol:
                case TokenType.BottomRightSymbol:
                case TokenType.BottomRightCornerSymbol:
                case TokenType.LeftTopSymbol:
                case TokenType.LeftMiddleSymbol:
                case TokenType.LeftBottomSymbol:
                case TokenType.RightTopSymbol:
                case TokenType.RightMiddleSymbol:
                case TokenType.RightBottomSymbol:
                    // these are the margin at-keywords
                    PushWaypoint();
                    NewLine();
                    AppendCurrent();
                    SkipSpace();

                    // don't allow margin at-keywords
                    parsed = ParseDeclarationBlock(false);
                    if (parsed == Parsed.Empty)
                    {
                        keepDirective = false;
                        parsed = Parsed.True;
                    }

                    NewLine();
                    PopWaypoint(keepDirective);
                    break;

                default:
                    // we're not interested
                    break;
            }
            return parsed;
        }

        private Parsed ParseFontFace()
        {
            var parsed = Parsed.False;
            if (CurrentTokenType == TokenType.FontFaceSymbol)
            {
                var keepDirective = true;
                PushWaypoint();

                NewLine();
                AppendCurrent();
                SkipSpace();

                // don't allow margin at-keywords
                parsed = ParseDeclarationBlock(false);
                if (parsed == Parsed.Empty)
                {
                    keepDirective = false;
                    parsed = Parsed.True;
                }

                NewLine();
                PopWaypoint(keepDirective);
            }
            return parsed;
        }

        private Parsed ParseOperator()
        {
            Parsed parsed = Parsed.Empty;
            if (CurrentTokenType == TokenType.Character
              && (CurrentTokenText == "/" || CurrentTokenText == ","))
            {
                AppendCurrent();
                SkipSpace();
                parsed = Parsed.True;
            }
            return parsed;
        }

        private Parsed ParseCombinator()
        {
            Parsed parsed = Parsed.Empty;
            if (CurrentTokenType == TokenType.Character
              && (CurrentTokenText == "+" || CurrentTokenText == ">" || CurrentTokenText == "~"))
            {
                AppendCurrent();
                SkipSpace();
                parsed = Parsed.True;
            }
            return parsed;
        }

        private Parsed ParseRule()
        {
            var keepRule = true;
            PushWaypoint();

            // check the line length before each new declaration -- if we're past the threshold, start a new line
            if (m_lineLength >= Settings.LineBreakThreshold)
            {
                AddNewLine();
            }

            m_forceNewLine = true;
            Parsed parsed = ParseSelector();
            if (parsed == Parsed.True)
            {
                if (m_scanner.EndOfFile)
                {
                    // we parsed a selector expecting this to be a rule, but then WHAM! we hit
                    // the end of the file. That isn't correct. Throw an error.
                    ReportError(0, CssErrorCode.UnexpectedEndOfFile);
                }

                while (!m_scanner.EndOfFile)
                {
                    if (CurrentTokenType != TokenType.Character
                        || (CurrentTokenText != "," && CurrentTokenText != "{"))
                    {
                        ReportError(0, CssErrorCode.ExpectedCommaOrOpenBrace, CurrentTokenText);
                        SkipToEndOfStatement();
                        AppendCurrent();
                        SkipSpace();
                        break;
                    }

                    if (CurrentTokenText == "{")
                    {
                        // REVIEW: IE6 has an issue where the "first-letter" and "first-line" 
                        // pseudo-classes need to be separated from the opening curly-brace 
                        // of the following rule set by a space or it doesn't get picked up. 
                        // So if the last-outputted word was "first-letter" or "first-line",
                        // add a space now (since we know the next character at this point 
                        // is the opening brace of a rule-set).
                        // Maybe some day this should be removed or put behind an "IE6-compat" switch.
                        if (m_lastOutputString == "first-letter" || m_lastOutputString == "first-line")
                        {
                            Append(' ');
                        }

                        // don't allow margin at-keywords
                        parsed = ParseDeclarationBlock(false);
                        if (parsed == Parsed.Empty)
                        {
                            keepRule = false;
                            parsed = Parsed.True;
                        }

                        break;
                    }

                    Append(',');

                    // check the line length before each new declaration -- if we're past the threshold, start a new line
                    if (m_lineLength >= Settings.LineBreakThreshold)
                    {
                        AddNewLine();
                    }
                    else if (Settings.OutputMode == OutputMode.MultipleLines)
                    {
                        Append(' ');
                    }

                    SkipSpace();

                    if (ParseSelector() != Parsed.True)
                    {
                        if (CurrentTokenType == TokenType.Character && CurrentTokenText == "{")
                        {
                            // the author ended the last selector with a comma, but didn't include
                            // the next selector before starting the declaration block. Or maybe it's there,
                            // but commented out. Still okay, but flag a style warning.
                            ReportError(4, CssErrorCode.ExpectedSelector, CurrentTokenText);
                            continue;
                        }
                        else
                        {
                            // not something we know about -- skip the whole statement
                            ReportError(0, CssErrorCode.ExpectedSelector, CurrentTokenText);
                            SkipToEndOfStatement();
                        }
                        AppendCurrent();
                        SkipSpace();
                        break;
                    }
                }
            }

            PopWaypoint(keepRule);
            return parsed;
        }

        private Parsed ParseSelectorList()
        {
            var parsed = ParseSelector();
            while (CurrentTokenType == TokenType.Character && CurrentTokenText == ",")
            {
                // append the comma to the output and skip it any any other
                // space following it
                AppendCurrent();
                SkipSpace();

                // parse another selector. Don't save the parsed result because this
                // function should return true now, since we parsed at least one selected
                // successfully
                if (ParseSelector() != Parsed.True)
                {
                    // but if we fail for any reason, then break out of the loop after reporting
                    // an error
                    ReportError(0, CssErrorCode.ExpectedSelector, CurrentTokenText);
                    break;
                }
            }

            return parsed;
        }

        private Parsed ParseSelector()
        {
            // should start with a selector
            Parsed parsed = ParseSimpleSelector();
            if (parsed == Parsed.False && CurrentTokenType != TokenType.None)
            {
                // no selector? See if it starts with a combinator.
                // common IE-7 hack to start with a combinator, because that browser will assume a beginning *
                var currentContext = m_currentToken.Context;
                var possibleCombinator = CurrentTokenText;
                parsed = ParseCombinator();
                if (parsed == Parsed.True)
                {
                    ReportError(4, CssErrorCode.HackGeneratesInvalidCss, currentContext, possibleCombinator);
                }
            }

            if (parsed == Parsed.True)
            {
                // save whether or not we are skipping anything by checking the type before we skip
                bool spaceWasSkipped = SkipIfSpace();

                while (!m_scanner.EndOfFile)
                {
                    Parsed parsedCombinator = ParseCombinator();
                    if (parsedCombinator != Parsed.True)
                    {
                        // we know the selector ends with a comma or an open brace,
                        // so if the next token is one of those, we're done.
                        // otherwise we're going to slap a space in the stream (if we found one)
                        // and look for the next selector
                        if (CurrentTokenType == TokenType.Character
                          && (CurrentTokenText == "," || CurrentTokenText == "{" || CurrentTokenText == ")"))
                        {
                            break;
                        }
                        else if (spaceWasSkipped)
                        {
                            Append(' ');
                        }
                    }

                    if (ParseSimpleSelector() == Parsed.False)
                    {
                        ReportError(0, CssErrorCode.ExpectedSelector, CurrentTokenText);
                        break;
                    }
                    else
                    {
                        // save the "we skipped whitespace" flag before skipping the whitespace
                        spaceWasSkipped = SkipIfSpace();
                    }
                }
            }
            return parsed;
        }

        // does NOT skip whitespace after the selector
        private Parsed ParseSimpleSelector()
        {
            // the element name is optional
            Parsed parsed = ParseElementName();
            while (!m_scanner.EndOfFile)
            {
                if (CurrentTokenType == TokenType.Hash)
                {
                    AppendCurrent();
                    NextToken();
                    parsed = Parsed.True;
                }
                else if (ParseClass() == Parsed.True)
                {
                    parsed = Parsed.True;
                }
                else if (ParseAttrib() == Parsed.True)
                {
                    parsed = Parsed.True;
                }
                else if (ParsePseudo() == Parsed.True)
                {
                    parsed = Parsed.True;
                }
                else
                {
                    break;
                }
            }
            return parsed;
        }

        private Parsed ParseClass()
        {
            Parsed parsed = Parsed.False;
            if (CurrentTokenType == TokenType.Character
              && CurrentTokenText == ".")
            {
                AppendCurrent();
                NextToken();

                if (CurrentTokenType == TokenType.Identifier)
                {
                    AppendCurrent();
                    NextToken();
                    parsed = Parsed.True;
                }
                else if (CurrentTokenType == TokenType.Character && CurrentTokenText == "%")
                {
                    UpdateIfReplacementToken();
                    if (CurrentTokenType == TokenType.ReplacementToken)
                    {
                        AppendCurrent();
                        NextToken();
                        parsed = Parsed.True;
                    }
                    else
                    {
                        ReportError(0, CssErrorCode.ExpectedIdentifier, CurrentTokenText);
                    }
                }
                else
                {
                    ReportError(0, CssErrorCode.ExpectedIdentifier, CurrentTokenText);
                }
            }
            else if (CurrentTokenType == TokenType.Dimension || CurrentTokenType == TokenType.Number)
            {
                string rawNumber = m_scanner.RawNumber;
                if (rawNumber != null && rawNumber.StartsWith(".", StringComparison.Ordinal))
                {
                    // if we are expecting a class but we got dimension or number that starts with a period,
                    // then what we REALLY have is a class name that starts with a digit. If it's all digits,
                    // it will be a number, and it it's just an identifier that starts with a digit, it will
                    // be a dimension.
                    // The problem here is that both of those those token type format the number, eg: 
                    // .000foo would get shrunk to 0foo.
                    // Be sure to use the RawNumber property on the scanner to get the raw text exactly as
                    // it was from the input
                    parsed = Parsed.True;

                    // but check the next token to see if it's an identifier.
                    // if the next token is an identifier with no whitespace between it and the previous
                    // "number," then it's part of this identifier
                    NextToken();
                    if (CurrentTokenType == TokenType.Identifier)
                    {
                        // add that identifier to the raw number
                        rawNumber += CurrentTokenText;
                        NextToken();
                    }

                    // report a low-sev warning before outputting the raw number text and advancing
                    ReportError(2, CssErrorCode.PossibleInvalidClassName, rawNumber);
                    Append(rawNumber);
                }
            }
            return parsed;
        }

        private Parsed ParseElementName()
        {
            Parsed parsed = Parsed.False;
            bool foundNamespace = false;

            // if the next character is a pipe, then we have an empty namespace prefix
            if (CurrentTokenType == TokenType.Character && CurrentTokenText == "|")
            {
                foundNamespace = true;
                AppendCurrent();
                NextToken();
            }

            if (CurrentTokenType == TokenType.Identifier
                || (CurrentTokenType == TokenType.Character && CurrentTokenText == "*"))
            {
                // if we already found a namespace, then there was none specified and the
                // element name started with |. Otherwise, save the current ident as a possible
                // namespace identifier
                string identifier = foundNamespace ? null : CurrentTokenText;

                AppendCurrent();
                NextToken();
                parsed = Parsed.True;

                // if the next character is a pipe, then that previous identifier or asterisk
                // was the namespace prefix
                if (!foundNamespace
                    && CurrentTokenType == TokenType.Character && CurrentTokenText == "|")
                {
                    // throw an error if identifier wasn't prevously defined by @namespace statement
                    ValidateNamespace(identifier);

                    // output the pipe and move to the true element name
                    AppendCurrent();
                    NextToken();

                    // a namespace and the bar character should ALWAYS be followed by
                    // either an identifier or an asterisk
                    if (CurrentTokenType == TokenType.Identifier
                        || (CurrentTokenType == TokenType.Character && CurrentTokenText == "*"))
                    {
                        AppendCurrent();
                        NextToken();
                    }
                    else
                    {
                        // we have an error condition
                        parsed = Parsed.False;
                        // handle the error
                        ReportError(0, CssErrorCode.ExpectedIdentifier, CurrentTokenText);
                    }
                }
            }
            else if (foundNamespace)
            {
                // we had found an empty namespace, but no element or universal following it!
                // handle the error
                ReportError(0, CssErrorCode.ExpectedIdentifier, CurrentTokenText);
            }

            return parsed;
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1502:AvoidExcessiveComplexity")]
        private Parsed ParseAttrib()
        {
            Parsed parsed = Parsed.False;
            if (CurrentTokenType == TokenType.Character
              && CurrentTokenText == "[")
            {
                Append('[');
                SkipSpace();

                bool foundNamespace = false;
                
                // must be either an identifier, an asterisk, or a namespace separator
                if (CurrentTokenType == TokenType.Character && CurrentTokenText == "|")
                {
                    // has an empty namespace
                    foundNamespace = true;
                    AppendCurrent();
                    NextToken();
                }

                if (CurrentTokenType == TokenType.Identifier
                    || (CurrentTokenType == TokenType.Character && CurrentTokenText == "*"))
                {
                    // if we already found a namespace, then there was none specified and the
                    // element name started with |. Otherwise, save the current ident as a possible
                    // namespace identifier
                    string identifier = foundNamespace ? null : CurrentTokenText;

                    AppendCurrent();
                    SkipSpace();

                    // check to see if that identifier is actually a namespace because the current
                    // token is a namespace separator
                    if (!foundNamespace 
                        && CurrentTokenType == TokenType.Character && CurrentTokenText == "|")
                    {
                        // namespaced attribute
                        // throw an error if the namespace hasn't previously been defined by a @namespace statement
                        ValidateNamespace(identifier);

                        // output the pipe and move to the next token,
                        // which should be the attribute name
                        AppendCurrent();
                        SkipSpace();

                        // must be either an identifier or an asterisk
                        if (CurrentTokenType == TokenType.Identifier
                            || (CurrentTokenType == TokenType.Character && CurrentTokenText == "*"))
                        {
                            // output the namespaced attribute name
                            AppendCurrent();
                            SkipSpace();
                        }
                        else
                        {
                            ReportError(0, CssErrorCode.ExpectedIdentifier, CurrentTokenText);
                        }
                    }
                }
                else
                {
                    // neither an identifier nor an asterisk
                    ReportError(0, CssErrorCode.ExpectedIdentifier, CurrentTokenText);
                }

                // check to see if there's an (optional) attribute operator
                if ((CurrentTokenType == TokenType.Character && CurrentTokenText == "=")
                  || (CurrentTokenType == TokenType.Includes)
                  || (CurrentTokenType == TokenType.DashMatch)
                  || (CurrentTokenType == TokenType.PrefixMatch)
                  || (CurrentTokenType == TokenType.SuffixMatch)
                  || (CurrentTokenType == TokenType.SubstringMatch))
                {
                    AppendCurrent();
                    SkipSpace();

                    if (CurrentTokenType == TokenType.Character
                        && CurrentTokenText == "%")
                    {
                        UpdateIfReplacementToken();
                        if (CurrentTokenType != TokenType.ReplacementToken)
                        {
                            ReportError(0, CssErrorCode.ExpectedIdentifierOrString, CurrentTokenText);
                        }
                    }
                    else if (CurrentTokenType != TokenType.Identifier
                      && CurrentTokenType != TokenType.String)
                    {
                        ReportError(0, CssErrorCode.ExpectedIdentifierOrString, CurrentTokenText);
                    }

                    AppendCurrent();
                    SkipSpace();
                }

                if (CurrentTokenType != TokenType.Character
                  || CurrentTokenText != "]")
                {
                    ReportError(0, CssErrorCode.ExpectedClosingBracket, CurrentTokenText);
                }

                // we're done!
                Append(']');
                NextToken();
                parsed = Parsed.True;
            }
            return parsed;
        }

        private Parsed ParsePseudo()
        {
            Parsed parsed = Parsed.False;
            if (CurrentTokenType == TokenType.Character
              && CurrentTokenText == ":")
            {
                Append(':');
                NextToken();

                // CSS3 has pseudo-ELEMENTS that are specified with a double-colon.
                // IF we find a double-colon, we will treat it exactly the same as if it were a pseudo-CLASS.
                if (CurrentTokenType == TokenType.Character && CurrentTokenText == ":")
                {
                    Append(':');
                    NextToken();
                }

                switch (CurrentTokenType)
                {
                    case TokenType.Identifier:
                        AppendCurrent();
                        NextToken();
                        break;

                    case TokenType.Not:
                    case TokenType.Any:
                    case TokenType.Matches:
                        AppendCurrent();
                        SkipSpace();

                        // the argument of an ANY/MATCHES pseudo function is a selector list,
                        // and Selectors 4 standards say NOT is also a selector list. Selectors 3
                        // says NOT is only a simple selector, but let's go with the later standard
                        parsed = ParseSelectorList();
                        if (parsed != Parsed.True)
                        {
                            // TODO: error? shouldn't we ALWAYS have a selector list inside a not()/matches()/any() function?
                        }

                        // skip any whitespace if we have it
                        SkipIfSpace();

                        // don't forget the closing paren
                        if (CurrentTokenType != TokenType.Character
                          || CurrentTokenText != ")")
                        {
                            ReportError(0, CssErrorCode.ExpectedIdentifier, CurrentTokenText);
                        }
                        AppendCurrent();
                        NextToken();
                        break;

                    case TokenType.Function:
                        AppendCurrent();
                        SkipSpace();

                        // parse the function argument expression
                        ParseExpression();

                        // IE extends CSS3 grammar to provide for multiple arguments to pseudo-class
                        // functions. So as long as the current token is a comma, keep on parsing
                        // expressions.
                        while (CurrentTokenType == TokenType.Character
                            && CurrentTokenText == ",")
                        {
                            AppendCurrent();
                            NextToken();
                            ParseExpression();
                        }

                        if (CurrentTokenType != TokenType.Character
                          || CurrentTokenText != ")")
                        {
                            ReportError(0, CssErrorCode.ExpectedIdentifier, CurrentTokenText);
                        }
                        AppendCurrent();
                        NextToken();
                        break;

                    default:
                        ReportError(0, CssErrorCode.ExpectedIdentifier, CurrentTokenText);
                        break;
                }
                parsed = Parsed.True;
            }
            return parsed;
        }

        private Parsed ParseExpression()
        {
            Parsed parsed = Parsed.Empty;
            while(true)
            {
                switch(CurrentTokenType)
                {
                    case TokenType.Dimension:
                    case TokenType.Number:
                    case TokenType.String:
                    case TokenType.Identifier:
                        // just output these token types
                        parsed = Parsed.True;
                        AppendCurrent();
                        NextToken();
                        break;

                    case TokenType.Space:
                        // ignore spaces
                        NextToken();
                        break;

                    case TokenType.Character:
                        if (CurrentTokenText == "+" || CurrentTokenText == "-")
                        {
                            parsed = Parsed.True;
                            AppendCurrent();
                            NextToken();
                        }
                        else
                        {
                            // anything else and we exit
                            return parsed;
                        }
                        break;

                    default:
                        // anything else and we bail
                        return parsed;
                }
            }
        }

        private Parsed ParseDeclaration()
        {
            Parsed parsed = Parsed.Empty;

            // see if the developer is using an IE hack of prefacing property names
            // with an asterisk -- IE seems to ignore it; other browsers will recognize
            // the invalid property name and ignore it.
            string prefix = null;
            if (CurrentTokenType == TokenType.Character 
                && (CurrentTokenText == "*" || CurrentTokenText == "."))
            {
                // spot a low-pri error because this is actually invalid CSS
                // taking advantage of an IE "feature"
                ReportError(4, CssErrorCode.HackGeneratesInvalidCss, CurrentTokenText);

                // save the prefix and skip it
                prefix = CurrentTokenText;
                NextToken();
            }

            if (CurrentTokenType == TokenType.Identifier)
            {
                // save the property name
                string propertyName = CurrentTokenText;

                // if this is an excluded property name, then set the no-output flag
                // so the declaration is not outputted (we'll always reset this flag at
                // the end of the function)
                if (Settings.ExcludeVendorPrefixes.Count > 0 && IsExcludedVendorPrefix(propertyName))
                {
                    m_noOutput = true;
                }

                NewLine();
                if (prefix != null)
                {
                    Append(prefix);
                }
                AppendCurrent();

                // we want to skip space BUT we want to preserve a space if there is a whitespace character
                // followed by a comment. So don't call the simple SkipSpace method -- that will output the
                // comment but ignore all whitespace.
                SkipSpaceComment();

                if (CurrentTokenType != TokenType.Character
                  || CurrentTokenText != ":")
                {
                    ReportError(0, CssErrorCode.ExpectedColon, CurrentTokenText);
                    SkipToEndOfDeclaration();
                    return Parsed.True;
                }
                Append(':');
                if (Settings.OutputMode == OutputMode.MultipleLines)
                {
                    Append(' ');
                }
                SkipSpace();

                if (m_valueReplacement != null)
                {
                    // output the replacement string
                    Append(m_valueReplacement);

                    // clear the replacement string
                    m_valueReplacement = null;

                    // set the no-output flag, parse the value, the reset the flag.
                    // we don't care if it actually finds a value or not
                    var notOutputting = m_noOutput;
                    m_noOutput = true;
                    ParseExpr();
                    m_noOutput = notOutputting;
                }
                else 
                {
                    m_parsingColorValue = MightContainColorNames(propertyName);
                    parsed = ParseExpr();
                    m_parsingColorValue = false;

                    if (parsed != Parsed.True)
                    {
                        ReportError(0, CssErrorCode.ExpectedExpression, CurrentTokenText);
                        SkipToEndOfDeclaration();
                        return Parsed.True;
                    }
                }

                // optional
                ParsePrio();

                parsed = Parsed.True;
                m_noOutput = false;
            }
            return parsed;
        }

        private Parsed ParsePrio()
        {
            Parsed parsed = Parsed.False;
            if (CurrentTokenType == TokenType.ImportantSymbol)
            {
                // issue #21057 - do not trip space before !important keyword.
                if (m_skippedSpace)
                {
                    Append(' ');
                }

                AppendCurrent();
                SkipSpace();

                // a common IE7-and-below hack is to append another ! at the end of !important.
                if (CurrentTokenType == TokenType.Character && CurrentTokenText == "!")
                {
                    ReportError(4, CssErrorCode.HackGeneratesInvalidCss, CurrentTokenText);
                    AppendCurrent();
                    SkipSpace();
                }

                parsed = Parsed.True;
            }
            else if (CurrentTokenType == TokenType.Character && CurrentTokenText == "!")
            {
                // another common IE7-and-below hack is to use an identifier OTHER than "important". All other browsers will see this
                // as an error, but IE7 and below will keep on processing. A common thing is to put !ie at the end to mark
                // the declaration as only for IE.
                if (Settings.OutputMode == OutputMode.MultipleLines)
                {
                    Append(' ');
                }

                AppendCurrent();
                NextToken();
                if (CurrentTokenType == TokenType.Identifier)
                {
                    ReportError(4, CssErrorCode.HackGeneratesInvalidCss, CurrentTokenText);

                    AppendCurrent();
                    SkipSpace();
                    parsed = Parsed.True;
                }
                else
                {
                    // but we need SOME identifier here....
                    ReportError(0, CssErrorCode.ExpectedIdentifier, CurrentTokenText);
                }
            }
            return parsed;
        }

        private Parsed ParseExpr()
        {
            Parsed parsed = ParseTerm(false);
            if (parsed == Parsed.True)
            {
                while (!m_scanner.EndOfFile)
                {
                    Parsed parsedOp = ParseOperator();
                    if (parsedOp != Parsed.False)
                    {
                        if (ParseTerm(parsedOp == Parsed.Empty) == Parsed.False)
                        {
                            break;
                        }
                    }
                }
            }
            return parsed;
        }

        private Parsed ParseFunctionParameters()
        {
            Parsed parsed = ParseTerm(false);
            if (parsed == Parsed.True)
            {
                while (!m_scanner.EndOfFile)
                {
                    if (CurrentTokenType == TokenType.Character
                      && CurrentTokenText == "=")
                    {
                        AppendCurrent();
                        SkipSpace();
                        ParseTerm(false);
                    }

                    Parsed parsedOp = ParseOperator();
                    if (parsedOp != Parsed.False)
                    {
                        if (ParseTerm(parsedOp == Parsed.Empty) == Parsed.False)
                        {
                            break;
                        }
                    }
                }
            }
            else if (parsed == Parsed.False
              && CurrentTokenType == TokenType.Character
              && CurrentTokenText == ")")
            {
                // it's okay to have no parameters in functions
                parsed = Parsed.Empty;
            }
            return parsed;
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1502:AvoidExcessiveComplexity")]
        private Parsed ParseTerm(bool wasEmpty)
        {
            Parsed parsed = Parsed.False;
            bool hasUnary = false;
            if (CurrentTokenType == TokenType.Character
                && (CurrentTokenText == "-" || CurrentTokenText == "+"))
            {
                if (wasEmpty)
                {
                    if (m_skippedSpace)
                    {
                        Append(' ');
                    }

                    wasEmpty = false;
                }

                AppendCurrent();
                NextToken();
                hasUnary = true;
            }

            switch (CurrentTokenType)
            {
                case TokenType.Hash:
                    if (hasUnary)
                    {
                        ReportError(0, CssErrorCode.HashAfterUnaryNotAllowed, CurrentTokenText);
                    }

                    if (wasEmpty)
                    {
                        Append(' ');
                        wasEmpty = false;
                    }
                    if (ParseHexcolor() == Parsed.False)
                    {
                        ReportError(0, CssErrorCode.ExpectedHexColor, CurrentTokenText);

                        // we expected the hash token to be a proper color -- but it's not.
                        // we threw an error -- go ahead and output the token as-is and keep going.
                        AppendCurrent();
                        SkipSpace();
                    }
                    parsed = Parsed.True;
                    break;

                case TokenType.String:
                case TokenType.Identifier:
                case TokenType.Uri:
                //case TokenType.RGB:
                case TokenType.UnicodeRange:
                    if (hasUnary)
                    {
                        ReportError(0, CssErrorCode.TokenAfterUnaryNotAllowed, CurrentTokenText);
                    }

                    // wasEmpty will be false if we DIDN'T find an operator
                    // as the last token. If we had an operator, then we can ignore
                    // any whitespace; but if we DIDN'T find an operator, then we
                    // will need to preserve a whitespace character to keep them 
                    // separated.
                    if (wasEmpty)
                    {
                        // if we had skipped any space, then add one now
                        if (m_skippedSpace)
                        {
                            Append(' ');
                        }

                        wasEmpty = false;
                    }

                    AppendCurrent();
                    SkipSpace();
                    parsed = Parsed.True;
                    break;

                case TokenType.Dimension:
                    ReportError(2, CssErrorCode.UnexpectedDimension, CurrentTokenText);
                    goto case TokenType.Number;

                case TokenType.Number:
                case TokenType.Percentage:
                case TokenType.AbsoluteLength:
                case TokenType.RelativeLength:
                case TokenType.Angle:
                case TokenType.Time:
                case TokenType.Frequency:
                case TokenType.Resolution:
                    if (wasEmpty)
                    {
                        Append(' ');
                        wasEmpty = false;
                    }

                    AppendCurrent();
                    SkipSpace();
                    parsed = Parsed.True;
                    break;

                case TokenType.ProgId:
                    if (wasEmpty)
                    {
                        Append(' ');
                        wasEmpty = false;
                    }
                    if (ParseProgId() == Parsed.False)
                    {
                        ReportError(0, CssErrorCode.ExpectedProgId, CurrentTokenText);
                    }
                    parsed = Parsed.True;
                    break;

                case TokenType.Function:
                    if (wasEmpty)
                    {
                        Append(' ');
                        wasEmpty = false;
                    }
                    if (ParseFunction() == Parsed.False)
                    {
                        ReportError(0, CssErrorCode.ExpectedFunction, CurrentTokenText);
                    }
                    parsed = Parsed.True;
                    break;

                case TokenType.Character:
                    if (CurrentTokenText == "(")
                    {
                        // the term starts with an opening paren.
                        // parse an expression followed by the close paren.
                        if (wasEmpty)
                        {
                            if (m_skippedSpace)
                            {
                                Append(' ');
                            }

                            wasEmpty = false;
                        }

                        AppendCurrent();
                        SkipSpace();

                        if (ParseExpr() == Parsed.False)
                        {
                            ReportError(0, CssErrorCode.ExpectedExpression, CurrentTokenText);
                        }

                        if (CurrentTokenType == TokenType.Character
                            && CurrentTokenText == ")")
                        {
                            AppendCurrent();
                            parsed = Parsed.True;

                            // the closing paren can only be followed IMMEDIATELY by the opening brace
                            // without any space if it's a repeat syntax.
                            m_skippedSpace = false;
                            NextRawToken();
                            if (CurrentTokenType == TokenType.Space)
                            {
                                m_skippedSpace = true;
                            }

                            // if the next token is an opening brace, then this might be
                            // a repeat operator
                            if (CurrentTokenType == TokenType.Character
                                && CurrentTokenText == "[")
                            {
                                AppendCurrent();
                                SkipSpace();

                                if (CurrentTokenType == TokenType.Number)
                                {
                                    AppendCurrent();
                                    SkipSpace();

                                    if (CurrentTokenType == TokenType.Character
                                        && CurrentTokenText == "]")
                                    {
                                        AppendCurrent();
                                        SkipSpace();
                                    }
                                    else
                                    {
                                        ReportError(0, CssErrorCode.ExpectedClosingBracket, CurrentTokenText);
                                        parsed = Parsed.False;
                                    }
                                }
                                else
                                {
                                    ReportError(0, CssErrorCode.ExpectedNumber, CurrentTokenText);
                                    parsed = Parsed.False;
                                }
                            }
                        }
                        else
                        {
                            ReportError(0, CssErrorCode.ExpectedClosingParenthesis, CurrentTokenText);
                        }
                    }
                    else if ( CurrentTokenText == "%")
                    {
                        // see if this is the start of a replacement token
                        UpdateIfReplacementToken();
                        if (CurrentTokenType == TokenType.ReplacementToken)
                        {
                            // it was -- output it and move along
                            if (wasEmpty)
                            {
                                Append(' ');
                                wasEmpty = false;
                            }

                            AppendCurrent();
                            SkipSpace();
                            parsed = Parsed.True;
                        }
                        else
                        {
                            // nope; just a percent. 
                            goto default;
                        }
                    }
                    else
                    {
                        goto default;
                    }
                    break;

                default:
                    if (hasUnary)
                    {
                        ReportError(0, CssErrorCode.UnexpectedToken, CurrentTokenText);
                    }
                    break;
            }
            return parsed;
        }

        private Parsed ParseProgId()
        {
            Parsed parsed = Parsed.False;
            if (CurrentTokenType == TokenType.ProgId)
            {
                ReportError(4, CssErrorCode.ProgIdIEOnly);

                // set the state flag that tells us we should NOT abbreviate color
                // hash values as we are parsing our parameters
                m_noColorAbbreviation = true;

                // comma-separated lists of progid expressions should have a space after
                // the comma, or IE will ignore all but the last
                if (m_lastOutputString == ",")
                {
                    Append(" ");
                }

                // append the progid and opening paren
                AppendCurrent();
                SkipSpace();

                // the rest is a series of parameters: name=value, separated
                // by commas and ending with a close paren
                while (CurrentTokenType == TokenType.Identifier)
                {
                    AppendCurrent();
                    SkipSpace();

                    if (CurrentTokenType != TokenType.Character
                      && CurrentTokenText != "=")
                    {
                        ReportError(0, CssErrorCode.ExpectedEqualSign, CurrentTokenText);
                    }

                    Append('=');
                    SkipSpace();

                    if (ParseTerm(false) != Parsed.True)
                    {
                        ReportError(0, CssErrorCode.ExpectedTerm, CurrentTokenText);
                    }

                    if (CurrentTokenType == TokenType.Character
                      && CurrentTokenText == ",")
                    {
                        Append(',');
                        SkipSpace();
                    }
                }

                // reset the color-abbreviation flag
                m_noColorAbbreviation = false;

                // make sure we're at the close paren
                if (CurrentTokenType == TokenType.Character
                  && CurrentTokenText == ")")
                {
                    Append(')');
                    SkipSpace();
                }
                else
                {
                    ReportError(0, CssErrorCode.UnexpectedToken, CurrentTokenText);
                }
                parsed = Parsed.True;
            }
            return parsed;
        }

        private static string GetRoot(string text)
        {
            if (text.StartsWith("-", StringComparison.Ordinal))
            {
                var match = s_vendorSpecific.Match(text);
                if (match.Success)
                {
                    text = match.Result("${root}");
                }
            }

            return text;
        }

        private Parsed ParseFunction()
        {
            Parsed parsed = Parsed.False;
            if (CurrentTokenType == TokenType.Function)
            {
                var functionText = GetRoot(CurrentTokenText);
                switch (functionText.ToUpperInvariant())
                {
                    case "RGB(":
                        parsed = ParseRgb();
                        break;

                    case "EXPRESSION(":
                        parsed = ParseExpressionFunction();
                        break;

                    case "CALC(":
                        parsed = ParseCalc();
                        break;

                    case "MIN(":
                    case "MAX(":
                        parsed = ParseMinMax();
                        break;

                    default:
                        // generic function parsing
                        AppendCurrent();
                        SkipSpace();

                        if (ParseFunctionParameters() == Parsed.False)
                        {
                            ReportError(0, CssErrorCode.ExpectedExpression, CurrentTokenText);
                        }

                        if (CurrentTokenType == TokenType.Character && CurrentTokenText == ")")
                        {
                            AppendCurrent();
                            SkipSpace();
                            parsed = Parsed.True;
                        }
                        else
                        {
                            ReportError(0, CssErrorCode.UnexpectedToken, CurrentTokenText);
                        }
                        break;
                }
            }
            return parsed;
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1502:AvoidExcessiveComplexity")]
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Globalization", "CA1308:NormalizeStringsToUppercase", Justification = "we want lower-case output")]
        private Parsed ParseRgb()
        {
            var parsed = Parsed.False;
            if (CurrentTokenType == TokenType.Function
                && string.Compare(CurrentTokenText, "rgb(", StringComparison.OrdinalIgnoreCase) == 0)
            {
                // rgb function parsing
                var useRGB = false;
                var crunchedRGB = false;
                // converting to #rrggbb or #rgb IF we don't find any significant comments!
                // skip any space or comments
                var rgb = new int[3];

                // we're going to be building up the rgb function just in case we need it
                var sbRGB = StringBuilderPool.Acquire();
                try
                {
                    sbRGB.Append(CurrentTokenText.ToLowerInvariant());

                    var comments = NextSignificantToken();
                    if (comments.Length > 0)
                    {
                        // add the comments
                        sbRGB.Append(comments);
                        // and signal that we need to use the RGB function because of them
                        useRGB = true;
                    }

                    for (var ndx = 0; ndx < 3; ++ndx)
                    {
                        // if this isn't the first number, we better find a comma separator
                        if (ndx > 0)
                        {
                            if (CurrentTokenType == TokenType.Character && CurrentTokenText == ",")
                            {
                                // add it to the rgb string builder
                                sbRGB.Append(',');
                            }
                            else if (CurrentTokenType == TokenType.Character && CurrentTokenText == ")")
                            {
                                ReportError(0, CssErrorCode.ExpectedComma, CurrentTokenText);

                                // closing paren is the end of the function! exit the loop
                                useRGB = true;
                                break;
                            }
                            else
                            {
                                ReportError(0, CssErrorCode.ExpectedComma, CurrentTokenText);
                                sbRGB.Append(CurrentTokenText);
                                useRGB = true;
                            }

                            // skip to the next significant
                            comments = NextSignificantToken();
                            if (comments.Length > 0)
                            {
                                // add the comments
                                sbRGB.Append(comments);
                                // and signal that we need to use the RGB function because of them
                                useRGB = true;
                            }
                        }

                        // although we ALLOW negative numbers here, we'll trim them
                        // later. But in the mean time, save a negation flag.
                        var negateNumber = false;
                        if (CurrentTokenType == TokenType.Character && CurrentTokenText == "-")
                        {
                            negateNumber = true;
                            comments = NextSignificantToken();
                            if (comments.Length > 0)
                            {
                                // add the comments
                                sbRGB.Append(comments);
                                // and signal that we need to use the RGB function because of them
                                useRGB = true;
                            }
                        }

                        // we might adjust the value, so save the token text
                        var tokenText = CurrentTokenText;

                        if (CurrentTokenType != TokenType.Number && CurrentTokenType != TokenType.Percentage)
                        {
                            ReportError(0, CssErrorCode.ExpectedRgbNumberOrPercentage, CurrentTokenText);
                            useRGB = true;
                        }
                        else
                        {
                            if (CurrentTokenType == TokenType.Number)
                            {
                                // get the number value
                                float numberValue;
                                if (tokenText.TryParseSingleInvariant(out numberValue))
                                {
                                    numberValue *= (negateNumber ? -1 : 1);
                                    // make sure it's between 0 and 255
                                    if (numberValue < 0)
                                    {
                                        tokenText = "0";
                                        rgb[ndx] = 0;
                                    }
                                    else if (numberValue > 255)
                                    {
                                        tokenText = "255";
                                        rgb[ndx] = 255;
                                    }
                                    else
                                    {
                                        rgb[ndx] = System.Convert.ToInt32(numberValue);
                                    }
                                }
                                else
                                {
                                    // error -- not even a number. Keep the rgb function
                                    // (and don't change the token)
                                    useRGB = true;
                                }
                            }
                            else
                            {
                                // percentage
                                float percentageValue;
                                if (tokenText.Substring(0, tokenText.Length - 1).TryParseSingleInvariant(out percentageValue))
                                {
                                    percentageValue *= (negateNumber ? -1 : 1);
                                    if (percentageValue < 0)
                                    {
                                        tokenText = "0%";
                                        rgb[ndx] = 0;
                                    }
                                    else if (percentageValue > 100)
                                    {
                                        tokenText = "100%";
                                        rgb[ndx] = 255;
                                    }
                                    else
                                    {
                                        rgb[ndx] = System.Convert.ToInt32(percentageValue * 255 / 100);
                                    }
                                }
                                else
                                {
                                    // error -- not even a number. Keep the rgb function
                                    // (and don't change the token)
                                    useRGB = true;
                                }
                            }
                        }

                        // add the number to the rgb string builder
                        sbRGB.Append(tokenText);

                        // skip to the next significant
                        comments = NextSignificantToken();
                        if (comments.Length > 0)
                        {
                            // add the comments
                            sbRGB.Append(comments);
                            // and signal that we need to use the RGB function because of them
                            useRGB = true;
                        }
                    }

                    if (useRGB)
                    {
                        // something prevented us from collapsing the rgb function
                        // just output the rgb function we've been building up
                        Append(sbRGB.ToString());
                    }
                    else
                    {
                        // we can collapse it to either #rrggbb or #rgb
                        // calculate the full hex string and crunch it
                        var fullCode = "#{0:x2}{1:x2}{2:x2}".FormatInvariant(rgb[0], rgb[1], rgb[2]);
                        var hexString = CrunchHexColor(fullCode, Settings.ColorNames, m_noColorAbbreviation);
                        Append(hexString);

                        // set the flag so we know we don't want to add the closing paren
                        crunchedRGB = true;
                    }
                }
                finally
                {
                    sbRGB.Release();
                }

                if (CurrentTokenType == TokenType.Character && CurrentTokenText == ")")
                {
                    if (!crunchedRGB)
                    {
                        AppendCurrent();
                    }

                    SkipSpace();
                    parsed = Parsed.True;
                }
                else
                {
                    ReportError(0, CssErrorCode.ExpectedClosingParenthesis, CurrentTokenText);
                }
            }

            return parsed;
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Globalization", "CA1308:NormalizeStringsToUppercase", Justification = "we want lower-case output")]
        private Parsed ParseExpressionFunction()
        {
            var parsed = Parsed.False;
            if (CurrentTokenType == TokenType.Function
                && string.Compare(CurrentTokenText, "expression(", StringComparison.OrdinalIgnoreCase) == 0)
            {
                Append(CurrentTokenText.ToLowerInvariant());
                NextToken();

                // for now, just echo out everything up to the matching closing paren, 
                // taking into account that there will probably be other nested paren pairs. 
                // The content of the expression is JavaScript, so we'd really
                // need a full-blown JS-parser to crunch it properly. Kinda scary.
                // Start the parenLevel at 0 because the "expression(" token contains the first paren.
                string expressionCode = null;
                var jsBuilder = StringBuilderPool.Acquire();
                try
                {
                    int parenLevel = 0;

                    while (!m_scanner.EndOfFile
                      && (CurrentTokenType != TokenType.Character
                        || CurrentTokenText != ")"
                        || parenLevel > 0))
                    {
                        if (CurrentTokenType == TokenType.Function)
                        {
                            // the function token INCLUDES the opening parenthesis,
                            // so up the paren level whenever we find a function.
                            // AND this includes the actual expression( token -- so we'll
                            // hit this branch at the beginning. Make sure the parenLevel
                            // is initialized to take that into account
                            ++parenLevel;
                        }
                        else if (CurrentTokenType == TokenType.Character)
                        {
                            switch (CurrentTokenText)
                            {
                                case "(":
                                    // start a nested paren
                                    ++parenLevel;
                                    break;

                                case ")":
                                    // end a nested paren 
                                    // (we know it's nested because if it wasn't, we wouldn't
                                    // have entered the loop)
                                    --parenLevel;
                                    break;
                            }
                        }
                        jsBuilder.Append(CurrentTokenText);
                        NextToken();
                    }

                    // create a JSParser object with the source we found, crunch it, and send 
                    // the minified script to the output
                    expressionCode = jsBuilder.ToString();
                }
                finally
                {
                    jsBuilder.Release();
                }

                if (Settings.MinifyExpressions)
                {
                    // we want to minify the javascript expressions
                    JSParser jsParser = new JSParser();

                    // hook the error handler and set the "contains errors" flag to false.
                    // the handler will set the value to true if it encounters any errors
                    var containsErrors = false;
                    jsParser.CompilerError += (sender, ea) =>
                    {
                        ReportError(0, CssErrorCode.ExpressionError, ea.Error.Message);
                        containsErrors = true;
                    };

                    // parse the source as an expression using our common JS settings
                    var block = jsParser.Parse(new DocumentContext(expressionCode) { FileContext = this.FileContext }, m_jsSettings);

                    // if we got back a parsed block and there were no errors, output the minified code.
                    // if we didn't get back the block, or if there were any errors at all, just output
                    // the raw expression source.
                    if (block != null && !containsErrors)
                    {
                        Append(OutputVisitor.Apply(block, jsParser.Settings));
                    }
                    else
                    {
                        Append(expressionCode);
                    }
                }
                else
                {
                    // we don't want to minify expression code for some reason.
                    // just output the code exactly as we parsed it
                    Append(expressionCode);
                }

                if (CurrentTokenType == TokenType.Character && CurrentTokenText == ")")
                {
                    AppendCurrent();
                    SkipSpace();
                    parsed = Parsed.True;
                }
                else
                {
                    ReportError(0, CssErrorCode.ExpectedClosingParenthesis, CurrentTokenText);
                }
            }

            return parsed;
        }

        private Parsed ParseHexcolor()
        {
            Parsed parsed = Parsed.False;

            if (CurrentTokenType == TokenType.Hash)
            {
                var colorHash = CurrentTokenText;
                var appendEscapedTab = false;

                // valid hash colors are #rgb, #rrggbb, and #aarrggbb.
                // but there is a commonly-used IE hack that puts \9 at the end of properties, so
                // if we have 5, 8, or 10 characters, let's first check to see if the color
                // ends in a tab.
                if ((colorHash.Length == 5 || colorHash.Length == 8 || colorHash.Length == 10)
                    && colorHash.EndsWith("\t", StringComparison.Ordinal))
                {
                    // it is -- strip that last character and set a flag
                    colorHash = colorHash.Substring(0, colorHash.Length - 1);
                    appendEscapedTab = true;
                }

                if (colorHash.Length == 4 || colorHash.Length == 7 || colorHash.Length == 9)
                {
                    parsed = Parsed.True;

                    // we won't do any conversion on the #aarrggbb formats to make them smaller.
                    string hexColor = CrunchHexColor(colorHash, Settings.ColorNames, m_noColorAbbreviation);
                    Append(hexColor);

                    if (appendEscapedTab)
                    {
                        Append("\\9");
                    }

                    SkipSpace();
                }
            }
            return parsed;
        }

        private Parsed ParseUnit()
        {
            var parsed = Parsed.Empty;

            // optional sign
            if (CurrentTokenType == TokenType.Character
                && (CurrentTokenText == "+" || CurrentTokenText == "-"))
            {
                AppendCurrent();
                NextToken();

                // set the parsed flag to false -- if we don't get a valid token
                // next and set it to true, then we know we had an error
                parsed = Parsed.False;
            }

            // followed by a number, a percentage, a dimension, a min(, a max(, or a parenthesized sum
            switch (CurrentTokenType)
            {
                case TokenType.Number:
                case TokenType.Percentage:
                case TokenType.Dimension:
                case TokenType.RelativeLength:
                case TokenType.AbsoluteLength:
                case TokenType.Angle:
                case TokenType.Time:
                case TokenType.Resolution:
                case TokenType.Frequency:
                    // output it, skip any whitespace, and mark us as okay
                    AppendCurrent();
                    SkipSpace();
                    parsed = Parsed.True;
                    break;

                case TokenType.Function:
                    // calc( or attr( are allowed here.
                    parsed = ParseFunction();

                    // if parsed is false, then we encountered an error with the function
                    // and probably already output an error message. So only output an error
                    // message if we didn't find ANYTHING
                    if (parsed == Parsed.Empty)
                    {
                        ReportError(0, CssErrorCode.UnexpectedFunction, CurrentTokenText);
                        parsed = Parsed.False;
                    }
                    break;

                case TokenType.Character:
                    // only open parenthesis allowed
                    if (CurrentTokenText == "(")
                    {
                        // TODO: make sure there is whitespace before the ( if it would cause
                        // it to be the opening paren of a function token

                        AppendCurrent();
                        SkipSpace();

                        // better be a sum inside the parens
                        parsed = ParseSum();
                        if (parsed != Parsed.True)
                        {
                            // report error and change the parsed flag to false so we know there was an error
                            ReportError(0, CssErrorCode.ExpectedSum, CurrentTokenText);
                            parsed = Parsed.False;
                        }
                        else if (CurrentTokenType != TokenType.Character || CurrentTokenText != ")")
                        {
                            // needs to be a closing paren here
                            ReportError(0, CssErrorCode.ExpectedClosingParenthesis, CurrentTokenText);
                            parsed = Parsed.False;
                        }
                        else
                        {
                            // we're at the closing paren, so output it now, advance past any
                            // subsequent whitespace, and mark us as okay
                            AppendCurrent();
                            SkipSpace();
                            parsed = Parsed.True;
                        }
                    }
                    break;
            }

            return parsed;
        }

        private Parsed ParseProduct()
        {
            // there needs to be at least one unit here
            var parsed = ParseUnit();
            if (parsed == Parsed.True)
            {
                // keep going while we have product operators
                // "mod" isn't a final operator, but it was in earlier drafts so keep allowing it.
                while ((CurrentTokenType == TokenType.Character && (CurrentTokenText == "*" || CurrentTokenText == "/"))
                    || (CurrentTokenType == TokenType.Identifier && string.Compare(CurrentTokenText, "mod", StringComparison.OrdinalIgnoreCase) == 0))
                {
                    if (CurrentTokenText == "*" || CurrentTokenText == "/")
                    {
                        // multiplication and dicision operators don't need spaces around them
                        // UNLESS we are outputting multi-line mode
                        if (Settings.OutputMode == OutputMode.MultipleLines)
                        {
                            Append(' ');
                        }

                        AppendCurrent();
                        if (Settings.OutputMode == OutputMode.MultipleLines)
                        {
                            Append(' ');
                        }
                    }
                    else
                    {
                        // the mod-operator usually needs space around it.
                        // and keep it lower-case.
                        Append(" mod ");
                    }

                    // skip any whitespace
                    SkipSpace();

                    // grab the next unit -- and there better be one
                    // technically the candidate spec says / can only be followed by NUMBER, not a UNIT, but
                    // let's let this slide and just parse a unit for both.
                    parsed = ParseUnit();
                    if (parsed != Parsed.True)
                    {
                        ReportError(0, CssErrorCode.ExpectedUnit, CurrentTokenText);
                        parsed = Parsed.False;
                    }
                }
            }
            else
            {
                // report an error and make sure we return false
                ReportError(0, CssErrorCode.ExpectedUnit, CurrentTokenText);
                parsed = Parsed.False;
            }

            return parsed;
        }

        private Parsed ParseSum()
        {
            // there needs to be at least one product here
            var parsed = ParseProduct();
            if (parsed == Parsed.True)
            {
                // keep going while we have sum operators
                while (CurrentTokenType == TokenType.Character && (CurrentTokenText == "+" || CurrentTokenText == "-"))
                {
                    // plus and minus operators need space around them.
                    Append(' ');
                    AppendCurrent();

                    // plus and minus operators both need spaces after them.
                    // the minus needs to not be an identifier.
                    Append(' ');

                    SkipSpace();

                    // grab the next product -- and there better be one
                    parsed = ParseProduct();
                    if (parsed != Parsed.True)
                    {
                        ReportError(0, CssErrorCode.ExpectedProduct, CurrentTokenText);
                        parsed = Parsed.False;
                    }
                }
            }
            else
            {
                // report an error and make sure we return false
                ReportError(0, CssErrorCode.ExpectedProduct, CurrentTokenText);
                parsed = Parsed.False;
            }

            return parsed;
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Globalization", "CA1308:NormalizeStringsToUppercase", Justification="we want lower-case output")]
        private Parsed ParseMinMax()
        {
            // return false if the function isn't min or max
            Parsed parsed = Parsed.False;
            if (CurrentTokenType == TokenType.Function
                && (string.Compare(CurrentTokenText, "min(", StringComparison.OrdinalIgnoreCase) == 0
                || string.Compare(CurrentTokenText, "max(", StringComparison.OrdinalIgnoreCase) == 0))
            {
                // output lower-case version and skip any space
                Append(CurrentTokenText.ToLowerInvariant());
                SkipSpace();

                // must be at least one sum
                parsed = ParseSum();

                // comma-delimited sums continue
                while (parsed == Parsed.True
                    && CurrentTokenType == TokenType.Character
                    && CurrentTokenText == ",")
                {
                    AppendCurrent();
                    SkipSpace();

                    parsed = ParseSum();
                }

                // end with the closing paren
                if (CurrentTokenType == TokenType.Character && CurrentTokenText == ")")
                {
                    AppendCurrent();
                    SkipSpace();
                    parsed = Parsed.True;
                }
                else
                {
                    ReportError(0, CssErrorCode.ExpectedClosingParenthesis, CurrentTokenText);
                    parsed = Parsed.False;
                }
            }

            return parsed;
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Globalization", "CA1308:NormalizeStringsToUppercase", Justification = "we want lower-case output")]
        private Parsed ParseCalc()
        {
            var parsed = Parsed.False;
            if (CurrentTokenType == TokenType.Function
                && string.Compare(GetRoot(CurrentTokenText), "calc(", StringComparison.OrdinalIgnoreCase) == 0)
            {
                Append(CurrentTokenText.ToLowerInvariant());
                SkipSpace();

                // contains one sum
                if (ParseSum() != Parsed.True)
                {
                    ReportError(0, CssErrorCode.ExpectedSum, CurrentTokenText);
                }

                if (CurrentTokenType == TokenType.Character && CurrentTokenText == ")")
                {
                    AppendCurrent();
                    SkipSpace();
                    parsed = Parsed.True;
                }
                else
                {
                    ReportError(0, CssErrorCode.ExpectedClosingParenthesis, CurrentTokenText);
                }
            }

            return parsed;
        }

        #endregion

        #region Next... methods

        // skip to the next token, but output any comments we may find as we go along
        private TokenType NextToken()
        {
            m_currentToken = m_scanner.NextToken();
            if (EchoWriter != null)
            {
                EchoWriter.Write(CurrentTokenText);
            }

            m_encounteredNewLine = m_scanner.GotEndOfLine;
            while (CurrentTokenType == TokenType.Comment)
            {
                // the append statement might not actually append anything.
                // if it doesn't, we don't need to output a newline
                if (AppendCurrent())
                {
                    NewLine();
                }
                m_currentToken = m_scanner.NextToken();
                if (EchoWriter != null)
                {
                    EchoWriter.Write(CurrentTokenText);
                }

                m_encounteredNewLine = m_encounteredNewLine || m_scanner.GotEndOfLine;
            }
            return CurrentTokenType;
        }

        // just skip to the next token; don't skip over comments
        private TokenType NextRawToken()
        {
            m_currentToken = m_scanner.NextToken();
            if (EchoWriter != null)
            {
                EchoWriter.Write(CurrentTokenText);
            }

            m_encounteredNewLine = m_scanner.GotEndOfLine;
            return CurrentTokenType;
        }

        private string NextSignificantToken()
        {
            // MOST of the time we won't need to save anything,
            // so don't bother allocating a string builder unless we need it
            string text = null;
            StringBuilder sb = null;
            try
            {
                // get the next token
                m_currentToken = m_scanner.NextToken();
                if (EchoWriter != null)
                {
                    EchoWriter.Write(CurrentTokenText);
                }

                m_encounteredNewLine = m_scanner.GotEndOfLine;
                while (CurrentTokenType == TokenType.Space || CurrentTokenType == TokenType.Comment)
                {
                    // if this token is a comment, add it to the builder
                    if (CurrentTokenType == TokenType.Comment)
                    {
                        // check for important comment
                        string commentText = CurrentTokenText;
                        bool importantComment = commentText.StartsWith("/*!", StringComparison.Ordinal);
                        if (importantComment)
                        {
                            // get rid of the exclamation mark in some situations
                            commentText = NormalizeImportantComment(commentText);
                        }

                        // if the comment mode is none, don't ever output it.
                        // if the comment mode is all, always output it.
                        // otherwise only output it if it is an important comment.
                        bool writeComment = Settings.CommentMode == CssComment.All
                            || (importantComment && Settings.CommentMode != CssComment.None);

                        if (!importantComment)
                        {
                            if (s_sharepointReplacement.IsMatch(commentText))
                            {
                                // we ALWAYS want to output sharepoint styling comments
                                // (unless settings say NO comments)
                                writeComment = Settings.CommentMode != CssComment.None;
                            }
                            else
                            {
                                // see if this is a value-replacement id
                                Match match = s_valueReplacement.Match(commentText);
                                if (match.Success)
                                {
                                    // check all the resource strings objects to see if one is a match.
                                    m_valueReplacement = null;

                                    var resourceList = Settings.ResourceStrings;
                                    if (resourceList.Count > 0)
                                    {
                                        // get the id of the string we want to substitute
                                        string ident = match.Result("${id}");

                                        // walk the list BACKWARDS so later resource string objects override previous ones
                                        for (var ndx = resourceList.Count - 1; ndx >= 0; --ndx)
                                        {
                                            m_valueReplacement = resourceList[ndx][ident];
                                            if (m_valueReplacement != null)
                                            {
                                                break;
                                            }
                                        }
                                    }

                                    // if there is such a string, we will have saved the value in the value replacement
                                    // variable so it will be substituted for the next value.
                                    // if there is no such string, we ALWAYS want to output the comment so we know 
                                    // there was a problem (even if the comments mode is to output none)
                                    writeComment = m_valueReplacement == null;
                                    if (writeComment)
                                    {
                                        // make sure the comment is normalized
                                        commentText = NormalizedValueReplacementComment(commentText);
                                    }
                                }
                            }
                        }

                        if (writeComment)
                        {
                            // if we haven't yet allocated a string builder, do it now
                            if (sb == null)
                            {
                                sb = StringBuilderPool.Acquire();
                            }

                            // add the comment to the builder
                            sb.Append(commentText);
                        }
                    }

                    // next token
                    m_currentToken = m_scanner.NextToken();
                    if (EchoWriter != null)
                    {
                        EchoWriter.Write(CurrentTokenText);
                    }

                    m_encounteredNewLine = m_encounteredNewLine || m_scanner.GotEndOfLine;
                }

                text = sb == null ? string.Empty : sb.ToString();
            }
            finally
            {
                sb.Release();
            }

            // return any comments we found in the mean time
            return text;
        }

        private void UpdateIfReplacementToken()
        {
            m_currentToken = m_scanner.ScanReplacementToken() ?? m_currentToken;
        }

        #endregion

        #region Skip... methods

        /// <summary>
        /// This method advances to the next token FIRST -- effectively skipping the current one -- 
        /// and then skips any space tokens that FOLLOW it.
        /// </summary>
        private void SkipSpace()
        {
            // reset the skipped-space flag
            m_skippedSpace = false;

            // move to the next token
            NextToken();

            // we need to collate this flag for this method call
            var encounteredNewLine = m_encounteredNewLine;

            // while space, keep stepping
            while (CurrentTokenType == TokenType.Space)
            {
                m_skippedSpace = true;
                NextToken();
                encounteredNewLine = encounteredNewLine || m_encounteredNewLine;
            }

            m_encounteredNewLine = encounteredNewLine;
        }

        private void SkipSpaceComment()
        {
            // reset the skipped-space flag
            m_skippedSpace = false;

            // move to the next token
            if (NextRawToken() == TokenType.Space)
            {
                // starts with whitespace! If the next token is a comment, we want to make sure that
                // whitespace is preserved. Keep going until we find something that isn't a space
                m_skippedSpace = true;
                var encounteredNewLine = m_encounteredNewLine;
                while (NextRawToken() == TokenType.Space)
                {
                    // iteration is in the condition
                    encounteredNewLine = encounteredNewLine || m_encounteredNewLine;
                }

                // now, if the first thing after space is a comment....
                if (CurrentTokenType == TokenType.Comment)
                {
                    // preserve the space character IF we're going to keep the comment.
                    // SO, if the comment mode is ALL, or if this is an important comment,
                    // (if the comment mode is hacks, then this comment will probably have already
                    // been changed into an important comment), then we output the space
                    // and the comment (don't bother outputting the comment if we already know we
                    // aren't going to)
                    if (Settings.CommentMode == CssComment.All
                        || CurrentTokenText.StartsWith("/*!", StringComparison.Ordinal))
                    {
                        Append(' ');

                        // output the comment
                        AppendCurrent();
                    }

                    // and do normal skip-space logic
                    SkipSpace();
                    encounteredNewLine = encounteredNewLine || m_encounteredNewLine;
                }

                m_encounteredNewLine = encounteredNewLine;
            }
            else if (CurrentTokenType == TokenType.Comment)
            {
                // doesn't start with whitespace.
                // append the comment and then do the normal skip-space logic
                var encounteredNewLine = m_encounteredNewLine;
                AppendCurrent();
                SkipSpace();
                m_encounteredNewLine = m_encounteredNewLine || encounteredNewLine;
            }
        }

        /// <summary>
        /// This method only skips the space that is already the current token.
        /// </summary>
        /// <returns>true if space was skipped; false if the current token is not space</returns>
        private bool SkipIfSpace()
        {
            // reset the skipped-space flag
            m_skippedSpace = false;

            bool tokenIsSpace = CurrentTokenType == TokenType.Space;
            var encounteredNewLine = m_encounteredNewLine;
            // while space, keep stepping
            while (CurrentTokenType == TokenType.Space)
            {
                m_skippedSpace = true;
                NextToken();
                encounteredNewLine = encounteredNewLine || m_encounteredNewLine;
            }

            m_encounteredNewLine = encounteredNewLine;
            return tokenIsSpace;
        }

        private void SkipToEndOfStatement()
        {
            bool possibleSpace = false;
            // skip to next semicolon or next block
            // AND honor opening/closing pairs of (), [], and {}
            while (!m_scanner.EndOfFile
                && (CurrentTokenType != TokenType.Character || CurrentTokenText != ";"))
            {
                // if the token is one of the characters we need to match closing characters...
                if (CurrentTokenType == TokenType.Character
                    && (CurrentTokenText == "(" || CurrentTokenText == "[" || CurrentTokenText == "{"))
                {
                    // see if this is this a block -- if so, we'll bail when we're done
                    bool isBlock = (CurrentTokenText == "{");

                    SkipToClose();

                    // if that was a block, bail now
                    if (isBlock)
                    {
                        return;
                    }
                    possibleSpace = false;
                }
                if (CurrentTokenType == TokenType.Space)
                {
                    possibleSpace = true;
                }
                else
                {
                    if (possibleSpace && NeedsSpaceBefore(CurrentTokenText)
                        && NeedsSpaceAfter(m_lastOutputString))
                    {
                        Append(' ');
                    }
                    AppendCurrent();
                    possibleSpace = false;
                }
                NextToken();
            }
        }

        private void SkipToEndOfDeclaration()
        {
            bool possibleSpace = false;
            // skip to end of declaration: ; or }
            // BUT honor opening/closing pairs of (), [], and {}
            while (!m_scanner.EndOfFile
                && (CurrentTokenType != TokenType.Character
                  || (CurrentTokenText != ";" && CurrentTokenText != "}")))
            {
                // if the token is one of the characters we need to match closing characters...
                if (CurrentTokenType == TokenType.Character
                    && (CurrentTokenText == "(" || CurrentTokenText == "[" || CurrentTokenText == "{"))
                {
                    if (possibleSpace)
                    {
                        Append(' ');
                    }

                    SkipToClose();
                    possibleSpace = false;
                }

                if (CurrentTokenType == TokenType.Space)
                {
                    possibleSpace = true;
                }
                else
                {
                    if (possibleSpace && NeedsSpaceBefore(CurrentTokenText)
                        && NeedsSpaceAfter(m_lastOutputString))
                    {
                        Append(' ');
                    }

                    AppendCurrent();
                    possibleSpace = false;
                }

                m_skippedSpace = false;
                NextToken();
                if (CurrentTokenType == TokenType.Space)
                {
                    m_skippedSpace = true;
                }
            }

            // make sure we reset this flag
            m_noOutput = false;
        }

        private void SkipToClose()
        {
            bool possibleSpace = false;
            string closingText;
            switch (CurrentTokenText)
            {
                case "(":
                    closingText = ")";
                    break;

                case "[":
                    closingText = "]";
                    break;

                case "{":
                    closingText = "}";
                    break;

                default:
                    throw new ArgumentException("invalid closing match");
            }

            if (m_skippedSpace && CurrentTokenText != "{")
            {
                Append(' ');
            }

            AppendCurrent();

            m_skippedSpace = false;
            NextToken();
            if (CurrentTokenType == TokenType.Space)
            {
                m_skippedSpace = true;
            }

            while (!m_scanner.EndOfFile
                && (CurrentTokenType != TokenType.Character || CurrentTokenText != closingText))
            {
                // if the token is one of the characters we need to match closing characters...
                if (CurrentTokenType == TokenType.Character
                    && (CurrentTokenText == "(" || CurrentTokenText == "[" || CurrentTokenText == "{"))
                {
                    SkipToClose();
                    possibleSpace = false;
                }

                if (CurrentTokenType == TokenType.Space)
                {
                    possibleSpace = true;
                }
                else
                {
                    if (possibleSpace && NeedsSpaceBefore(CurrentTokenText)
                        && NeedsSpaceAfter(m_lastOutputString))
                    {
                        Append(' ');
                    }

                    AppendCurrent();
                    possibleSpace = false;
                }

                m_skippedSpace = false;
                NextToken();
                if (CurrentTokenType == TokenType.Space)
                {
                    m_skippedSpace = true;
                }
            }
        }

        private void SkipSemicolons()
        {
            while (CurrentTokenType == TokenType.Character && CurrentTokenText == ";")
            {
                NextToken();
            }
        }

        private static bool NeedsSpaceBefore(string text)
        {
            return text == null ? false : !("{}()[],;".Contains(text));
        }

        private static bool NeedsSpaceAfter(string text)
        {
            return text == null ? false : !("{}()[],;:".Contains(text));
        }

        #endregion

        #region output methods

        private bool AppendCurrent()
        {
            return Append(
                CurrentTokenText, 
                CurrentTokenType);
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1502:AvoidExcessiveComplexity"),
         System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1505:AvoidUnmaintainableCode"),
         System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Globalization", "CA1308:NormalizeStringsToUppercase")]
        private bool Append(object obj, TokenType tokenType)
        {
            bool outputText = false;
            bool textEndsInEscapeSequence = false;

            // if the no-output flag is true, don't output anything
            // or process value replacement comments
            if (!m_noOutput)
            {
                var parsed = m_builders.Peek();
                var text = obj.ToString();

                // first if there are replacement tokens in the settings, then we'll want to
                // replace any tokens with the appropriate replacement values
                if (Settings.ReplacementTokens.Count > 0)
                {
                    text = CommonData.ReplacementToken.Replace(text, GetReplacementValue);
                }

                if (tokenType == TokenType.Identifier || tokenType == TokenType.Dimension)
                {
                    // need to make sure invalid identifier characters are properly escaped
                    StringBuilder escapedBuilder = null;
                    try
                    {
                        var startIndex = 0;
                        var protectNextHexCharacter = false;
                        var firstIndex = 0;

                        // if the token type is an identifier, we need to make sure the first character
                        // is a proper identifier start, or is escaped. But if it's a dimension, the first
                        // character will be a numeric digit -- which wouldn't be a valid identifier. So
                        // for dimensions, skip the first character -- subsequent numeric characters will
                        // be okay.
                        if (tokenType == TokenType.Identifier)
                        {
                            // for identifiers, if the first character is a hyphen or an underscore, then it's a prefix
                            // and we want to look at the next character for nmstart.
                            firstIndex = text[0] == '_' || text[0] == '-' ? 1 : 0;
                            if (firstIndex < text.Length)
                            {
                                // the only valid non-escaped first characters are A-Z (and a-z)
                                var firstChar = text[firstIndex];

                                // anything at or above 0x80 is okay for identifiers
                                if (firstChar < 0x80)
                                {
                                    // if it's not an a-z or A-Z, we want to escape it
                                    // also leave literal back-slashes as-is, too. The identifier might start with an escape
                                    // sequence that we didn't decode to its Unicode character for whatever reason.
                                    if ((firstChar < 'A' || 'Z' < firstChar)
                                        && (firstChar < 'a' || 'z' < firstChar)
                                        && firstChar != '\\')
                                    {
                                        // invalid first character -- create the string builder
                                        escapedBuilder = StringBuilderPool.Acquire();

                                        // if we had a prefix, output it
                                        if (firstIndex > 0)
                                        {
                                            escapedBuilder.Append(text[0]);
                                        }

                                        // output the escaped first character
                                        protectNextHexCharacter = EscapeCharacter(escapedBuilder, text[firstIndex]);
                                        textEndsInEscapeSequence = true;
                                        startIndex = firstIndex + 1;
                                    }
                                }
                            }
                        }
                        else
                        {
                            // for dimensions, we want to skip over the numeric part. So any sign, then decimal
                            // digits, then a decimal point (period), then decimal digits. The rest will be the identifier
                            // part that we want to escape.
                            if (text[0] == '+' || text[0] == '-')
                            {
                                ++firstIndex;
                            }

                            while ('0' <= text[firstIndex] && text[firstIndex] <= '9')
                            {
                                ++firstIndex;
                            }

                            if (text[firstIndex] == '.')
                            {
                                ++firstIndex;
                            }

                            while ('0' <= text[firstIndex] && text[firstIndex] <= '9')
                            {
                                ++firstIndex;
                            }

                            // since we start at the first character AFTER firstIndex, subtract
                            // one so we get back to the first character that isn't a part of
                            // the number portion
                            --firstIndex;
                        }

                        // loop through remaining characters, escaping any invalid nmchar characters
                        for (var ndx = firstIndex + 1; ndx < text.Length; ++ndx)
                        {
                            char nextChar = text[ndx];

                            // anything at or above 0x80, then it's okay and doesnt need to be escaped
                            if (nextChar < 0x80)
                            {
                                // only -, _, 0-9, a-z, A-Z are allowed without escapes
                                // but we also want to NOT escape \ or space characters. If the identifier had
                                // an escaped space character, it will still be escaped -- so any spaces would
                                // be necessary whitespace for the end of unicode escapes.
                                if (nextChar == '\\')
                                {
                                    // escape characters cause the next character -- no matter what it is -- to
                                    // be part of the escape and not escaped itself. Even if this is part of a
                                    // unicode or character escape, this will hold true. Increment the index and
                                    // loop around again so that we skip over both the backslash and the following
                                    // character.
                                    ++ndx;
                                }
                                else if (nextChar != '-'
                                    && nextChar != '_'
                                    && nextChar != ' '
                                    && ('0' > nextChar || nextChar > '9')
                                    && ('a' > nextChar || nextChar > 'z')
                                    && ('A' > nextChar || nextChar > 'Z'))
                                {
                                    // need to escape this character -- create the builder if we haven't already
                                    if (escapedBuilder == null)
                                    {
                                        escapedBuilder = StringBuilderPool.Acquire();
                                    }

                                    // output any okay characters we have so far
                                    if (startIndex < ndx)
                                    {
                                        // if the first character of the unescaped string is a valid hex digit,
                                        // then we need to add a space so that characer doesn't get parsed as a
                                        // digit in the previous escaped sequence.
                                        // and if the first character is a space, we need to protect it from the
                                        // previous escaped sequence with another space, too.
                                        string unescapedSubstring = text.Substring(startIndex, ndx - startIndex);
                                        if ((protectNextHexCharacter && CssScanner.IsH(unescapedSubstring[0]))
                                            || (textEndsInEscapeSequence && unescapedSubstring[0] == ' '))
                                        {
                                            escapedBuilder.Append(' ');
                                        }

                                        escapedBuilder.Append(unescapedSubstring);
                                    }

                                    // output the escape sequence for the current character
                                    protectNextHexCharacter = EscapeCharacter(escapedBuilder, text[ndx]);
                                    textEndsInEscapeSequence = true;

                                    // update the start pointer to the next character
                                    startIndex = ndx + 1;
                                }
                            }
                        }

                        // if we escaped anything, get the text from what we built
                        if (escapedBuilder != null)
                        {
                            // append whatever is left over
                            if (startIndex < text.Length)
                            {
                                // if the first character of the unescaped string is a valid hex digit,
                                // then we need to add a space so that characer doesn't get parsed as a
                                // digit in the previous escaped sequence.
                                // same for spaces! a trailing space will be part of the escape, so if we need
                                // a real space to follow, need to make sure there are TWO.
                                string unescapedSubstring = text.Substring(startIndex);
                                if ((protectNextHexCharacter && CssScanner.IsH(unescapedSubstring[0]))
                                    || unescapedSubstring[0] == ' ')
                                {
                                    escapedBuilder.Append(' ');
                                }

                                escapedBuilder.Append(unescapedSubstring);
                                textEndsInEscapeSequence = false;
                            }

                            // get the full string
                            text = escapedBuilder.ToString();
                        }
                    }
                    finally
                    {
                        escapedBuilder.Release();
                    }
                }
                else if (tokenType == TokenType.String)
                {
                    // we need to make sure that control codes are properly escaped
                    StringBuilder sb = null;
                    try
                    {
                        var startRaw = 0;
                        for (var ndx = 0; ndx < text.Length; ++ndx)
                        {
                            // if it's a control code...
                            var ch = text[ndx];
                            if (ch < ' ')
                            {
                                // if we haven't created our string builder yet, do it now
                                if (sb == null)
                                {
                                    sb = StringBuilderPool.Acquire();
                                }

                                // add the raw text up to but not including the current character.
                                // but only if start raw is BEFORE the current index
                                if (startRaw < ndx)
                                {
                                    sb.Append(text.Substring(startRaw, ndx - startRaw));
                                }

                                // regular unicode escape
                                sb.Append("\\{0:x}".FormatInvariant(char.ConvertToUtf32(text, ndx)));

                                // if the NEXT character (if there is one) is a hex digit, 
                                // we will need to append a space to signify the end of the escape sequence, since this
                                // will never have more than two digits (0 - 1f).
                                if (ndx + 1 < text.Length
                                    && CssScanner.IsH(text[ndx + 1]))
                                {
                                    sb.Append(' ');
                                }

                                // and update the raw pointer to the next character
                                startRaw = ndx + 1;
                            }
                        }

                        // if we have something left over, add the rest now
                        if (sb != null && startRaw < text.Length)
                        {
                            sb.Append(text.Substring(startRaw));
                        }

                        // if we built up a string, use it. Otherwise just use what we have.
                        text = sb == null ? text : sb.ToString();
                    }
                    finally
                    {
                        sb.Release();
                    }
                }
                else if (tokenType == TokenType.Uri && Settings.FixIE8Fonts)
                {
                    // IE8 @font-face directive has an issue with src properties that are URLs ending with .EOT
                    // that don't have any querystring. They end up sending a malformed HTTP request to the server,
                    // which is bad for the server. So we want to automatically fix this for developers: if ANY URL
                    // ends in .EOT without a querystring parameters, just add a question mark in the appropriate 
                    // location. This fixes the IE8 issue.
                    text = s_eotIE8Fix.Replace(text, ".eot?$1");
                }

                // if it's not a comment, we're going to output it.
                // if it is a comment, we're not going to SAY we've output anything,
                // even if we end up outputting the comment
                var isImportant = false;
                outputText = (tokenType != TokenType.Comment);
                if (!outputText)
                {
                    // if the comment mode is none, we never want to output it.
                    // if the comment mode is all, then we always want to output it.
                    // otherwise we only want to output if it's an important /*! */ comment
                    if (text.StartsWith("/*!", StringComparison.Ordinal))
                    {
                        // this is an important comment. We will always output it
                        // UNLESS the comment mode is none. If it IS none, bail now.
                        if (Settings.CommentMode == CssComment.None)
                        {
                            return false;    
                        }

                        // this is an important comment that we always want to output
                        // (after we get rid of the exclamation point in some situations)
                        text = NormalizeImportantComment(text);

                        // find the index of the initial / character
                        var indexSlash = text.IndexOf('/');
                        if (indexSlash > 0)
                        {
                            // it's not the first character!
                            // the only time that should happen is if we put a line-feed in front.
                            // if the string builder is empty, or if the LAST character is a \r or \n,
                            // then trim off everything before that opening slash
                            if (m_outputNewLine)
                            {
                                // trim off everything before it
                                text = text.Substring(indexSlash);
                            }
                        }
                    }
                    else if (s_sharepointReplacement.IsMatch(text))
                    {
                        // if it's a sharepoint replacement comment, then  always output it
                        // (unless settings say NO comments)
                        if (Settings.CommentMode == CssComment.None)
                        {
                            return false;
                        }
                    }
                    else
                    {
                        // not important, and not sharepoint.
                        // check to see if it's a special value-replacement comment
                        Match match = s_valueReplacement.Match(CurrentTokenText);
                        if (match.Success)
                        {
                            m_valueReplacement = null;

                            var resourceList = Settings.ResourceStrings;
                            if (resourceList.Count > 0)
                            {
                                // it is! see if we have a replacement string
                                string id = match.Result("${id}");

                                // if we have resource strings in the settings, check each one for the
                                // id and set the value replacement field to the value.
                                // walk backwards so later objects override earlier ones.
                                for (var ndx = resourceList.Count - 1; ndx >= 0; --ndx)
                                {
                                    m_valueReplacement = resourceList[ndx][id];
                                    if (m_valueReplacement != null)
                                    {
                                        break;
                                    }
                                }
                            }

                            if (m_valueReplacement != null)
                            {
                                // we do. Don't output the comment. Instead, save the value replacement
                                // for the next time we encounter a value
                                return false;
                            }
                            else
                            {
                                // make sure the comment is normalized
                                text = NormalizedValueReplacementComment(text);
                            }
                        }
                        else if (Settings.CommentMode != CssComment.All)
                        {
                            // don't want to output, bail now
                            return false;
                        }
                    }

                    // see if it's still important
                    isImportant = text.StartsWith("/*!", StringComparison.Ordinal);
                }
                else if (m_parsingColorValue
                    && (tokenType == TokenType.Identifier || tokenType == TokenType.ReplacementToken))
                {
                    if (!text.StartsWith("#", StringComparison.Ordinal))
                    {
                        bool nameConvertedToHex = false;
                        string lowerCaseText = text.ToLowerInvariant();
                        string rgbString;

                        switch (Settings.ColorNames)
                        {
                            case CssColor.Hex:
                                // we don't want any color names in our code.
                                // convert ALL known color names to hex, so see if there is a match on
                                // the set containing all the name-to-hex values
                                if (ColorSlice.AllColorNames.TryGetValue(lowerCaseText, out rgbString))
                                {
                                    text = rgbString;
                                    nameConvertedToHex = true;
                                }
                                break;

                            case CssColor.Strict:
                                // we only want strict names in our css.
                                // convert all non-strict name to hex, AND any strict names to hex if the hex is
                                // shorter than the name. So check the set that contains all non-strict name-to-hex
                                // values and all the strict name-to-hex values where hex is shorter than name.
                                if (ColorSlice.StrictHexShorterThanNameAndAllNonStrict.TryGetValue(lowerCaseText, out rgbString))
                                {
                                    text = rgbString;
                                    nameConvertedToHex = true;
                                }
                                break;

                            case CssColor.Major:
                                // we don't care if there are non-strict color name. So check the set that only
                                // contains name-to-hex pairs where the hex is shorter than the name.
                                if (ColorSlice.HexShorterThanName.TryGetValue(lowerCaseText, out rgbString))
                                {
                                    text = rgbString;
                                    nameConvertedToHex = true;
                                }
                                break;

                            case CssColor.NoSwap:
                                // nope; leave it a name and don't swap it with the equivalent hex value
                                break;
                        }

                        // if we didn't convert the color name to hex, let's see if it is a color
                        // name -- if so, we want to make it lower-case for readability. We don't need
                        // to do this check if our color name setting is hex-only, because we would
                        // have already converted the name if we know about it
                        if (Settings.ColorNames != CssColor.Hex && !nameConvertedToHex
                            && ColorSlice.AllColorNames.TryGetValue(lowerCaseText, out rgbString))
                        {
                            // the color exists in the table, so we're pretty sure this is a color.
                            // make sure it's lower case
                            text = lowerCaseText;
                        }
                    }
                    else if (CurrentTokenType == TokenType.ReplacementToken)
                    {
                        // a replacement token is a color hash -- make sure we trim it to #RGB if it matches #RRGGBB
                        text = CrunchHexColor(text, Settings.ColorNames, m_noColorAbbreviation);
                    }
                }

                // if the global might-need-space flag is set and the first character we're going to
                // output if a hex digit or a space, we will need to add a space before our text
                if (m_mightNeedSpace
                    && (CssScanner.IsH(text[0]) || text[0] == ' '))
                {
                    if (m_lineLength >= Settings.LineBreakThreshold)
                    {
                        // we want to add whitespace, but we're over the line-length threshold, so
                        // output a line break instead
                        AddNewLine();
                    }
                    else
                    {
                        // output a space on the same line
                        parsed.Append(' ');
                        ++m_lineLength;
                    }
                }

                if (tokenType == TokenType.Comment && isImportant)
                {
                    // don't bother resetting line length after this because 
                    // we're going to follow the comment with another blank line
                    // and we'll reset the length at that time
                    AddNewLine();
                }

                if (text == " ")
                {
                    // we are asking to output a space character. At this point, if we are
                    // over the line-length threshold, we can substitute a line break for a space.
                    if (m_lineLength >= Settings.LineBreakThreshold)
                    {
                        AddNewLine();
                    }
                    else
                    {
                        // just output a space, and don't change the newline flag
                        parsed.Append(' ');
                        ++m_lineLength;
                    }
                }
                else
                {
                    // normal text
                    // see if we wanted to force a newline
                    if (m_forceNewLine)
                    {
                        // only output a newline if we aren't already on a new line
                        // AND we are in multiple-line mode
                        if (!m_outputNewLine && Settings.OutputMode == OutputMode.MultipleLines)
                        {
                            AddNewLine();
                        }
                        
                        // reset the flag
                        m_forceNewLine = false;
                    }

                    parsed.Append(text);
                    m_outputNewLine = false;

                    if (tokenType == TokenType.Comment && isImportant)
                    {
                        AddNewLine();
                        m_lineLength = 0;
                        m_outputNewLine = true;
                    }
                    else
                    {
                        m_lineLength += text.Length;
                    }
                }

                // if the text we just output ENDS in an escape, we might need a space later
                m_mightNeedSpace = textEndsInEscapeSequence;

                // save a copy of the string so we can check the last output
                // string later if we need to
                m_lastOutputString = text;
            }

            return outputText;
        }

        private string GetReplacementValue(Match match)
        {
            string tokenValue = null;
            var tokenName = match.Result("${token}");
            if (!tokenName.IsNullOrWhiteSpace())
            {
                if (!Settings.ReplacementTokens.TryGetValue(tokenName, out tokenValue))
                {
                    // no match. Check for a fallback
                    var fallbackClass = match.Result("${fallback}");
                    if (!fallbackClass.IsNullOrWhiteSpace())
                    {
                        Settings.ReplacementFallbacks.TryGetValue(fallbackClass, out tokenValue);
                    }
                }
            }

            // if we found a replacement, use it. Otherwise use a blank string to remove the token
            return tokenValue.IfNullOrWhiteSpace(string.Empty);
        }

        private static bool EscapeCharacter(StringBuilder sb, char character)
        {
            // output the hex value of the escaped character. If it's less than seven digits
            // (the slash followed by six hex digits), we might
            // need to append a space before the next valid character if it is a valid hex digit.
            // (we will always need to append another space after an escape sequence if the next valid character is a space)
            var hex = "\\{0:x}".FormatInvariant((int)character);
            sb.Append(hex);
            return hex.Length < 7;
        }

        private bool Append(object obj)
        {
            return Append(obj, TokenType.None);
        }

        private void NewLine()
        {
            // if we've output something other than a newline, output one now
            if (Settings.OutputMode == OutputMode.MultipleLines && !m_outputNewLine)
            {
                AddNewLine();
                m_lineLength = 0;
                m_outputNewLine = true;
            }
        }

        /// <summary>
        /// Always add new line to the stream
        /// </summary>
        /// <param name="sb"></param>
        private void AddNewLine()
        {
            if (!m_outputNewLine)
            {
                var parsed = m_builders.Peek();
                if (Settings.OutputMode == OutputMode.MultipleLines)
                {
                    parsed.AppendLine();

                    var indentSpaces = Settings.TabSpaces;
                    m_lineLength = indentSpaces.Length;
                    if (m_lineLength > 0)
                    {
                        parsed.Append(indentSpaces);
                    }
                }
                else
                {
                    parsed.Append('\n');
                    m_lineLength = 0;
                }

                m_outputNewLine = true;
            }
        }

        private void Indent()
        {
            // increase the indent level by one
            Settings.Indent();
        }

        private void Unindent()
        {
            // only decrease the indent level by one IF it's greater than zero
            Settings.Unindent();
        }

        #endregion

        #region color methods

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Globalization", "CA1308:NormalizeStringsToUppercase")]
        private static string CrunchHexColor(string hexColor, CssColor colorNames, bool noAbbr)
        {
            if (!noAbbr)
            {
                hexColor = s_rrggbb.Replace(hexColor, "#${r}${g}${b}").ToLowerInvariant();
            }

            if (colorNames == CssColor.Strict || colorNames == CssColor.Major)
            {
                // check for the hex values that can be swapped with the W3C color names to save bytes?
                //      #808080 - gray
                //      #008000 - green
                //      #800000 - maroon
                //      #000080 - navy
                //      #808000 - olive
                //      #ffa500 - orange
                //      #800080 - purple
                //      #f00    - red
                //      #c0c0c0 - silver
                //      #008080 - teal
                // (these are the only colors we can use and still validate)
                // if we don't care about validating, there are even more colors that work in all
                // major browsers that would save up some bytes. But if we convert to those names,
                // we'd really need to be able to convert back to make it validate again.
                //
                // if the map contains an entry for this color, then we
                // should use the name instead because it's smaller.
                string colorName;
                if (ColorSlice.StrictNameShorterThanHex.TryGetValue(hexColor, out colorName))
                {
                    hexColor = colorName;
                }
                else if (colorNames == CssColor.Major)
                {
                    if (ColorSlice.NameShorterThanHex.TryGetValue(hexColor, out colorName))
                    {
                        hexColor = colorName;
                    }
                }
            }

            return hexColor;
        }

        private static bool MightContainColorNames(string propertyName)
        {
            bool hasColor = (propertyName.EndsWith("color", StringComparison.Ordinal));
            if (!hasColor)
            {
                switch (propertyName)
                {
                    case "background":
                    case "border-top":
                    case "border-right":
                    case "border-bottom":
                    case "border-left":
                    case "border":
                    case "outline":
                        hasColor = true;
                        break;
                }
            }
            return hasColor;
        }

        #endregion

        #region Error methods

        public static string ErrorFormat(CssErrorCode errorCode)
        {
            return CssStrings.ResourceManager.GetString(errorCode.ToString(), CssStrings.Culture);
        }

        private void ReportError(int severity, CssErrorCode errorNumber, CssContext context, params object[] arguments)
        {
            // guide: 0 == syntax error
            //        1 == the programmer probably did not intend to do this
            //        2 == this can lead to problems in the future.
            //        3 == this can lead to performance problems
            //        4 == this is just not right

            string message = ErrorFormat(errorNumber).FormatInvariant(arguments);
            Debug.Assert(!message.IsNullOrWhiteSpace());
            var error = new ContextError()
                {
                    IsError = severity < 2,
                    Severity = severity,
                    Subcategory = ContextError.GetSubcategory(severity),
                    File = FileContext,
                    ErrorNumber = (int)errorNumber,
                    ErrorCode = "CSS{0}".FormatInvariant(((int)errorNumber) & (0xffff)),
                    Message = message,
                };

            if (context != null)
            {
                error.StartLine = context.Start.Line;
                error.StartColumn = context.Start.Char;
            }

            // but warnings we want to just report and carry on
            OnCssError(error);
        }

        // just use the current context for the error
        private void ReportError(int severity, CssErrorCode errorNumber, params object[] arguments)
        {
            ReportError(severity, errorNumber, m_currentToken != null ? m_currentToken.Context : null, arguments);
        }

        public event EventHandler<ContextErrorEventArgs> CssError;

        protected void OnCssError(ContextError cssError)
        {
            if (CssError != null && cssError != null && !Settings.IgnoreAllErrors)
            {
                // if we have no errors in our error ignore list, or if we do but this error code is not in
                // that list, fire the event to whomever is listening for it.
                if (!Settings.IgnoreErrorCollection.Contains(cssError.ErrorCode))
                {
                    CssError(this, new ContextErrorEventArgs()
                        {
                            Error = cssError
                        });
                }
            }
        }

        #endregion

        #region comment methods

        /// <summary>
        /// regular expression for matching newline characters
        /// </summary>
        ////private static Regex s_regexNewlines = new Regex(
        ////    @"\r\n|\f|\r|\n",
        ////    RegexOptions.CultureInvariant | RegexOptions.Singleline | RegexOptions.Compiled);

        static string NormalizedValueReplacementComment(string source)
        {
            return s_valueReplacement.Replace(source, "/*[${id}]*/");
        }

        static bool CommentContainsText(string comment)
        {
            for (var ndx = 0; ndx < comment.Length; ++ndx)
            {
                if (char.IsLetterOrDigit(comment[ndx]))
                {
                    return true;
                }
            }

            // if we get here, we didn't find any text characters
            return false;
        }

        string NormalizeImportantComment(string source)
        {
            // if this important comment does not contain any text, assume it's for a comment hack
            // and return a normalized string without the exclamation mark.
            if (CommentContainsText(source))
            {
                // first check to see if the comment is in the form /*!/ ...text... /**/
                // if so, then it's probably a part of the Opera5&NS4-only comment hack and we want
                // to make SURE that exclamation point does not get in the output because it would
                // mess up the results.
                if (source[3] == '/' && source.EndsWith("/**/", StringComparison.Ordinal))
                {
                    // it is. output the comment as-is EXCEPT without the exclamation mark
                    // (and don't put any line-feeds around it)
                    source = "/*" + source.Substring(3);
                }
            }
            else
            {
                // important comment, but it doesn't contain text. So instead, leave it inline
                // (don't add a newline character before it) but take out the exclamation mark.
                source = "/*" + source.Substring(3);
            }

            // if this is single-line mode, make sure CRLF-pairs are all converted to just CR
            if (Settings.OutputMode == OutputMode.SingleLine)
            {
                source = source.Replace("\r\n", "\n");
            }
            return source;
        }
        #endregion

        #region private enums

        private enum Parsed
        {
            True,
            False,
            Empty
        }

        #endregion
    }
}