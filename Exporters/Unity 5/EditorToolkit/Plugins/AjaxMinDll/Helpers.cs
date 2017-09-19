// Helpers.cs
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

namespace Microsoft.Ajax.Utilities
{
#if NET_20
    using System.Collections;
    using System.Collections.Generic;

    // these are a few of the many useful delegates defined in .NET 3.5 and higher
    public delegate TResult Func<in T1, out TResult>(T1 arg1);
    public delegate TResult Func<in T1, in T2, out TResult>(T1 arg1, T2 arg2);

    /// <summary>
    /// use a templated Dictionary to aproximate a hashed set.
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public class HashSet<T> : IEnumerable<T>, ICollection<T>
    {
        private Dictionary<T,T> m_table;

        public int Count
        {
            get
            {
                return m_table.Count;
            }
        }

        public HashSet()
        {
            m_table = new Dictionary<T, T>();
        }

        public HashSet(IEnumerable<T> items)
        {
            m_table = new Dictionary<T, T>();
            foreach (var item in items)
            {
                m_table.Add(item, default(T));
            }
        }

        public HashSet(IEqualityComparer<T> comparer)
        {
            m_table = new Dictionary<T, T>(comparer);
        }

        public bool Add(T item)
        {
            return SafeAdd(item);
        }

        public bool Contains(T key)
        {
            return m_table.ContainsKey(key);
        }

        #region IEnumerable Members

        IEnumerator IEnumerable.GetEnumerator()
        {
            return m_table.GetEnumerator();
        }

        #endregion

        #region IEnumerable<T> Members

        IEnumerator<T> IEnumerable<T>.GetEnumerator()
        {
            return m_table.Keys.GetEnumerator();
        }

        #endregion

        #region ICollection<T> Members

        void ICollection<T>.Add(T item)
        {
            SafeAdd(item);
        }

        public void Clear()
        {
            m_table.Clear();
        }

        public void CopyTo(T[] array, int arrayIndex)
        {
            m_table.Keys.CopyTo(array, arrayIndex);
        }

        public bool IsReadOnly
        {
            get { return false; }
        }

        public bool Remove(T item)
        {
            return m_table.Remove(item);
        }

        #endregion

        #region private helpers

        private bool SafeAdd(T item)
        {
            var added = !m_table.ContainsKey(item);
            if (added)
            {
                m_table.Add(item, default(T));
            }

            return added;
        }

        #endregion
    }

#endif

#if DEBUG
    public static class ErrorStringHelper
    {
        public static System.Collections.Generic.IEnumerable<string> AvailableCssStrings
        {
            get
            {
                var type = typeof(CssStrings);
                var properties = type.GetProperties(System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.GetProperty | System.Reflection.BindingFlags.NonPublic);
                foreach (var property in properties)
                {
                    if (property.PropertyType == typeof(string))
                    {
                        yield return property.Name;
                    }
                }
            }
        }

        public static System.Collections.Generic.IEnumerable<string> AvailableJSStrings
        {
            get
            {
                var type = typeof(JScript);
                var properties = type.GetProperties(System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.GetProperty | System.Reflection.BindingFlags.NonPublic);
                foreach (var property in properties)
                {
                    if (property.PropertyType == typeof(string))
                    {
                        yield return property.Name;
                    }
                }
            }
        }
    }
#endif
}
