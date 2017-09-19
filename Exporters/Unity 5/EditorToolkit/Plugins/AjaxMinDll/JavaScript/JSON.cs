// JSON.cs
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

using System.ComponentModel;
using System.Text;

namespace Microsoft.Ajax.Utilities
{
    /// <summary>
    /// super-simple JSON parser/validator. Exposes a Validate method
    /// that takes a string and returns NULL if it isn't valid JSON, or
    /// a string representing the original JSON text with any whitespace
    /// removed.
    /// </summary>
    public class JSON
    {
        private string m_jsonText;
        private int m_currentIndex;
        private StringBuilder m_builder;

        private bool IsAtEnd
        {
            get
            {
                return SkipSpace() == '\0';
            }
        }

        private char Current
        {
            get
            {
                return m_currentIndex < m_jsonText.Length ? m_jsonText[m_currentIndex] : '\0';
            }
        }

        private string Minified
        {
            get
            {
                return m_builder.ToString();
            }
        }

        private JSON(string jsonText)
        {
            m_jsonText = jsonText;
            m_currentIndex = 0;
            m_builder = new StringBuilder(8192);
        }

        /// <summary>
        /// Validate the given JSON string
        /// </summary>
        /// <param name="jsonText">JSON string to validate</param>
        /// <returns>null if not valid JSON; otherwise the original JSON text with whitespace removed</returns>
        public static string Validate(string jsonText)
        {
            var jsonValidator = new JSON(jsonText);
            return jsonValidator.IsValidValue() && jsonValidator.IsAtEnd ? jsonValidator.Minified : null;
        }

        private bool IsValidValue()
        {
            var isValid = false;
            switch (SkipSpace())
            {
                case '"':
                    isValid = IsValidString();
                    break;

                case '-':
                case '0':
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9':
                    isValid = IsValidNumber();
                    break;

                case '[':
                    isValid = IsValidArray();
                    break;

                case 'f':
                    isValid = IsFollowedBy("alse");
                    break;

                case 'n':
                    isValid = IsFollowedBy("ull");
                    break;

                case 't':
                    isValid = IsFollowedBy("rue");
                    break;

                case '{':
                    isValid = IsValidObject();
                    break;
            }

            return isValid;
        }

        [Localizable(false)]
        private bool IsFollowedBy(string text)
        {
            for (var ndx = 0; ndx < text.Length; ++ndx)
            {
                if (Peek(ndx + 1) != text[ndx])
                {
                    // nope
                    return false;
                }
            }

            // add the literal to the string builder
            var length = text.Length + 1;
            m_builder.Append(m_jsonText, m_currentIndex, length);

            // if we got here, we found the proper text, so advance to
            // current position and return true
            m_currentIndex += length;
            return true;
        }

        private bool IsValidNumber()
        {
            var isValid = false;

            // skip the optional negative sign
            var start = m_currentIndex;
            var ch = Current;
            if (ch == '-')
            {
                ch = Next();
            }

            // must be a digit next
            if ('0' <= ch && ch <= '9')
            {
                // from here on, assume that we are valid unless proven otherwise
                isValid = true;

                // integer part
                if (ch == '0')
                {
                    // zero can't be followed by any other digits
                    if ('0' <= (ch = Next()) && ch <= '9')
                    {
                        isValid = false;
                    }
                }
                else
                {
                    // any digit but zero can be followed by other digits
                    while ('0' <= (ch = Next()) && ch <= '9') ;
                }

                // optional fractional part
                if (isValid && ch == '.')
                {
                    // decimal point MUST be followed by at least one digit
                    ch = Next();
                    if ('0' <= ch && ch <= '9')
                    {
                        // any number of digits can follow
                        while ('0' <= (ch = Next()) && ch <= '9') ;
                    }
                    else
                    {
                        isValid = false;
                    }
                }

                // optional exponent part
                if (isValid && ch == 'e' || ch == 'E')
                {
                    ch = Next();

                    // optional sign
                    if (ch == '-' || ch == '+')
                    {
                        ch = Next();
                    }

                    // exponent MUST have at least one digit
                    if ('0' <= ch && ch <= '9')
                    {
                        // any number of digits can follow
                        while ('0' <= (ch = Next()) && ch <= '9') ;
                    }
                    else
                    {
                        isValid = false;
                    }
                }
            }

            m_builder.Append(m_jsonText, start, m_currentIndex - start);
            return isValid;
        }

