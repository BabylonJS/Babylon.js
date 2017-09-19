// ResourceStrings.cs
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

using System.Collections.Generic;

namespace Microsoft.Ajax.Utilities
{
    public class ResourceStrings
    {
        public string Name { get; set; }
        public IDictionary<string, string> NameValuePairs { get; private set; }

        public string this[string name]
        {
            get
            {
                string propertyValue;
                if (!this.NameValuePairs.TryGetValue(name, out propertyValue))
                {
                    // couldn't find the property -- make sure we return null
                    propertyValue = null;
                }

                return propertyValue;
            }
            set
            {
                this.NameValuePairs[name] = value;
            }
        }

        public int Count
        {
            get { return this.NameValuePairs.Count; }
        }

        public ResourceStrings()
        {
            this.NameValuePairs = new Dictionary<string, string>();
        }
    }
}
