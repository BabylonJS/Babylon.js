// arrayliteral.cs
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
    public sealed class ArrayLiteral : Expression
    {
        private AstNodeList m_elements;

        public AstNodeList Elements 
        {
            get { return m_elements; }
            set
            {
                ReplaceNode(ref m_elements, value);
            }
        }

        public bool MayHaveIssues { get; set; }

        public int Length
        {
            get
            {
                int count = 0;
                foreach (var element in m_elements)
                {
                    if (!element.IsConstant)
                    {
                        return -1;
                    }

                    var unaryOperator = element as UnaryOperator;
                    if (unaryOperator != null && unaryOperator.OperatorToken == JSToken.RestSpread)
                    {
                        // it's a spread. we already know it's a constant, but let's make sure it's
                        // also an array literal
                        var arrayLiteral = unaryOperator.Operand as ArrayLiteral;
                        var length = arrayLiteral != null ? arrayLiteral.Length : -1;
                        if (length >= 0)
                        {
                            count += length;
                        }
                        else
                        {
                            return -1;
                        }
                    }
                    else
                    {
                        // not a spread; just one element
                        ++count;
                    }
                }

                return count;
            }
        }

        public ArrayLiteral(Context context)
            : base(context)
        {
        }

        public override IEnumerable<AstNode> Children
        {
            get
            {
                return EnumerateNonNullNodes(Elements);
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
            // if the old node isn't our element list, ignore the cal
            if (oldNode == Elements)
            {
                if (newNode == null)
                {
                    // we want to remove the list altogether
                    Elements = null;
                    return true;
                }
                else
                {
                    // if the new node isn't an AstNodeList, then ignore the call
                    AstNodeList newList = newNode as AstNodeList;
                    if (newList != null)
                    {
                        // replace it
                        Elements = newList;
                        return true;
                    }
                }
            }
            return false;
        }

        public override bool IsConstant
        {
            get
            {
                return Elements == null ? true : Elements.IsConstant;
            }
        }
    }
}
