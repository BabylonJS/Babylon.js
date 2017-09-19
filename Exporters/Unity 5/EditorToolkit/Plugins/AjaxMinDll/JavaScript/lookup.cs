// lookup.cs
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

namespace Microsoft.Ajax.Utilities
{
    public enum ReferenceType
    {
        Variable,
        Function,
        Constructor
    }


    public sealed class Lookup : Expression, INameReference, IRenameable
    {
        public JSVariableField VariableField { get; set; }

        public bool IsGenerated { get; set; }
        public ReferenceType RefType { get; set; }
        public string Name { get; set; }

        public bool IsAssignment
        {
            get
            {
                var isAssign = false;

                // see if our parent is a binary operator.
                var binaryOp = Parent as BinaryOperator;
                if (binaryOp != null)
                {
                    // if we are, we are an assignment lookup if the binary operator parent is an assignment
                    // and we are the left-hand side.
                    isAssign = binaryOp.IsAssign && binaryOp.Operand1 == this;
                }
                else
                {
                    // not a binary op -- but we might still be an "assignment" if we are an increment or decrement operator.
                    var unaryOp = Parent as UnaryOperator;
                    isAssign = unaryOp != null
                        && (unaryOp.OperatorToken == JSToken.Increment || unaryOp.OperatorToken == JSToken.Decrement);

                    if (!isAssign)
                    {
                        // AND if we are the variable of a for-in statement, we are an "assignment".
                        // (if the forIn variable is a var, then it wouldn't be a lookup, so we don't have to worry about
                        // going up past a var-decl intermediate node)
                        var forIn = Parent as ForIn;
                        isAssign = forIn != null && this == forIn.Variable;
                    }
                }

                return isAssign;
            }
        }

        public AstNode AssignmentValue
        {
            get
            {
                AstNode value = null;

                // see if our parent is a binary operator.
                var binaryOp = Parent as BinaryOperator;
                if (binaryOp != null)
                {
                    // the parent is a binary operator. If it is an assignment operator 
                    // (not including any of the op-assign which depend on an initial value)
                    // then the value we are assigning is the right-hand side of the = operator.
                    value = binaryOp.OperatorToken == JSToken.Assign && binaryOp.Operand1 == this ? binaryOp.Operand2 : null;
                }

                return value;
            }
        }

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

        public Lookup(Context context)
            : base(context)
        {
            RefType = ReferenceType.Variable;
        }

        public override void Accept(IVisitor visitor)
        {
            if (visitor == null) return;
            visitor.Visit(this);
        }

        public override bool IsEquivalentTo(AstNode otherNode)
        {
            // this one is tricky. If we have a field assigned, then we are equivalent if the
            // field is the same as the other one. If there is no field, then just check the name
            var otherLookup = otherNode as Lookup;
            if (otherLookup != null)
            {
                if (VariableField != null)
                {
                    // the variable fields should be the same
                    return VariableField.IsSameField(otherLookup.VariableField);
                }
                else
                {
                    // otherwise the names should be identical
                    return string.CompareOrdinal(Name, otherLookup.Name) == 0;
                }
            }

            // if we get here, we're not equivalent
            return false;
        }

        internal override string GetFunctionGuess(AstNode target)
        {
            // return the source name
            return Name;
        }

        //code in parser relies on this.name being returned from here
        public override String ToString()
        {
            return Name;
        }

        #region INameReference Members

        public ActivationObject VariableScope
        {
            get
            {
                // get the enclosing scope from the node, but that might be 
                // a block scope -- we only want variable scopes: functions or global.
                // so walk up until we find one.
                var enclosingScope = this.EnclosingScope;
                while (enclosingScope is BlockScope)
                {
                    enclosingScope = enclosingScope.Parent;
                }

                return enclosingScope;
            }
        }

        #endregion
    }
}
