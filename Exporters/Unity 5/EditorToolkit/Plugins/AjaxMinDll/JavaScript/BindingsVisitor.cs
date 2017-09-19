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

using System.Collections.Generic;

namespace Microsoft.Ajax.Utilities
{
    public class BindingsVisitor : IVisitor
    {
        private IList<BindingIdentifier> m_bindings;
        private IList<Lookup> m_lookups;

        private BindingsVisitor()
        {
            m_bindings = new List<BindingIdentifier>();
            m_lookups = new List<Lookup>();
        }

        /// <summary>
        /// For the given binding node, return a collection of individual INameDeclaration
        /// nodes that represent the names being declared for this binding element.
        /// </summary>
        /// <param name="node">binding node</param>
        /// <returns>collection of INameDeclaration nodes</returns>
        public static IList<BindingIdentifier> Bindings(AstNode node)
        {
            var visitor = new BindingsVisitor();
            if (node != null)
            {
                node.Accept(visitor);
            }

            return visitor.m_bindings;
        }

        /// <summary>
        /// For the given binding node, return a collection of individual lookup
        /// nodes that represent the names being referenced.
        /// </summary>
        /// <param name="node">binding node</param>
        /// <returns>collection of Lookup nodes</returns>
        public static IList<Lookup> References(AstNode node)
        {
            var visitor = new BindingsVisitor();
            if (node != null)
            {
                node.Accept(visitor);
            }

            return visitor.m_lookups;
        }

        #region IVisitor methods that contribute

        public void Visit(ArrayLiteral node)
        {
            // recurse each element
            node.IfNotNull(n => n.Elements.ForEach(e => e.Accept(this)));
        }

        public void Visit(AstNodeList node)
        {
            // add the names for each item in the list
            // this assumes that the items are name declarations!
            // (like parameter lists)
            if (node != null)
            {
                var count = node.Count;
                for (var i = 0; i < count; i++)
                {
                    var itemNode = node[i];
                    if (itemNode != null)
                    {
                        itemNode.Accept(this);
                    }
                }
            }
        }

        public void Visit(BindingIdentifier node)
        {
            // the binding identifier is the individual bound name
            node.IfNotNull(n => m_bindings.Add(n));
        }

        public void Visit(ClassNode node)
        {
            // recurse the class binding
            if (node != null && node.Binding != null)
            {
                node.Binding.Accept(this);
            }
        }

        public void Visit(ConstantWrapper node)
        {
            // elisions in rrays are allowed, but don't recurse or contribute.
            // nothing else is allowed, though.
            if (node != null && node.Value != Missing.Value)
            {
                ReportError(node);
            }
        }

        public void Visit(ConstStatement node)
        {
            // add the names for each vardecl in the statement
            node.IfNotNull(n => n.Children.ForEach(v => v.Accept(this)));
        }

        public void Visit(CustomNode node)
        {
            // ignore, but don't throw error
        }

        public void Visit(ExportNode node)
        {
            if (node != null)
            {
                foreach (var specifier in node)
                {
                    specifier.Accept(this);
                }
            }
        }

        public void Visit(FunctionObject node)
        {
            // recurse the function binding
            if (node != null && node.Binding != null)
            {
                node.Binding.Accept(this);
            }
        }

        public void Visit(InitializerNode node)
        {
            // recurse the value, not the initializer
            node.IfNotNull(n => n.Binding.IfNotNull(v => v.Accept(this)));
        }

        public void Visit(ImportExportSpecifier node)
        {
            if (node != null)
            {
                // this nodes local identifier might be a binding identifier and it might be a lookup.
                // we only care about binding identifiers
                var bindingIdentifier = node.LocalIdentifier as BindingIdentifier;
                if (bindingIdentifier != null)
                {
                    m_bindings.Add(bindingIdentifier);
                }
            }
        }

        public void Visit(ImportNode node)
        {
            if (node != null)
            {
                foreach (var specifier in node)
                {
                    specifier.Accept(this);
                }
            }
        }

        public void Visit(LexicalDeclaration node)
        {
            // add the names for each vardecl in the statement
            node.IfNotNull(n => n.Children.ForEach(v => v.Accept(this)));
        }

        public void Visit(Lookup node)
        {
            // add the lookup to the list
            node.IfNotNull(n => m_lookups.Add(n));
        }

        public void Visit(ModuleDeclaration node)
        {
            if (node != null && node.Binding != null)
            {
                m_bindings.Add(node.Binding);
            }
        }

        public void Visit(ObjectLiteral node)
        {
            // recurse the properties
            node.IfNotNull(n => n.Properties.ForEach(p => p.Accept(this)));
        }

