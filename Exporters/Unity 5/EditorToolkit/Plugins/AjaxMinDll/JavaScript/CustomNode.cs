// CustomNode.cs
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

namespace Microsoft.Ajax.Utilities
{
    /// <summary>
    /// This is a base-class for any custom AST nodes someone may want to implement. It allows 
    /// these nodes to be hooked into the IVisitor framework. If you wish to create custom AST nodes,
    /// derive from this class.
    /// </summary>
    public class CustomNode : AstNode
    {
        public CustomNode(Context context)
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

        /// <summary>
        /// Gets whether to add a semicolon after the node when another node follows this inside a block
        /// </summary>
        internal virtual bool RequiresSeparator
        {
            get
            {
                // by default, custom nodes will get semicolons inserted after them.
                // override this method in your own custom node if that is not the desired behavior.
                return true;
            }
        }

        /// <summary>
        /// Gets whether the custom node is a debugger statement and should be stripped for release builds
        /// </summary>
        internal virtual bool IsDebuggerStatement
        {
            get
            {
                // by default, custom nodes are not debug-only statements.
                // override this method in your own custom node if that is not the desired behavior.
                return false;
            }
        }

        public virtual string ToCode()
        {
            // by default, this node produces nothing in the output.
            // the OutputVisitor will output the results of ToCode, so
            // any derived class that wants to insert code into the output
            // should override this method.
            return string.Empty;
        }
    }
}
