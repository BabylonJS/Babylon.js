// CssEncoderFallback.cs
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
using System.Text;

namespace Microsoft.Ajax.Utilities
{
    /// <summary>
    /// CssFallback encodes invalid encoder characters as Unicode escapes:
    ///       \123456
    /// up to six hexadecimal characters. If less then six characters, we'll
    /// suffix the encoding with a space character, just un case the next character 
    /// could be mistaken for another hexadecimal digit.
    /// 
    /// To use this class, create an instance of it and set it to the EncoderFallback
    /// property of your Encoding object. You may have to clone the Encoding object
    /// in order to get write access to the EncoderFallback property. 
    /// <example>
    ///     var encoding = (Encoding)Encoding.ASCII.Clone();
    ///     encoding.EncoderFallback = new CssEncoderFallback();
    ///     var bytes = encoding.GetBytes(crunchedCode);
    ///     Console.WriteLine(encoding.GetString(bytes));
    /// </example>
    /// </summary>
    public class CssEncoderFallback : EncoderFallback
    {
        /// <summary>
        /// return a fallback buffer for this encoding fallback
        /// </summary>
        /// <returns></returns>
        public override EncoderFallbackBuffer CreateFallbackBuffer()
        {
            // return our custom buffer
            return new CssEncoderFallbackBuffer();
        }

        /// <summary>
        /// the maximum number of characters we'll expand a single character into
        /// </summary>
        public override int MaxCharCount
        {
            get
            {
                // since the longest format is \123456, the max is 7
                return 7;
            }
        }
    }

    /// <summary>
    /// fallback buffer for encoding unknown characters into CSS Unicode escapes
    /// </summary>
    internal sealed class CssEncoderFallbackBuffer : EncoderFallbackBuffer
    {
        // encoded output string
        private string m_fallbackString;

        // the position of the next character to return
        private int m_position;

        // use this string to encode a character that we just don't know what to do with
        private static readonly string s_giveUpString = CssStrings.UnknownCharacterEncoding;

        /// <summary>
        /// Number of characters remaining in the buffer
        /// </summary>
        public override int Remaining
        {
            get
            {
                // number of characters left is the length minus the position
                return m_fallbackString.Length - m_position;
            }
        }

        public CssEncoderFallbackBuffer()
        {
            // call reset to set initial state
            Reset();
        }

        /// <summary>
        /// Get the single-character encoding string
        /// </summary>
        /// <param name="unknownChar">character to encode</param>
        /// <returns>encoded string</returns>
        private static string GetEncoding(int charValue)
        {
            // first see how many characters the numeric value turns out to be
            string hexValue = "{0:x}".FormatInvariant(charValue);

            // if we're more than six characters, then something is wrong!
            if (hexValue.Length > 6)
            {
                // should we throw an exception?
                // or return an empty string?
                return s_giveUpString;
            }

            // if it's a full six characters, we won't need the trailing space. 
            // Otherwise we might, so we should always add it. We have no way of knowing what
            // the next character will be, so we can't tell if it's 0-9, a-f, or A-F, unfortunately.
            // (and add the leading escape backslash)
            return "\\{0}{1}".FormatInvariant(hexValue, (hexValue.Length < 6 ? " " : string.Empty));
        }

        /// <summary>
        /// Prepare the unknown character for encoding
        /// </summary>
        /// <param name="unknownChar">character to process</param>
        /// <param name="index">position in input string</param>
        /// <returns>true if characters to process placed in buffer</returns>
        public override bool Fallback(char charUnknown, int index)
        {
            // if we're not done with the current buffer, we're being recursive.
            if (m_position < m_fallbackString.Length)
            {
                throw new ArgumentException(CommonStrings.FallbackEncodingFailed);
            }

            // Go ahead and get our fallback
            m_fallbackString = GetEncoding((int)charUnknown);
            m_position = 0;

            // return false if we have no string, indicating we didn't encode it
            return (m_fallbackString.Length > 0);
        }

        /// <summary>
        /// Prepare the unknwon surrogate pair for encoding
        /// </summary>
        /// <param name="unknownCharHigh">high surrogate pair character</param>
        /// <param name="unknownCharLow">low surrogate pair character</param>
        /// <param name="index">index of character in the stream</param>
        /// <returns></returns>
        public override bool Fallback(char charUnknownHigh, char charUnknownLow, int index)
        {
            // if we're not done with the current buffer, we're being recursive.
            if (m_position < m_fallbackString.Length)
            {
                throw new ArgumentException(CommonStrings.FallbackEncodingFailed);
            }

            // de-surrogate the pair into a single value in the range 0x010000 to 0x10ffff
            int unicodeChar = 0x10000
              + ((int)charUnknownHigh - 0xD800) * 0x400
              + ((int)charUnknownLow - 0xDC00);
            // validate the range?

            // get the fallback string
            m_fallbackString = GetEncoding(unicodeChar);
            m_position = 0;

            // return false if we have no string, indicating we didn't encode it
            return (m_fallbackString.Length > 0);
        }

        /// <summary>
        /// return the next character
        /// </summary>
        /// <returns>(char)0 if no character</returns>
        public override char GetNextChar()
        {
            // if the position is at or beyond the number of characters in the buffer,
            // then we're done -- return a null character.
            // otherwise return the next character an increment the position for next time
            return (
              m_position < m_fallbackString.Length
              ? m_fallbackString[m_position++]
              : (char)0
              );
        }

        /// <summary>
        /// back the character position up one character
        /// </summary>
        /// <returns>false if already at front; true otherwise</returns>
        public override bool MovePrevious()
        {
            // we'll return true if we aren't already at the front, false if we are
            bool backedUp = (m_position > 0);
            // if we're not already at the front...
            if (m_position > 0)
            {
                // bakc up one position
                --m_position;
            }
            // return true if we weren't already at the front
            return backedUp;
        }

        /// <summary>
        /// reset the fallback buffer to initial state
        /// </summary>
        public override void Reset()
        {
            // reset our values first, because base.Reset() will call back into our methods
            m_fallbackString = string.Empty;
            m_position = 0;
            // call the base implementation
            base.Reset();
        }

        /// <summary>
        /// Return string representation of this object
        /// </summary>
        /// <returns></returns>
        public override string ToString()
        {
            // just the buffer
            return m_fallbackString;
        }
    }
}
