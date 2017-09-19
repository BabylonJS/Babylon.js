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


namespace Microsoft.Ajax.Utilities
{
    public class CommaOperator : BinaryOperator
    {
        public CommaOperator(Context context)
            : base(context)
        {
            this.OperatorToken = JSToken.Comma;
        }

        public static AstNode CombineWithComma(Context context, AstNode operand1, AstNode operand2)
        {
            var comma = new CommaOperator(context);

            // if the left is a comma-operator already....
            var leftBinary = operand1 as BinaryOperator;
            var rightBinary = operand2 as BinaryOperator;
            if (leftBinary != null && leftBinary.OperatorToken == JSToken.Comma)
            {
                // the left-hand side is already a comma operator. Instead of nesting these, we're
                // going to combine them
                // move the old list's left-hand side to our left-hand side
                comma.Operand1 = leftBinary.Operand1;

                AstNodeList list;
                if (rightBinary != null && rightBinary.OperatorToken == JSToken.Comma)
                {
                    // the right is ALSO a comma operator. Create a new list, append all the rest of the operands
                    // and set our right-hand side to be the list
                    list = new AstNodeList(leftBinary.Context.FlattenToStart());
                    list.Append(leftBinary.Operand2).Append(rightBinary.Operand1).Append(rightBinary.Operand2);
                }
                else
                {
                    // the right is not a comma operator.
                    // see if the left-hand side already has a list we can use
                    list = leftBinary.Operand2 as AstNodeList;
                    if (list == null)
                    {
                        // it's not a list already
                        // create a new list with the left's right and our right and set it to our right
                        list = new AstNodeList(leftBinary.Operand2.Context.FlattenToStart());
                        list.Append(leftBinary.Operand2);
                    }

                    // and add our right-hand operand to the end of the list
                    list.Append(operand2);
                }

                // set the list on the right
                comma.Operand2 = list;
            }
            else if (rightBinary != null && rightBinary.OperatorToken == JSToken.Comma)
            {
                // the left hand side is NOT a comma operator.
                comma.Operand1 = operand1;

                // the right-hand side is already a comma-operator, but the left is not.
                // see if it already has a list we can reuse
                var rightList = rightBinary.Operand2 as AstNodeList;
                if (rightList != null)
                {
                    // it does. Prepend its right-hand operand and use the list
                    rightList.Insert(0, rightBinary.Operand1);
                }
                else
                {
                    // it's not -- create a new list containing the operands
                    rightList = new AstNodeList(rightBinary.Context);
                    rightList.Append(rightBinary.Operand1);
                    rightList.Append(rightBinary.Operand2);
                }

                comma.Operand2 = rightList;
            }
            else
            {
                comma.Operand1 = operand1;
                comma.Operand2 = operand2;
            }

            return comma;
        }
    }
}
