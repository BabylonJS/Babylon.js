// ModuleDefinition.cs
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
    public class ModuleDeclaration : AstNode, IModuleReference
    {
        private BindingIdentifier m_binding;
        private Block m_body;

        /// <summary>
        /// Gets or sets the identifier used when binding all of an external modules exports as properties on a local object
        /// </summary>
        public BindingIdentifier Binding
        {
            get { return m_binding; }
            set
            {
                ReplaceNode(ref m_binding, value);
            }
        }

        public Context FromContext { get; set; }

        /// <summary>
        /// Gets or sets the module name
        /// </summary>
        public string ModuleName { get; set; }

        public Context ModuleContext { get; set; }

        public ModuleScope ReferencedModule { get; set; }

        /// <summary>
        /// Gets or sets a flag indicating whether or not this module is an implicit module,
        /// parsed as an external file that gets referenced by an import statement
        /// </summary>
        public bool IsImplicit { get; set; }

        public Block Body
        {
            get { return m_body; }
            set
            {
                ReplaceNode<Block>(ref m_body, value);
            }
        }

        public override bool IsDeclaration
        {
            get
            {
                // always considered a declaration
                return true;
            }
        }

        public ModuleDeclaration(Context context)
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
                return EnumerateNonNullNodes(m_binding, m_body);
            }
        }

        public override bool ReplaceChild(AstNode oldNode, AstNode newNode)
        {
            if (Binding == oldNode)
            {
                return (newNode as BindingIdentifier).IfNotNull(b => { Binding = b; return true; });
            }

            if (Body == oldNode)
            {
                Body = ForceToBlock(newNode);
                return true;
            }

            return false;
        }
    }
}
