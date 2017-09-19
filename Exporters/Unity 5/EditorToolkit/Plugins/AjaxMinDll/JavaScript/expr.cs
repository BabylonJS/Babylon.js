// expr.cs
//
// Copyright 2011 Microsoft Corporation
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
    public abstract class Expression : AstNode
    {
        protected Expression(Context context)
            : base(context)
        {
        }

        public override bool IsExpression
        {
            get
            {
                // by definition we're an expression
                return true;
            }
        }

        public override OperatorPrecedence Precedence
        {
            get
            {
                // assume primary (lookup, literals, etc) and override for operators
                return OperatorPrecedence.Primary;
            }
        }
    }
}
