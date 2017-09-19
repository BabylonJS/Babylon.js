// crunchenumerator.cs
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
using System.Text;

namespace Microsoft.Ajax.Utilities
{
    public class CrunchEnumerator
    {
        private HashSet<string> m_skipNames;
        private int m_currentName = -1;

        // this first set of characters is broken out from the second set because the allowed first-characters
        // in JS variable names is smaller than allowed subseqent characters. These two strings don't HAVE to
        // be the same. For instance, names can't start with numbers, but they can contain numbers after the first char.
        // we're actually going to tune these two sets rather than just have the max allowed because we want to 
        // make the final g-zipped results smaller.
        private static string s_varFirstLetters = "ntirufeoshclavypwbkdg";//"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
        public static string FirstLetters { get { return s_varFirstLetters; } set { s_varFirstLetters = value; } }

        private static string s_varPartLetters  = "tirufeoshclavypwbkdgn";//"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_$";
        public static string PartLetters { get { return s_varPartLetters ?? s_varFirstLetters; } set { s_varPartLetters = value; } }

        private const int PrecalculateLength = 32;
        private static string[] s_smallNames = PrecalculateFrequentNames();

        internal CrunchEnumerator(HashSet<string> avoidNames)
        {
            // just use the hashset we were passed
            m_skipNames = avoidNames;
        }

        internal string NextName()
        {
            string name;
            do
            {
                // advance to the next name
                ++m_currentName;
                name = CurrentName;
                // keep advancing until we find one that isn't in the skip list or a keyword
                // (use strict mode to be safe)
            }
            while (m_skipNames.Contains(name) || JSScanner.IsKeyword(name, true));
            return name;
        }

        private string CurrentName
        {
            get
            {
                return GenerateNameFromNumber(m_currentName);
            }
        }

        private static string[] PrecalculateFrequentNames()
        {
            var small = new string[PrecalculateLength];
            for (var i = 0; i < PrecalculateLength; i++)
            {
                small[i] = GenerateNameFromNumber(i);
            }

            return small;
        }

        public static string CrunchedLabel(int nestLevel)
        {
            // nestCount is 0-based.
            // return null if the nestLevel is invalid (< 0).
            string minLabel = null;
            if (nestLevel >= 0)
            {
                minLabel = GenerateNameFromNumber(nestLevel);
                if (JSScanner.IsKeyword(minLabel, true))
                {
                    // prepend something to make it NOT a keyword.
                    // no keywords start with an underscore, so...
                    minLabel = '_' + minLabel;
                }
            }

            return minLabel;
        }

        /// <summary>
        /// get the algorithmically-generated minified variable name based on the given number
        /// zero is the first name, 1 is the next, etc. This method needs to be tuned to
        /// get better gzip results.
        /// </summary>
        /// <param name="index">integer position of the name to retrieve</param>
        /// <returns>minified variable name</returns>
        public static string GenerateNameFromNumber(int index)
        {
            if ((s_smallNames != null) && (index >= 0) && (index < PrecalculateLength))
            {
                return s_smallNames[index];
            }

            var sb = StringBuilderPool.Acquire();
            try
            {
                // this REALLY needs some 'splainin.
                // first off, we want to use a different set of characters for the first digit
                // than we use for the second digit (they could be the same, but if we want the shortest
                // possible names, there are more characters available for the second digit than
                // the first. We could use the same strings if we wanted to limit the available characters
                // and therefore increase the length of the strings. 
                // But let's think digits for a sec. normal base-10 would be:
                // 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 ... 9 0 1
                //                     1 1 1 1 1 1 1 1 1 1 2 2 2 2 ... 9 0 0
                //                                                       1 1
                // but we want to go:
                // 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 ... ... ... 9 0 1
                //                     0 0 0 0 0 0 0 0 0 0 1 1 1 1 ... ... ... 9 0 0
                //                                                     ... ...   0 0
                // this is because for base-10, the leading zeros are blanks, but in our strings,
                // the leading blanks are NOT zeros. In essence what we do it START OVER FROM ZERO 
                // but with explicit leading zeros every time we add another character to the length 
                // of the string.
                // so after we peel off the last character, we divide by the number of possibilities to get
                // the next number in base-10. But WE want to divide by possibilities AND THEN SUBSTRACT ONE.
                // that not only gets us starting at 0, it also makes us push out the the number of iterations
                // we can go through before we need to increase the number of digits again.
                if (index >= 0)
                {
                    sb.Append(s_varFirstLetters[index % s_varFirstLetters.Length]);
                    index /= s_varFirstLetters.Length;

                    // this is where we substract the one after our division to get the next character (if any)
                    while (--index >= 0)
                    {
                        sb.Append(s_varPartLetters[index % s_varPartLetters.Length]);
                        index /= s_varPartLetters.Length;
                    }
                }

                return sb.ToString();
            }
            finally
            {
                sb.Release();
            }
        }
    }