        public void Visit(ObjectLiteralProperty node)
        {
            // the value is another binding pattern
            node.IfNotNull(n => n.Value.IfNotNull(v => v.Accept(this)));
        }

        public void Visit(ParameterDeclaration node)
        {
            // add the names from the binding, but ignore any initializers
            if (node != null)
            {
                var binding = node.Binding;
                if (binding != null)
                {
                    binding.Accept(this);
                }
            }
        }

        public void Visit(Var node)
        {
            // add the names for each vardecl in the statement
            node.IfNotNull(n => n.Children.ForEach(v => v.Accept(this)));
        }

        public void Visit(VariableDeclaration node)
        {
            // add the names from the binding, but ignore any initializers
            node.IfNotNull(n => n.Binding.IfNotNull(b => b.Accept(this)));
        }

        #endregion

        #region IVisitor methods that are bad binding syntax

        private static void ReportError(AstNode node)
        {
            node.IfNotNull(n => n.Context.IfNotNull(c => c.HandleError(JSError.BadBindingSyntax, true)));
        }

        public void Visit(AspNetBlockNode node)
        {
            ReportError(node);
        }

        public void Visit(BinaryOperator node)
        {
            ReportError(node);
        }

        public void Visit(Block node)
        {
            ReportError(node);
        }

        public void Visit(Break node)
        {
            ReportError(node);
        }

        public void Visit(CallNode node)
        {
            ReportError(node);
        }

        public void Visit(ComprehensionNode node)
        {
            ReportError(node);
        }

        public void Visit(ComprehensionForClause node)
        {
            ReportError(node);
        }

        public void Visit(ComprehensionIfClause node)
        {
            ReportError(node);
        }

        public void Visit(ConditionalCompilationComment node)
        {
            ReportError(node);
        }

        public void Visit(ConditionalCompilationElse node)
        {
            ReportError(node);
        }

        public void Visit(ConditionalCompilationElseIf node)
        {
            ReportError(node);
        }

        public void Visit(ConditionalCompilationEnd node)
        {
            ReportError(node);
        }

        public void Visit(ConditionalCompilationIf node)
        {
            ReportError(node);
        }

        public void Visit(ConditionalCompilationOn node)
        {
            ReportError(node);
        }

        public void Visit(ConditionalCompilationSet node)
        {
            ReportError(node);
        }

        public void Visit(Conditional node)
        {
            ReportError(node);
        }

        public void Visit(ConstantWrapperPP node)
        {
            ReportError(node);
        }

        public void Visit(ContinueNode node)
        {
            ReportError(node);
        }

        public void Visit(DebuggerNode node)
        {
            ReportError(node);
        }

        public void Visit(DirectivePrologue node)
        {
            ReportError(node);
        }

        public void Visit(DoWhile node)
        {
            ReportError(node);
        }

        public void Visit(EmptyStatement node)
        {
            ReportError(node);
        }

        public void Visit(ForIn node)
        {
            ReportError(node);
        }

        public void Visit(ForNode node)
        {
            ReportError(node);
        }

        public void Visit(GetterSetter node)
        {
            ReportError(node);
        }

        public void Visit(GroupingOperator node)
        {
            ReportError(node);
        }

        public void Visit(IfNode node)
        {
            ReportError(node);
        }

        public void Visit(ImportantComment node)
        {
            ReportError(node);
        }

        public void Visit(LabeledStatement node)
        {
            ReportError(node);
        }

        public void Visit(Member node)
        {
            ReportError(node);
        }

        public void Visit(ObjectLiteralField node)
        {
            ReportError(node);
        }

        public void Visit(RegExpLiteral node)
        {
            ReportError(node);
        }

        public void Visit(ReturnNode node)
        {
            ReportError(node);
        }

        public void Visit(Switch node)
        {
            ReportError(node);
        }

        public void Visit(SwitchCase node)
        {
            ReportError(node);
        }

        public void Visit(TemplateLiteral node)
        {
            ReportError(node);
        }

        public void Visit(TemplateLiteralExpression node)
        {
            ReportError(node);
        }

        public void Visit(ThisLiteral node)
        {
            ReportError(node);
        }

        public void Visit(ThrowNode node)
        {
            ReportError(node);
        }

        public void Visit(TryNode node)
        {
            ReportError(node);
        }

        public void Visit(UnaryOperator node)
        {
            ReportError(node);
        }

        public void Visit(WhileNode node)
        {
            ReportError(node);
        }

        public void Visit(WithNode node)
        {
            ReportError(node);
        }

        #endregion
    }
}