        private bool IsValidString()
        {
            // skip past opening delimiter
            var start = m_currentIndex;
            var ch = Next();

            // loop until we get the closing delimiter or the end of the string
            while (ch != '\0' && ch != '"')
            {
                // escape sequence?
                if (ch == '\\')
                {
                    // if these are valid single-character escapes, then keep going
                    ch = Next();
                    if (ch != '"' && ch != '/' && ch != '\\' && ch != 'b' && ch != 'f' && ch != 'n' && ch != 'r' && ch != 't')
                    {
                        // unicode escape?
                        if (ch == 'u')
                        {
                            // must be followed by exactly four hex digits to be valid
                            for (var ndx = 0; ndx < 4; ++ndx)
                            {
                                ch = Next();
                                if (!('0' <= ch && ch <= '9') && !('A' <= ch && ch <= 'F') && !('a' <= ch && ch <= 'f'))
                                {
                                    // fail
                                    return false;
                                }
                            }
                        }
                        else
                        {
                            // anything else is a fail and we can stop
                            return false;
                        }
                    }
                }

                ch = Next();
            }

            // better be the closing delimiter
            if (ch != '"')
            {
                return false;
            }

            // we're good
            Next();
            m_builder.Append(m_jsonText, start, m_currentIndex - start);
            return true;
        }

        private bool IsValidArray()
        {
            // skip past the opening delimiter
            Next();
            m_builder.Append('[');
            if (SkipSpace() != ']')
            {
                if (!IsValidValue())
                {
                    return false;
                }

                // commas mean more values
                while (SkipSpace() == ',')
                {
                    m_builder.Append(',');
                    Next();
                    if (!IsValidValue())
                    {
                        return false;
                    }
                }
            }

            // better be the closing delimiter now
            if (SkipSpace() != ']')
            {
                return false;
            }

            // we're good
            Next();
            m_builder.Append(']');
            return true;
        }

        private bool IsValidObject()
        {
            // skip past opening delimiter
            Next();
            m_builder.Append('{');
            if (SkipSpace() != '}')
            {
                if (!IsValidProperty())
                {
                    return false;
                }

                while (SkipSpace() == ',')
                {
                    Next();
                    SkipSpace();
                    m_builder.Append(',');
                    if (!IsValidProperty())
                    {
                        return false;
                    }
                }
            }

            // better be the closing delimiter now
            if (SkipSpace() != '}')
            {
                return false;
            }

            Next();
            m_builder.Append('}');
            return true;
        }

        private bool IsValidProperty()
        {
            // property name is always a string
            if (!IsValidString())
            {
                return false;
            }

            // which is always followed by a colon
            if (SkipSpace() != ':')
            {
                return false;
            }

            // which is always followed by a value
            Next();
            m_builder.Append(':');
            if (!IsValidValue())
            {
                return false;
            }

            // good to go!
            return true;
        }

        #region character methods

        private char Peek(int offset = 0)
        {
            var index = m_currentIndex + offset;
            return index < m_jsonText.Length ? m_jsonText[m_currentIndex + offset] : '\0';
        }

        private char Next()
        {
            return ++m_currentIndex < m_jsonText.Length ? m_jsonText[m_currentIndex] : '\0';
        }

        private char SkipSpace()
        {
            var ch = Current;
            while (ch == '\t' || ch == '\n' || ch == '\r' || ch == ' ')
            {
                ch = Next();
            }

            return ch;
        }

        #endregion
    }
}
