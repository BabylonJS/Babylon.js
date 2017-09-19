// directiveprologue.cs
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

namespace Microsoft.Ajax.Utilities
{
    public class DirectivePrologue : ConstantWrapper
    {
        public DirectivePrologue(string value, Context context)
            : base(value, PrimitiveType.String, context)
        {
            // this is a "use strict" directive if the source context is EXACTLY "use strict"
            // don't consider the quotes so it can be " or ' delimiters
            UseStrict = string.CompareOrdinal(Context.Code, 1, "use strict", 0, 10) == 0;
        }

        public bool UseStrict { get; private set; }
        public bool IsRedundant { get; set; }

        public override bool IsExpression
        {
            get
            {
                // directive prologues aren't expressions -- we don't want to
                // combine them with other expressions, for instance.
                return false;
            }
        }

        public override bool IsConstant
        {
            get
            {
                // not a constant, really; it's a directive prologue.
                return false;
            }
        }

        public override void Accept(IVisitor visitor)
        {
            if (visitor != null)
            {
                visitor.Visit(this);
            }
        }
    }
}
