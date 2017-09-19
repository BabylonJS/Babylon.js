// StringBuilderPool.cs
//
// Copyright 2014 Microsoft Corporation
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
    using System;
    using System.Text;

    /// <summary>
    /// Static class for caching StringBuilders so we don't have to keep creating/destroying them all the time
    /// </summary>
    public static class StringBuilderPool
    {
        [ThreadStatic]
        private static StringBuilder[] ts_cachedArray;

        private const int CountPerThread = 5;

        private static int s_BuilderCapacity = 8192;

        private static StringBuilder[] GetList()
        {
            var list = ts_cachedArray;
            if (list == null)
            {
                list = new StringBuilder[CountPerThread];
                ts_cachedArray = list;
            }

            return list;
        }

        /// <summary>
        /// Acquire a possibly-shared string builder instance
        /// </summary>
        /// <returns>an empty string builder instance</returns>
        public static StringBuilder Acquire()
        {
            var list = GetList();
            for(var index = 0; index < list.Length; ++index)
            {
                if (list[index] != null)
                {
                    var builder = list[index];
                    list[index] = null;
                    return builder;
                }
            }

            return new StringBuilder(s_BuilderCapacity);
        }

        /// <summary>
        /// Acquire a tringBuilder object with at least the given capacity. If the capacity
        /// is less than or equal to our normal capacity, just return something from the pool.
        /// Otherwise create a new string builder that will just get discarded when released.
        /// </summary>
        /// <param name="capacity">minimum capacity</param>
        /// <returns>StringBuilder object</returns>
        public static StringBuilder Acquire(int capacity)
        {
            if (capacity <= s_BuilderCapacity)
            {
                return Acquire();
            }

            return new StringBuilder(capacity);
        }

        /// <summary>
        /// Extension method to add a method to StringBuilders that will release them back into the thread pool
        /// </summary>
        /// <param name="builder">StringBuilder instance to add back to the thread pool</param>
        public static void Release(this StringBuilder builder)
        {
            if (builder != null)
            {
                if (builder.Capacity > s_BuilderCapacity)
                {
                    //s_BuilderCapacity = builder.Capacity;
#if DEBUG
                    System.Diagnostics.Debug.WriteLine("StringBuilderPool: discarding builder of capacity {0}", builder.Capacity);
#endif
                }
                else
                {
                    var list = GetList();
                    for(var index = 0; index < list.Length; ++index)
                    {
                        if (list[index] == null)
                        {
                            list[index] = builder;
                            builder.Clear();
                            return;
                        }
                    }

#if DEBUG
                    System.Diagnostics.Debug.WriteLine("StringBuilderPool: Too many builders for the pool; discarding");
#endif
                }
            }
        }
    }
}
