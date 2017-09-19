// block.cs
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
    /// <summary>
    /// Block of statements
    /// </summary>
    [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1710:IdentifiersShouldHaveCorrectSuffix")]
    public sealed class Block : AstNode, IEnumerable<AstNode>
    {
        private List<AstNode> m_list;

        /// <summary>
        /// Gets a particular statement in the list of statements making up this block
        /// </summary>
        /// <param name="index">zero-based index of the desired statement</param>
        /// <returns>abstract syntax tree node</returns>
        public AstNode this[int index]
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

        /// <summary>
        /// Gets the count of statements making up this block
        /// </summary>
        public int Count
        {
            get { return m_list.Count; }
        }

        /// <summary>
        /// Gets or sets a boolean value indicating whether the brace for this block (if there was one) started
        /// on a newline (true) or the same line as the statement to which it belongs (false)
        /// </summary>
        public bool BraceOnNewLine { get; set; }

        /// <summary>
        /// Gets or sets a flag indicating this this block is a module body
        /// </summary>
        public bool IsModule { get; set; }

        public override Context TerminatingContext
        {
            get
            {
                // if we have one, return it. If not, see if there's only one
                // line in our block, and if so, return it's terminator.
                return base.TerminatingContext ?? (m_list.Count == 1 ? m_list[0].TerminatingContext : null);
            }
        }

        /// <summary>
        /// Gets or sets whether to force this block to always have curly-braces around it
        /// and never to optimize them away.
        /// </summary>
        public bool ForceBraces { get; set; }

        /// <summary>
        /// Gets or sets whether this block is a concise block (has no braces)
        /// </summary>
        public bool IsConcise { get; set; }

        /// <summary>
        /// Returns false unless the block constains only a single statement that is itself an expression.
        /// </summary>
        public override bool IsExpression
        {
            get
            {
                // if this block contains a single statement, then recurse.
                // otherwise it isn't.
                //
                // TODO: if there are no statements -- empty block -- then is is an expression?
                // I mean, we can make an empty block be an expression by just making it a zero. 
                return m_list.Count == 1 && m_list[0].IsExpression;
            }
        }

        /// <summary>
        /// Gets an enumerator for the syntax tree nodes making up this block
        /// </summary>
        public override IEnumerable<AstNode> Children
        {
            get
            {
                return FastEnumerateNonNullNodes(m_list);
            }
        }

        public Block(Context context)
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

        /// <summary>
        /// Remove all statements from the Block
        /// </summary>
        public void Clear()
        {
            foreach (var item in m_list)
            {
                item.IfNotNull(n => n.Parent = (n.Parent == this) ? null : n.Parent);
            }

            m_list.Clear();
            this.IsConcise = false;
        }

        internal override bool EncloseBlock(EncloseBlockType type)
        {
            // if there's more than one item, then return false.
            // otherwise recurse the call
            return (m_list.Count == 1 && m_list[0].EncloseBlock(type));
        }

        /// <summary>
        /// Replace the existing direct child node of the block with a new node.
        /// </summary>
        /// <param name="oldNode">existing statement node to replace.</param>
        /// <param name="newNode">node with which to replace the existing node.</param>
        /// <returns>true if the replacement was a succeess; false otherwise</returns>
        public override bool ReplaceChild(AstNode oldNode, AstNode newNode)
        {
            for (int ndx = m_list.Count - 1; ndx >= 0; --ndx)
            {
                if (m_list[ndx] == oldNode)
                {
                    if ((oldNode != null) && (oldNode.Parent == this))
                    {
                        oldNode.Parent = null;
                    }
                    
                    if (newNode == null)
                    {
                        // if this was concise, we're not anymore. Don't need to undo
                        // the conciseness, because there's only one statement and we're going
                        // to be deleting it.
                        this.IsConcise = false;

                        // just remove it
                        m_list.RemoveAt(ndx);

                        // if this was a concise block, it shouldn't be anymore
                        this.IsConcise = false;
                    }
                    else
                    {
                        Block newBlock = newNode as Block;
                        if (newBlock != null)
                        {
                            // the new "statement" is a block. That means we need to insert all
                            // the statements from the new block at the location of the old item.
                            m_list.RemoveAt(ndx);
                            InsertRange(ndx, newBlock.m_list);
                        }
                        else
                        {
                            // not a block -- slap it in there
                            m_list[ndx] = newNode;
                            newNode.Parent = this;

                            // if we were concise and we are replacing our single expression with
                            // something that isn't an expression, we are no longer concise.
                            if (this.IsConcise && !newNode.IsExpression)
                            {
                                this.IsConcise = false;
                            }
                        }
                    }

                    return true;
                }
            }

            return false;
        }

        /// <summary>
        /// Append the given statement node to the end of the block
        /// </summary>
        /// <param name="item">node to add to the block</param>
        public void Append(AstNode item)
        {
            if (item != null)
            {
                if (this.IsConcise)
                {
                    // this WAS concise -- make it not a concise block now because adding another
                    // statement totally changes the semantics.
                    Unconcise();
                }

                item.Parent = this;
                m_list.Add(item);
                Context.UpdateWith(item.Context);
            }
        }

        /// <summary>
        /// Gets the zero-based index of the given syntax tree node within the block, or -1 if the node is not a direct child of the block
        /// </summary>
        /// <param name="item">node to find</param>
        /// <returns>zero-based index of the node in the block, or -1 if the node is not a direct child of the block</returns>
        public int IndexOf(AstNode item)
        {
            return m_list.IndexOf(item);
        }

        /// <summary>
        /// Insert the given statement node after an existing node in the block.
        /// </summary>
        /// <param name="after">exisitng child node of the block</param>
        /// <param name="item">node to insert after the existing node</param>
        public void InsertAfter(AstNode after, AstNode item)
        {
            if (item != null)
            {
                int index = m_list.IndexOf(after);
                if (index >= 0)
                {
                    if (this.IsConcise)
                    {
                        // this WAS concise -- make it not a concise block now because adding another
                        // statement totally changes the semantics.
                        Unconcise();
                    }

                    var block = item as Block;
                    if (block != null)
                    {
                        // don't insert a block into a block -- insert the new block's
                        // children instead (don't want nested blocks)
                        InsertRange(index + 1, block.Children);
                    }
                    else
                    {
                        item.Parent = this;
                        m_list.Insert(index + 1, item);
                    }
                }
            }
        }

        /// <summary>
        /// Insert a new node into the given position index within the block
        /// </summary>
        /// <param name="index">zero-based index into which the new node will be inserted</param>
        /// <param name="item">new node to insert into the block</param>
        public void Insert(int index, AstNode item)
        {
            if (item != null)
            {
                if (this.IsConcise)
                {
                    // this WAS concise -- make it not a concise block now because adding another
                    // statement totally changes the semantics.
                    Unconcise();
                }

                var block = item as Block;
                if (block != null)
                {
                    InsertRange(index, block.Children);
                }
                else
                {
                    item.Parent = this;
                    m_list.Insert(index, item);
                }
            }
        }

        /// <summary>
        /// Remove the last node in the block
        /// </summary>
        public void RemoveLast()
        {
            // if this was concise, we're not anymore. Don't need to undo
            // the conciseness, because there's only one statement and we're going
            // to be deleting it.
            this.IsConcise = false;
            RemoveAt(m_list.Count - 1);
        }

        /// <summary>
        /// Remove the node at the given position index.
        /// </summary>
        /// <param name="index">Zero-based position index</param>
        public void RemoveAt(int index)
        {
            if (0 <= index && index < m_list.Count)
            {
                // if this was concise, we're not anymore. Don't need to undo
                // the conciseness, because there's only one statement and we're going
                // to be deleting it.
                this.IsConcise = false;

                UnlinkParent(m_list[index]);
                m_list.RemoveAt(index);
            }
        }

        /// <summary>
        /// Insert a set of nodes into the block at the given position
        /// </summary>
        /// <param name="index">Zero-based position into which the new nodes will be inserted.</param>
        /// <param name="newItems">Collection of statements to insert</param>
        public void InsertRange(int index, IEnumerable<AstNode> newItems)
        {
            if (newItems != null)
            {
                if (this.IsConcise)
                {
                    // this WAS concise, but adding statements changes the semantics
                    Unconcise();
                }

                m_list.InsertRange(index, newItems);
                foreach (AstNode newItem in newItems)
                {
                    newItem.Parent = this;
                }
            }
        }

        private void Unconcise()
        {
            // Instead of implicitly returning the one expression, we're
            // going to need to turn this into a non-concise block and explicitly return
            // that expression.
            this.IsConcise = false;

            // there should be a single statement that's an expression. Make it the argument of
            // a return statement.
            if (m_list.Count == 1)
            {
                var expression = m_list[0];
                if (expression.IsExpression)
                {
                    m_list[0] = new ReturnNode(expression.Context)
                    {
                        Operand = expression,
                        Parent = this
                    };
                }
            }
        }

        #region IEnumerable implementation

        public IEnumerator<AstNode> GetEnumerator()
        {
            return m_list.GetEnumerator();
        }

        System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator()
        {
            return m_list.GetEnumerator();
        }

        #endregion
    }
}