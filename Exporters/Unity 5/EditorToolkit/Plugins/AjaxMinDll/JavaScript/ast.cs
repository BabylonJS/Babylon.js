// ast.cs
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

namespace Microsoft.Ajax.Utilities
{
    internal enum EncloseBlockType
    {
        IfWithoutElse,
        SingleDoWhile
    }

    /// <summary>
    /// Abstract syntax tree node
    /// </summary>
    public abstract class AstNode
    {
        // this is used in the child enumeration for nodes that don't have any children
        private static readonly IEnumerable<AstNode> s_emptyChildrenCollection = new AstNode[0];

        private ActivationObject m_enclosingScope;

        /// <summary>
        /// Gets or sets the parent node of this node in the abstract syntax tree
        /// </summary>
        public AstNode Parent { get; set; }

        /// <summary>
        /// Gets or sets the source context of this node
        /// </summary>
        public Context Context { get; set; }

        /// <summary>the context of any terminating character parsed after this node
        /// e.g. the semicolon after a statement or a comma in a parameter list</summary>
        public virtual Context TerminatingContext { get; set; }

        /// <summary>
        /// Gets a boolean flag indicating whether this node is an expression
        /// </summary>
        public virtual bool IsExpression { get { return false; } }

        /// <summary>
        /// Gets a boolean flag indicating whether this node is a constant expression
        /// </summary>
        public virtual bool IsConstant { get { return false; } }

        /// <summary>
        /// Gets or sets a flag indicating whether we have analyzed this statement and determined it
        /// to be for a debug-only build 
        /// </summary>
        public bool IsDebugOnly { get; set; }

        /// <summary>
        /// Gets or sets the order-execution index for the node's function scope
        /// </summary>
        public long Index { get; set; }

        /// <summary>
        /// Gets the order precedence of this node, if it is an expression
        /// </summary>
        public virtual OperatorPrecedence Precedence
        {
            get { return OperatorPrecedence.None; }
        }

        /// <summary>
        /// Gets or sets a flag indicting whether this node is a declaration
        /// </summary>
        public virtual bool IsDeclaration
        {
            get { return false; }
        }

        /// <summary>
        /// Gets a boolean value representing whether this node is a Lookup node resolving to the global predefined window object.
        /// </summary>
        public bool IsWindowLookup
        {
            get
            {
                Lookup lookup = this as Lookup;
                return (lookup != null
                        && string.CompareOrdinal(lookup.Name, "window") == 0
                        && (lookup.VariableField == null || lookup.VariableField.FieldType == FieldType.Predefined));
            }
        }

        /// <summary>
        /// Gets the syntax tree node representing the leftmost portion of this node's subtree.
        /// </summary>
        public virtual AstNode LeftHandSide
        {
            get
            {
                // default is just to return ourselves
                return this;
            }
        }

        /// <summary>
        /// Get the enclosing lexical scope for this node.
        /// </summary>
        public virtual ActivationObject EnclosingScope
        {
            get
            {
                // if we don't have our own scope, ask the parent for theirs
                return m_enclosingScope ?? (Parent == null ? null : Parent.EnclosingScope);
            }
            set
            {
                m_enclosingScope = value;
            }
        }

        /// <summary>
        /// Gets a flag indicating whether or not this node has its own associated scope, or relies on a parent node's scope
        /// </summary>
        public bool HasOwnScope
        {
            get { return m_enclosingScope != null; }
        }

        /// <summary>
        /// Gets an enumeration representing the child nodes of this node in the abstract syntax tree
        /// </summary>
        public virtual IEnumerable<AstNode> Children
        {
            get { return s_emptyChildrenCollection; }
        }

        /// <summary>
        /// Returns true if the node contains an in-operator
        /// </summary>
        public virtual bool ContainsInOperator
        {
            get
            {
                // recursivelt check all children
                foreach (var child in Children)
                {
                    if (child.ContainsInOperator)
                    {
                        return true;
                    }
                }

                // if we get here, we didn'thave any in-operators
                return false;
            }
        }

        protected AstNode(Context context)
        {
            if (context == null)
            {
                throw new ArgumentNullException("context");
            }

            Context = context;
        }

        internal virtual string GetFunctionGuess(AstNode target)
        {
            // most objects serived from AST return an empty string
            return string.Empty;
        }

        internal virtual bool EncloseBlock(EncloseBlockType type)
        {
            // almost all statements return false
            return false;
        }

