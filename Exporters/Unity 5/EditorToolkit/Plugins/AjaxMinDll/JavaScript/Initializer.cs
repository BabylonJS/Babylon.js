// Initializer.cs
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
    /// <summary>
    /// Initializer used in bindings
    /// </summary>
    public class InitializerNode : AstNode
    {
        private AstNode m_binding;
        private AstNode m_initializer;

        public AstNode Binding
        {
            get { return m_binding; }
            set
            {
                ReplaceNode(ref m_binding, value);
            }
        }

        public Context AssignContext { get; set; }

        public AstNode Initializer
        {
            get { return m_initializer; }
            set
            {
                ReplaceNode(ref m_initializer, value);
            }
        }

        public override bool IsConstant
        {
            get
            {
                // we are constant if our value is constant.
                // If we don't have a value, then assume it's constant
                return Binding != null ? Binding.IsConstant : true;
            }
        }

        public InitializerNode(Context context)
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
                return EnumerateNonNullNodes(Binding, Initializer);
            }
        }

        public override bool ReplaceChild(AstNode oldNode, AstNode newNode)
        {
            if (Binding == oldNode)
            {
                Binding = newNode;
                return true;
            }

            if (Initializer == oldNode)
            {
                Initializer = newNode;
                return true;
            }

            return false;
        }

        internal override string GetFunctionGuess(AstNode target)
        {
            return Binding.IfNotNull(b => b.GetFunctionGuess(target));
        }

        public override bool IsEquivalentTo(AstNode otherNode)
        {
            // EVERYTHING referenced in the other node needs to be represented
            // in the bindings of this node. This node can have MORE, though; that's okay.
            var everythingRepresented = true;
            var theseBindings = BindingsVisitor.Bindings(this.Binding);
            foreach (var reference in BindingsVisitor.References(otherNode))
            {
                var foundOne = false;
                foreach (var bindingIdentifier in theseBindings)
                {
                    if (bindingIdentifier.IsEquivalentTo(reference))
                    {
                        foundOne = true;
                        break;
                    }
                }

                if (!foundOne)
                {
                    everythingRepresented = false;
                    break;
                }
            }

            return everythingRepresented;
        }
    }
}
