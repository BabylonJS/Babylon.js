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

using System.Diagnostics;

namespace Microsoft.Ajax.Utilities
{
    /// <summary>
    /// Determines whether or not a node needs parentheses around it within a new operator
    /// </summary>
    internal class NewParensVisitor : IVisitor
    {
        private bool m_needsParens;// = false;
        private bool m_outerHasNoArguments;

        public static bool NeedsParens(AstNode expression, bool outerHasNoArguments)
        {
            var visitor = new NewParensVisitor(outerHasNoArguments);
            expression.Accept(visitor);
            return visitor.m_needsParens;
        }

        private NewParensVisitor(bool outerHasNoArguments)
        {
            // save whether or not the outer new-operator has any arguments itself
            m_outerHasNoArguments = outerHasNoArguments;
        }

        #region IVisitor Members

        public void Visit(ArrayLiteral node)
        {
            // don't recurse; we don't need parens around this
        }

        public void Visit(AspNetBlockNode node)
        {
            // don't bother recursing, but let's wrap in parens, just in case 
            // (since we don't know what will be inserted here)
            m_needsParens = true;
        }

        public void Visit(BinaryOperator node)
        {
            // lesser precedence than the new operator; use parens
            m_needsParens = true;
        }

        public void Visit(BindingIdentifier node)
        {
            // we're good
        }

        public void Visit(CallNode node)
        {
            if (node != null)
            {
                if (node.InBrackets)
                {
                    // if this is a member-bracket operation, then *we* don't need parens, but we shoul
                    // recurse the function in case something in there does
                    node.Function.Accept(this);
                }
                else if (!node.IsConstructor)
                {
                    // we have parens for our call arguments, so we definitely
                    // need to be wrapped and there's no need to recurse
                    m_needsParens = true;
                }
                else
                {
                    // we are a new-operator - if we have any arguments then we're good to go
                    // because those arguments will be associated with us, not the outer new.
                    // but if we don't have any arguments, we might need to be wrapped in parens
                    // so any outer arguments don't get associated with us
                    if (node.Arguments == null || node.Arguments.Count == 0)
                    {
                        m_needsParens = !m_outerHasNoArguments;
                    }
                }
            }
            else
            {
                // shouldn't happen, but we're a call so let's wrap in parens
                m_needsParens = true;
            }
        }

        public void Visit(ClassNode node)
        {
            // we're good
        }

        public void Visit(ComprehensionNode node)
        {
            // we're good. We are either an array comprehension, in which case we start
            // with a [ character, or a generator comprehension, in which case we start
            // with a ( character. No need for another set of parens.
        }

        public void Visit(ConditionalCompilationComment node)
        {
            if (node != null)
            {
                // recurse the children, but as soon as we get the flag set to true, bail
                foreach (var child in node.Children)
                {
                    child.Accept(this);
                    if (m_needsParens)
                    {
                        break;
                    }
                }
            }
        }

        public void Visit(ConditionalCompilationElse node)
        {
            // preprocessor nodes are handled outside the real JavaScript parsing
        }

        public void Visit(ConditionalCompilationElseIf node)
        {
            // preprocessor nodes are handled outside the real JavaScript parsing
        }

        public void Visit(ConditionalCompilationEnd node)
        {
            // preprocessor nodes are handled outside the real JavaScript parsing
        }

        public void Visit(ConditionalCompilationIf node)
        {
            // preprocessor nodes are handled outside the real JavaScript parsing
        }

        public void Visit(ConditionalCompilationOn node)
        {
            // preprocessor nodes are handled outside the real JavaScript parsing
        }

        public void Visit(ConditionalCompilationSet node)
        {
            // preprocessor nodes are handled outside the real JavaScript parsing
        }

        public void Visit(Conditional node)
        {
            // lesser precedence than the new operator; use parens
            m_needsParens = true;
        }

        public void Visit(ConstantWrapper node)
        {
            // we're good
        }

        public void Visit(ConstantWrapperPP node)
        {
            // we're good
        }

        public void Visit(CustomNode node)
        {
            // we're good
        }

        public void Visit(FunctionObject node)
        {
            // we're good
        }

        public virtual void Visit(GroupingOperator node)
        {
            // definitely does NOT need parens, because we will
            // output parens ourselves. And don't bother recursing.
        }

        public void Visit(ImportantComment node)
        {
            // we're good?
        }

        public void Visit(Lookup node)
        {
            // we're good
        }

        public void Visit(Member node)
        {
            // need to recurse the collection
            if (node != null)
            {
                node.Root.Accept(this);
            }
        }

        public void Visit(ObjectLiteral node)
        {
            // we're good
        }

        public void Visit(ParameterDeclaration node)
        {
            // we're good
        }

        public void Visit(RegExpLiteral node)
        {
            // we're good
        }

        public void Visit(TemplateLiteral node)
        {
            // we're good
        }

        public void Visit(ThisLiteral node)
        {
            // we're good
        }

        public void Visit(UnaryOperator node)
        {
            // lesser precedence than the new operator; use parens
            m_needsParens = true;
        }

        #endregion

        #region nodes we shouldn't hit

        //
        // expression elements we shouldn't get to
        //

        public void Visit(AstNodeList node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(GetterSetter node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(ObjectLiteralField node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(ObjectLiteralProperty node)
        {
            Debug.Fail("shouldn't get here");
        }

        //
        // statements (we should only hit expressions)
        //

        public void Visit(Block node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(Break node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(ComprehensionForClause node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(ComprehensionIfClause node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(ConstStatement node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(ContinueNode node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(DebuggerNode node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(DirectivePrologue node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(DoWhile node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(EmptyStatement node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(ExportNode node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(ForIn node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(ForNode node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(IfNode node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(ImportExportSpecifier node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(ImportNode node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(InitializerNode node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(LabeledStatement node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(LexicalDeclaration node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(ModuleDeclaration node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(ReturnNode node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(Switch node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(SwitchCase node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(TemplateLiteralExpression node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(ThrowNode node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(TryNode node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(Var node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(VariableDeclaration node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(WhileNode node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(WithNode node)
        {
            Debug.Fail("shouldn't get here");
        }

        #endregion
    }
}
