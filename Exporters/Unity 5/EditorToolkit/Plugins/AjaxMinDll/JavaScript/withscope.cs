// withscope.cs
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

using System.Reflection;

namespace Microsoft.Ajax.Utilities
{
    public sealed class WithScope : BlockScope
    {
        public WithScope(ActivationObject parent, CodeSettings settings)
            : base(parent, settings, ScopeType.With)
        {
            IsInWithScope = true;
        }

        public override JSVariableField CreateInnerField(JSVariableField outerField)
        {
            return outerField.IfNotNull(o =>
            {
                // blindly create an inner reference field for with scopes, no matter what it
                // is. globals and predefined values can be hijacked by object properties in
                // this scope.
                var withField = AddField(CreateField(outerField));

                // and we need to make sure that any field that may be referenced from inside
                // a with-statement does not get automatically renamed
                outerField.CanCrunch = false;

                // if the outer field is an undefined global, then we want to flag it with a
                // special attribute that tells us that it might not actually be an undefined global,
                // because it might just be a property reference on the with-object.
                if (outerField.FieldType == FieldType.UndefinedGlobal)
                {
                    do
                    {
                        outerField.Attributes |= FieldAttributes.RTSpecialName;
                    } while ((outerField = outerField.OuterField) != null);
                }

                return withField;
            });
        }

        /// <summary>
        /// Set up this scopes lexically-declared fields
        /// </summary>
        public override void DeclareScope()
        {
            // only bind lexical declarations
            DefineLexicalDeclarations();

            // however, take a look at the var-decl fields and make sure that
            // their fields all get marked as cannot-rename.
            foreach (var varDecl in VarDeclaredNames)
            {
                if (varDecl.VariableField != null)
                {
                    varDecl.VariableField.CanCrunch = false;
                }
            }
        }

        public override JSVariableField CreateField(JSVariableField outerField)
        {
            // when we create a field inside a with-scope, it's ALWAYS a with-field, no matter
            // what type the outer reference is.
            return new JSVariableField(FieldType.WithField, outerField);
        }

        public override JSVariableField CreateField(string name, object value, FieldAttributes attributes)
        {
            return new JSVariableField(FieldType.WithField, name, attributes, null);
        }
    }
}
