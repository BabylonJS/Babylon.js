// CommonData.cs
//
// Copyright 2013 Microsoft Corporation
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
    using System.Text.RegularExpressions;

    /// <summary>
    /// Helper class to hold common data elements
    /// </summary>
    internal static class CommonData
    {
        /// <summary>
        /// Regular expression to identifier replacement token syntax
        /// </summary>
        private static Regex s_replacementToken;
        public static Regex ReplacementToken
        {
            get
            {
                if (s_replacementToken == null)
                {
                    s_replacementToken = new Regex(
                        @"%(?<token>[\w\.-]+)(?:\:(?<fallback>\w*))?%",
                        RegexOptions.CultureInvariant | RegexOptions.Compiled);
                }

                return s_replacementToken;
            }
        }

        private static Regex s_decimalFormat;
        public static Regex DecimalFormat
        {
            get
            {
                if (s_decimalFormat == null)
                {
                    s_decimalFormat = new Regex(
                        @"^\s*(?:\+|(?<neg>\-))?0*(?<mag>(?<sig>\d*[1-9])(?<zer>0*))?(\.(?<man>\d*[1-9])?0*)?(?<exp>E\+?(?<eng>\-?)0*(?<pow>[1-9]\d*))?$",
                        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);
                }

                return s_decimalFormat;
            }
        }
    }
}
