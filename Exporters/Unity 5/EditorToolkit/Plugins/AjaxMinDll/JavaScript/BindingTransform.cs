// BindingsVisitor.cs
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


namespace Microsoft.Ajax.Utilities
{
    public static class BindingTransform
    {
        public static AstNode FromBinding(AstNode node)
        {
            return ConvertFromBinding(node);
        }

        public static AstNode ToBinding(AstNode node)
        {
            return ConvertToBinding(node);
        }

        public static AstNodeList ToParameters(AstNode node)
        {
            AstNodeList parameterList = null;
            if (node != null)
            {
                parameterList = new AstNodeList(node.Context);

                // ignore any parentheses around the parameter(s)
                var groupingOperator = node as GroupingOperator;
                RecurseParameters(
                    parameterList,
                    groupingOperator != null ? groupingOperator.Operand : node);
            }

            return parameterList;
        }

        #region from binding methods

        private static AstNode ConvertFromBinding(AstNode node)
        {
            ArrayLiteral arrayLiteral;
            ObjectLiteral objectLiteral;
            ObjectLiteralProperty objectProperty;
            var bindingIdentifier = node as BindingIdentifier;
            if (bindingIdentifier != null)
            {
                // convert binding identifier to a lookup (reference identifier)
                return ConvertFromBindingIdentifier(bindingIdentifier);
            }
            else if ((arrayLiteral = node as ArrayLiteral) != null)
            {
                return ConvertFromBindingArrayLiteral(arrayLiteral);
            }
            else if ((objectLiteral = node as ObjectLiteral) != null)
            {
                return ConvertFromBindingObjectLiteral(objectLiteral);
            }
            else if ((objectProperty = node as ObjectLiteralProperty) != null)
            {
                return ConvertFromBindingObjectProperty(objectProperty);
            }

            node.Context.HandleError(JSError.UnableToConvertFromBinding, true);
            return null;
        }

        private static Lookup ConvertFromBindingIdentifier(BindingIdentifier bindingIdentifier)
        {
            Lookup lookup = null;
            if (bindingIdentifier != null)
            {
                lookup = new Lookup(bindingIdentifier.Context)
                    {
                        Name = bindingIdentifier.Name,
                        VariableField = bindingIdentifier.VariableField
                    };

                // the binding is now referenced from the lookup
                bindingIdentifier.VariableField.IfNotNull(v => v.References.Add(lookup));
            }

            return lookup;
        }

        private static ArrayLiteral ConvertFromBindingArrayLiteral(ArrayLiteral bindingLiteral)
        {
            ArrayLiteral arrayLiteral = null;
            if (bindingLiteral != null)
            {
                arrayLiteral = new ArrayLiteral(bindingLiteral.Context)
                    {
                        TerminatingContext = bindingLiteral.TerminatingContext,
                    };
                if (bindingLiteral.Elements != null)
                {
                    arrayLiteral.Elements = new AstNodeList(bindingLiteral.Elements.Context);
                    foreach (var item in bindingLiteral.Elements)
                    {
                        arrayLiteral.Elements.Append(ConvertFromBinding(item));
                    }
                }
            }

            return arrayLiteral;
        }

        private static ObjectLiteral ConvertFromBindingObjectLiteral(ObjectLiteral bindingLiteral)
        {
            ObjectLiteral objectLiteral = null;
            if (bindingLiteral != null)
            {
                objectLiteral = new ObjectLiteral(bindingLiteral.Context)
                 {
                     TerminatingContext = bindingLiteral.TerminatingContext,
                 };

                if (bindingLiteral.Properties != null)
                {
                    objectLiteral.Properties = new AstNodeList(bindingLiteral.Properties.Context);
                    foreach (var property in bindingLiteral.Properties)
                    {
                        objectLiteral.Properties.Append(ConvertFromBinding(property));
                    }
                }
            }

            return objectLiteral;
        }

        private static ObjectLiteralProperty ConvertFromBindingObjectProperty(ObjectLiteralProperty bindingLiteral)
        {
            ObjectLiteralProperty prop = null;
            if (bindingLiteral != null)
            {
                prop = new ObjectLiteralProperty(bindingLiteral.Context)
                    {
                        Name = ConvertFromBindingObjectName(bindingLiteral.Name),
                        Value = ConvertFromBinding(bindingLiteral.Value),
                        TerminatingContext = bindingLiteral.TerminatingContext
                    };
            }

            return prop;
        }

