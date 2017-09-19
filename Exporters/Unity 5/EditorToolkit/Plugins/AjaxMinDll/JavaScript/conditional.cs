// conditional.cs
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

    public sealed class Conditional : Expression
    {
        private AstNode m_condition;
        private AstNode m_trueExpression;
        private AstNode m_falseExpression;

        public AstNode Condition
        {
            get { return m_condition; }
            set
            {
                ReplaceNode(ref m_condition, value);
            }
        }

        public AstNode TrueExpression
        {
            get { return m_trueExpression; }
            set
            {
                ReplaceNode(ref m_trueExpression, value);
            }
        }

        public AstNode FalseExpression
        {
            get { return m_falseExpression; }
            set
            {
                ReplaceNode(ref m_falseExpression, value);
            }
        }

        public Context QuestionContext { get; set; }
        public Context ColonContext { get; set; }

        public Conditional(Context context)
            : base(context)
        {
        }

        public override OperatorPrecedence Precedence
        {
            get
            {
                return OperatorPrecedence.Conditional;
            }
        }

        public void SwapBranches()
        {
            var temp = m_trueExpression;
            m_trueExpression = m_falseExpression;
            m_falseExpression = temp;
        }

        public override PrimitiveType FindPrimitiveType()
        {
            if (TrueExpression != null && FalseExpression != null)
            {
                // if the primitive type of both true and false expressions is the same, then
                // we know the primitive type. Otherwise we do not.
                PrimitiveType trueType = TrueExpression.FindPrimitiveType();
                if (trueType == FalseExpression.FindPrimitiveType())
                {
                    return trueType;
                }
            }

            // nope -- they don't match, so we don't know
            return PrimitiveType.Other;
        }

        public override bool IsEquivalentTo(AstNode otherNode)
        {
            var otherConditional = otherNode as Conditional;
            return otherConditional != null
                && Condition.IsEquivalentTo(otherConditional.Condition)
                && TrueExpression.IsEquivalentTo(otherConditional.TrueExpression)
                && FalseExpression.IsEquivalentTo(otherConditional.FalseExpression);
        }

        public override IEnumerable<AstNode> Children
        {
            get
            {
                return EnumerateNonNullNodes(Condition, TrueExpression, FalseExpression);
            }
        }

        public override void Accept(IVisitor visitor)
        {
            if (visitor != null)
            {
                visitor.Visit(this);
            }
        }

        public override bool ReplaceChild(AstNode oldNode, AstNode newNode)
        {
            if (Condition == oldNode)
            {
                Condition = newNode;
                return true;
            }
            if (TrueExpression == oldNode)
            {
                TrueExpression = newNode;
                return true;
            }
            if (FalseExpression == oldNode)
            {
                FalseExpression = newNode;
                return true;
            }
            return false;
        }

        public override AstNode LeftHandSide
        {
            get
            {
                // the condition is on the left
                return Condition.LeftHandSide;
            }
        }
    }
}