// ComprehensionNode.cs
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
    public enum ComprehensionType
    {
        Array = 0,
        Generator = 1,
    }

    public class ComprehensionNode : Expression
    {
        private AstNode m_expression;
        private AstNodeList m_clauses;

        public ComprehensionType ComprehensionType { get; set; }

        public bool MozillaOrdering { get; set; }

        public Context OpenDelimiter { get; set; }

        public AstNode Expression
        {
            get { return m_expression; }
            set
            {
                ReplaceNode(ref m_expression, value);
            }
        }

        public AstNodeList Clauses
        {
            get { return m_clauses; }
            set
            {
                ReplaceNode(ref m_clauses, value);
            }
        }

        public Context CloseDelimiter { get; set; }

        public BlockScope BlockScope { get; set; }

        public ComprehensionNode(Context context)
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
                return EnumerateNonNullNodes(m_clauses, m_expression);
            }
        }

        public override bool ReplaceChild(AstNode oldNode, AstNode newNode)
        {
            if (Expression == oldNode)
            {
                Expression = newNode;
                return true;
            }

            if (Clauses == oldNode)
            {
                return (newNode as AstNodeList).IfNotNull(list =>
                {
                    Clauses = list;
                    return true;
                });
            }

            return false;
        }
    }
}
