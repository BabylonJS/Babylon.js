// TemplateLiteral.cs
//
// Copyright 2013 Microsoft Corporation
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
    public class TemplateLiteral : Expression
    {
        private Lookup m_function;
        private AstNodeList m_expressions;

        public Lookup Function
        {
            get { return m_function; }
            set
            {
                ReplaceNode(ref m_function, value);
            }
        }

        public string Text { get; set; }

        public Context TextContext { get; set; }

        public AstNodeList Expressions
        {
            get { return m_expressions; }
            set
            {
                ReplaceNode(ref m_expressions, value);
            }
        }

        public TemplateLiteral(Context context)
            : base(context)
        {
        }

        public override void Accept(IVisitor visitor)
        {
            if (visitor != null)
            {
                visitor.Visit(this);
            }
        }

        public override IEnumerable<AstNode> Children
        {
            get
            {
                return EnumerateNonNullNodes(m_function, m_expressions);
            }
        }

        public override bool ReplaceChild(AstNode oldNode, AstNode newNode)
        {
            if (Function == oldNode)
            {
                return (newNode as Lookup).IfNotNull(lookup =>
                {
                    Function = lookup;
                    return true;
                });
            }

            if (Expressions == oldNode)
            {
                return (newNode as AstNodeList).IfNotNull(list =>
                {
                    Expressions = list;
                    return true;
                });
            }

            return false;
        }
    }
}