        private static ObjectLiteralField ConvertFromBindingObjectName(ObjectLiteralField bindingLiteral)
        {
            ObjectLiteralField name = null;
            if (bindingLiteral != null)
            {
                name = new ObjectLiteralField(bindingLiteral.Name, bindingLiteral.PrimitiveType, bindingLiteral.Context)
                    {
                        ColonContext = bindingLiteral.ColonContext,
                        IsIdentifier = bindingLiteral.IsIdentifier,
                        MayHaveIssues = bindingLiteral.MayHaveIssues,
                        TerminatingContext = bindingLiteral.TerminatingContext
                    };
            }

            return name;
        }

        #endregion

        #region to binding methods

        private static AstNode ConvertToBinding(AstNode node)
        {
            ArrayLiteral arrayLiteral;
            ObjectLiteral objectLiteral;
            ObjectLiteralProperty objectProperty;
            ConstantWrapper constantWrapper;
            ImportExportSpecifier importExportSpecifier;

            var lookup = node as Lookup;
            if (lookup != null)
            {
                // convert binding identifier to a lookup (reference identifier)
                return ConvertToBindingIdentifier(lookup);
            }
            else if ((arrayLiteral = node as ArrayLiteral) != null)
            {
                return ConvertToBindingArrayLiteral(arrayLiteral);
            }
            else if ((objectLiteral = node as ObjectLiteral) != null)
            {
                return ConvertToBindingObjectLiteral(objectLiteral);
            }
            else if ((objectProperty = node as ObjectLiteralProperty) != null)
            {
                return ConvertToBindingObjectProperty(objectProperty);
            }
            else if ((constantWrapper = node as ConstantWrapper) != null
                && constantWrapper.Value == Missing.Value)
            {
                // must preserve missing constant values in array literals, too
                return constantWrapper;
            }
            else if ((importExportSpecifier = node as ImportExportSpecifier) != null)
            {
                return ConvertToBindingSpecifier(importExportSpecifier);
            }

            node.Context.HandleError(JSError.UnableToConvertToBinding, true);
            return null;
        }

        private static BindingIdentifier ConvertToBindingIdentifier(Lookup lookup)
        {
            BindingIdentifier bindingIdentifier = null;
            if (lookup != null)
            {
                bindingIdentifier = new BindingIdentifier(lookup.Context)
                    {
                        Name = lookup.Name,
                        VariableField = lookup.VariableField
                    };

                // the field now has another declaration, and one less reference
                lookup.VariableField.IfNotNull(v => 
                    {
                        v.Declarations.Add(bindingIdentifier);
                        v.References.Remove(lookup);
                    });
            }

            return bindingIdentifier;
        }

        private static ArrayLiteral ConvertToBindingArrayLiteral(ArrayLiteral arrayLiteral)
        {
            ArrayLiteral bindingLiteral = null;
            if (arrayLiteral != null)
            {
                bindingLiteral = new ArrayLiteral(arrayLiteral.Context)
                    {
                        TerminatingContext = arrayLiteral.TerminatingContext
                    };
                if (arrayLiteral.Elements != null)
                {
                    bindingLiteral.Elements = new AstNodeList(arrayLiteral.Elements.Context);
                    foreach (var item in arrayLiteral.Elements)
                    {
                        bindingLiteral.Elements.Append(ConvertToBinding(item));
                    }
                }
            }

            return bindingLiteral;
        }

        private static ObjectLiteral ConvertToBindingObjectLiteral(ObjectLiteral objectLiteral)
        {
            ObjectLiteral bindingLiteral = null;
            if (objectLiteral != null)
            {
                bindingLiteral = new ObjectLiteral(objectLiteral.Context)
                    {
                        TerminatingContext = objectLiteral.TerminatingContext
                    };

                if (objectLiteral.Properties != null)
                {
                    bindingLiteral.Properties = new AstNodeList(objectLiteral.Properties.Context);
                    foreach (var property in objectLiteral.Properties)
                    {

                        bindingLiteral.Properties.Append(ConvertToBinding(property));
                    }
                }
            }
             
            return bindingLiteral;
        }

