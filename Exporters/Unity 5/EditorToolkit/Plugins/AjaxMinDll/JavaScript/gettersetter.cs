// gettersetter.cs
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

namespace Microsoft.Ajax.Utilities
{

    public sealed class GetterSetter : ObjectLiteralField
    {
        public bool IsGetter { get; set; }

        public GetterSetter(String identifier, bool isGetter, Context context)
            : base(identifier, PrimitiveType.String, context)
        {
            IsGetter = isGetter;
        }

        public override void Accept(IVisitor visitor)
        {
            if (visitor != null)
            {
                visitor.Visit(this);
            }
        }

        public override String ToString()
        {
            return Value.ToString();
        }
    }
}

