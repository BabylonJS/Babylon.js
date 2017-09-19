// ContextError.cs
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
using System.ComponentModel;
using System.Text;

namespace Microsoft.Ajax.Utilities
{
    public class ContextError
    {
        public int ErrorNumber { get; set; }

        // error information properties
        public string File { get; set; }

        public virtual int Severity { get; set; }

        public virtual string Subcategory { get; set; }

        [Localizable(false)]
        public virtual string ErrorCode { get; set; }

        public virtual int StartLine { get; set; }

        public virtual int StartColumn { get; set; }

        public virtual int EndLine { get; set; }

        public virtual int EndColumn { get; set; }

        public virtual string Message { get; set; }

        public virtual bool IsError { get; set; }

        public string HelpKeyword { get; set; }

        /// <summary>
        /// Convert the exception to a VisualStudio format error message
        /// file(startline[-endline]?,startcol[-endcol]?):[ subcategory] category [errorcode]: message
        /// </summary>
        /// <returns></returns>
        public override string ToString()
        {
            var sb = StringBuilderPool.Acquire();
            try
            {
                if (!string.IsNullOrEmpty(File))
                {
                    sb.Append(File);
                }

                // if there is a startline, then there must be a location.
                // no start line, then no location
                if (StartLine > 0)
                {
                    // we will always at least start with the start line
                    sb.AppendFormat("({0}", StartLine);

                    if (EndLine > StartLine)
                    {
                        if (StartColumn > 0 && EndColumn > 0)
                        {
                            // all four values were specified
                            sb.AppendFormat(",{0},{1},{2}", StartColumn, EndLine, EndColumn);
                        }
                        else
                        {
                            // one or both of the columns wasn't specified, so ignore them both
                            sb.AppendFormat("-{0}", EndLine);
                        }
                    }
                    else if (StartColumn > 0)
                    {
                        sb.AppendFormat(",{0}", StartColumn);
                        if (EndColumn > StartColumn)
                        {
                            sb.AppendFormat("-{0}", EndColumn);
                        }
                    }

                    sb.Append(')');
                }

                // seaprate the location from the error description
                sb.Append(':');

                // if there is a subcategory, add it prefaced with a space
                if (!string.IsNullOrEmpty(Subcategory))
                {
                    sb.Append(' ');
                    sb.Append(Subcategory);
                }

                // not localizable
                sb.Append(IsError ? " error " : " warning ");

                // if there is an error code
                if (!string.IsNullOrEmpty(ErrorCode))
                {
                    sb.Append(ErrorCode);
                }

                // separate description from the message
                sb.Append(": ");

                if (!string.IsNullOrEmpty(Message))
                {
                    sb.Append(Message);
                }

                return sb.ToString();
            }
            finally
            {
                sb.Release();
            }
        }

        internal static string GetSubcategory(int severity)
        {
            // guide: 0 == there will be a run-time error if this code executes
            //        1 == the programmer probably did not intend to do this
            //        2 == this can lead to problems in the future.
            //        3 == this can lead to performance problems
            //        4 == this is just not right
            switch (severity)
            {
                case 0:
                    return CommonStrings.Severity0;

                case 1:
                    return CommonStrings.Severity1;

                case 2:
                    return CommonStrings.Severity2;

                case 3:
                    return CommonStrings.Severity3;

                case 4:
                    return CommonStrings.Severity4;

                default:
                    return CommonStrings.SeverityUnknown.FormatInvariant(severity);
            }
        }
    }

    public class ContextErrorEventArgs : EventArgs
    {
        public ContextError Error { get; set; }

        public ContextErrorEventArgs()
        {
        }
    }
}