        private static ObjectLiteralProperty ConvertToBindingObjectProperty(ObjectLiteralProperty objectProperty)
        {
            ObjectLiteralProperty newProperty = null;
            if (objectProperty != null)
            {
                newProperty = new ObjectLiteralProperty(objectProperty.Context)
                {
                    Name = ConvertToBindingObjectName(objectProperty.Name),
                    Value = ConvertToBinding(objectProperty.Value),
                    TerminatingContext = objectProperty.TerminatingContext
                };
            }

            return newProperty;
        }

        private static ObjectLiteralField ConvertToBindingObjectName(ObjectLiteralField objectName)
        {
            ObjectLiteralField newName = null;
            if (objectName != null)
            {
                newName = new ObjectLiteralField(objectName.Name, objectName.PrimitiveType, objectName.Context)
                    {
                        IsIdentifier = objectName.IsIdentifier,
                        ColonContext = objectName.ColonContext,
                        MayHaveIssues = objectName.MayHaveIssues,
                        TerminatingContext = objectName.TerminatingContext
                    };
            }

            return newName;
        }

        private static ImportExportSpecifier ConvertToBindingSpecifier(ImportExportSpecifier specifier)
        {
            // if there's a local identifier, we need to convert it to a binding.
            if (specifier != null && specifier.LocalIdentifier != null)
            {
                specifier.LocalIdentifier = ConvertToBinding(specifier.LocalIdentifier);
            }

            return specifier;
        }

        #endregion

        #region to parameter list

        private static void RecurseParameters(AstNodeList parameterList, AstNode node)
        {
            if (node != null)
            {
                // if this is a comma operator, then we need to 
                var binOp = node as BinaryOperator;
                if (binOp != null && binOp.OperatorToken == JSToken.Comma)
                {
                    // there are two or more parameters - recurse the list so we get them added left to right,
                    // converting each one to a binding object
                    RecurseParameters(parameterList, binOp.Operand1);

                    // comma operators can flatten lots of commas to an element on the left, and subsequent
                    // elements in a list on the right.
                    var rightList = binOp.Operand2 as AstNodeList;
                    if (rightList != null)
                    {
                        foreach (var listItem in rightList.Children)
                        {
                            parameterList.Append(ConvertToParameter(listItem, parameterList.Count));
                        }
                    }
                    else
                    {
                        // nope, just a single item
                        parameterList.Append(ConvertToParameter(binOp.Operand2, parameterList.Count));
                    }
                }
                else
                {
                    // nope; single operand to convert to a parameter
                    parameterList.Append(ConvertToParameter(node, 0));
                }
            }
        }

        private static ParameterDeclaration ConvertToParameter(AstNode node, int position)
        {
            var paramDecl = new ParameterDeclaration(node.Context)
                {
                    Position = position
                };

            // check to see if there's a unary spread operator
            var unaryOp = node as UnaryOperator;
            if (unaryOp != null && unaryOp.OperatorToken == JSToken.RestSpread)
            {
                // there is. convert the operand and set the has-rest property
                paramDecl.HasRest = true;
                paramDecl.RestContext = unaryOp.OperatorContext;
                paramDecl.Binding = ConvertToBinding(unaryOp.Operand);
            }
            else
            {
                // check to see if there's an assignment operator. If so, then the right hand side is the initializer.
                // or if there's a unary rest, in which case this is a rest operation.
                var binOp = node as BinaryOperator;
                if (binOp != null && binOp.OperatorToken == JSToken.Assign)
                {
                    // initializer
                    paramDecl.AssignContext = binOp.OperatorContext;
                    paramDecl.Initializer = binOp.Operand2;

                    // and binding
                    paramDecl.Binding = ConvertToBinding(binOp.Operand1);
                }
                else
                {
                    // no initializer
                    paramDecl.Binding = ConvertToBinding(node);
                }
            }

            // if we couldn't get a binding, then ignore this entire parameter
            // (which will lose it and its initializer, if any)
            return paramDecl.Binding != null ? paramDecl : null;
        }

        #endregion
    }
}
