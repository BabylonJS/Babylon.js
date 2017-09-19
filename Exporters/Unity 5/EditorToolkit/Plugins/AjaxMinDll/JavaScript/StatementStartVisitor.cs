// FinalPassVisitor.cs
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

using System.Diagnostics;

namespace Microsoft.Ajax.Utilities
{
    /// <summary>
    /// Determines if a node at the beginning of a statement needs parentheses around it
    /// </summary>
    public class StatementStartVisitor : IVisitor
    {
        #region private fields 

        /// <summary>
        /// This is the flag that we are going to return to indicate whether or not
        /// the statement start is safe (true) or requires parens (false)
        /// </summary>
        private bool m_isSafe;

        #endregion

        public StatementStartVisitor()
        {
        }

        public bool IsSafe(AstNode node)
        {
            // assume it is unless preven otherwise
            m_isSafe = true;

            if (node != null)
            {
                node.Accept(this);
            }
            
            return m_isSafe;
        }

        #region IVisitor that may recurse

        public void Visit(BinaryOperator node)
        {
            // if there's a left-hand operand, recurse into it
            if (node != null && node.Operand1 != null)
            {
                node.Operand1.Accept(this);
            }
        }

        public void Visit(CallNode node)
        {
            // if there's a function node, recurse into it
            if (node != null && node.Function != null)
            {
                node.Function.Accept(this);
            }
        }

        public void Visit(Conditional node)
        {
            // if there's a condition node, recurse into it
            if (node != null && node.Condition != null)
            {
                node.Condition.Accept(this);
            }
        }

        public void Visit(Member node)
        {
            // if there's a root node, recurse into it
            if (node != null && node.Root != null)
            {
                node.Root.Accept(this);
            }
        }

        public void Visit(UnaryOperator node)
        {
            // if this is a postfix operator and there is an operand, recurse into it
            if (node != null && node.IsPostfix && node.Operand != null)
            {
                node.Operand.Accept(this);
            }
        }

        #endregion

        #region IVisitor that return false (needs parens)

        public void Visit(ClassNode node)
        {
            // expressions are definitely NOT safe to start a statement off because it would
            // then be interpreted as a class *declaration*.
            m_isSafe = node.IfNotNull(n => n.ClassType == ClassType.Declaration);
        }

        public void Visit(CustomNode node)
        {
            // we don't know, so assume it's not safe and bail.
            m_isSafe = false;
        }

        public void Visit(FunctionObject node)
        {
            // if this is an arrow function, then we're good to go. Otherwise
            // this shouldn't be called for anything but a function expression,
            // which is definitely NOT safe to start a statement off because it would
            // then be interpreted as a function *declaration*.
            m_isSafe = node.IfNotNull(n => n.FunctionType == FunctionType.ArrowFunction);
        }

        public void Visit(ObjectLiteral node)
        {
            // NOT safe -- if it starts a statement off, it would be interpreted as a block,
            // not an object literal.
            m_isSafe = false;
        }

        #endregion

        #region IVisitor nodes that return true (doesn't need parens)

        public void Visit(ArrayLiteral node)
        {
            // starts with a '[', so we don't care
        }

        public void Visit(AspNetBlockNode node)
        {
            // starts with a '<%', so we don't care
        }

        public void Visit(BindingIdentifier node)
        {
            // binding identifier, so we don't care
        }

        public void Visit(Block node)
        {
            // if we got here, then the block is at the statement level, which means it's
            // a nested block that hasn't been optimized out. 
            // Therefore it starts with a '{' and we don't care.
        }

        public void Visit(Break node)
        {
            // starts with a 'break', so we don't care
        }

        public void Visit(ComprehensionNode node)
        {
            // start with either '(' or '[', so we don't care
        }

        public void Visit(ConditionalCompilationComment node)
        {
            // starts with a '/*@' or '//@', so we don't care
        }

        public void Visit(ConditionalCompilationElse node)
        {
            // starts with a '@else', so we don't care
        }

        public void Visit(ConditionalCompilationElseIf node)
        {
            // starts with a '@elif', so we don't care
        }

        public void Visit(ConditionalCompilationEnd node)
        {
            // starts with a '@end', so we don't care
        }

        public void Visit(ConditionalCompilationIf node)
        {
            // starts with a '@if', so we don't care
        }

        public void Visit(ConditionalCompilationOn node)
        {
            // starts with a '@cc_on', so we don't care
        }