        /// <summary>
        /// Gets a valid indicating the primitive JavaScript type of this node, if known.
        /// </summary>
        /// <returns></returns>
        public virtual PrimitiveType FindPrimitiveType()
        {
            // by default, we don't know what the primitive type of this node is
            return PrimitiveType.Other;
        }

        /// <summary>
        /// Replace this node's specified child with another given node. 
        /// </summary>
        /// <param name="oldNode">Child node to be replaced</param>
        /// <param name="newNode">New node with which to replace the existing child node</param>
        /// <returns>true if the replacement succeeded; false otherwise</returns>
        public virtual bool ReplaceChild(AstNode oldNode, AstNode newNode)
        {
            return false;
        }

        /// <summary>
        /// Abstract method to be implemented by every concrete class.
        /// Returns true of the other object is equivalent to this object
        /// </summary>
        /// <param name="otherNode"></param>
        /// <returns></returns>
        public virtual bool IsEquivalentTo(AstNode otherNode)
        {
            // by default nodes aren't equivalent to each other unless we know FOR SURE that they are
            return false;
        }

        /// <summary>
        /// Gets a boolean value representing whether this node is a Lookup node resolving to the global name, or
        /// a member off the global window object with the given name.
        /// </summary>
        public bool IsGlobalNamed(string name)
        {
            if (name != null)
            {
                var lookup = this as Lookup;
                if (lookup != null
                    && lookup.VariableField != null
                    && (lookup.VariableField.FieldType == FieldType.Global || lookup.VariableField.FieldType == FieldType.Predefined || lookup.VariableField.FieldType == FieldType.UndefinedGlobal)
                    && name.Equals(lookup.Name, StringComparison.Ordinal))
                {
                    // match on a lookup pointing to a global with that name
                    return true;
                }

                var member = this as Member;
                if (member != null
                    && member.Root != null
                    && member.Root.IsWindowLookup
                    && name.Equals(member.Name, StringComparison.Ordinal))
                {
                    // match on a member lookup off the global object with the target name
                    return true;
                }
            }

            // nope
            return false;
        }

        /// <summary>
        /// Abstract method to be implemented by every concrete node class
        /// </summary>
        /// <param name="visitor">visitor to accept</param>
        public abstract void Accept(IVisitor visitor);

        public void UpdateWith(Context context)
        {
            if (context != null)
            {
                if (this.Context == null)
                {
                    this.Context = context;
                }
                else
                {
                    this.Context.UpdateWith(context);
                }
            }
        }

        public static Block ForceToBlock(AstNode node)
        {
            // if the node is null or already a block, then we're 
            // good to go -- just return it.
            var block = node as Block;
            if (block == null && node != null)
            {
                // it's not a block, so create a new block, append the astnode
                // and return the block
                block = new Block(node.Context.Clone());
                block.Append(node);
            }

            return block;
        }

        internal static IEnumerable<AstNode> FastEnumerateNonNullNodes<T>(IList<T> nodes) where T : AstNode
        {
            var hasNull = false;
            for (var ndx = 0; ndx < nodes.Count; ++ndx)
            {
                if (nodes[ndx] != null)
                {
                    hasNull = true;
                    break;
                }
            }

            if (hasNull)
            {
                return EnumerateNonNullNodes(nodes);
            }

            // Return the original list, avoid allocation using yield return
            return (IEnumerable<AstNode>)nodes;
        }

        internal static IEnumerable<AstNode> EnumerateNonNullNodes<T>(IList<T> nodes) where T : AstNode
        {
            for (int ndx = 0; ndx < nodes.Count; ++ndx)
            {
                if (nodes[ndx] != null)
                {
                    yield return nodes[ndx];
                }
            }
        }

        internal static IEnumerable<AstNode> EnumerateNonNullNodes(AstNode n1, AstNode n2 = null, AstNode n3 = null, AstNode n4 = null)
        {
            return EnumerateNonNullNodes(new[] { n1, n2, n3, n4 });
        }

        internal void UnlinkParent(AstNode node)
        {
            if ((node != null) && (node.Parent == this))
            {
                node.Parent = null;
            }
        }

        internal void ReplaceNode<T>(ref T node, T value) where T: AstNode
        {
            UnlinkParent(node);

            node = value;
            if (node != null)
            {
                node.Parent = this;
            }
        }
    }
}
