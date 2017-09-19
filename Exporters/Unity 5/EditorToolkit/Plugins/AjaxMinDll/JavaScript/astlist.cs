// astlist.cs
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

using System;
using System.Collections.Generic;
using System.Text;

namespace Microsoft.Ajax.Utilities
{
    [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1710:IdentifiersShouldHaveCorrectSuffix")]
    public sealed class AstNodeList : AstNode, IEnumerable<AstNode>
    {
        private List<AstNode> m_list;

        public override Context TerminatingContext
        {
            get
            {
                // if we have one, return it. If not, see if we are empty, and if not,
                // return the last item's terminator
                return base.TerminatingContext ?? (m_list.Count> 0 ? m_list[m_list.Count - 1].TerminatingContext : null);
            }
        }

        public AstNodeList(Context context)
            : base(context)
        {
            m_list = new List<AstNode>();
        }

        public override void Accept(IVisitor visitor)
        {
            if (visitor != null)
            {
                visitor.Visit(this);
            }
        }

        public override OperatorPrecedence Precedence
        {
            get
            {
                // the only time this should be called is when we are outputting a
                // comma-operator, so the list should have the comma precedence.
                return OperatorPrecedence.Comma;
            }
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

        public void ForEach<TItem>(Action<TItem> action) where TItem : AstNode
        {
            if (action == null)
            {
                throw new ArgumentNullException("action");
            }

            foreach (var item in m_list)
            {
                var itemAsType = item as TItem;
                if (itemAsType != null)
                {
                    action(itemAsType);
                }
            }
        }

        public override bool ReplaceChild(AstNode oldNode, AstNode newNode)
        {
            for (int ndx = 0; ndx < m_list.Count; ++ndx)
            {
                if (m_list[ndx] == oldNode)
                {
                    if ((oldNode != null) && (oldNode.Parent == this))
                    {
                        oldNode.Parent = null;
                    }

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

        /// <summary>
        /// an astlist is equivalent to another astlist if they both have the same number of
        /// items, and each item is equivalent to the corresponding item in the other
        /// </summary>
        /// <param name="otherNode"></param>
        /// <returns></returns>
        public override bool IsEquivalentTo(AstNode otherNode)
        {
            bool isEquivalent = false;

            AstNodeList otherList = otherNode as AstNodeList;
            if (otherList != null && m_list.Count == otherList.Count)
            {
                // now assume it's true unless we come across an item that ISN'T
                // equivalent, at which case we'll bail the test.
                isEquivalent = true;
                for (var ndx = 0; ndx < m_list.Count; ++ndx)
                {
                    if (!m_list[ndx].IsEquivalentTo(otherList[ndx]))
                    {
                        isEquivalent = false;
                        break;
                    }
                }
            }

            return isEquivalent;
        }

        internal AstNodeList Append(AstNode node)
        {
            var list = node as AstNodeList;
            if (list != null)
            {
                // another list -- append each item, not the whole list
                for (var ndx = 0; ndx < list.Count; ++ndx)
                {
                    Append(list[ndx]);
                }
            }
            else if (node != null)
            {
                // not another list
                node.Parent = this;
                m_list.Add(node);
                Context.UpdateWith(node.Context);
            }

            return this;
        }

        public AstNodeList Insert(int position, AstNode node)
        {
            var list = node as AstNodeList;
            if (list != null)
            {
                // another list. 
                for (var ndx = 0; ndx < list.Count; ++ndx)
                {
                    Insert(position + ndx, list[ndx]);
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

        internal void RemoveAt(int position)
        {
            var node = m_list[position];

            if ((node != null) && (node.Parent == this))
            {
                node.Parent = null;
            }

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

        public bool IsSingleConstantArgument(string argumentValue)
        {
            if (m_list.Count == 1)
            {
                ConstantWrapper constantWrapper = m_list[0] as ConstantWrapper;
                if (constantWrapper != null 
                    && string.CompareOrdinal(argumentValue, constantWrapper.Value.ToString()) == 0)
                {
                    return true;
                }
            }
            return false;
        }

        public string SingleConstantArgument
        {
            get
            {
                string constantValue = null;
                if (m_list.Count == 1)
                {
                    ConstantWrapper constantWrapper = m_list[0] as ConstantWrapper;
                    if (constantWrapper != null)
                    {
                        constantValue = constantWrapper.ToString();
                    }
                }
                return constantValue;
            }
        }

        public override bool IsConstant
        {
            get
            {
                foreach (var item in m_list)
                {
                    if (item != null)
                    {
                        if (!item.IsConstant)
                        {
                            return false;
                        }
                    }
                }

                return true;
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
