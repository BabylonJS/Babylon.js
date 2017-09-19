// ImportExportSpecifierSet.cs
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
    public class ImportExportSpecifier : AstNode, INameDeclaration
    {
        private AstNode m_localIdentifier;

        public Context NameContext { get; set; }

        public string ExternalName { get; set; }

        public Context AsContext { get; set; }

        public AstNode LocalIdentifier
        {
            get { return m_localIdentifier; }
            set
            {
                ReplaceNode(ref m_localIdentifier, value);
            }
        }

        /// <summary>
        /// Gets the name that is declared for this specifier.
        /// Only used if there was no local identifier defined and we added the external name to our scope.
        /// </summary>
        public string Name
        {
            get { return ExternalName; }
        }

        /// <summary>
        /// Gets null; import specifiers are not parameters.
        /// Only used if there was no local identifier defined and we added the external name to our scope.
        /// </summary>
        public AstNode Initializer
        {
            get { return null; }
        }

        /// <summary>
        /// Gets a flag indicating that this is not a parameter
        /// Only used if there was no local identifier defined and we added the external name to our scope.
        /// </summary>
        public bool IsParameter
        {
            get { return false; }
        }

        /// <summary>
        /// Gets a flag to indicate that imported external named cannot be renamed.
        /// Only used if there was no local identifier defined and we added the external name to our scope.
        /// </summary>
        public bool RenameNotAllowed
        {
            get { return true; }
        }

        /// <summary>
        /// Gets or sets a variable field corresponding to an import specifiers imported external name
        /// Only used if there was no local identifier defined and we added the external name to our scope.
        /// </summary>
        public JSVariableField VariableField { get; set; }

        public ImportExportSpecifier(Context context)
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
                return EnumerateNonNullNodes(m_localIdentifier);
            }
        }

        public override bool ReplaceChild(AstNode oldNode, AstNode newNode)
        {
            if (LocalIdentifier == oldNode)
            {
                LocalIdentifier = newNode;
                return true;
            }

            return false;
        }
    }
}
