// CssSettings.cs
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
    using System.Collections.Generic;

    #region public enums

    /// <summary>
    /// Enumeration for the type of CSS that will be parsed
    /// </summary>
    public enum CssType
    {
        /// <summary>
        /// Default setting: expecting a full CSS stylesheet
        /// </summary>
        FullStyleSheet = 0,

        /// <summary>
        /// Expecting just a declaration list, for instance: the value of an HTML style attribute
        /// </summary>
        DeclarationList,
    }

    public enum CssComment
    {
        /// <summary>
        /// Remove all comments except those marked as important (//! or /*!)
        /// </summary>
        Important = 0,

        /// <summary>
        /// Remove all source comments from the output
        /// </summary>
        None,

        /// <summary>
        /// Keep all source comments in the output
        /// </summary>
        All,

        /// <summary>
        /// Remove all source comments except those for approved comment-based hacks. (See documentation)
        /// </summary>
        Hacks
    }

    /// <summary>
    /// Enumeration for how to treat known color names
    /// </summary>
    public enum CssColor
    {
        /// <summary>
        /// Convert strict names to hex values if shorter; hex values to strict names if shorter. Leave all other
        /// color names or hex values as-specified.
        /// </summary>
        Strict = 0,

        /// <summary>
        /// Always use hex values; do not convert any hex values to color names
        /// </summary>
        Hex,

        /// <summary>
        /// Convert known hex values to major-browser color names if shorter; and known major-browser color
        /// names to hex if shorter.
        /// </summary>
        Major,

        /// <summary>
        /// Don't swap names for hex or hex for names, whether or not one is shorter.
        /// </summary>
        NoSwap,
    }

    #endregion

    /// <summary>
    /// Settings Object for CSS Minifier
    /// </summary>
    public class CssSettings : CommonSettings
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="CssSettings"/> class with default settings.
        /// </summary>
        public CssSettings()
        {
            ColorNames = CssColor.Hex;
            CommentMode = CssComment.Important;
            MinifyExpressions = true;
            CssType = CssType.FullStyleSheet;
            RemoveEmptyBlocks = true;
            FixIE8Fonts = true;
            ExcludeVendorPrefixes = new List<string>();
        }

        public CssSettings Clone()
        {
            // create the new settings object and copy all the properties from
            // the current settings
            var newSettings = new CssSettings()
            {
                AllowEmbeddedAspNetBlocks = this.AllowEmbeddedAspNetBlocks,
                ColorNames = this.ColorNames,
                CommentMode = this.CommentMode,
                FixIE8Fonts = this.FixIE8Fonts,
                IgnoreAllErrors = this.IgnoreAllErrors,
                IgnoreErrorList = this.IgnoreErrorList,
                IndentSize = this.IndentSize,
                KillSwitch = this.KillSwitch,
                LineBreakThreshold = this.LineBreakThreshold,
                MinifyExpressions = this.MinifyExpressions,
                OutputMode = this.OutputMode,
                PreprocessorDefineList = this.PreprocessorDefineList,
                TermSemicolons = this.TermSemicolons,
                CssType = this.CssType,
                BlocksStartOnSameLine = this.BlocksStartOnSameLine,
                RemoveEmptyBlocks = this.RemoveEmptyBlocks,
            };

            // add the resource strings (if any)
            newSettings.AddResourceStrings(this.ResourceStrings);

            foreach (var item in this.ReplacementTokens)
            {
                newSettings.ReplacementTokens.Add(item);
            }

            foreach (var item in this.ReplacementFallbacks)
            {
                newSettings.ReplacementTokens.Add(item);
            }

            foreach (var item in this.ExcludeVendorPrefixes)
            {
                newSettings.ExcludeVendorPrefixes.Add(item);
            }

            return newSettings;
        }

        /// <summary>
        /// Gets or sets ColorNames setting. Default is Strict.
        /// </summary>
        public CssColor ColorNames
        {
            get; set;
        }

        /// <summary>
        /// Gets or sets CommentMode setting. Default is Important.
        /// </summary>
        public CssComment CommentMode
        {
            get; set;
        }

        /// <summary>
        /// Gets or sets a value indicating whether to minify the javascript within expression functions. Deault is true.
        /// </summary>
        public bool MinifyExpressions
        {
            get; set;
        }

        /// <summary>
        /// Gets or sets a value indicating how to treat the input source. Default is FullStyleSheet.
        /// </summary>
        public CssType CssType 
        { 
            get; 
            set; 
        }

        /// <summary>
        /// Gets or sets a value indicating whether empty blocks removes the corresponding rule or directive. Default is true.
        /// </summary>
        public bool RemoveEmptyBlocks
        {
            get;
            set;
        }

        /// <summary>
        /// Gets or sets a value indicating whether IE8 .EOT fonts should get a question-mark appended to the URL
        /// (if not there already) to prevent the browser from generating invalid HTTP requests to the server. Default is true.
        /// </summary>
        public bool FixIE8Fonts
        {
            get;
            set;
        }

        /// <summary>
        /// Gets or sets a list of vendor-specific prefixes ("ms", "webkit", "moz") that will be omitted from the output.
        /// Default is no exclusions.
        /// </summary>
        public IList<string> ExcludeVendorPrefixes
        {
            get;
            private set;
        }
    }
}
