// BindingIdentifier.cs
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


namespace Microsoft.Ajax.Utilities
{
    /// <summary>
    /// Simple Binding identifier node class. Represents a name that is declared in a binding (parameter, vardecl, catch, etc)
    /// </summary>
    public class BindingIdentifier : AstNode, INameDeclaration, IRenameable
    {
        /// <summary>
        /// Gets or sets the name of the binding
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Gets or sets the field corresponding to this declaration
        /// </summary>
        public JSVariableField VariableField { get; set; }

        /// <summary>
        /// Gets or sets whether or not this declaration can be renamed
        /// </summary>
        public bool RenameNotAllowed { get; set; }

        /// <summary>
        /// Gets or sets the scope type for this declaration (lexical or variable)
        /// </summary>
        public ScopeType ScopeType { get; set; }

        /// <summary>
        /// Gets any initializer that may be associated with this binding identifier
        /// </summary>
        public AstNode Initializer
        {
            get { return (Parent as InitializerNode).IfNotNull(v => v.Initializer); }
        }

        /// <summary>
        /// Gets or sets whether this binding identifier is a parameter name
        /// </summary>
        public bool IsParameter { get; set; }

        /// <summary>
        /// Gets the original name of the identifier, before any renaming
        /// </summary>
        public string OriginalName
        {
            get { return Name; }
        }

        /// <summary>
        /// Gets whether or not the item was renamed
        /// </summary>
        public bool WasRenamed
        {
            get
            {
                return VariableField.IfNotNull(f => !f.CrunchedName.IsNullOrWhiteSpace());
            }
        }

        public BindingIdentifier(Context context)
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

        public override bool IsEquivalentTo(AstNode otherNode)
        {
            var bindingIdentifier = otherNode as BindingIdentifier;
            if (bindingIdentifier != null)
            {
                return bindingIdentifier.VariableField.IfNotNull(v => v == this.VariableField);
            }
            else
            {
                // also check lookups
                var lookup = otherNode as Lookup;
                if (lookup != null)
                {
                    return lookup.VariableField.IfNotNull(v => v == this.VariableField);
                }
            }

            return false;
        }

        public override string ToString()
        {
            return Name;
        }
    }
}
