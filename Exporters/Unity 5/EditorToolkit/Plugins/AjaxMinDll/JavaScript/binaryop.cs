// binaryop.cs
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

    public class BinaryOperator : Expression
    {
        private AstNode m_operand1;
        private AstNode m_operand2;

        public AstNode Operand1 
        {
            get { return m_operand1; }
            set
            {
                ReplaceNode(ref m_operand1, value);
            }
        }
        
        public AstNode Operand2 
        {
            get { return m_operand2; }
            set
            {
                ReplaceNode(ref m_operand2, value);
            }
        }

        public JSToken OperatorToken { get; set; }
        public Context OperatorContext { get; set; }

        public override Context TerminatingContext
        {
            get
            {
                // if we have one, return it. If not, see ifthe right-hand side has one
                return base.TerminatingContext ?? Operand2.IfNotNull(n => n.TerminatingContext);
            }
        }

        public BinaryOperator(Context context)
            : base(context)
        {
        }

        public override OperatorPrecedence Precedence
        {
            get 
            {
                switch (OperatorToken)
                {
                    case JSToken.Comma:
                        return OperatorPrecedence.Comma;

                    case JSToken.Assign:
                    case JSToken.BitwiseAndAssign:
                    case JSToken.BitwiseOrAssign:
                    case JSToken.BitwiseXorAssign:
                    case JSToken.DivideAssign:
                    case JSToken.LeftShiftAssign:
                    case JSToken.MinusAssign:
                    case JSToken.ModuloAssign:
                    case JSToken.MultiplyAssign:
                    case JSToken.RightShiftAssign:
                    case JSToken.UnsignedRightShiftAssign:
                    case JSToken.PlusAssign:
                        return OperatorPrecedence.Assignment;

                    case JSToken.LogicalOr:
                        return OperatorPrecedence.LogicalOr;

                    case JSToken.LogicalAnd:
                        return OperatorPrecedence.LogicalAnd;

                    case JSToken.BitwiseOr:
                        return OperatorPrecedence.BitwiseOr;

                    case JSToken.BitwiseXor:
                        return OperatorPrecedence.BitwiseXor;

                    case JSToken.BitwiseAnd:
                        return OperatorPrecedence.BitwiseAnd;

                    case JSToken.Equal:
                    case JSToken.NotEqual:
                    case JSToken.StrictEqual:
                    case JSToken.StrictNotEqual:
                        return OperatorPrecedence.Equality;

                    case JSToken.GreaterThan:
                    case JSToken.GreaterThanEqual:
                    case JSToken.In:
                    case JSToken.InstanceOf:
                    case JSToken.LessThan:
                    case JSToken.LessThanEqual:
                        return OperatorPrecedence.Relational;

                    case JSToken.LeftShift:
                    case JSToken.RightShift:
                    case JSToken.UnsignedRightShift:
                        return OperatorPrecedence.Shift;

                    case JSToken.Multiply:
                    case JSToken.Divide:
                    case JSToken.Modulo:
                        return OperatorPrecedence.Multiplicative;

                    case JSToken.Plus:
                    case JSToken.Minus:
                        return OperatorPrecedence.Additive;

                    default:
                        return OperatorPrecedence.None;
                }
            }
        }

        public override PrimitiveType FindPrimitiveType()
        {
            PrimitiveType leftType;
            PrimitiveType rightType;

            switch (OperatorToken)
            {
                case JSToken.Assign:
                case JSToken.Comma:
                    // returns whatever type the right operand is
                    return Operand2.FindPrimitiveType();

                case JSToken.BitwiseAnd:
                case JSToken.BitwiseAndAssign:
                case JSToken.BitwiseOr:
                case JSToken.BitwiseOrAssign:
                case JSToken.BitwiseXor:
                case JSToken.BitwiseXorAssign:
                case JSToken.Divide:
                case JSToken.DivideAssign:
                case JSToken.LeftShift:
                case JSToken.LeftShiftAssign:
                case JSToken.Minus:
                case JSToken.MinusAssign:
                case JSToken.Modulo:
                case JSToken.ModuloAssign:
                case JSToken.Multiply:
                case JSToken.MultiplyAssign:
                case JSToken.RightShift:
                case JSToken.RightShiftAssign:
                case JSToken.UnsignedRightShift:
                case JSToken.UnsignedRightShiftAssign:
                    // always returns a number
                    return PrimitiveType.Number;

                case JSToken.Equal:
                case JSToken.GreaterThan:
                case JSToken.GreaterThanEqual:
                case JSToken.In:
                case JSToken.InstanceOf:
                case JSToken.LessThan:
                case JSToken.LessThanEqual:
                case JSToken.NotEqual:
                case JSToken.StrictEqual:
                case JSToken.StrictNotEqual:
                    // always returns a boolean
                    return PrimitiveType.Boolean;

                case JSToken.PlusAssign:
                case JSToken.Plus:
                    // if either operand is known to be a string, then the result type is a string.
                    // otherwise the result is numeric if both types are known.
                    leftType = Operand1.FindPrimitiveType();
                    rightType = Operand2.FindPrimitiveType();

                    return (leftType == PrimitiveType.String || rightType == PrimitiveType.String)
                        ? PrimitiveType.String
                        : (leftType != PrimitiveType.Other && rightType != PrimitiveType.Other
                            ? PrimitiveType.Number
                            : PrimitiveType.Other);

                case JSToken.LogicalAnd:
                case JSToken.LogicalOr:
                    // these two are special. They return either the left or the right operand
                    // (depending on their values), so unless they are both known types AND the same,
                    // then we can't know for sure.
                    leftType = Operand1.FindPrimitiveType();
                    if (leftType != PrimitiveType.Other)
                    {
                        if (leftType == Operand2.FindPrimitiveType())
                        {
                            // they are both the same and neither is unknown
                            return leftType;
                        }
                    }

                    // if we get here, then we don't know the type
                    return PrimitiveType.Other;

                default:
                    // shouldn't get here....
                    return PrimitiveType.Other;
            }
        }

        public override IEnumerable<AstNode> Children
        {
            get
            {
                return EnumerateNonNullNodes(Operand1, Operand2);
            }
        }

        public override void Accept(IVisitor visitor)
        {
            if (visitor == null) return;
            visitor.Visit(this);
        }

        public override bool ReplaceChild(AstNode oldNode, AstNode newNode)
        {
            if (Operand1 == oldNode)
            {
                Operand1 = newNode;
                return true;
            }
            if (Operand2 == oldNode)
            {
                Operand2 = newNode;
                return true;
            }
            return false;
        }

        public override AstNode LeftHandSide
        {
            get
            {
                if (OperatorToken == JSToken.Comma)
                {
                    // for comma-operators, the leftmost item is the leftmost item of the
                    // rightmost operand. And the operand2 might be a list.
                    var list = Operand2 as AstNodeList;
                    if (list != null && list.Count > 0)
                    {
                        // the right-hand side is a list, so we want the LAST item
                        return list[list.Count - 1].LeftHandSide;
                    }

                    // not a list, just ask the right-hand operand what its leftmost node is
                    return Operand2.LeftHandSide;
                }

                // not a comma, so operand1 is on the left
                return Operand1.LeftHandSide;
            }
        }

        public void SwapOperands()
        {
            // swap the operands -- we don't need to go through ReplaceChild or the
            // property setters because we don't need to change the Parent pointers 
            // or anything like that.
            AstNode temp = m_operand1;
            m_operand1 = m_operand2;
            m_operand2 = temp;
        }

        public override bool IsEquivalentTo(AstNode otherNode)
        {
            // a binary operator is equivalent to another binary operator if the operator is the same and
            // both operands are also equivalent
            var otherBinary = otherNode as BinaryOperator;
            return otherBinary != null
                && OperatorToken == otherBinary.OperatorToken
                && Operand1.IsEquivalentTo(otherBinary.Operand1)
                && Operand2.IsEquivalentTo(otherBinary.Operand2);
        }

        public bool IsAssign
        {
            get
            {
                switch(OperatorToken)
                {
                    case JSToken.Assign:
                    case JSToken.PlusAssign:
                    case JSToken.MinusAssign:
                    case JSToken.MultiplyAssign:
                    case JSToken.DivideAssign:
                    case JSToken.ModuloAssign:
                    case JSToken.BitwiseAndAssign:
                    case JSToken.BitwiseOrAssign:
                    case JSToken.BitwiseXorAssign:
                    case JSToken.LeftShiftAssign:
                    case JSToken.RightShiftAssign:
                    case JSToken.UnsignedRightShiftAssign:
                        return true;

                    default:
                        return false;
                }
            }
        }

        internal override string GetFunctionGuess(AstNode target)
        {
            return Operand2 == target
                ? IsAssign ? Operand1.GetFunctionGuess(this) : Parent.GetFunctionGuess(this)
                : string.Empty;
        }

        /// <summary>
        /// Returns true if the expression contains an in-operator
        /// </summary>
        public override bool ContainsInOperator
        {
            get
            {
                // if we are an in-operator, then yeah: we contain one.
                // otherwise recurse the operands.
                return OperatorToken == JSToken.In
                    ? true
                    : Operand1.ContainsInOperator || Operand2.ContainsInOperator;
            }
        }

        public override bool IsConstant
        {
            get
            {
                return Operand1.IfNotNull(o => o.IsConstant) && Operand2.IfNotNull(o => o.IsConstant);
            }
        }

        public override string ToString()
        {
            return (Operand1 == null ? "<null>" : Operand1.ToString())
                + ' ' + OutputVisitor.OperatorString(OperatorToken) + ' '
                + (Operand2 == null ? "<null>" : Operand2.ToString());
        }
    }
}
