// MatchPropertiesVisitor.cs
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
    /// This visitor has a Match method that takes a node and an string representing an identifier list separated by periods: IDENT(.IDENT)*
    /// </summary>
    public class MatchPropertiesVisitor : IVisitor
    {
        private string[] m_parts;
        private bool m_isMatch;
        private int m_index;

        public MatchPropertiesVisitor()
        {
        }

        public bool Match(AstNode node, string identifiers)
        {
            // set the match to false
            m_isMatch = false;

            // identifiers cannot be null or blank and must match: IDENT(.IDENT)*
            // since for JS there has to be at least a global object, the dot must be AFTER the first character.
            if (node != null && !string.IsNullOrEmpty(identifiers))
            {
                // get all the parts
                var parts = identifiers.Split('.');

                // each part must be a valid JavaScript identifier. Assume everything is valid
                // unless at least one is invalid -- then forget it
                var isValid = true;
                foreach (var part in parts)
                {
                    if (!JSScanner.IsValidIdentifier(part))
                    {
                        isValid = false;
                        break;
                    }
                }

                // must be valid to continue
                if (isValid)
                {
                    // save the parts and start the index on the last one, since we'll be walking backwards
                    m_parts = parts;
                    m_index = parts.Length - 1;

                    node.Accept(this);
                }
            }

            return m_isMatch;
        }

        public void Visit(CallNode node)
        {
            // only interested if the index is greater than zero, since the zero-index
            // needs to be a lookup. Also needs to be a brackets-call, and there needs to
            // be a single argument.
            if (node != null
                && m_index > 0
                && node.InBrackets
                && node.Arguments != null
                && node.Arguments.Count == 1)
            {
                // better be a constant wrapper, too
                var constantWrapper = node.Arguments[0] as ConstantWrapper;
                if (constantWrapper != null && constantWrapper.PrimitiveType == PrimitiveType.String)
                {
                    // check the value of the constant wrapper against the current part
                    if (string.CompareOrdinal(constantWrapper.Value.ToString(), m_parts[m_index--]) == 0)
                    {
                        // match! recurse the function after decrementing the index
                        node.Function.Accept(this);
                    }
                }
            }
        }

        public void Visit(Member node)
        {
            // only interested if the index is greater than zero, since the zero-index
            // needs to be a lookup.
            if (node != null && m_index > 0)
            {
                // check the Name property against the current part
                if (string.CompareOrdinal(node.Name, m_parts[m_index--]) == 0)
                {
                    // match! recurse the root after decrementing the index
                    node.Root.Accept(this);
                }
            }
        }

        public void Visit(Lookup node)
        {
            // we are only a match if we are looking for the first part
            if (node != null && m_index == 0)
            {
                // see if the name matches; and if there is a field, it should be a global
                if (string.CompareOrdinal(node.Name, m_parts[0]) == 0
                    && (node.VariableField == null || node.VariableField.FieldType == FieldType.UndefinedGlobal 
                    || node.VariableField.FieldType == FieldType.Global))
                {
                    // match!
                    m_isMatch = true;
                }
            }
        }

        public virtual void Visit(GroupingOperator node)
        {
            if (node != null && node.Operand != null)
            {
                // just totally ignore any parentheses
                node.Operand.Accept(this);
            }
        }

        #region IVisitor Members

        public void Visit(ArrayLiteral node)
        {
            // not applicable; terminate
        }

        public void Visit(AspNetBlockNode node)
        {
            // not applicable; terminate
        }

        public void Visit(AstNodeList node)
        {
            // not applicable; terminate
        }

        public void Visit(BinaryOperator node)
        {
            // not applicable; terminate
        }

        public void Visit(BindingIdentifier node)
        {
            // not applicable; terminate
        }

        public void Visit(Block node)
        {
            // not applicable; terminate
        }

        public void Visit(Break node)
        {
            // not applicable; terminate
        }

        public void Visit(ClassNode node)
        {
            // not applicable; terminate
        }

        public void Visit(ComprehensionNode node)
        {
            // not applicable; terminate
        }

        public void Visit(ComprehensionForClause node)
        {
            // not applicable; terminate
        }

        public void Visit(ComprehensionIfClause node)
        {
            // not applicable; terminate
        }

        public void Visit(ConditionalCompilationComment node)
        {
            // not applicable; terminate
        }

        public void Visit(ConditionalCompilationElse node)
        {
            // not applicable; terminate
        }

        public void Visit(ConditionalCompilationElseIf node)
        {
            // not applicable; terminate
        }

        public void Visit(ConditionalCompilationEnd node)
        {
            // not applicable; terminate
        }

        public void Visit(ConditionalCompilationIf node)
        {
            // not applicable; terminate
        }

        public void Visit(ConditionalCompilationOn node)
        {
            // not applicable; terminate
        }

        public void Visit(ConditionalCompilationSet node)
        {
            // not applicable; terminate
        }

        public void Visit(Conditional node)
        {
            // not applicable; terminate
        }

        public void Visit(ConstantWrapper node)
        {
            // not applicable; terminate
        }

        public void Visit(ConstantWrapperPP node)
        {
            // not applicable; terminate
        }

        public void Visit(ConstStatement node)
        {
            // not applicable; terminate
        }

        public void Visit(ContinueNode node)
        {
            // not applicable; terminate
        }

        public void Visit(CustomNode node)
        {
            // not applicable; terminate
        }

        public void Visit(DebuggerNode node)
        {
            // not applicable; terminate
        }

        public void Visit(DirectivePrologue node)
        {
            // not applicable; terminate
        }

        public void Visit(DoWhile node)
        {
            // not applicable; terminate
        }

        public void Visit(EmptyStatement node)
        {
            // not applicable; terminate
        }

        public void Visit(ExportNode node)
        {
            // not applicable; terminate
        }

        public void Visit(ForIn node)
        {
            // not applicable; terminate
        }

        public void Visit(ForNode node)
        {
            // not applicable; terminate
        }

        public void Visit(FunctionObject node)
        {
            // not applicable; terminate
        }

        public void Visit(GetterSetter node)
        {
            // not applicable; terminate
        }

        public void Visit(IfNode node)
        {
            // not applicable; terminate
        }

        public void Visit(ImportantComment node)
        {
            // not applicable; terminate
        }

        public void Visit(ImportExportSpecifier node)
        {
            // not applicable; terminate
        }

        public void Visit(ImportNode node)
        {
            // not applicable; terminate
        }

        public void Visit(InitializerNode node)
        {
            // not applicable; terminate
        }

        public void Visit(LabeledStatement node)
        {
            // not applicable; terminate
        }

        public void Visit(LexicalDeclaration node)
        {
            // not applicable; terminate
        }

        public void Visit(ModuleDeclaration node)
        {
            // not applicable; terminate
        }

        public void Visit(ObjectLiteral node)
        {
            // not applicable; terminate
        }

        public void Visit(ObjectLiteralField node)
        {
            // not applicable; terminate
        }

        public void Visit(ObjectLiteralProperty node)
        {
            // not applicable; terminate
        }

        public void Visit(ParameterDeclaration node)
        {
            // not applicable; terminate
        }

        public void Visit(RegExpLiteral node)
        {
            // not applicable; terminate
        }

        public void Visit(ReturnNode node)
        {
            // not applicable; terminate
        }

        public void Visit(Switch node)
        {
            // not applicable; terminate
        }

        public void Visit(SwitchCase node)
        {
            // not applicable; terminate
        }

        public void Visit(TemplateLiteral node)
        {
            // not applicable; terminate
        }

        public void Visit(TemplateLiteralExpression node)
        {
            // not applicable; terminate
        }

        public void Visit(ThisLiteral node)
        {
            // not applicable; terminate
        }

        public void Visit(ThrowNode node)
        {
            // not applicable; terminate
        }

        public void Visit(TryNode node)
        {
            // not applicable; terminate
        }

        public void Visit(UnaryOperator node)
        {
            // not applicable; terminate
        }

        public void Visit(Var node)
        {
            // not applicable; terminate
        }

        public void Visit(VariableDeclaration node)
        {
            // not applicable; terminate
        }

        public void Visit(WhileNode node)
        {
            // not applicable; terminate
        }

        public void Visit(WithNode node)
        {
            // not applicable; terminate
        }

        #endregion
    }
}
