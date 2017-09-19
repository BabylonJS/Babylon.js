// grouping.cs
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
    using System.Collections.Generic;

    /// <summary>
    /// Implementation of parenthetical '(' expr ')' operators
    /// </summary>
    public class GroupingOperator : Expression
    {
        private AstNode m_operand;

        public AstNode Operand
        {
            get { return m_operand; }
            set
            {
                ReplaceNode(ref m_operand, value);
            }
        }

        public GroupingOperator(Context context)
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

        public override PrimitiveType FindPrimitiveType()
        {
            return Operand != null
                ? Operand.FindPrimitiveType()
                : PrimitiveType.Other;
        }

        public override OperatorPrecedence Precedence
        {
            get
            {
                return OperatorPrecedence.Primary;
            }
        }

        public override IEnumerable<AstNode> Children
        {
            get
            {
                return EnumerateNonNullNodes(Operand);
            }
        }

        public override bool ReplaceChild(AstNode oldNode, AstNode newNode)
        {
            if (Operand == oldNode)
            {
                Operand = newNode;
                return true;
            }

            return false;
        }

        public override bool IsEquivalentTo(AstNode otherNode)
        {
            // we be equivalent if the other node is the
            // equivalent of the operand, right? The only difference would be the
            // parentheses, so maybe it'd still be the equivalent, no?
            var otherGroup = otherNode as GroupingOperator;
            return (otherGroup != null && Operand.IsEquivalentTo(otherGroup.Operand))
                || Operand.IsEquivalentTo(otherNode);
        }

        public override bool IsConstant
        {
            get
            {
                return Operand.IfNotNull(o => o.IsConstant);
            }
        }

        public override string ToString()
        {
            return '(' + (Operand == null ? "<null>" : Operand.ToString()) + ')';
        }
    }
}
