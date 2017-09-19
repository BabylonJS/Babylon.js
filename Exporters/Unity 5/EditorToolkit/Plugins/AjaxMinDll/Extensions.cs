// Extensions.cs
//
// Copyright 2012 Microsoft Corporation
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

#if NET_20

namespace System.Runtime.CompilerServices
{
    // Summary:
    //     Indicates that a method is an extension method, or that a class or assembly
    //     contains extension methods.
    [AttributeUsage(AttributeTargets.Assembly | AttributeTargets.Class | AttributeTargets.Method)]
    internal sealed class ExtensionAttribute : Attribute
    {
        // Summary:
        //     Initializes a new instance of the System.Runtime.CompilerServices.ExtensionAttribute
        //     class.
        public ExtensionAttribute() { }
    }
}

#endif

namespace Microsoft.Ajax.Utilities
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using System.Text;

    public static class AjaxMinExtensions
    {
        public static string FormatInvariant(this string format, params object[] args)
        {
            try
            {
                return format == null
                    ? string.Empty
                    : string.Format(CultureInfo.InvariantCulture, format, args);
            }
            catch (FormatException)
            {
                return format;
            }
        }

        public static bool TryParseSingleInvariant(this string text, out float number)
        {
            try
            {
                number = System.Convert.ToSingle(text, CultureInfo.InvariantCulture);
                return true;
            }
            catch (FormatException)
            {
                number = float.NaN;
                return false;
            }
            catch (OverflowException)
            {
                number = float.NaN;
                return false;
            }
        }

        public static bool TryParseIntInvariant(this string text, NumberStyles numberStyles, out int number)
        {
            number = default(int);
            return text == null ? false : int.TryParse(text, numberStyles, CultureInfo.InvariantCulture, out number);
        }

        public static bool TryParseLongInvariant(this string text, NumberStyles numberStyles, out long number)
        {
            number = default(long);
            return text == null ? false : long.TryParse(text, numberStyles, CultureInfo.InvariantCulture, out number);
        }

        public static bool IsNullOrWhiteSpace(this string text)
        {
#if NET_20 || NET_35
            return string.IsNullOrEmpty(text) || text.Trim().Length == 0;
#else
            return string.IsNullOrWhiteSpace(text);
#endif
        }

        public static string IfNullOrWhiteSpace(this string text, string defaultValue)
        {
#if NET_20 || NET_35
            return string.IsNullOrEmpty(text) || text.Trim().Length == 0 ? defaultValue : text;
#else
            return string.IsNullOrWhiteSpace(text) ? defaultValue : text;
#endif
        }

        public static string SubstringUpToFirst(this string text, char delimiter)
        {
            // if the string is null, return null
            if (text == null)
            {
                return null;
            }

            // get the index of the first delimiter character
            var indexOf = text.IndexOf(delimiter);

            // if the delimiter doesn't exist in the string, return the whole string.
            // otherwise return from the beginning up to BUT NOT INCLUDING the delimiter.
            return indexOf < 0 ? text : text.Substring(0, indexOf);
        }

        public static string ToStringInvariant(this int number, string format)
        {
            return format == null
                ? number.ToString(CultureInfo.InvariantCulture)
                : number.ToString(format, CultureInfo.InvariantCulture);
        }

        public static string ToStringInvariant(this double number, string format)
        {
            return format == null
                ? number.ToString(CultureInfo.InvariantCulture)
                : number.ToString(format, CultureInfo.InvariantCulture);
        }

        public static string ToStringInvariant(this int number)
        {
            return number.ToStringInvariant(null);
        }

        public static IEnumerable<TSource> DistinctBy<TSource, TKey>(this IEnumerable<TSource> source, Func<TSource, TKey> keySelector)
        {
            var hash = new HashSet<TKey>();
            return source.Where(p => hash.Add(keySelector(p)));
        }

        public static void ForEach<TObject>(this IEnumerable<TObject> collection, Action<TObject> action)
        {
            if (action == null)
            {
                throw new ArgumentNullException("action");
            }

            if (collection != null)
            {
                foreach (var item in collection)
                {
                    if (item != null)
                    {
                        action(item);
                    }
                }
            }
        }

        public static TResult IfNotNull<TObject, TResult>(this TObject obj, Func<TObject, TResult> action)
        {
            if (action == null)
            {
                throw new ArgumentNullException("action");
            }

            return obj == null ? default(TResult) : action(obj);
        }

        public static TResult IfNotNull<TObject, TResult>(this TObject obj, Func<TObject, TResult> action, TResult defaultValue)
        {
            if (action == null)
            {
                throw new ArgumentNullException("action");
            }

            return obj == null ? defaultValue : action(obj);
        }

        public static void IfNotNull<TObject>(this TObject obj, Action<TObject> action)
        {
            if (action == null)
            {
                throw new ArgumentNullException("action");
            }

            if (obj != null)
            {
                action(obj);
            }
        }

        public static void CopyItemsTo<TSource>(this ICollection<TSource> fromSet, ICollection<TSource> toSet)
        {
            if (toSet == null)
            {
                throw new ArgumentNullException("toSet");
            }

            if ((fromSet != null) && (fromSet.Count != 0))
            {
                foreach (var item in fromSet)
                {
                    toSet.Add(item);
                }
            }
        }
#if NET_20 || NET_35
        // Clear method introduced in .NET 4.0!
        public static void Clear(this StringBuilder stringBuilder)
        {
            // all it does is set the length to zero
            stringBuilder.Length = 0;
        }
#endif
    }
}
