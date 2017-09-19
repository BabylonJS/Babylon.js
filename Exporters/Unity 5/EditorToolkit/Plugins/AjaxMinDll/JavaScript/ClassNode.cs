// ClassNode.cs
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
    public enum ClassType
    {
        None = 0,
        Declaration,
        Expression
    }

    /// <summary>
    /// Class represents an EcmaScript 6 class node
    /// </summary>
    public class ClassNode : AstNode
    {
        private AstNode m_binding;
        private AstNode m_heritage;
        private AstNodeList m_elements;

        public Context ClassContext { get; set; }

        public AstNode Binding
        {
            get { return m_binding; }
            set
            {
                ReplaceNode(ref m_binding, value);
            }
        }

        public Context ExtendsContext { get; set; }

        public AstNode Heritage
        {
            get { return m_heritage; }
            set
            {
                ReplaceNode(ref m_heritage, value);
            }
        }

        public Context OpenBrace { get; set; }

        public AstNodeList Elements
        {
            get { return m_elements; }
            set
            {
                ReplaceNode(ref m_elements, value);
            }
        }

        public Context CloseBrace { get; set; }

        public ClassType ClassType { get; set; }

        public override bool IsExpression
        {
            get
            {
                // if this is a declaration, then it's not an expression. Otherwise treat it 
                // as if it were an expression.
                return ClassType != ClassType.Declaration;
            }
        }

        public BlockScope Scope { get; set; }

        public override bool IsDeclaration
        {
            get
            {
                return ClassType == ClassType.Declaration;
            }
        }

        public ClassNode(Context context)
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
                return EnumerateNonNullNodes(m_binding, m_heritage, m_elements);
            }
        }

        public override bool ReplaceChild(AstNode oldNode, AstNode newNode)
        {
            if (Binding == oldNode)
            {
                Binding = newNode as BindingIdentifier;
                return true;
            }

            if (Heritage == oldNode)
            {
                Heritage = newNode;
                return true;
            }

            if (Elements == oldNode)
            {
                Elements = newNode as AstNodeList;
                return true;
            }

            return false;
        }
    }
}
