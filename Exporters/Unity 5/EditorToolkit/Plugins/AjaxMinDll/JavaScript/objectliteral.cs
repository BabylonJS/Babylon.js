// objectliteral.cs
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
    public sealed class ObjectLiteral : Expression
    {
        private AstNodeList m_properties;

        public AstNodeList Properties
        {
            get { return m_properties; }
            set
            {
                ReplaceNode(ref m_properties, value);
            }
        }

        public override bool IsConstant
        {
            get
            {
                // we are NOT constant if any one property value isn't constant.
                // no properties means an empty object literal, which is constant.
                if (Properties != null)
                {
                    foreach (var property in Properties)
                    {
                        if (!property.IsConstant)
                        {
                            return false;
                        }
                    }
                }

                // if we got here, they're all constant
                return true;
            }
        }

        public ObjectLiteral(Context context)
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
                return EnumerateNonNullNodes(m_properties);
            }
        }

        public override bool ReplaceChild(AstNode oldNode, AstNode newNode)
        {
            if (oldNode == m_properties)
            {
                var properties = newNode as AstNodeList;
                if (newNode == null || properties != null)
                {
                    Properties = properties;
                }
            }
            return false;
        }
    }
}

