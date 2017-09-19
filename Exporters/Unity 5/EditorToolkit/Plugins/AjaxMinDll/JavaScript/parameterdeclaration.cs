// parameterdeclaration.cs
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
    public sealed class ParameterDeclaration : AstNode
    {
        private AstNode m_binding;
        private AstNode m_initializer;

        /// <summary>
        /// Gets or sets parameter order position, zero-based
        /// </summary>
        public int Position { get; set; }

        /// <summary>
        /// Gets or sets whether this parameter is prefixed with the rest token (...)
        /// </summary>
        public bool HasRest { get; set; }

        /// <summary>
        /// Gets or sets the source context for the rest token (if any)
        /// </summary>
        public Context RestContext { get; set; }

        /// <summary>
        // Gets or sets the binding node
        /// </summary>
        public AstNode Binding 
        {
            get { return m_binding; }
            set
            {
                ReplaceNode(ref m_binding, value);
            }
        }

        /// <summary>
        /// Gets or sets the context for the optional default-value assignment token
        /// </summary>
        public Context AssignContext { get; set; }

        /// <summary>
        /// Gets or sets the optional default value for the parameter
        /// </summary>
        public AstNode Initializer 
        {
            get { return m_initializer; }
            set
            {
                ReplaceNode(ref m_initializer, value);
            }
        }

        public bool IsReferenced
        {
            get
            {
                // the entire parameter is referenced if ANY of the binding declarations 
                // within it have a reference
                foreach(var nameDecl in BindingsVisitor.Bindings(this))
                {
                    // if there is no variable field (although there SHOULD be), then let's
                    // just assume it's referenced.
                    if (nameDecl.VariableField == null || nameDecl.VariableField.IsReferenced)
                    {
                        return true;
                    }
                }

                // if we get here, none are referenced, so this parameter is not referenced
                return false;
            }
        }

        public ParameterDeclaration(Context context)
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

        internal override string GetFunctionGuess(AstNode target)
        {
            return Binding.IfNotNull(b => b.GetFunctionGuess(target));
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
            else if (Initializer == oldNode)
            {
                Initializer = newNode;
                return true;
            }
            return false;
        }
    }
}
