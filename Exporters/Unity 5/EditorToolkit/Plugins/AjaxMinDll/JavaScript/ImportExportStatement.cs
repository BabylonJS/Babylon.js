// ImportExportStatement.cs
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
using System.Text;

namespace Microsoft.Ajax.Utilities
{
    [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1710:IdentifiersShouldHaveCorrectSuffix")]
    public abstract class ImportExportStatement : AstNode, IEnumerable<AstNode>, IModuleReference
    {
        private List<AstNode> m_list;

        public Context KeywordContext { get; set; }

        public Context OpenContext { get; set; }

        public Context CloseContext { get; set; }

        public Context FromContext { get; set; }

        public Context ModuleContext { get; set; }

        public string ModuleName { get; set; }

        public ModuleScope ReferencedModule { get; set; }

        public override bool IsDeclaration
        {
            get
            {
                // always considered a declaration of something
                return true;
            }
        }

        protected ImportExportStatement(Context context)
            : base(context)
        {
            m_list = new List<AstNode>();
        }

        public int Count
        {
            get { return m_list.Count; }
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
                    oldNode.IfNotNull(n => n.Parent = (n.Parent == this) ? null : n.Parent);

                    if (newNode == null)
                    {
                        // remove it
                        m_list.RemoveAt(ndx);
                    }
                    else
                    {
                        // replace with the new node
                        m_list[ndx] = newNode;
                        newNode.Parent = this;
                    }

                    return true;
                }
            }

            return false;
        }

        public ImportExportStatement Append(AstNode node)
        {
            var specifierList = node as ImportExportStatement;
            if (specifierList != null)
            {
                // another secifier list -- move each specifier from the other list to ours
                for (var ndx = 0; ndx < specifierList.Count; ++ndx)
                {
                    Append(specifierList[ndx]);
                }
            }
            else if (node != null)
            {
                // not another list; just add it
                node.Parent = this;
                m_list.Add(node);
                Context.UpdateWith(node.Context);
            }

            return this;
        }

        public ImportExportStatement Insert(int position, AstNode node)
        {
            var specifierList = node as ImportExportStatement;
            if (specifierList != null)
            {
                // another secifier list -- move each specifier from the other list to ours
                for (var ndx = 0; ndx < specifierList.Count; ++ndx)
                {
                    Insert(position + ndx, specifierList[ndx]);
                }
            }
            else if (node != null)
            {
                // not another list
                node.Parent = this;
                m_list.Insert(position, node);
                Context.UpdateWith(node.Context);
            }

            return this;
        }

        public void RemoveAt(int position)
        {
            m_list[position].IfNotNull(n => n.Parent = (n.Parent == this) ? null : n.Parent);
            m_list.RemoveAt(position);
        }

        public AstNode this[int index]
        {
            get
            {
                return m_list[index];
            }
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

        public override string ToString()
        {
            var sb = StringBuilderPool.Acquire();
            try
            {
                if (m_list.Count > 0)
                {
                    // output the first one; then all subsequent, each prefaced with a comma
                    sb.Append(m_list[0].ToString());
                    for (var ndx = 1; ndx < m_list.Count; ++ndx)
                    {
                        sb.Append(" , ");
                        sb.Append(m_list[ndx].ToString());
                    }
                }

                return sb.ToString();
            }
            finally
            {
                sb.Release();
            }
        }

        #region IEnumerable<AstNode> Members

        public IEnumerator<AstNode> GetEnumerator()
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
