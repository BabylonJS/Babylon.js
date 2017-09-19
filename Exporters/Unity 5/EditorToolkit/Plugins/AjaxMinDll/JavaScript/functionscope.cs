// functionscope.cs
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
using System.Reflection;

namespace Microsoft.Ajax.Utilities
{
    public sealed class FunctionScope : ActivationObject
    {
        private HashSet<ActivationObject> m_refScopes;

        internal FunctionScope(ActivationObject parent, bool isExpression, CodeSettings settings, FunctionObject funcObj)
            : base(parent, settings)
        {
            ScopeType = ScopeType.Function;
            m_refScopes = new HashSet<ActivationObject>();
            if (isExpression)
            {
                // parent scopes automatically reference enclosed function expressions
                AddReference(Parent);
            }

            Owner = funcObj;
        }

        #region scope setup methods

        /// <summary>
        /// Set up this scopes lexically- and var-declared fields, plus formal parameters and the arguments object
        /// </summary>
        public override void DeclareScope()
        {
            // we are a function expression that points to a function object. 
            // if the function object points back to us, then this is the main
            // function scope. But if it doesn't, then this is actually the parent
            // scope for named function expressions that should contain just a field
            // for the function name
            if (((FunctionObject)Owner).EnclosingScope == this)
            {
                // first bind any parameter names
                DefineParameters();

                // bind lexical declarations next
                DefineLexicalDeclarations();

                // bind the arguments object if this is a function scope
                DefineArgumentsObject();

                // bind the variable declarations
                DefineVarDeclarations();
            }
            else
            {
                // we just need to define the function name in this scope
                DefineFunctionExpressionName();
            }
        }

        private void DefineFunctionExpressionName()
        {
            var functionObject = (FunctionObject)Owner;

            // add a field for the function expression name so it can be self-referencing.
            var functionField = this.CreateField(functionObject.Binding.Name, functionObject, 0);
            functionField.IsFunction = true;
            functionField.OriginalContext = functionObject.Binding.Context;

            functionObject.Binding.VariableField = functionField;

            this.AddField(functionField);
        }

        private void DefineParameters()
        {
            var functionObject = (FunctionObject)Owner;
            if (functionObject.ParameterDeclarations != null)
            {
                // for each parameter...
                foreach (ParameterDeclaration parameter in functionObject.ParameterDeclarations)
                {
                    foreach (var nameDeclaration in BindingsVisitor.Bindings(parameter.Binding))
                    {
                        // see if it's already defined
                        var argumentField = this[nameDeclaration.Name];
                        if (argumentField == null)
                        {
                            // not already defined -- create a field now
                            argumentField = new JSVariableField(FieldType.Argument, nameDeclaration.Name, 0, null)
                            {
                                Position = parameter.Position,
                                OriginalContext = parameter.Context,
                                CanCrunch = !nameDeclaration.RenameNotAllowed
                            };

                            this.AddField(argumentField);
                        }

                        // make the parameter reference the field and the field reference
                        // the parameter as its declaration
                        nameDeclaration.VariableField = argumentField;
                        argumentField.Declarations.Add(nameDeclaration);
                    }
                }
            }
        }

        private void DefineArgumentsObject()
        {
            // this one is easy: if it's not already defined, define it now
            const string name = "arguments";
            if (this[name] == null)
            {
                this.AddField(new JSVariableField(FieldType.Arguments, name, 0, null));
            }
        }

        #endregion

        public override JSVariableField CreateField(string name, object value, FieldAttributes attributes)
        {
            return new JSVariableField(FieldType.Local, name, attributes, value);
        }

        internal void AddReference(ActivationObject scope)
        {
            // we don't want to include block scopes or with scopes -- they are really
            // contained within their parents
            while (scope != null && scope is BlockScope)
            {
                scope = scope.Parent;
            }

            if (scope != null)
            {
                // add the scope to the hash
                m_refScopes.Add(scope);
            }
        }
    }
}
