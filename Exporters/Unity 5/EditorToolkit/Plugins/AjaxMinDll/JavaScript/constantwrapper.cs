// constantwrapper.cs
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
using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace Microsoft.Ajax.Utilities
{
    /// <summary>
    /// Array of strings which can be converted to string using a single allocation and single copy
    /// </summary>
    public class StringList
    {
        private string[] m_strings;

        private void Add(StringList source, ref int pos)
        {
            for (var i = 0; i < source.m_strings.Length; i ++)
            {
                m_strings[pos++] = source.m_strings[i];
            }
        }

        public StringList(object left, object right)
        {
            var list1 = left  as StringList;
            var list2 = right as StringList;

            var len = 1;

            if (list1 != null)
            {
                len = list1.m_strings.Length;
            }
            
            if (list2 != null)
            {
                len += list2.m_strings.Length;
            }
            else
            {
                len++;
            }

            m_strings = new string[len];

            len = 0;

            if (list1 != null)
            {
                Add(list1, ref len);
            }
            else if (left != null)
            {
                m_strings[len++] = left.ToString();
            }

            if (list2 != null)
            {
                Add(list2, ref len);
            }
            else if (right != null)
            {
                m_strings[len++] = right.ToString();
            }
        }

        public override string ToString()
        {
            return String.Concat(m_strings);
        }
    }

    public class ConstantWrapper : Expression
    {
        // this is a regular expression that we'll use to strip a leading "0x" from
        // a string if we are trying to parse it into a number. also removes the leading
        // and trailing spaces, while we're at it.
        // will also capture a sign if it's present. Strictly speaking, that's not allowed
        // here, but some browsers (Firefox, Opera, Chrome) will parse it. IE and Safari
        // will not. So if we match that sign, we are in a cross-browser gray area.
        private static Regex s_hexNumberFormat = new Regex(
            @"^\s*(?<sign>[-+])?0X(?<hex>[0-9a-f]+)\s*$",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);

        // used to detect possible ASP.NET substitutions in a string
        private static Regex s_aspNetSubstitution = new Regex(
            @"\<%.*%\>",
            RegexOptions.CultureInvariant | RegexOptions.Compiled);

        public bool MayHaveIssues { get; set; }

        public Object Value { get; set; }

        public PrimitiveType PrimitiveType
        {
            get;
            set;
        }

        public override bool IsConstant
        {
            get
            {
                // this is a constant
                return true;
            }
        }

        public bool IsNumericLiteral
        {
            get
            {
                return PrimitiveType == PrimitiveType.Number;
            }
        }

        public bool IsFiniteNumericLiteral
        {
            get
            {
                // numeric literal, but not NaN, +Infinity, or -Infinity
                return IsNumericLiteral
                    ? !double.IsNaN((double)Value) && !double.IsInfinity((double)Value)
                    : false;
            }
        }

        public bool IsIntegerLiteral
        {
            get
            {
                try
                {
                    // numeric literal, but not NaN, +Infinity, or -Infinity; and no decimal portion 
                    return IsFiniteNumericLiteral ? (ToInteger() == (double)Value) : false;
                }
                catch (InvalidCastException)
                {
                    // couldn't convert to a number, so we are not an integer literal
                    // (at least, not a *cross-browser* integer literal)
                    return false;
                }
            }
        }

        public bool IsExactInteger
        {
            get
            {
                // first off, it has to BE an integer value.
                // and then it has to be within the range of -2^53 and +2^53 EXCLUSIVE. Every integer in that range can
                // be EXACTLY represented in a 64-bit IEEE double value. Outside that range and the source characters
                // may not be exactly what we would get if we turn this value to a string because the gap between
                // consecutive available numbers is larger than one.
                return IsIntegerLiteral && Math.Abs((double)Value) <= 0x1FFFFFFFFFFFFF;
            }
        }

        public bool IsNaN
        {
            get
            {
                return IsNumericLiteral && double.IsNaN((double)Value);
            }
        }

        public bool IsInfinity
        {
            get
            {
                return IsNumericLiteral && double.IsInfinity((double)Value);
            }
        }

        public bool IsZero
        {
            get
            {
                return IsNumericLiteral && ((double)Value == 0);
            }
        }

        public bool IsBooleanLiteral
        {
            get
            {
                return PrimitiveType == PrimitiveType.Boolean;
            }
        }

        public bool IsStringLiteral
        {
            get
            {
                return PrimitiveType == PrimitiveType.String;
            }
        }

        public bool IsParameterToRegExp { get; set; }

        public bool IsSpecialNumeric
        {
            get
            {
                bool isSpecialNumeric = false;
                if (IsNumericLiteral)
                {
                    double doubleValue = (double)Value;
                    isSpecialNumeric = (double.IsNaN(doubleValue) || double.IsInfinity(doubleValue));
                }
                return isSpecialNumeric;
            }
        }

        public bool IsOtherDecimal
        {
            get
            {
                return PrimitiveType == PrimitiveType.Other
                    && Value != null
                    && IsOnlyDecimalDigits(Value.ToString());
            }
        }

        public bool StringContainsAspNetReplacement
        {
            get
            {
                return IsStringLiteral && s_aspNetSubstitution.IsMatch((string)Value);
            }
        }

        public ConstantWrapper(Object value, PrimitiveType primitiveType, Context context)
            : base(context)
        {
            PrimitiveType = primitiveType;

            // force numerics to be of type double
            Value = (primitiveType == PrimitiveType.Number ? System.Convert.ToDouble(value, CultureInfo.InvariantCulture) : value);
        }

        public override bool IsEquivalentTo(AstNode otherNode)
        {
            var otherConstant = otherNode as ConstantWrapper;
            if (otherConstant != null && PrimitiveType == otherConstant.PrimitiveType)
            {
                switch (PrimitiveType)
                {
                    case PrimitiveType.Boolean:
                        // bools must be the same
                        return ToBoolean() == otherConstant.ToBoolean();

                    case PrimitiveType.Null:
                        // nulls are always equivalent
                        return true;

                    case PrimitiveType.Number:
                        // numbers must be equal
                        return ToNumber() == otherConstant.ToNumber();

                    case PrimitiveType.String:
                        // strings must be identical
                        return string.CompareOrdinal(Value.ToString(), otherConstant.ToString()) == 0;

                    case PrimitiveType.Other:
                        // others are never the same
                        return false;
                }
            }

            // if we get here, we're not equivalent
            return false;
        }

        public override PrimitiveType FindPrimitiveType()
        {
            // we know the primitive type of this node
            return PrimitiveType;
        }

        public override void Accept(IVisitor visitor)
        {
            if (visitor != null)
            {
                visitor.Visit(this);
            }
        }

        private static void AddEscape(string unescapedRun, string escapedText, ref StringBuilder sb)
        {
            // if we haven't yet created the string builder, do it now
            if (sb == null)
            {
                sb = StringBuilderPool.Acquire();
            }

            // add the run of unescaped text (if any), followed by the escaped text
            sb.Append(unescapedRun);
            sb.Append(escapedText);
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1502:AvoidExcessiveComplexity", Justification="big switch-case for special characters")]
        public static string EscapeString(string text, bool isRegularExpression, bool useW3Strict, bool useStrict)
        {
            // see which kind of delimiter we need.
            // if it's okay to use double-quotes, use them. Otherwise use single-quotes
            char delimiter = (OkayToDoubleQuote(text) ? '"' : '\'');
            string escapedString;

            // don't create the string builder until we actually need it
            StringBuilder sb = null;
            try
            {
                int startOfStretch = 0;
                if (!string.IsNullOrEmpty(text))
                {
                    for (int ndx = 0; ndx < text.Length; ++ndx)
                    {
                        char c = text[ndx];
                        switch (c)
                        {
                            // explicit escape sequences
                            // if this is for a string parameter to a RegExp object, then we want to use
                            // explicit hex-values, not the escape sequences
                            case '\b':
                                AddEscape(text.Substring(startOfStretch, ndx - startOfStretch), isRegularExpression ? @"\x08" : @"\b", ref sb);
                                startOfStretch = ndx + 1;
                                break;

                            case '\t':
                                AddEscape(text.Substring(startOfStretch, ndx - startOfStretch), isRegularExpression ? @"\x09" : @"\t", ref sb);
                                startOfStretch = ndx + 1;
                                break;

                            case '\n':
                                AddEscape(text.Substring(startOfStretch, ndx - startOfStretch), isRegularExpression ? @"\x0a" : @"\n", ref sb);
                                startOfStretch = ndx + 1;
                                break;

                            case '\v':
                                if (!useW3Strict)
                                {
                                    goto default;
                                }

                                AddEscape(text.Substring(startOfStretch, ndx - startOfStretch), isRegularExpression ? @"\x0b" : @"\v", ref sb);
                                startOfStretch = ndx + 1;
                                break;

                            case '\f':
                                AddEscape(text.Substring(startOfStretch, ndx - startOfStretch), isRegularExpression ? @"\x0c" : @"\f", ref sb);
                                startOfStretch = ndx + 1;
                                break;

                            case '\r':
                                AddEscape(text.Substring(startOfStretch, ndx - startOfStretch), isRegularExpression ? @"\x0d" : @"\r", ref sb);
                                startOfStretch = ndx + 1;
                                break;

                            case '\\':
                                AddEscape(text.Substring(startOfStretch, ndx - startOfStretch), @"\\", ref sb);
                                startOfStretch = ndx + 1;
                                break;

                            case '\'':
                            case '"':
                                // whichever character we're using as the delimiter, we need
                                // to escape inside the string
                                if (delimiter == c)
                                {
                                    AddEscape(text.Substring(startOfStretch, ndx - startOfStretch), "\\", ref sb);
                                    sb.Append(c);
                                    startOfStretch = ndx + 1;
                                }

                                // otherwise, we're going to output the character as-is, so just keep going
                                break;

                            case '\x2028':
                            case '\x2029':
                                // issue #14398 - unescaped, these characters (Unicode LineSeparator and ParagraphSeparator)
                                // would introduce a line-break in the string.  they ALWAYS need to be escaped, 
                                // no matter what output encoding we may use.
                                AddEscape(text.Substring(startOfStretch, ndx - startOfStretch), @"\u", ref sb);
                                sb.Append("{0:x}".FormatInvariant((int)c));
                                startOfStretch = ndx + 1;
                                break;

                            default:
                                if (' ' <= c && c <= 0x7e)
                                {
                                    // regular ascii character
                                    break;
                                }

                                if (c < ' ')
                                {
                                    // ECMA strict mode can't use octal, either
                                    if (isRegularExpression || useStrict)
                                    {
                                        // for regular expression strings, \1 through \9 are always backreferences, 
                                        // and \10 through \40 are backreferences if they correspond to existing 
                                        // backreference groups. So we can't use octal for the characters with values
                                        // between 0 and 31. encode with a hexadecimal escape sequence
                                        AddEscape(text.Substring(startOfStretch, ndx - startOfStretch), "\\x{0:x2}".FormatInvariant((int)c), ref sb);
                                        startOfStretch = ndx + 1;
                                    }
                                    else
                                    {
                                        // we're not a regular expression string. And character with a value between 
                                        // 0 and 31 can be represented in octal with two to three characters (\0 - \37),
                                        // whereas it would always take four characters to do it in hex: \x00 - \x1f.
                                        // so let's go with octal since we aren't in strict mode
                                        AddEscape(text.Substring(startOfStretch, ndx - startOfStretch), "\\", ref sb);
                                        int intValue = (int)c;
                                        if (intValue < 8)
                                        {
                                            // single octal digit
                                            sb.Append(intValue.ToStringInvariant());
                                        }
                                        else
                                        {
                                            // two octal digits
                                            sb.Append((intValue / 8).ToStringInvariant());
                                            sb.Append((intValue % 8).ToStringInvariant());
                                        }

                                        startOfStretch = ndx + 1;
                                    }
                                }

                                break;
                        }
                    }
                }

                if (sb == null || string.IsNullOrEmpty(text))
                {
                    // didn't escape any characters -- can use the string unchanged
                    escapedString = text ?? string.Empty;
                }
                else
                {
                    // escaped characters. If there are still unescaped characters left at the
                    // end of the string, add them to the builder now
                    if (startOfStretch < text.Length)
                    {
                        sb.Append(text.Substring(startOfStretch));
                    }

                    // get the escaped string
                    escapedString = sb.ToString();
                }
            }
            finally
            {
                sb.Release();
            }

            // close the delimiter and return the fully-escaped string
            return delimiter + escapedString + delimiter;
        }

        private static bool OkayToDoubleQuote(string text)
        {
            int numberOfQuotes = 0;
            int numberOfApostrophes = 0;
            for (int ndx = 0; ndx < text.Length; ++ndx)
            {
                switch (text[ndx])
                {
                    case '"': 
                        ++numberOfQuotes; 
                        break;
                    case '\'': 
                        ++numberOfApostrophes; 
                        break;
                }
            }

            return numberOfQuotes <= numberOfApostrophes;
        }

        public double ToNumber()
        {
            switch(PrimitiveType)
            {
                case PrimitiveType.Number:
                    // pass-through the double as-is
                    return (double)Value;

                case PrimitiveType.Null:
                    // converting null to a number returns +0
                    return 0;

                case PrimitiveType.Boolean:
                    // converting boolean to number: true is 1, false is +0
                    return (bool)Value ? 1 : 0;

                case PrimitiveType.Other:
                    // don't convert others to numbers
                    throw new InvalidCastException("Cannot convert 'other' primitives to number");

                default:
                    // otherwise this must be a string
                    try
                    {
                        string stringValue = Value.ToString();
                        if (stringValue == null || string.IsNullOrEmpty(stringValue.Trim()))
                        {
                            // empty string or string of nothing but whitespace returns +0
                            return 0;
                        }

                        // see if this is a hex number representation
                        Match match;
                        if (MayHaveIssues)
                        {
                            throw new InvalidCastException("cross-browser conversion issues");
                        }
                        else if ((match = s_hexNumberFormat.Match(stringValue)).Success)
                        {
                            // if we matched a sign, then we are in a cross-browser gray area.
                            // the ECMA spec says that isn't allowed. IE and Safari correctly return NaN.
                            // But Firefox, Opera, and Chrome will apply the sign to the parsed hex value.
                            if (!string.IsNullOrEmpty(match.Result("${sign}")))
                            {
                                throw new InvalidCastException("Cross-browser error converting signed hex string to number");
                            }

                            // parse the hexadecimal digits portion
                            // can't use NumberStyles.HexNumber in double.Parse, so we need to do the conversion manually
                            double doubleValue = 0;
                            string hexRep = match.Result("${hex}");

                            // loop from the start of the string to the end, converting the hex digits to a binary
                            // value. As soon as we hit an overflow condition, we can bail.
                            for (int ndx = 0; ndx < hexRep.Length && !double.IsInfinity(doubleValue); ++ndx)
                            {
                                // we already know from the regular expression match that the hex rep is ONLY
                                // 0-9, a-f or A-F, so we don't need to test for outside those ranges.
                                char ch = hexRep[ndx];
                                doubleValue = (doubleValue * 16) + (ch <= '9' ? ch & 0xf : (ch & 0xf) + 9);
                            }
                            return doubleValue;
                        }
                        else
                        {
                            // not a hex number -- try doing a regular decimal float conversion
                            return double.Parse(stringValue, NumberStyles.Float, CultureInfo.InvariantCulture);
                        }
                    }
                    catch (FormatException)
                    {
                        // string isn't a number, return NaN
                        return double.NaN;
                    }
                    catch (OverflowException)
                    {
                        // if the string starts with optional white-space followed by a minus sign,
                        // then it's a negative-infinity overflow. Otherwise it's a positive infinity overflow.
                        Regex negativeSign = new Regex(@"^\s*-");
                        return (negativeSign.IsMatch(Value.ToString()))
                            ? double.NegativeInfinity
                            : double.PositiveInfinity;
                    }
            }
        }

        public bool IsOkayToCombine
        {
            get
            {
                // StringList is already combined strings
                if ((PrimitiveType == PrimitiveType.String) && (this.Value is StringList))
                {
                    return true;
                }

                // basically, if it's a real number or an integer not in the range
                // where all integers can be exactly represented by a double,
                // then we don't want to combine them.
                // also, we don't want to combine any strings that contain \v, since
                // IE doesn't implement the ECMAScript standard of \v being the
                // vertical tab character. Cross-browser difference there.
                // and most browsers treat the null character the same, but they don't treat an
                // escaped null character the same, so don't combine if there's a null in the string, either.
                var isOkay = (!IsStringLiteral && !IsNumericLiteral)
                    || (IsNumericLiteral && !MayHaveIssues && NumberIsOkayToCombine((double)Value))
                    || (IsStringLiteral && !MayHaveIssues);

                // broke this out into a separate test because I originally thought I would only do it if the
                // AllowEmbeddedAspNetBlocks switch was set. But I think this is important enough to do all the time.
                if (isOkay && IsStringLiteral && s_aspNetSubstitution.IsMatch((string)Value))
                {
                    // also, if it's a string, check to see if it contains a possible ASP.NET substitution.
                    // if it does, we don't want to combine those, either.
                    isOkay = false;
                }

                return isOkay;
            }
        }

        static public bool NumberIsOkayToCombine(double numericValue)
        {
            return (double.IsNaN(numericValue) || double.IsInfinity(numericValue)) ||
                (-0x20000000000000 <= numericValue && numericValue <= 0x20000000000000
                && Math.Floor(numericValue) == numericValue);
        }

        public bool IsNotOneOrPositiveZero
        {
            get
            {
                // 1 or +0 must be a numeric value
                if (IsNumericLiteral)
                {
                    // get the value as a double
                    double numericValue = (double)Value;

                    // if it's one, or if we are equal to zero but NOT -0,
                    // the we ARE 1 or +0, and we return false
                    if (numericValue == 1
                        || (numericValue == 0 && !IsNegativeZero))
                    {
                        return false;
                    }
                }
                // if we get here, we're NOT 1 or +0
                return true;
            }
        }

        public bool IsNegativeZero
        {
            get
            {
                // must be a numeric value, and +0 and -0 are both equal to zero.
                if (IsNumericLiteral && (double)Value == 0)
                {
                    // division by zero produces positive infinity if +0 and negative inifinity if -0
                    return 1 / ((double)Value) < 0;
                }

                // either not a number, or not zero
                return false;
            }
        }

        internal double ToInteger()
        {
            double value = ToNumber();
            if (double.IsNaN(value))
            {
                // NaN returns +0
                return 0;
            }
            if (value == 0 || double.IsInfinity(value))
            {
                // +0, -0, +Infinity and -Infinity return themselves unchanged
                return value;
            }
            return Math.Sign(value) * Math.Floor(Math.Abs(value));
        }

        internal Int32 ToInt32()
        {
            double value = ToNumber();

            if (Math.Floor(value) != value
                || value < Int32.MinValue || Int32.MaxValue < value)
            {
                // some versions of JavaScript return NaN if the value is not an
                // integer in the signed 32-bit range. Therefore if we aren't an
                // integer value in the proper range, we bail
                throw new InvalidCastException("Not an integer in the appropriate range; cross-browser issue");
            }

            if (value == 0 || double.IsNaN(value) || double.IsInfinity(value))
            {
                // +0, -0, NaN, +Infinity and -Infinity all return +0
                return 0;
            }

            // get the integer value, then MOD it with 2^32 to restrict to an unsigned 32-bit range.
            // and then check that top bit to see if the value should be negative or not;
            // if so, subtract 2^32 to get the negative value.
            long int64bit = (Convert.ToInt64(value) % 0x100000000);
            return Convert.ToInt32(int64bit >= 0x80000000 ? int64bit - 0x100000000 : int64bit);
        }

        internal UInt32 ToUInt32()
        {
            double value = ToNumber();

            if (Math.Floor(value) != value
                || value < UInt32.MinValue || UInt32.MaxValue < value)
            {
                // some versions of JavaScript return NaN if the value is not an
                // integer in the unsigned 32-bit range. Therefore if we aren't an
                // integer value in the proper range, we bail
                throw new InvalidCastException("Not an integer in the appropriate range; cross-browser issue");
            }

            if (value == 0 || double.IsNaN(value) || double.IsInfinity(value))
            {
                // +0, -0, NaN, +Infinity and -Infinity all return +0
                return 0;
            }

            // get the integer value, then MOD it with 2^32 to restrict to an unsigned 32-bit range.
            long int64bit = Convert.ToInt64(value);
            return (UInt32)(int64bit & 0xffffffff);
        }

        public bool ToBoolean()
        {
            switch (PrimitiveType)
            {
                case PrimitiveType.Null:
                    // null converts to false
                    return false;

                case PrimitiveType.Boolean:
                    // boolean is just whatever the value is (cast to bool)
                    return (bool)Value;

                case PrimitiveType.Number:
                    {
                        // numeric: false if zero or NaN; otherwise true
                        double doubleValue = (double)Value;
                        return !(doubleValue == 0 || double.IsNaN(doubleValue));
                    }

                case PrimitiveType.Other:
                    throw new InvalidCastException("Cannot convert 'other' primitive types to boolean");

                default:
                    // string or other: false if empty; otherwise true
                    // (we already know the value is not null)
                    return !string.IsNullOrEmpty(Value.ToString());
            }
        }

        /// <summary>
        /// Optimized string literal concatenation for repeat usage pattern, avoiding multiple copying and allocation
        /// </summary>
        /// <param name="other"></param>
        /// <returns></returns>
        public StringList Concat(ConstantWrapper other)
        {
            var left = this.Value;
            if (this.PrimitiveType != PrimitiveType.String)
            {
                left = this.ToString();
            }

            object right = null;
            if (other != null)
            {
                right = other.Value;
                if (other.PrimitiveType != PrimitiveType.String)
                {
                    right = other.ToString();
                }
            }

            return new StringList(left, right);
        }

        public override string ToString()
        {
            // this function returns the STRING representation
            // of this primitive value -- NOT the same as the CODE representation
            // of this AST node.
            switch (PrimitiveType)
            {
                case PrimitiveType.Null:
                    // null is just "null"
                    return "null";

                case PrimitiveType.Boolean:
                    // boolean is "true" or "false"
                    return (bool)Value ? "true" : "false";

                case PrimitiveType.Number:
                    {
                        // handle some special values, otherwise just fall through
                        // to the default ToString implementation
                        double doubleValue = (double)Value;
                        if (doubleValue == 0)
                        {
                            // both -0 and 0 return "0". Go figure.
                            return "0";
                        }
                        if (double.IsNaN(doubleValue))
                        {
                            return "NaN";
                        }
                        if (double.IsPositiveInfinity(doubleValue))
                        {
                            return "Infinity";
                        }
                        if (double.IsNegativeInfinity(doubleValue))
                        {
                            return "-Infinity";
                        }

                        // use the "R" format, which guarantees that the double value can
                        // be round-tripped to the same value
                        return doubleValue.ToStringInvariant("R");
                    }
            }

            // otherwise this must be a string
            return Value.ToString();
        }

        private static bool IsOnlyDecimalDigits(string text)
        {
            // if text is null, return false. 
            // Otherwise return true if ALL the characters are decimal digits, 
            // or false is ANY ONE character isn't.
            return text.IfNotNull(s => !s.Any(c => !JSScanner.IsDigit(c)));
        }
    }

    public enum PrimitiveType
    {
        Null = 0,
        Boolean,
        Number,
        String,
        Other
    }
}
