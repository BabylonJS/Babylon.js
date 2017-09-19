// TreeVisitor.cs
//
// Copyright 2011 Microsoft Corporation
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
    public class TreeVisitor : IVisitor
    {
        public TreeVisitor() { }

        #region IVisitor Members

        public virtual void Visit(ArrayLiteral node)
        {
            if (node != null)
            {
                if (node.Elements != null)
                {
                    node.Elements.Accept(this);
                }
            }
        }

        public virtual void Visit(AspNetBlockNode node)
        {
            // no children
        }

        public virtual void Visit(AstNodeList node)
        {
            if (node != null)
            {
                var count = node.Count;

                for (var i = 0; i < count; i++)
                { 
                    var element = node[i];
                    
                    if (element != null)
                    {
                        element.Accept(this);
                    }
                }
            }
        }

        public virtual void Visit(BinaryOperator node)
        {
            if (node != null)
            {
                if (node.Operand1 != null)
                {
                    node.Operand1.Accept(this);
                }

                if (node.Operand2 != null)
                {
                    node.Operand2.Accept(this);
                }
            }
        }

        public virtual void Visit(BindingIdentifier node)
        {
            // no children
        }

        public virtual void Visit(Block node)
        {
            if (node != null)
            {
                foreach (var statement in node.Children)
                {
                    if (statement != null)
                    {
                        statement.Accept(this);
                    }
                }
            }
        }

        public virtual void Visit(Break node)
        {
            // no children
        }

        public virtual void Visit(CallNode node)
        {
            if (node != null)
            {
                if (node.Arguments != null)
                {
                    node.Arguments.Accept(this);
                }

                if (node.Function != null)
                {
                    node.Function.Accept(this);
                }
            }
        }

        public virtual void Visit(ClassNode node)
        {
            if (node != null)
            {
                if (node.Binding != null)
                {
                    node.Binding.Accept(this);
                }

                if (node.Heritage != null)
                {
                    node.Heritage.Accept(this);
                }

                if (node.Elements != null)
                {
                    node.Elements.Accept(this);
                }
            }
        }

        public virtual void Visit(ComprehensionNode node)
        {
            if (node != null)
            {
                if (node.Clauses != null)
                {
                    node.Clauses.Accept(this);
                }

                if (node.Expression != null)
                {
                    node.Expression.Accept(this);
                }
            }
        }

        public virtual void Visit(ComprehensionForClause node)
        {
            if (node != null)
            {
                if (node.Binding != null)
                {
                    node.Binding.Accept(this);
                }

                if (node.Expression != null)
                {
                    node.Expression.Accept(this);
                }
            }
        }

        public virtual void Visit(ComprehensionIfClause node)
        {
            if (node != null)
            {
                if (node.Condition != null)
                {
                    node.Condition.Accept(this);
                }
            }
        }

        public virtual void Visit(ConditionalCompilationComment node)
        {
            if (node != null)
            {
                if (node.Statements != null)
                {
                    node.Statements.Accept(this);
                }
            }
        }

        public virtual void Visit(ConditionalCompilationElse node)
        {
            // no children
        }

        public virtual void Visit(ConditionalCompilationElseIf node)
        {
            if (node != null)
            {
                if (node.Condition != null)
                {
                    node.Condition.Accept(this);
                }
            }
        }

        public virtual void Visit(ConditionalCompilationEnd node)
        {
            // no children
        }

        public virtual void Visit(ConditionalCompilationIf node)
        {
            if (node != null)
            {
                if (node.Condition != null)
                {
                    node.Condition.Accept(this);
                }
            }
        }

        public virtual void Visit(ConditionalCompilationOn node)
        {
            // no children
        }

        public virtual void Visit(ConditionalCompilationSet node)
        {
            if (node != null)
            {
                if (node.Value != null)
                {
                    node.Value.Accept(this);
                }
            }
        }

        public virtual void Visit(Conditional node)
        {
            if (node != null)
            {
                if (node.Condition != null)
                {
                    node.Condition.Accept(this);
                }

                if (node.TrueExpression != null)
                {
                    node.TrueExpression.Accept(this);
                }

                if (node.FalseExpression != null)
                {
                    node.FalseExpression.Accept(this);
                }
            }
        }

        public virtual void Visit(ConstantWrapper node)
        {
            // no children
        }

        public virtual void Visit(ConstantWrapperPP node)
        {
            // no children
        }

        public virtual void Visit(ConstStatement node)
        {
            if (node != null)
            {
                foreach (var declaration in node.Children)
                {
                    if (declaration != null)
                    {
                        declaration.Accept(this);
                    }
                }
            }
        }

        public virtual void Visit(ContinueNode node)
        {
            // no children
        }

        public virtual void Visit(CustomNode node)
        {
            if (node != null)
            {
                foreach (var childNode in node.Children)
                {
                    if (childNode != null)
                    {
                        childNode.Accept(this);
                    }
                }
            }
        }

        public virtual void Visit(DebuggerNode node)
        {
            // no children
        }

        public virtual void Visit(DirectivePrologue node)
        {
            // no children
        }

        public virtual void Visit(DoWhile node)
        {
            if (node != null)
            {
                if (node.Body != null)
                {
                    node.Body.Accept(this);
                }

                if (node.Condition != null)
                {
                    node.Condition.Accept(this);
                }
            }
        }

        public virtual void Visit(EmptyStatement node)
        {
            // no children
        }

        public virtual void Visit(ExportNode node)
        {
            if (node != null)
            {
                foreach (var specifier in node.Children)
                {
                    specifier.Accept(this);
                }
            }
        }

        public virtual void Visit(ForIn node)
        {
            if (node != null)
            {
                if (node.Variable != null)
                {
                    node.Variable.Accept(this);
                }

                if (node.Collection != null)
                {
                    node.Collection.Accept(this);
                }

                if (node.Body != null)
                {
                    node.Body.Accept(this);
                }
            }
        }

        public virtual void Visit(ForNode node)
        {
            if (node != null)
            {
                if (node.Initializer != null)
                {
                    node.Initializer.Accept(this);
                }
                
                if (node.Condition != null)
                {
                    node.Condition.Accept(this);
                }

                if (node.Incrementer != null)
                {
                    node.Incrementer.Accept(this);
                }

                if (node.Body != null)
                {
                    node.Body.Accept(this);
                }
            }
        }

        public virtual void Visit(FunctionObject node)
        {
            if (node != null)
            {
                if (node.Body != null)
                {
                    node.Body.Accept(this);
                }
            }
        }

        public virtual void Visit(GetterSetter node)
        {
            // no children
        }

        public virtual void Visit(GroupingOperator node)
        {
            if (node != null)
            {
                if (node.Operand != null)
                {
                    node.Operand.Accept(this);
                }
            }
        }

        public virtual void Visit(IfNode node)
        {
            if (node != null)
            {
                if (node.Condition != null)
                {
                    node.Condition.Accept(this);
                }

                if (node.TrueBlock != null)
                {
                    node.TrueBlock.Accept(this);
                }

                if (node.FalseBlock != null)
                {
                    node.FalseBlock.Accept(this);
                }
            }
        }

        public virtual void Visit(ImportantComment node)
        {
            // no children
        }

        public virtual void Visit(ImportExportSpecifier node)
        {
            if (node != null)
            {
                if (node.LocalIdentifier != null)
                {
                    node.LocalIdentifier.Accept(this);
                }
            }
        }

        public virtual void Visit(ImportNode node)
        {
            if (node != null)
            {
                foreach (var specifier in node.Children)
                {
                    specifier.Accept(this);
                }
            }
        }

        public virtual void Visit(InitializerNode node)
        {
            if (node != null)
            {
                if (node.Binding != null)
                {
                    node.Binding.Accept(this);
                }

                if (node.Initializer != null)
                {
                    node.Initializer.Accept(this);
                }
            }
        }

        public virtual void Visit(LabeledStatement node)
        {
            if (node != null)
            {
                if (node.Statement != null)
                {
                    node.Statement.Accept(this);
                }
            }
        }

        public virtual void Visit(LexicalDeclaration node)
        {
            if (node != null)
            {
                foreach (var declaration in node.Children)
                {
                    if (declaration != null)
                    {
                        declaration.Accept(this);
                    }
                }
            }
        }

        public virtual void Visit(Lookup node)
        {
            // no children
        }

        public virtual void Visit(Member node)
        {
            if (node != null)
            {
                if (node.Root != null)
                {
                    node.Root.Accept(this);
                }
            }
        }

        public virtual void Visit(ModuleDeclaration node)
        {
            if (node != null)
            {
                if (node.Binding != null)
                {
                    node.Binding.Accept(this);
                }

                if (node.Body != null)
                {
                    node.Body.Accept(this);
                }
            }
        }

        public virtual void Visit(ObjectLiteral node)
        {
            if (node != null)
            {
                if (node.Properties != null)
                {
                    node.Properties.Accept(this);
                }
            }
        }

        public virtual void Visit(ObjectLiteralField node)
        {
            // no children
        }

        public virtual void Visit(ObjectLiteralProperty node)
        {
            if (node != null)
            {
                if (node.Name != null)
                {
                    node.Name.Accept(this);
                }

                if (node.Value != null)
                {
                    node.Value.Accept(this);
                }
            }
        }

        public virtual void Visit(ParameterDeclaration node)
        {
            if (node != null)
            {
                if (node.Binding != null)
                {
                    node.Binding.Accept(this);
                }

                if (node.Initializer != null)
                {
                    node.Initializer.Accept(this);
                }
            }
        }

        public virtual void Visit(RegExpLiteral node)
        {
            // no children
        }

        public virtual void Visit(ReturnNode node)
        {
            if (node != null)
            {
                if (node.Operand != null)
                {
                    node.Operand.Accept(this);
                }
            }
        }

        public virtual void Visit(Switch node)
        {
            if (node != null)
            {
                if (node.Expression != null)
                {
                    node.Expression.Accept(this);
                }

                if (node.Cases != null)
                {
                    node.Cases.Accept(this);
                }
            }
        }

        public virtual void Visit(SwitchCase node)
        {
            if (node != null)
            {
                if (node.CaseValue != null)
                {
                    node.CaseValue.Accept(this);
                }

                if (node.Statements != null)
                {
                    node.Statements.Accept(this);
                }
            }
        }

        public virtual void Visit(TemplateLiteral node)
        {
            if (node != null)
            {
                if (node.Function != null)
                {
                    node.Function.Accept(this);
                }

                if (node.Expressions != null)
                {
                    node.Expressions.Accept(this);
                }
            }
        }

        public virtual void Visit(TemplateLiteralExpression node)
        {
            if (node != null)
            {
                if (node.Expression != null)
                {
                    node.Expression.Accept(this);
                }
            }
        }

        public virtual void Visit(ThisLiteral node)
        {
            // no children
        }

        public virtual void Visit(ThrowNode node)
        {
            if (node != null)
            {
                if (node.Operand != null)
                {
                    node.Operand.Accept(this);
                }
            }
        }

        public virtual void Visit(TryNode node)
        {
            if (node != null)
            {
                if (node.TryBlock != null)
                {
                    node.TryBlock.Accept(this);
                }

                if (node.CatchParameter != null)
                {
                    node.CatchParameter.Accept(this);
                }

                if (node.CatchBlock != null)
                {
                    node.CatchBlock.Accept(this);
                }

                if (node.FinallyBlock != null)
                {
                    node.FinallyBlock.Accept(this);
                }
            }
        }

        public virtual void Visit(Var node)
        {
            if (node != null)
            {
                var count = node.Count;

                for (var i = 0; i < count; i ++)
                { 
                    var declaration = node[i];
                    
                    if (declaration != null)
                    {
                        declaration.Accept(this);
                    }
                }
            }
        }

        public virtual void Visit(VariableDeclaration node)
        {
            if (node != null)
            {
                if (node.Binding != null)
                {
                    node.Binding.Accept(this);
                }

                if (node.Initializer != null)
                {
                    node.Initializer.Accept(this);
                }
            }
        }

        public virtual void Visit(UnaryOperator node)
        {
            if (node != null)
            {
                if (node.Operand != null)
                {
                    node.Operand.Accept(this);
                }
            }
        }

        public virtual void Visit(WhileNode node)
        {
            if (node != null)
            {
                if (node.Condition != null)
                {
                    node.Condition.Accept(this);
                }

                if (node.Body != null)
                {
                    node.Body.Accept(this);
                }
            }
        }

        public virtual void Visit(WithNode node)
        {
            if (node != null)
            {
                if (node.WithObject != null)
                {
                    node.WithObject.Accept(this);
                }

                if (node.Body != null)
                {
                    node.Body.Accept(this);
                }
            }
        }

        #endregion
    }
}