        public void Visit(ConditionalCompilationSet node)
        {
            // starts with a '@set', so we don't care
        }

        public void Visit(ConstantWrapper node)
        {
            // it's a constant, so we don't care
        }

        public void Visit(ConstantWrapperPP node)
        {
            // it's a constant, so we don't care
        }

        public void Visit(ConstStatement node)
        {
            // starts with a 'const', so we don't care
        }

        public void Visit(ContinueNode node)
        {
            // starts with a 'continue', so we don't care
        }

        public void Visit(DebuggerNode node)
        {
            // starts with a 'debugger', so we don't care
        }

        public void Visit(DirectivePrologue node)
        {
            // just a string, so we don't care
        }

        public void Visit(DoWhile node)
        {
            // starts with a 'do', so we don't care
        }

        public void Visit(EmptyStatement node)
        {
            // empty statement, so we don't care
        }

        public void Visit(ExportNode node)
        {
            // starts with export, so we don't care
        }

        public void Visit(ForIn node)
        {
            // starts with a 'for', so we don't care
        }

        public void Visit(ForNode node)
        {
            // starts with a 'for', so we don't care
        }

        public void Visit(GetterSetter node)
        {
            // starts with a 'get' or a 'set', so we don't care
        }

        public void Visit(GroupingOperator node)
        {
            // starts with a '(', so we don't care
        }

        public void Visit(IfNode node)
        {
            // starts with an 'if', so we don't care
        }

        public void Visit(ImportantComment node)
        {
            // comment, so we need to keep going
        }

        public void Visit(ImportNode node)
        {
            // starts with import, so we don't care
        }

        public void Visit(LabeledStatement node)
        {
            // starts with a label identifier, so we don't care
        }

        public void Visit(LexicalDeclaration node)
        {
            // starts with a 'let', so we don't care
        }

        public void Visit(Lookup node)
        {
            // lookup identifier, so we don't care
        }

        public void Visit(ModuleDeclaration node)
        {
            // starts with module, so we don't care
        }

        public void Visit(RegExpLiteral node)
        {
            // regexp literal, so we don't care
        }

        public void Visit(ReturnNode node)
        {
            // starts with 'return', so we don't care
        }

        public void Visit(Switch node)
        {
            // starts with 'switch', so we don't care
        }

        public void Visit(TemplateLiteral node)
        {
            // starts with a lookup or a `, so we don't care
        }

        public void Visit(ThisLiteral node)
        {
            // this literal, so we don't care
        }

        public void Visit(ThrowNode node)
        {
            // starts with 'throw', so we don't care
        }

        public void Visit(TryNode node)
        {
            // starts with 'try', so we don't care
        }

        public void Visit(Var node)
        {
            // starts with 'var', so we don't care
        }

        public void Visit(WhileNode node)
        {
            // starts with 'while', so we don't care
        }

        public void Visit(WithNode node)
        {
            // starts with 'with', so we don't care
        }

        #endregion

        #region IVisitor nodes we shouldn't hit (because their parents don't recurse)

        public void Visit(AstNodeList node)
        {
            // shoudn't get here
            Debug.Fail("shouldn't get here");
        }

        public void Visit(ComprehensionForClause node)
        {
            // shoudn't get here
            Debug.Fail("shouldn't get here");
        }

        public void Visit(ComprehensionIfClause node)
        {
            // shoudn't get here
            Debug.Fail("shouldn't get here");
        }

        public void Visit(InitializerNode node)
        {
            // shoudn't get here
            Debug.Fail("shouldn't get here");
        }

        public void Visit(ImportExportSpecifier node)
        {
            // shoudn't get here
            Debug.Fail("shouldn't get here");
        }

        public void Visit(ObjectLiteralField node)
        {
            // shoudn't get here
            Debug.Fail("shouldn't get here");
        }

        public void Visit(ObjectLiteralProperty node)
        {
            // shoudn't get here
            Debug.Fail("shouldn't get here");
        }

        public void Visit(ParameterDeclaration node)
        {
            // shoudn't get here
            Debug.Fail("shouldn't get here");
        }

        public void Visit(SwitchCase node)
        {
            // shoudn't get here
            Debug.Fail("shouldn't get here");
        }

        public void Visit(TemplateLiteralExpression node)
        {
            // shoudn't get here
            Debug.Fail("shouldn't get here");
        }

        public void Visit(VariableDeclaration node)
        {
            // shoudn't get here
            Debug.Fail("shouldn't get here");
        }

        #endregion
    }
}
