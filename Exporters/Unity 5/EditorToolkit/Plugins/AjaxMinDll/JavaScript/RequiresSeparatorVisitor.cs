// RequiresSeparatorVisitor.cs
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

using System.Diagnostics;

namespace Microsoft.Ajax.Utilities
{
    public class RequiresSeparatorVisitor : IVisitor
    {
        private CodeSettings m_settings;

        public bool DoesRequire { get; private set; }

        public RequiresSeparatorVisitor(CodeSettings settings)
        {
            // requires by default unless a node explicitly says it doesn't need one
            DoesRequire = true;
            m_settings = settings ?? new CodeSettings();
        }

        public bool Query(AstNode node)
        {
            // requires by default unless a node explicitly says it doesn't need one
            DoesRequire = node != null;

            if (node != null)
            {
                node.Accept(this);
            }

            return DoesRequire;
        }

        #region IVisitor

        public void Visit(ArrayLiteral node)
        {
            if (node != null)
            {
                DoesRequire = true;
            }
        }

        public void Visit(AspNetBlockNode node)
        {
            if (node != null)
            {
                DoesRequire = node.IsTerminatedByExplicitSemicolon;
            }
        }

        public void Visit(AstNodeList node)
        {
            if (node != null)
            {
                DoesRequire = true;
            }
        }

        public void Visit(BinaryOperator node)
        {
            if (node != null)
            {
                DoesRequire = true;
            }
        }

