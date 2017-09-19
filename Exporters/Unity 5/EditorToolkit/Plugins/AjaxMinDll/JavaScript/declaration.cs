// declaration.cs
//
// Copyright 2012 Microsoft Corporation
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
    [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1710:IdentifiersShouldHaveCorrectSuffix", Justification = "AST statement")]
    public abstract class Declaration : AstNode, IEnumerable<VariableDeclaration>
    {
        private List<VariableDeclaration> m_list;

        public JSToken StatementToken { get; set; }

        public Context KeywordContext { get; set; }

        public int Count
        {
            get { return m_list.Count; }
        }

        public VariableDeclaration this[int index]
        {
            get { return m_list[index]; }
            set
            {
                UnlinkParent(m_list[index]);
                if (value != null)
                {
                    m_list[index] = value;
                    m_list[index].Parent = this;
                }
                else
                {
                    m_list.RemoveAt(index);
                }
            }
        }

        public ActivationObject Scope { get; set; }

        public override bool IsDeclaration
        {
            get
            {
                // always considered a declaration
                return true;
            }
        }

        protected Declaration(Context context)
            : base(context)
        {
            m_list = new List<VariableDeclaration>();
        }

        public override IEnumerable<AstNode> Children
        {
            get
            {
                return FastEnumerateNonNullNodes(m_list);
            }
        }

        public override bool ReplaceChild(AstNode oldNode, AstNode newNode)
        {
            for (int ndx = 0; ndx < m_list.Count; ++ndx)
            {
                if (m_list[ndx] == oldNode)
                {
                    if (newNode == null)
                    {
                        // found the item, but we just want to remove it after we unhook it
                        m_list[ndx].IfNotNull(n => n.Parent = (n.Parent == this) ? null : n.Parent);
                        m_list.RemoveAt(ndx);
                    }
                    else
                    {
                        // if the new node isn't a variabledeclaration, ignore the call
                        VariableDeclaration newDecl = newNode as VariableDeclaration;
                        if (newNode == null || newDecl != null)
                        {
                            m_list[ndx].IfNotNull(n => n.Parent = (n.Parent == this) ? null : n.Parent);
                            m_list[ndx] = newDecl;
                            newDecl.Parent = this;
                            return true;
                        }
                    }

                    break;
                }
            }

            return false;
        }

        public void Append(AstNode element)
        {
            var decl = element as VariableDeclaration;
            if (decl != null)
            {
                // first check the list for existing instances of this name.
                // if there are no duplicates (indicated by returning true), add it to the list.
                // if there is a dup (indicated by returning false) then that dup
                // has an initializer, and we DON'T want to add this new one if it doesn't
                // have it's own initializer.
                if (HandleDuplicates(decl.Binding) || decl.Initializer != null)
                {
                    // set the parent and add it to the list
                    decl.Parent = this;
                    m_list.Add(decl);
                    UpdateWith(decl.Context);
                }
            }
            else
            {
                // TODO: what should we do if we try to add a const to a var, or a var to a const???
                var otherVar = element as Declaration;
                if (otherVar != null)
                {
                    for (int ndx = 0; ndx < otherVar.m_list.Count; ++ndx)
                    {
                        Append(otherVar.m_list[ndx]);
                    }
                }
            }
        }

        public void InsertAt(int index, AstNode element)
        {
            VariableDeclaration decl = element as VariableDeclaration;
            if (decl != null)
            {
                // first check the list for existing instances of this name.
                // if there are no duplicates (indicated by returning true), add it to the list.
                // if there is a dup (indicated by returning false) then that dup
                // has an initializer, and we DON'T want to add this new one if it doesn't
                // have it's own initializer.
                if (HandleDuplicates(decl.Binding) || decl.Initializer != null)
                {
                    // set the parent and add it to the list
                    decl.Parent = this;
                    m_list.Insert(index, decl);
                }
            }
            else
            {
                // TODO: what should we do if we try to add a const to a var, or a var to a const???
                var otherVar = element as Declaration;
                if (otherVar != null)
                {
                    // walk the source backwards so they end up in the right order
                    for (int ndx = otherVar.m_list.Count - 1; ndx >= 0; --ndx)
                    {
                        InsertAt(index, otherVar.m_list[ndx]);
                    }
                }
            }
        }

        private bool HandleDuplicates(AstNode binding)
        {
            var notDuplicate = true;

            // TODO: for now, just do this logic for simple binding identifiers.
            // would be nice to also remove duplicates if they are in binding patterns (object literal and array literals)
            var testName = (binding as BindingIdentifier).IfNotNull(b => b.Name);
            if (!testName.IsNullOrWhiteSpace())
            {
                // walk backwards because we'll be removing items from the list
                for (var ndx = m_list.Count - 1; ndx >= 0 ; --ndx)
                {
                    var varDecl = m_list[ndx];

                    // if the binding is a simple identifier and the names match
                    var bindingIdentifier = varDecl.Binding as BindingIdentifier;
                    if (bindingIdentifier != null && string.CompareOrdinal(bindingIdentifier.Name, testName) == 0)
                    {
                        // check the initializer. If there is no initializer, then
                        // we want to remove it because we'll be adding a new one.
                        // but if there is an initializer, keep it but return false
                        // to indicate that there is still a duplicate in the list, 
                        // and that dup has an initializer.
                        if (varDecl.Initializer == null)
                        {
                            varDecl.Parent = null;
                            m_list.RemoveAt(ndx);
                        }
                        else
                        {
                            notDuplicate = false;
                        }
                    }
                }
            }

            return notDuplicate;
        }

        public void RemoveAt(int index)
        {
            if (0 <= index & index < m_list.Count)
            {
                UnlinkParent(m_list[index]);
                m_list.RemoveAt(index);
            }
        }

        public void Remove(VariableDeclaration variableDeclaration)
        {
            // remove the vardecl from the list. If it was there and was
            // successfully remove, Remove will return true. At that point, if the
            // vardecl still thinks we are the parent, reset the parent pointer.
            if (variableDeclaration != null && m_list.Remove(variableDeclaration) && variableDeclaration.Parent == this)
            {
                variableDeclaration.Parent = null;
            }
        }

        public bool Contains(string name)
        {
            if (!name.IsNullOrWhiteSpace())
            {
                // look at each vardecl in our list
                foreach (var varDecl in m_list)
                {
                    foreach (var nameDeclaration in BindingsVisitor.Bindings(varDecl))
                    {
                        // if it matches the target name exactly...
                        if (string.CompareOrdinal(name, nameDeclaration.Name) == 0)
                        {
                            // ...we found a match
                            return true;
                        }
                    }
                }
            }

            // if we get here, we didn't find any matches
            return false;
        }

        /// <summary>
        /// Returns true if any of the variable declarations contain initializers using the in-operator
        /// </summary>
        public override bool ContainsInOperator
        {
            get
            {
                // go through each child var-decl
                foreach (var decl in m_list)
                {
                    // if it has an initializer and it contains an in-operator, then we know that
                    // at least one of our decls contain an in-operator, so WE do.
                    if (decl.Initializer != null && decl.Initializer.ContainsInOperator)
                    {
                        return true;
                    }
                }

                // if we get here, we don't have any in-operators
                return false;
            }
        }

        #region IEnumerable<VariableDeclaration> Members

        public IEnumerator<VariableDeclaration> GetEnumerator()
        {
            return m_list.GetEnumerator();
        }

        #endregion

        #region IEnumerable Members

        System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator()
        {
            return m_list.GetEnumerator();
        }

        #endregion
    }
}
