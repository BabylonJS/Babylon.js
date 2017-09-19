// switch.cs
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
    public sealed class Switch : AstNode
    {
        private AstNode m_expression;
        private AstNodeList m_cases;

        public AstNode Expression
        {
            get { return m_expression; }
            set
            {
                ReplaceNode(ref m_expression, value);
            }
        }

        public AstNodeList Cases
        {
            get { return m_cases; }
            set
            {
                ReplaceNode(ref m_cases, value);
            }
        }

        public bool BraceOnNewLine { get; set; }
        public Context BraceContext { get; set; }

        public ActivationObject BlockScope { get; set; }

        public Switch(Context context)
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
                return EnumerateNonNullNodes(Expression, Cases);
            }
        }

        public override bool ReplaceChild(AstNode oldNode, AstNode newNode)
        {
            if (Expression == oldNode)
            {
                Expression = newNode;
                return true;
            }
            if (Cases == oldNode)
            {
                AstNodeList newList = newNode as AstNodeList;
                if (newNode == null || newList != null)
                {
                    // remove it
                    Cases = newList;
                    return true;
                }
            }

            return false;
        }
    }
}