        public void Visit(BindingIdentifier node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(Block node)
        {
            if (node != null)
            {
                if (node.ForceBraces || node.Count > 1)
                {
                    // if we are forcing the braces around this block or there are multiple statments
                    // within it, then we will be wrapping it in braces and never need to follow it with 
                    // a semicolon separator.
                    DoesRequire = false;
                }
                else if (node.Count == 0)
                {
                    // if there are no statements in this block, then we're not going to output it
                    // at all, which means we'll need to have a separator added to be the replacement
                    // empty statement.
                    DoesRequire = true;
                }
                else if (node[0] == null)
                {
                    // if we get here, then there is only a single statement in the block.
                    // if the first statement is null, then we actually have an empty block and will need to use a separator. 
                    DoesRequire = true;
                }
                else
                {
                    // otherwise just ask that one contained statement to see what it needs
                    node[0].Accept(this);
                }
            }
        }

        public void Visit(Break node)
        {
            if (node != null)
            {
                DoesRequire = true;
            }
        }

        public void Visit(CallNode node)
        {
            if (node != null)
            {
                DoesRequire = true;
            }
        }

        public void Visit(ClassNode node)
        {
            if (node != null)
            {
                DoesRequire = false;
            }
        }

        public void Visit(ComprehensionNode node)
        {
            if (node != null)
            {
                DoesRequire = true;
            }
        }

        public void Visit(ComprehensionForClause node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(ComprehensionIfClause node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(ConditionalCompilationComment node)
        {
            if (node != null)
            {
                if (node.Statements.IfNotNull(s => s.Count > 0))
                {
                    node.Statements[node.Statements.Count - 1].Accept(this);
                }
                else
                {
                    DoesRequire = true;
                }
            }
        }

        public void Visit(ConditionalCompilationElse node)
        {
            if (node != null)
            {
                DoesRequire = false;
            }
        }

        public void Visit(ConditionalCompilationElseIf node)
        {
            if (node != null)
            {
                DoesRequire = false;
            }
        }

        public void Visit(ConditionalCompilationEnd node)
        {
            if (node != null)
            {
                DoesRequire = false;
            }
        }

        public void Visit(ConditionalCompilationIf node)
        {
            if (node != null)
            {
                DoesRequire = false;
            }
        }

        public void Visit(ConditionalCompilationOn node)
        {
            if (node != null)
            {
                DoesRequire = false;
            }
        }

        public void Visit(ConditionalCompilationSet node)
        {
            if (node != null)
            {
                DoesRequire = false;
            }
        }

        public void Visit(Conditional node)
        {
            if (node != null)
            {
                DoesRequire = true;
            }
        }

        public void Visit(ConstantWrapper node)
        {
            if (node != null)
            {
                DoesRequire = true;
            }
        }

        public void Visit(ConstantWrapperPP node)
        {
            if (node != null)
            {
                DoesRequire = true;
            }
        }

        public void Visit(ConstStatement node)
        {
            if (node != null)
            {
                DoesRequire = true;
            }
        }

        public void Visit(ContinueNode node)
        {
            if (node != null)
            {
                DoesRequire = true;
            }
        }

        public void Visit(CustomNode node)
        {
            if (node != null)
            {
                // ask the custom node implementation
                DoesRequire = node.RequiresSeparator;
            }
        }

        public void Visit(DebuggerNode node)
        {
            if (node != null)
            {
                DoesRequire = true;
            }
        }

        public void Visit(DirectivePrologue node)
        {
            if (node != null)
            {
                DoesRequire = !node.IsRedundant;
            }
        }

        public void Visit(DoWhile node)
        {
            if (node != null)
            {
                // do-while statements TECHNICALLY should end with a semicolon.
                // but IE seems to parse do-while statements WITHOUT the semicolon, so
                // the terminating semicolon ends up being an empty statement AFTER the
                // do-while. Which throws off else or other do-while while-clauses.
                DoesRequire = true;
            }
        }

        public void Visit(EmptyStatement node)
        {
            if (node != null)
            {
                // we ARE a semicolon, so don't add another one
                DoesRequire = false;
            }
        }

        public void Visit(ExportNode node)
        {
            if (node != null)
            {
                // let's assume we do by default
                DoesRequire = true;

                if (!node.IsDefault && node.Count == 1)
                {
                    if (node[0] is FunctionObject || node[0] is ClassNode)
                    {
                        // export function/class doesn't need one
                        DoesRequire = false;
                    }
                }
            }
        }

        public void Visit(ForIn node)
        {
            if (node != null)
            {
                if (node.Body == null || node.Body.Count == 0)
                {
                    DoesRequire = false;
                }
                else
                {
                    node.Body.Accept(this);
                }
            }
        }

        public void Visit(ForNode node)
        {
            if (node != null)
            {
                if (node.Body == null)
                {
                    DoesRequire = false;
                }
                else
                {
                    node.Body.Accept(this);
                }
            }
        }

        public void Visit(FunctionObject node)
        {
            if (node != null)
            {
                // if this is an arrow function with a single statement in the block that isn't a return statement,
                // then we need to ask the block statement if it requires a separator.
                if (node.FunctionType == FunctionType.ArrowFunction
                    && node.Body.IfNotNull(b => b.Count == 1 && !(b[0] is ReturnNode)))
                {
                    node.Body[0].Accept(this);
                }
                else
                {
                    DoesRequire = false;
                }
            }
        }

        public void Visit(GetterSetter node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(GroupingOperator node)
        {
            if (node != null)
            {
                DoesRequire = true;
            }
        }

        public void Visit(IfNode node)
        {
            if (node != null)
            {
                // if we have an else block, then the if statement
                // requires a separator if the else block does. 
                // otherwise only if the true case requires one.
                if (node.FalseBlock != null && node.FalseBlock.Count > 0)
                {
                    node.FalseBlock.Accept(this);
                }
                else if (node.TrueBlock != null && node.TrueBlock.Count > 0)
                {
                    node.TrueBlock.Accept(this);
                }
                else
                {
                    DoesRequire = false;
                }
            }
        }

        public void Visit(ImportantComment node)
        {
            if (node != null)
            {
                DoesRequire = false;
            }
        }

        public void Visit(ImportExportSpecifier node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(ImportNode node)
        {
            if (node != null)
            {
                DoesRequire = true;
            }
        }

        public void Visit(InitializerNode node)
        {
            // REVIEW: do we ever get here?
            if (node != null)
            {
                DoesRequire = true;
            }
        }

        public void Visit(LabeledStatement node)
        {
            if (node != null)
            {
                // requires a separator if the statement does
                if (node.Statement != null)
                {
                    node.Statement.Accept(this);
                }
                else
                {
                    DoesRequire = false;
                }
            }
        }

        public void Visit(LexicalDeclaration node)
        {
            if (node != null)
            {
                DoesRequire = true;
            }
        }

        public void Visit(Lookup node)
        {
            if (node != null)
            {
                DoesRequire = true;
            }
        }

        public void Visit(Member node)
        {
            if (node != null)
            {
                DoesRequire = true;
            }
        }

        public void Visit(ModuleDeclaration node)
        {
            if (node != null)
            {
                // if there is a binding, then we shouldn't have a body so we will
                // need a terminator. If the binding is null, we will have a body,
                // but it might be null indicating an empty body; but we'll still output
                // the {} so we won't need a terminator.
                DoesRequire = node.Binding != null;
            }
        }

        public void Visit(ObjectLiteral node)
        {
            if (node != null)
            {
                DoesRequire = true;
            }
        }

        public void Visit(ObjectLiteralField node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(ObjectLiteralProperty node)
        {
            Debug.Fail("shouldn't get here");
        }

        public void Visit(ParameterDeclaration node)
        {
            // shouldn't get here
            Debug.Fail("shouldn't get here");
        }

        public void Visit(RegExpLiteral node)
        {
            if (node != null)
            {
                DoesRequire = true;
            }
        }

        public void Visit(ReturnNode node)
        {
            if (node != null)
            {
                DoesRequire = true;
            }
        }

        public void Visit(Switch node)
        {
            if (node != null)
            {
                DoesRequire = false;
            }
        }

        public void Visit(SwitchCase node)
        {
            if (node != null)
            {
                // no statements doesn't require a separator.
                // otherwise only if statements require it
                if (node.Statements == null || node.Statements.Count == 0)
                {
                    DoesRequire = false;
                }
                else
                {
                    node.Statements[node.Statements.Count - 1].Accept(this);
                }
            }
        }

        public void Visit(TemplateLiteral node)
        {
            if (node != null)
            {
                DoesRequire = true;
            }
        }

        public void Visit(TemplateLiteralExpression node)
        {
            // shouldn't get here
            Debug.Fail("shouldn't get here");
        }

        public void Visit(ThisLiteral node)
        {
            if (node != null)
            {
                DoesRequire = true;
            }
        }

        public void Visit(ThrowNode node)
        {
            if (node != null)
            {
                // if MacSafariQuirks is true, then we will be adding the semicolon
                // ourselves every single time and won't need outside code to add it.
                // otherwise we won't be adding it, but it will need it if there's something
                // to separate it from.
                DoesRequire = !m_settings.MacSafariQuirks;
            }
        }

        public void Visit(TryNode node)
        {
            if (node != null)
            {
                DoesRequire = false;
            }
        }

        public void Visit(Var node)
        {
            if (node != null)
            {
                DoesRequire = true;
            }
        }

        public void Visit(VariableDeclaration node)
        {
            if (node != null)
            {
                // we might get here is we moved a var decl to the top of the
                // block but left a copy of the vardecl in-place as an assignment statement.
                DoesRequire = true;
            }
        }

        public void Visit(UnaryOperator node)
        {
            if (node != null)
            {
                DoesRequire = true;
            }
        }

        public void Visit(WhileNode node)
        {
            if (node != null)
            {
                if (node.Body == null || node.Body.Count == 0)
                {
                    DoesRequire = false;
                }
                else
                {
                    node.Body.Accept(this);
                }
            }
        }

        public void Visit(WithNode node)
        {
            if (node != null)
            {
                if (node.Body == null || node.Body.Count == 0)
                {
                    DoesRequire = false;
                }
                else
                {
                    node.Body.Accept(this);
                }
            }
        }

        #endregion
    }
}
