// if.cs
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

    public sealed class IfNode : AstNode
    {
        private AstNode m_condition;
        private Block m_trueBlock;
        private Block m_falseBlock;

        public AstNode Condition
        {
            get { return m_condition; }
            set
            {
                ReplaceNode(ref m_condition, value);
            }
        }

        public Block TrueBlock
        {
            get { return m_trueBlock; }
            set
            {
                ReplaceNode<Block>(ref m_trueBlock, value);
            }
        }

        public Block FalseBlock
        {
            get { return m_falseBlock; }
            set
            {
                ReplaceNode<Block>(ref m_falseBlock, value);
            }
        }

        public Context ElseContext { get; set; }

        public override Context TerminatingContext
        {
            get
            {
                // if we have one, return it.
                var term = base.TerminatingContext;
                if (term == null)
                {
                    // we didn't have a terminator. See if there's an else-block. If so,
                    // return it's terminator (if any)
                    if (FalseBlock != null)
                    {
                        term = FalseBlock.TerminatingContext;
                    }
                    else
                    {
                        // no else-block. Return the true-block's, if there is one.
                        term = TrueBlock.IfNotNull(b => b.TerminatingContext);
                    }
                }

                return term;
            }
        }

        public IfNode(Context context)
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

        public void SwapBranches()
        {
            Block temp = m_trueBlock;
            m_trueBlock = m_falseBlock;
            m_falseBlock = temp;
        }

        public override IEnumerable<AstNode> Children
        {
            get
            {
                return EnumerateNonNullNodes(Condition, TrueBlock, FalseBlock);
            }
        }

        public override bool ReplaceChild(AstNode oldNode, AstNode newNode)
        {
            if (Condition == oldNode)
            {
                Condition = newNode;
                return true;
            }
            if (TrueBlock == oldNode)
            {
                TrueBlock = ForceToBlock(newNode);
                return true;
            }
            if (FalseBlock == oldNode)
            {
                FalseBlock = ForceToBlock(newNode);
                return true;
            }
            return false;
        }

        internal override bool EncloseBlock(EncloseBlockType type)
        {
            // if there's an else block, recurse down that branch.
            // if we aren't forcing braces and the block contains nothing, then we don't
            // really have a false block.
            if (FalseBlock != null && (FalseBlock.ForceBraces || FalseBlock.Count > 0))
            {
                return FalseBlock.EncloseBlock(type);
            }
            else if (type == EncloseBlockType.IfWithoutElse)
            {
                // there is no else branch -- we might have to enclose the outer block
                return true;
            }
            else if (TrueBlock != null)
            {
                return TrueBlock.EncloseBlock(type);
            }
            return false;
        }
    }
}