    /// <summary>
    /// this class is used to sort the crunchable local fields in a scope so that the fields
    /// most in need of crunching get crunched first, therefore having the smallest-length
    /// crunched variable name.
    /// Highest priority are the fields most-often referenced.
    /// Among fields with the same reference count, the longest fields get priority.
    /// Lastly, alphabetize.
    /// </summary>
    internal class ReferenceComparer : IComparer<JSVariableField>
    {
        // singleton instance
        public static readonly IComparer<JSVariableField> Instance = new ReferenceComparer();
        // never instantiate outside this class
        private ReferenceComparer() { }

        #region IComparer<JSVariableField> Members

        /// <summary>
        /// sorting method for fields that will be renamed in the minification process.
        /// The order of the fields determines which minified name it will receive --
        /// the earlier in the list, typically the smaller, more-common the minified name.
        /// Tune this method to get better gzip results.
        /// </summary>
        /// <param name="left"></param>
        /// <param name="right"></param>
        /// <returns></returns>
        public int Compare(JSVariableField left, JSVariableField right)
        {
            /*
            int comparison = 0;
            if (left != right && left != null && right != null)
            {
                comparison = right.RefCount - left.RefCount;
                if (comparison == 0)
                {
                    comparison = right.Name.Length - left.Name.Length;
                    if (comparison == 0)
                    {
                        comparison = string.Compare(left.Name, right.Name, StringComparison.OrdinalIgnoreCase);
                    }
                }
            }
            return comparison;
            */

            // same field (or both are null)?
            if (left == right || (left == null && right == null)) return 0;

            // if the left field is null, we want if AFTER the right field (which isn't null)
            if (left == null) return 1;

            // if the right field is null, we want it AFTER the left field (which isn't null)
            if (right == null) return -1;

            // arguments come first, ordered by position. This is an effort to try and make the
            // argument lists for the functions come out in a more repeatable pattern so gzip will
            // compress the file better.
            if ((left.FieldType == FieldType.Argument || left.FieldType == FieldType.CatchError)
                && (right.FieldType == FieldType.Argument || right.FieldType == FieldType.CatchError))
            {
                var byPos = left.Position - right.Position;
                if (byPos == 0)
                {
                    // if for some reason the positions are the same, then we failed somewhere and
                    // need to look at the context position
                    byPos = CompareContext(left.OriginalContext, right.OriginalContext);
                    if (byPos == 0)
                    {
                        // NEITHER have an original context. Order by name; those MUST be different.
                        byPos = string.Compare(left.Name, right.Name, StringComparison.Ordinal);
                    }
                }

                return byPos;
            }
            if (left.FieldType == FieldType.Argument || left.FieldType == FieldType.CatchError)
            {
                return -1;
            }
            if (right.FieldType == FieldType.Argument || right.FieldType == FieldType.CatchError)
            {
                return 1;
            }

            // everything other than args comes next, ordered by refcount
            // (the number of times it's referenced in the code) in DECREASING
            // order. So the variables used most often get named first (presumably
            // with smaller names)
            var delta = right.RefCount - left.RefCount;
            if (delta == 0)
            {
                // same number of refcounts. Check the line number where they were declared
                delta = CompareContext(left.OriginalContext, right.OriginalContext);
                if (delta == 0)
                {
                    // NEITHER have an original context. Order by name; those MUST be different.
                    delta = string.Compare(left.Name, right.Name, StringComparison.Ordinal);
                }
            }

            return delta;
        }

        private static int CompareContext(Context left, Context right)
        {
            // same number of refcounts. Check the line number where they were declared
            var delta = 0;
            if (left != null && right != null)
            {
                delta = left.StartLineNumber - right.StartLineNumber;
                if (delta == 0)
                {
                    // same line? check the column -- those SHOULD be different
                    delta = left.StartColumn - right.StartColumn;
                }
            }
            else if (left != null)
            {
                // right must not have an original context -- put it on the end
                delta = -1;
            }
            else if (right != null)
            {
                // left must not have an original context -- put it on the end
                delta = 1;
            }

            return delta;
        }

        #endregion
    }
}
