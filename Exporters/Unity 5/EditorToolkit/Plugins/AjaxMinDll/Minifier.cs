// Minifier.cs
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
using System.IO;
using System.Text;

namespace Microsoft.Ajax.Utilities
{
    /// <summary>
    /// Minifier class for quick minification of JavaScript or Stylesheet code without needing to
    /// access or modify any abstract syntax tree nodes. Just put in source code and get our minified
    /// code as strings.
    /// </summary>
    public class Minifier
    {
        #region Properties

        /// <summary>
        /// Warning level threshold for reporting errors.
        /// Default value is zero: syntax/run-time errors.
        /// </summary>
        public int WarningLevel
        {
            get; set;
        }

        /// <summary>
        /// File name to use in error reporting.
        /// Default value is null: use Minify... method name.
        /// </summary>
        public string FileName
        {
            get; set;
        }

        /// <summary>
        /// Collection of ContextError objects found during minification process
        /// </summary>
        public ICollection<ContextError> ErrorList { get { return m_errorList; } }
        private List<ContextError> m_errorList; // = null;

        /// <summary>
        /// Collection of any error strings found during the crunch process.
        /// </summary>
        public ICollection<string> Errors
        {
            get 
            { 
                var errorList = new List<string>(ErrorList.Count);
                foreach (var error in ErrorList)
                {
                    errorList.Add(error.ToString());
                }
                return errorList;
            }
        }

        #endregion

        #region JavaScript methods

        /// <summary>
        /// MinifyJavaScript JS string passed to it using default code minification settings.
        /// The ErrorList property will be set with any errors found during the minification process.
        /// </summary>
        /// <param name="source">source Javascript</param>
        /// <returns>minified Javascript</returns>
        public string MinifyJavaScript(string source)
        {
            // just pass in default settings
            return MinifyJavaScript(source, new CodeSettings());
        }

        /// <summary>
        /// Crunched JS string passed to it, returning crunched string.
        /// The ErrorList property will be set with any errors found during the minification process.
        /// </summary>
        /// <param name="source">source Javascript</param>
        /// <param name="codeSettings">code minification settings</param>
        /// <returns>minified Javascript</returns>
        public string MinifyJavaScript(string source, CodeSettings codeSettings)
        {
            // default is an empty string
            var crunched = string.Empty;

            // reset the errors builder
            m_errorList = new List<ContextError>();

            // create the parser and hook the engine error event
            var parser = new JSParser();
            parser.CompilerError += OnJavaScriptError;

            var sb = StringBuilderPool.Acquire();
            try
            {
                var preprocessOnly = codeSettings != null && codeSettings.PreprocessOnly;
                using (var stringWriter = new StringWriter(sb, CultureInfo.InvariantCulture))
                {
                    if (preprocessOnly)
                    {
                        parser.EchoWriter = stringWriter;
                    }

                    // parse the input
                    var scriptBlock = parser.Parse(new DocumentContext(source) { FileContext = this.FileName }, codeSettings);
                    if (scriptBlock != null && !preprocessOnly)
                    {
                        // we'll return the crunched code
                        if (codeSettings != null && codeSettings.Format == JavaScriptFormat.JSON)
                        {
                            // we're going to use a different output visitor -- one
                            // that specifically returns valid JSON.
                            if (!JSONOutputVisitor.Apply(stringWriter, scriptBlock, codeSettings))
                            {
                                m_errorList.Add(new ContextError()
                                    {
                                        Severity = 0,
                                        File = this.FileName,
                                        Message = CommonStrings.InvalidJSONOutput,
                                    });
                            }
                        }
                        else
                        {
                            // just use the normal output visitor
                            OutputVisitor.Apply(stringWriter, scriptBlock, codeSettings);

                            // if we are asking for a symbols map, give it a chance to output a little something
                            // to the minified file.
                            if (codeSettings != null && codeSettings.SymbolsMap != null)
                            {
                                codeSettings.SymbolsMap.EndFile(stringWriter, codeSettings.LineTerminator);
                            }
                        }
                    }
                }

                crunched = sb.ToString();
            }
            catch (Exception e)
            {
                m_errorList.Add(new ContextError()
                    {
                        Severity = 0,
                        File = this.FileName,
                        Message = e.Message,
                    });
                throw;
            }
            finally
            {
                sb.Release();
            }

            return crunched;
        }

        #endregion

        #region CSS methods

#if !JSONLY
        /// <summary>
        /// MinifyJavaScript CSS string passed to it using default code minification settings.
        /// The ErrorList property will be set with any errors found during the minification process.
        /// </summary>
        /// <param name="source">source Javascript</param>
        /// <returns>minified Javascript</returns>
        public string MinifyStyleSheet(string source)
        {
            // just pass in default settings
            return MinifyStyleSheet(source, new CssSettings(), new CodeSettings());
        }

        /// <summary>
        /// Minifies the CSS stylesheet passes to it using the given settings, returning the minified results
        /// The ErrorList property will be set with any errors found during the minification process.
        /// </summary>
        /// <param name="source">CSS Source</param>
        /// <param name="settings">CSS minification settings</param>
        /// <returns>Minified StyleSheet</returns>
        public string MinifyStyleSheet(string source, CssSettings settings)
        {
            // just pass in default settings
            return MinifyStyleSheet(source, settings, new CodeSettings());
        }

        /// <summary>
        /// Minifies the CSS stylesheet passes to it using the given settings, returning the minified results
        /// The ErrorList property will be set with any errors found during the minification process.
        /// </summary>
        /// <param name="source">CSS Source</param>
        /// <param name="settings">CSS minification settings</param>
        /// <param name="scriptSettings">JS minification settings to use for expression-minification</param>
        /// <returns>Minified StyleSheet</returns>
        public string MinifyStyleSheet(string source, CssSettings settings, CodeSettings scriptSettings)
        {
            // initialize some values, including the error list (which shoudl start off empty)
            string minifiedResults = string.Empty;
            m_errorList = new List<ContextError>();

            // create the parser object and if we specified some settings,
            // use it to set the Parser's settings object
            CssParser parser = new CssParser();
            parser.FileContext = FileName;

            if (settings != null)
            {
                parser.Settings = settings;
            }

            if (scriptSettings != null)
            {
                parser.JSSettings = scriptSettings;
            }

            // hook the error handler
            parser.CssError += new EventHandler<ContextErrorEventArgs>(OnCssError);

            // try parsing the source and return the results
            try
            {
                minifiedResults = parser.Parse(source);
            }
            catch (Exception e)
            {
                m_errorList.Add(new ContextError()
                    {
                        Severity = 0,
                        File = this.FileName,
                        Message = e.Message,
                    });
                throw;
            }
            return minifiedResults;
        }
#endif
        #endregion

        #region Error-handling Members

#if !JSONLY
        private void OnCssError(object sender, ContextErrorEventArgs e)
        {
            var error = e.Error;
            if (error.Severity <= WarningLevel)
            {
                m_errorList.Add(error);
            }
        }
#endif

        private void OnJavaScriptError(object sender, ContextErrorEventArgs e)
        {
            var error = e.Error;
            if (error.Severity <= WarningLevel)
            {
                m_errorList.Add(error);
            }
        }

        #endregion
    }
}