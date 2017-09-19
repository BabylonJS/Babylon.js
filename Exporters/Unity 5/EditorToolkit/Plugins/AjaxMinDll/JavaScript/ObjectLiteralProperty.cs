// ObjectLiteralProperty.cs
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
    public class ObjectLiteralProperty : AstNode
    {
        private ObjectLiteralField m_propertyName;
        private AstNode m_propertyValue;

        public ObjectLiteralField Name
        {
            get { return m_propertyName; }
            set
            {
                ReplaceNode(ref m_propertyName, value);
            }
        }

        public AstNode Value
        {
            get { return m_propertyValue; }
            set
            {
                ReplaceNode(ref m_propertyValue, value);
            }
        }

        public override bool IsConstant
        {
            get
            {
                // we are constant if our value is constant.
                // If we don't have a value, then assume it's constant
                return Value != null ? Value.IsConstant : true;
            }
        }

        public ObjectLiteralProperty(Context context)
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
                return EnumerateNonNullNodes(Name, Value);
            }
        }

        public override bool ReplaceChild(AstNode oldNode, AstNode newNode)
        {
            if (Name == oldNode)
            {
                var objectField = newNode as ObjectLiteralField;
                if (newNode == null || objectField != null)
                {
                    Name = objectField;
                }
                return true;
            }

            if (Value == oldNode)
            {
                Value = newNode;
                return true;
            }

            return false;
        }

        internal override string GetFunctionGuess(AstNode target)
        {
            return Name.IfNotNull(n => n.ToString());
        }
    }
}
