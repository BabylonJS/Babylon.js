// AnalyzeNodeVisitor.cs
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

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.Reflection;
using System.Text.RegularExpressions;

namespace Microsoft.Ajax.Utilities
{
    [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1506:AvoidExcessiveClassCoupling")]
    internal class AnalyzeNodeVisitor : TreeVisitor
    {
        private JSParser m_parser;
        private bool m_encounteredCCOn;// = false;
        private MatchPropertiesVisitor m_matchVisitor;// == null;
        private Stack<ActivationObject> m_scopeStack;
        private JSError m_strictNameError = JSError.StrictModeVariableName;
        private HashSet<string> m_noRename;
        private bool m_stripDebug;
        private bool m_lookForDebugNamespaces;
        private bool m_possibleDebugNamespace;
        private int m_possibleDebugNamespaceIndex;
        private List<string[]> m_possibleDebugMatches;
        private string[][] m_debugNamespaceParts;

        public AnalyzeNodeVisitor(JSParser parser)
        {
            m_parser = parser;
            m_scopeStack = new Stack<ActivationObject>();
            m_scopeStack.Push(parser.GlobalScope);

            // see if we want to strip debug namespaces, and create the matching list if we do.
            m_stripDebug = m_parser.Settings.StripDebugStatements
                && m_parser.Settings.IsModificationAllowed(TreeModifications.StripDebugStatements);
            m_lookForDebugNamespaces = m_stripDebug && m_parser.DebugLookups.Count > 0;
            if (m_lookForDebugNamespaces)
            {
                m_possibleDebugMatches = new List<string[]>();
                m_debugNamespaceParts = new string[m_parser.DebugLookups.Count][];
                var ndx = 0;
                foreach (var debugNamespace in m_parser.DebugLookups)
                {
                    m_debugNamespaceParts[ndx++] = debugNamespace.Split('.');
                }
            }

            if (m_parser.Settings.LocalRenaming != LocalRenaming.KeepAll)
            {
                m_noRename = new HashSet<string>(m_parser.Settings.NoAutoRenameCollection);
            }
        }

        #region IVisitor

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1502:AvoidExcessiveComplexity")]
        public override void Visit(BinaryOperator node)
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

                if ((node.Operand1 == null || node.Operand1.IsDebugOnly) 
                    && (node.Operand2 == null || node.Operand2.IsDebugOnly))
                {
                    // if both operands are debug-only, then this whole expression is debug only.
                    // if the right-hand side is debug only and this is an assignment, then this operation is debug-only.
                    node.IsDebugOnly = true;
                }
                else
                {
                    if (node.Operand1 != null && node.Operand1.IsDebugOnly)
                    {
                        node.Operand1 = ClearDebugExpression(node.Operand1);
                    }

                    if (node.Operand2 != null && node.Operand2.IsDebugOnly)
                    {
                        node.Operand2 = ClearDebugExpression(node.Operand2);
                    }

                    // see if this operation is subtracting zero from a lookup -- that is typically done to
                    // coerce a value to numeric. There's a simpler way: unary plus operator.
                    if (node.OperatorToken == JSToken.Minus
                        && m_parser.Settings.IsModificationAllowed(TreeModifications.SimplifyStringToNumericConversion))
                    {
                        Lookup lookup = node.Operand1 as Lookup;
                        if (lookup != null)
                        {
                            ConstantWrapper right = node.Operand2 as ConstantWrapper;
                            if (right != null && right.IsIntegerLiteral && right.ToNumber() == 0)
                            {
                                // okay, so we have "lookup - 0"
                                // this is done frequently to force a value to be numeric. 
                                // There is an easier way: apply the unary + operator to it. 
                                // transform: lookup - 0   => +lookup
                                var unary = new UnaryOperator(node.Context)
                                    {
                                        Operand = lookup,
                                        OperatorToken = JSToken.Plus
                                    };
                                node.Parent.ReplaceChild(node, unary);

                                // because we recursed at the top of this function, we don't need to Analyze
                                // the new Unary node. This visitor's method for UnaryOperator only does something
                                // if the operand is a constant -- and this one is a Lookup. And we already analyzed
                                // the lookup.
                            }
                        }
                    }
                    else if ((node.OperatorToken == JSToken.StrictEqual || node.OperatorToken == JSToken.StrictNotEqual)
                        && m_parser.Settings.IsModificationAllowed(TreeModifications.ReduceStrictOperatorIfTypesAreSame))
                    {
                        PrimitiveType leftType = node.Operand1.FindPrimitiveType();
                        if (leftType != PrimitiveType.Other)
                        {
                            PrimitiveType rightType = node.Operand2.FindPrimitiveType();
                            if (leftType == rightType)
                            {
                                // the are the same known types. We can reduce the operators
                                node.OperatorToken = node.OperatorToken == JSToken.StrictEqual ? JSToken.Equal : JSToken.NotEqual;
                            }
                            else if (rightType != PrimitiveType.Other)
                            {
                                // they are not the same, but they are both known. We can completely remove the operator
                                // and replace it with true (!==) or false (===).
                                // transform: x !== y   =>   true
                                // transform: x === y   =>   false
                                node.Context.HandleError(JSError.StrictComparisonIsAlwaysTrueOrFalse, false);
                                node.Parent.ReplaceChild(
                                    node,
                                    new ConstantWrapper(node.OperatorToken == JSToken.StrictNotEqual, PrimitiveType.Boolean, node.Context));

                                // because we are essentially removing the node from the AST, be sure to detach any references
                                DetachReferences.Apply(node);
                            }
                        }
                    }
                    else if (node.IsAssign)
                    {
                        var lookup = node.Operand1 as Lookup;
                        if (lookup != null)
                        {
                            if (lookup.VariableField != null && lookup.VariableField.InitializationOnly)
                            {
                                // the field is an initialization-only field -- we should NOT be assigning to it
                                lookup.Context.HandleError(JSError.AssignmentToConstant, true);
                            }
                            else if (m_scopeStack.Peek().UseStrict)
                            {
                                if (lookup.VariableField == null || lookup.VariableField.FieldType == FieldType.UndefinedGlobal)
                                {
                                    // strict mode cannot assign to undefined fields
                                    node.Operand1.Context.HandleError(JSError.StrictModeUndefinedVariable, true);
                                }
                                else if (lookup.VariableField.FieldType == FieldType.Arguments
                                    || (lookup.VariableField.FieldType == FieldType.Predefined 
                                    && string.CompareOrdinal(lookup.Name, "eval") == 0))
                                {
                                    // strict mode cannot assign to lookup "eval" or "arguments"
                                    node.Operand1.Context.HandleError(JSError.StrictModeInvalidAssign, true);
                                }
                            }
                        }
                    }
                    else if ((node.Parent is Block || (node.Parent is CommaOperator && node.Parent.Parent is Block))
                        && (node.OperatorToken == JSToken.LogicalOr || node.OperatorToken == JSToken.LogicalAnd))
                    {
                        // this is an expression statement where the operator is || or && -- basically
                        // it's a shortcut for an if-statement:
                        // expr1&&expr2; ==> if(expr1)expr2;
                        // expr1||expr2; ==> if(!expr1)expr2;
                        // let's check to see if the not of expr1 is smaller. If so, we can not the expression
                        // and change the operator
                        var logicalNot = new LogicalNot(node.Operand1, m_parser.Settings);
                        if (logicalNot.Measure() < 0)
                        {
                            // it would be smaller! Change it.
                            // transform: expr1&&expr2 => !expr1||expr2
                            // transform: expr1||expr2 => !expr1&&expr2
                            logicalNot.Apply();
                            node.OperatorToken = node.OperatorToken == JSToken.LogicalAnd ? JSToken.LogicalOr : JSToken.LogicalAnd;
                        }
                    }
                }
            }
        }

        public override void Visit(BindingIdentifier node)
        {
            if (node != null)
            {
                ValidateIdentifier(m_scopeStack.Peek().UseStrict, node.Name, node.Context, m_strictNameError);
            }
        }

        private void CombineExpressions(Block node)
        {
            // walk backwards because we'll be removing items as we go along.
            // and don't bother looking at the first element, because we'll be attempting to combine
            // the current element with the previous element -- and the first element (0) has no
            // previous element.
            // we will check for:
            //      1) expr1;expr2           ==> expr1,expr2
            //      2) expr1;for(;...)       ==> for(expr1;...)
            //      3) expr1;for(expr2;...)  ==> for(expr1,expr2;...)
            //      4) expr1;return expr2    ==> return expr1,expr2
            //      5) expr1;if(cond)...     ==> if(expr1,cond)...
            //      6) expr1;while(cond)...  ==> for(expr;cond;)...
            //      7) lookup=expr1;lookup[OP]=expr2;   ==> lookup=expr1[OP]expr2
            //      8) lookup[OP1]=expr1;lookup[OP2]=expr2  ==> lookup=(lookup[OP1]expr1)[OP2]expr2
            for (var ndx = node.Count - 1; ndx > 0; --ndx)
            {
                // we may have deleted more than 1 statement, in which case we need to loop around
                // again to let ndx catch up to the last item in the block
                if (ndx >= node.Count)
                {
                    continue;
                }

                // see if the previous statement is an expression
                if (node[ndx - 1].IsExpression)
                {
                    CombineWithPreviousExpression(node, ndx);
                }
                else
                {
                    var previousVar = node[ndx - 1] as Var;
                    if (previousVar != null)
                    {
                        CombineWithPreviousVar(node, ndx, previousVar);
                    }
                }
            }
        }

        private void CombineWithPreviousExpression(Block node, int ndx)
        {
            IfNode ifNode;
            ForNode forNode;
            WhileNode whileNode;
            ReturnNode returnNode;
            if (node[ndx].IsExpression)
            {
                CombineTwoExpressions(node, ndx);
            }
            else if ((returnNode = node[ndx] as ReturnNode) != null)
            {
                CombineReturnWithExpression(node, ndx, returnNode);
            }
            else if ((forNode = node[ndx] as ForNode) != null)
            {
                CombineForNodeWithExpression(node, ndx, forNode);
            }
            else if ((ifNode = node[ndx] as IfNode) != null)
            {
                // transform: expr;if(cond)... => if(expr,cond)...
                // combine the previous expression with the if-condition via comma, then delete
                // the previous statement.
                ifNode.Condition = CommaOperator.CombineWithComma(node[ndx - 1].Context.FlattenToStart(), node[ndx - 1], ifNode.Condition);
                node.RemoveAt(ndx - 1);
            }
            else if ((whileNode = node[ndx] as WhileNode) != null
                && m_parser.Settings.IsModificationAllowed(TreeModifications.ChangeWhileToFor))
            {
                // transform: expr;while(cond)... => for(expr;cond;)...
                // zero-sum, and maybe a little worse for performance because of the nop iterator,
                // but combines two statements into one, which may have savings later on.
                var initializer = node[ndx - 1];
                node[ndx] = new ForNode(initializer.Context.FlattenToStart())
                {
                    Initializer = initializer,
                    Condition = whileNode.Condition,
                    Body = whileNode.Body
                };
                node.RemoveAt(ndx - 1);
            }
        }

        private static void CombineTwoExpressions(Block node, int ndx)
        {
            var prevBinary = node[ndx - 1] as BinaryOperator;
            var curBinary = node[ndx] as BinaryOperator;
            Lookup lookup;
            if (prevBinary != null
                && curBinary != null
                && prevBinary.IsAssign
                && curBinary.IsAssign
                && curBinary.OperatorToken != JSToken.Assign
                && (lookup = curBinary.Operand1 as Lookup) != null
                && prevBinary.Operand1.IsEquivalentTo(curBinary.Operand1))
            {
                if (prevBinary.OperatorToken == JSToken.Assign
                    && !ReferencesVisitor.References(curBinary.Operand2, lookup))
                {
                    // transform: lookup=expr1;lookup[OP]=expr2;  ==>  lookup=expr1[OP]expr2
                    // BUT NOT IF expr2 contains a reference to lookup!
                    var binOp = new BinaryOperator(prevBinary.Operand2.Context.CombineWith(curBinary.Operand2.Context))
                    {
                        Operand1 = prevBinary.Operand2,
                        Operand2 = curBinary.Operand2,
                        OperatorToken = JSScanner.StripAssignment(curBinary.OperatorToken),
                        OperatorContext = curBinary.OperatorContext
                    };
                    prevBinary.Operand2 = binOp;

                    // we are removing the second lookup, so clean up the reference on the field
                    if (lookup.VariableField != null)
                    {
                        lookup.VariableField.References.Remove(lookup);
                    }

                    // and remove the current assignment expression (everything was combined into the previous)
                    node[ndx] = null;
                }
                else
                {
                    // there's lots of ins-and-outs in terms of strings versus numerics versus precedence and all 
                    // sorts of stuff. I need to iron this out a little better, but until then, just combine with a comma.
                    // transform: expr1;expr2  ==>  expr1,expr2
                    var binOp = CommaOperator.CombineWithComma(prevBinary.Context.CombineWith(curBinary.Context), prevBinary, curBinary);

                    // replace the previous node and delete the current
                    node[ndx - 1] = binOp;
                    node[ndx] = null;
                }
            }
            else
            {
                // transform: expr1;expr2 to expr1,expr2
                // use the special comma operator object so we can handle it special
                // and don't create stack-breakingly deep trees
                var binOp = CommaOperator.CombineWithComma(node[ndx - 1].Context.CombineWith(node[ndx].Context), node[ndx - 1], node[ndx]);

                // replace the current node and delete the previous
                node[ndx] = binOp;
                node[ndx - 1] = null;
            }
        }

        private static void CombineReturnWithExpression(Block node, int ndx, ReturnNode returnNode)
        {
            // see if the return node has an expression operand
            if (returnNode.Operand != null && returnNode.Operand.IsExpression)
            {
                // check for lookup[ASSIGN]expr2;return expr1.
                var beforeExpr = node[ndx - 1] as BinaryOperator;
                Lookup lookup;
                if (beforeExpr != null
                    && beforeExpr.IsAssign
                    && (lookup = beforeExpr.Operand1 as Lookup) != null)
                {
                    if (returnNode.Operand.IsEquivalentTo(lookup))
                    {
                        // we have lookup[ASSIGN]expr2;return lookup.
                        // if lookup is a local variable in the current scope, we can replace with return expr2;
                        // if lookup is an outer reference, we can replace with return lookup[ASSIGN]expr2
                        if (beforeExpr.OperatorToken == JSToken.Assign)
                        {
                            // check to see if lookup is in the current scope from which we are returning
                            if (lookup.VariableField == null
                                || lookup.VariableField.OuterField != null
                                || lookup.VariableField.IsReferencedInnerScope)
                            {
                                // transform: lookup[ASSIGN]expr2;return lookup => return lookup[ASSIGN]expr2
                                // lookup points to outer field (or we don't know)
                                // replace the operand on the return node with the previous expression and
                                // delete the previous node.
                                // first be sure to remove the lookup in the return operand from the references
                                // to field.
                                DetachReferences.Apply(returnNode.Operand);
                                returnNode.Operand = beforeExpr;
                                node[ndx - 1] = null;
                            }
                            else
                            {
                                // transform: lookup[ASSIGN]expr2;return lookup => return expr2
                                // lookup is a variable local to the current scope, so when we return, the
                                // variable won't exists anymore anyway.
                                // replace the operand on the return node oprand with the right-hand operand of the
                                // previous expression and delete the previous node.
                                // we're eliminating the two lookups altogether, so remove them both from the
                                // field's reference table.
                                var varField = lookup.VariableField;
                                DetachReferences.Apply(lookup, returnNode.Operand);

                                returnNode.Operand = beforeExpr.Operand2;
                                node[ndx - 1] = null;

                                // now that we've eliminated the two lookups, see if the local variable isn't
                                // referenced anymore. If it isn't, we might be able to remove the variable, too.
                                // (need to pick up those changes to keep track of a field's declarations, though)
                                if (varField.RefCount == 0)
                                {
                                    // it's not. if there's only one declaration and it either has no initializer or
                                    // is initialized to a constant, get rid of it.
                                    var nameDecl = varField.OnlyDeclaration;
                                    if (nameDecl != null)
                                    {
                                        // we only had one declaration.
                                        if (nameDecl.Initializer == null || nameDecl.Initializer.IsConstant)
                                        {
                                            // and it either had no initializer or it was initialized to a constant.
                                            // but it has no references, so let's whack it. Actually, only if it was
                                            // a var-decl (leave parameter and function decls alone).
                                            // TODO: would be nice to properly remove unused declarations from binding parameters
                                            // as well (object literals and array literals)
                                            var varDecl = nameDecl.Parent as VariableDeclaration;
                                            if (varDecl != null)
                                            {
                                                // save the declaration parent (var, const, or let) and remove the
                                                // child vardecl from its list
                                                var declStatement = varDecl.Parent as Declaration;
                                                declStatement.Remove(varDecl);
                                                varField.WasRemoved = true;

                                                // if the parent statement is now empty, remove it, too. this will
                                                // move everything up one index, but that'll just mean an extra loop.
                                                if (declStatement.Count == 0)
                                                {
                                                    declStatement.Parent.ReplaceChild(declStatement, null);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        else
                        {
                            // it's an assignment, but it's not =. That means it's one of the OP= operators.
                            // we can't remove the field altogether. But we can move the assignment into the 
                            // return statement and get rid of the lone lookup.
                            // transform: lookup OP= expr;return lookup   =>   return lookup OP= expr;
                            if (lookup.VariableField != null)
                            {
                                // we're getting rid of the lookup, so remove it from the field's list of references
                                DetachReferences.Apply(returnNode.Operand);
                            }

                            // remove the expression from the block and put it in the operand of
                            // the return statement.
                            node.RemoveAt(ndx - 1);
                            returnNode.Operand = beforeExpr;

                            // is this field scoped only to this function?
                            if (lookup.VariableField != null
                                && lookup.VariableField.OuterField == null
                                && !lookup.VariableField.IsReferencedInnerScope)
                            {
                                // in fact, the lookup is in the current scope, so assigning to it is a waste
                                // because we're going to return (this is a return statement, after all).
                                // we can get rid of the assignment part and just keep the operator:
                                // transform: lookup OP= expr;return lookup   =>   return lookup OP expr;
                                beforeExpr.OperatorToken = JSScanner.StripAssignment(beforeExpr.OperatorToken);
                            }
                        }
                    }
                    else
                    {
                        // transform: expr1;return expr2 to return expr1,expr2
                        var binOp = CommaOperator.CombineWithComma(node[ndx - 1].Context.FlattenToStart(), node[ndx - 1], returnNode.Operand);

                        // replace the operand on the return node with the new expression and
                        // delete the previous node
                        returnNode.Operand = binOp;
                        node[ndx - 1] = null;
                    }
                }
                else
                {
                    // transform: expr1;return expr2 to return expr1,expr2
                    var binOp = CommaOperator.CombineWithComma(node[ndx - 1].Context.FlattenToStart(), node[ndx - 1], returnNode.Operand);

                    // replace the operand on the return node with the new expression and
                    // delete the previous node
                    returnNode.Operand = binOp;
                    node[ndx - 1] = null;
                }
            }
        }

        private void CombineForNodeWithExpression(Block node, int ndx, ForNode forNode)
        {
            // if we aren't allowing in-operators to be moved into for-statements, then
            // first check to see if that previous expression statement is free of in-operators
            // before trying to move it.
            if (m_parser.Settings.IsModificationAllowed(TreeModifications.MoveInExpressionsIntoForStatement)
                || !node[ndx - 1].ContainsInOperator)
            {
                if (forNode.Initializer == null)
                {
                    // transform: expr1;for(;...) to for(expr1;...)
                    // simply move the previous expression to the for-statement's initializer
                    forNode.Initializer = node[ndx - 1];
                    node[ndx - 1] = null;
                }
                else if (forNode.Initializer.IsExpression)
                {
                    // transform: expr1;for(expr2;...) to for(expr1,expr2;...)
                    var binOp = CommaOperator.CombineWithComma(node[ndx-1].Context.FlattenToStart(), node[ndx - 1], forNode.Initializer);

                    // replace the initializer with the new binary operator and remove the previous node
                    forNode.Initializer = binOp;
                    node[ndx - 1] = null;
                }
            }
        }

        private static void CombineWithPreviousVar(Block node, int ndx, Var previousVar)
        {
            if (previousVar.Count == 0)
            {
                return;
            }

            var binaryOp = node[ndx] as BinaryOperator;
            var varDecl = previousVar[previousVar.Count - 1];
            Lookup lookup;
            BindingIdentifier bindingIdentifier;

            if (binaryOp != null
                && binaryOp.IsAssign
                && (lookup = binaryOp.Operand1 as Lookup) != null
                && lookup.VariableField != null
                && !ReferencesVisitor.References(binaryOp.Operand2, lookup)
                && (bindingIdentifier = varDecl.Binding as BindingIdentifier) != null
                && bindingIdentifier.VariableField == lookup.VariableField)
            {
                // the current statement is a binary operator assignment with a lookup on the left-hand side.
                // the previous statement is a var, the last vardecl is a simple binding identifier, and that identifier
                // is the same as the left-hand side of the assignment. 
                if (varDecl.Initializer != null)
                {
                    if (binaryOp.OperatorToken == JSToken.Assign)
                    {
                        // we have var name=expr1;name=expr2. If expr1 is a constant, we will
                        // get rid of it entirely and replace it with expr2. Otherwise we don't
                        // know about any side-effects, so just leave it be.
                        if (varDecl.Initializer.IsConstant)
                        {
                            // transform: var name=const;name=expr  ==> var name=expr
                            varDecl.Initializer = binaryOp.Operand2;

                            // getting rid of the lookup, so clean up its references
                            lookup.VariableField.IfNotNull(v => v.References.Remove(lookup));
                            node[ndx] = null;
                        }
                    }
                    else
                    {
                        // we have var name=expr1;name[OP]=expr2.
                        // transform: var name=expr1;name[OP]=expr2  ==>  var name=expr1[OP]expr2
                        // getting rid of the lookup, so clean up its references
                        lookup.VariableField.IfNotNull(v => v.References.Remove(lookup));

                        // reuse the binary op by stripping the assignment to just the operator,
                        // clobbering the lookup on operand1 with the vardecl assignment,
                        // and expanding the context to include the initializer.
                        binaryOp.OperatorToken = JSScanner.StripAssignment(binaryOp.OperatorToken);
                        binaryOp.Operand1 = varDecl.Initializer;
                        binaryOp.UpdateWith(binaryOp.Operand1.Context);

                        // set the adjusted binary op to the vardecl initializer and remove the
                        // current statement (that points to the binary op)
                        varDecl.Initializer = binaryOp;
                        node[ndx] = null;
                    }
                }
                else if (binaryOp.OperatorToken == JSToken.Assign)
                {
                    // transform: var name;name=expr  ==>  var name=expr
                    lookup.VariableField.IfNotNull(v => v.References.Remove(lookup));
                    varDecl.Initializer = binaryOp.Operand2;
                    node[ndx] = null;
                }
                else
                {
                    // we have var name;name[OP]=expr.
                    // leave it alone???? we could make var name=undefined[OP]expr1, if we have a good undefined value.
                }
            }
        }

        private static AstNode FindLastStatement(Block node)
        {
            // start with the last statement in the block and back up over any function declarations
            // or important comments until we get the last statement
            var lastStatementIndex = node.Count - 1;
            while (lastStatementIndex >= 0 
                && (node[lastStatementIndex] is FunctionObject || node[lastStatementIndex] is ImportantComment))
            {
                --lastStatementIndex;
            }

            return lastStatementIndex >= 0 ? node[lastStatementIndex] : null;
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Performance", "CA1809:AvoidExcessiveLocals"),
         System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1506:AvoidExcessiveClassCoupling"),
         System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1502:AvoidExcessiveComplexity"),
         System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1505:AvoidUnmaintainableCode")]
        public override void Visit(Block node)
        {
            if (node != null)
            {
                // if this block has a BLOCK scope, then look at the lexically-declared names (if any)
                // and throw an error if any are defined as var's within this scope (ES6 rules).
                // if this is the body of a function object, use the function scope.
                ActivationObject lexicalScope = null;
                if (node.HasOwnScope)
                {
                    lexicalScope = node.EnclosingScope as BlockScope;
                    var functionObject = node.Parent as FunctionObject;
                    if (functionObject != null)
                    {
                        lexicalScope = functionObject.EnclosingScope;
                    }
                }

                if (lexicalScope != null)
                {
                    foreach (var lexDecl in lexicalScope.LexicallyDeclaredNames)
                    {
                        var varDecl = lexicalScope.VarDeclaredName(lexDecl.Name);
                        if (varDecl != null)
                        {
                            // collision.
                            // if the lexical declaration is a let or const declaration (as opposed to a function declaration),
                            // then force the warning to an error. This is so the function declaration will remain a warning if
                            // it collides with a var. 
                            varDecl.Context.HandleError(JSError.DuplicateLexicalDeclaration, lexDecl is LexicalDeclaration);

                            // mark them both a no-rename to preserve the collision in the output
                            lexDecl.VariableField.IfNotNull(v => v.CanCrunch = false);
                            varDecl.VariableField.IfNotNull(v => v.CanCrunch = false);
                        }
                    }
                }

                // we might things differently if these statements are the body collection for a function
                // because we can assume the implicit return statement at the end of it
                bool isFunctionLevel = (node.Parent is FunctionObject);

                // analyze all the statements in our block and recurse them
                if (node.HasOwnScope)
                {
                    m_scopeStack.Push(node.EnclosingScope);
                }

                var oldStrictError = m_strictNameError;
                try
                {
                    m_strictNameError = JSError.StrictModeVariableName;

                    // don't call the base class to recurse -- let's walk the block
                    // backwards in case any of the children opt to delete themselves.
                    for (var ndx = node.Count - 1; ndx >= 0; --ndx)
                    {
                        node[ndx].Accept(this);

                        // we can do this because we are walking backwards, and if the statement had deleted itself
                        // for whatever reason, the next one will slip into its place, and we've already seen it so
                        // it must not be debug only or we would've deleted it.
                        if (m_stripDebug && node.Count > ndx && node[ndx].IsDebugOnly)
                        {
                            node.RemoveAt(ndx);
                        }
                    }
                }
                finally
                {
                    m_strictNameError = oldStrictError;
                    if (node.HasOwnScope)
                    {
                        m_scopeStack.Pop();
                    }
                }

                if (m_parser.Settings.RemoveUnneededCode)
                {
                    // go forward, and check the count each iteration because we might be ADDING statements to the block.
                    // let's look at all our if-statements. If a true-clause ends in a return, then we don't
                    // need the else-clause; we can pull its statements out and stick them after the if-statement.
                    // also, if we encounter a return-, break- or continue-statement, we can axe everything after it
                    for (var ndx = 0; ndx < node.Count; ++ndx)
                    {
                        // see if it's an if-statement with both a true and a false block
                        var ifNode = node[ndx] as IfNode;
                        if (ifNode != null
                            && ifNode.TrueBlock != null
                            && ifNode.TrueBlock.Count > 0
                            && ifNode.FalseBlock != null)
                        {
                            // now check to see if the true block ends in a return statement
                            if (ifNode.TrueBlock[ifNode.TrueBlock.Count - 1] is ReturnNode)
                            {
                                // transform: if(cond){statements1;return}else{statements2} to if(cond){statements1;return}statements2
                                // it does. insert all the false-block statements after the if-statement
                                node.InsertRange(ndx + 1, ifNode.FalseBlock.Children);

                                // and then remove the false block altogether
                                ifNode.FalseBlock = null;
                            }
                        }
                        else if (node[ndx] is ReturnNode
                            || node[ndx] is Break
                            || node[ndx] is ContinueNode
                            || node[ndx] is ThrowNode)
                        {
                            // we have an exit node -- no statments afterwards will be executed, so clear them out.
                            // transform: {...;return;...} to {...;return}
                            // transform: {...;break;...} to {...;break}
                            // transform: {...;continue;...} to {...;continue}
                            // transform: {...;throw;...} to {...;throw}
                            // we've found an exit statement, and it's not the last statement in the function.
                            // walk the rest of the statements and delete anything that isn't a function declaration
                            // or a var- or const-statement.
                            for (var ndxRemove = node.Count - 1; ndxRemove > ndx; --ndxRemove)
                            {
                                if (node[ndxRemove].IsDeclaration)
                                {
                                    // we want to keep this statement because it's a "declaration."
                                    // HOWEVER, if this is a var or a let, let's whack the initializer, since it will 
                                    // never get executed. Leave the initializers for const statements, even though 
                                    // they will never get run, since it would be a syntax error to not have one.
                                    var declaration = node[ndxRemove] as Declaration;
                                    if (declaration != null && declaration.StatementToken != JSToken.Const)
                                    {
                                        for (var ndxDecl = 0; ndxDecl < declaration.Count; ++ndxDecl)
                                        {
                                            if (declaration[ndxDecl].Initializer != null)
                                            {
                                                DetachReferences.Apply(declaration[ndxDecl].Initializer);
                                                declaration[ndxDecl].Initializer = null;
                                            }
                                        }
                                    }
                                }
                                else
                                {
                                    // not a declaration -- remove it
                                    DetachReferences.Apply(node[ndxRemove]);
                                    node.RemoveAt(ndxRemove);
                                }
                            }
                        }
                    }
                }

                // now check the last statement -- if it's an if-statement where the true-block is a single return
                // and there is no false block, convert this one statement to a conditional. We might back it out later
                // if we don't combine the conditional with other stuff.
                // but we can only do this if we're at the functional level because of the implied return at the end
                // of that block.
                if (isFunctionLevel && node.Count > 0
                    && m_parser.Settings.IsModificationAllowed(TreeModifications.IfConditionReturnToCondition))
                {
                    ReturnNode returnNode;
                    var ifNode = FindLastStatement(node) as IfNode;
                    if (ifNode != null && ifNode.FalseBlock == null
                        && ifNode.TrueBlock.Count == 1
                        && (returnNode = ifNode.TrueBlock[0] as ReturnNode) != null)
                    {
                        // if the return node doesn't have an operand, then we can just replace the if-statement with its conditional
                        if (returnNode.Operand == null)
                        {
                            // if the condition is a constant, then eliminate it altogether
                            if (ifNode.Condition.IsConstant)
                            {
                                // delete the node altogether. Because the condition is a constant,
                                // there is no else-block, and the if-block only contains a return
                                // with no expression, we don't have anything to detach.
                                node.ReplaceChild(ifNode, null);
                            }
                            else
                            {
                                // transform: {...;if(cond)return;} to {...;cond;}
                                node.ReplaceChild(ifNode, ifNode.Condition);
                            }
                        }
                        else if (returnNode.Operand.IsExpression)
                        {
                            // this is a strategic replacement that might pay off later. And if
                            // it doesn't, we'll eventually back it out after all the other stuff
                            // if applied on top of it.
                            // transform: if(cond)return expr;} to return cond?expr:void 0}
                            var conditional = new Conditional(ifNode.Condition.Context.FlattenToStart())
                                {
                                    Condition = ifNode.Condition,
                                    TrueExpression = returnNode.Operand,
                                    FalseExpression = CreateVoidNode(returnNode.Context.FlattenToStart())
                                };

                            // replace the if-statement with the new return node
                            node.ReplaceChild(ifNode, new ReturnNode(ifNode.Context)
                                {
                                    Operand = conditional
                                });
                            Optimize(conditional);
                        }
                    }
                }

                // now walk through and combine adjacent expression statements, and adjacent var-for statements
                // and adjecent expression-return statements
                if (m_parser.Settings.IsModificationAllowed(TreeModifications.CombineAdjacentExpressionStatements))
                {
                    CombineExpressions(node);
                }

                // check to see if we want to combine a preceding var with a for-statement
                if (m_parser.Settings.IsModificationAllowed(TreeModifications.MoveVarIntoFor))
                {
                    // look at the statements in the block. 
                    // walk BACKWARDS down the list because we'll be removing items when we encounter
                    // var statements that can be moved inside a for statement's initializer
                    // we also don't need to check the first one, since there is nothing before it.
                    for (int ndx = node.Count - 1; ndx > 0; --ndx)
                    {
                        // see if the previous statement is a var statement
                        // (we've already combined adjacent var-statements)
                        ForNode forNode;
                        ForIn forInNode;
                        WhileNode whileNode;
                        var previousVar = node[ndx - 1] as Var;
                        if (previousVar != null && (forNode = node[ndx] as ForNode) != null)
                        {
                            // BUT if the var statement has any initializers containing an in-operator, first check
                            // to see if we haven't killed that move before we try moving it. Opera 11 seems to have
                            // an issue with that syntax, even if properly parenthesized.
                            if (m_parser.Settings.IsModificationAllowed(TreeModifications.MoveInExpressionsIntoForStatement)
                                || !previousVar.ContainsInOperator)
                            {
                                // and see if the forNode's initializer is empty
                                if (forNode.Initializer != null)
                                {
                                    // not empty -- see if it is a Var node
                                    Var varInitializer = forNode.Initializer as Var;
                                    if (varInitializer != null)
                                    {
                                        // transform: var decls1;for(var decls2;...) to for(var decls1,decls2;...)
                                        // we want to PREPEND the initializers in the previous var-statement
                                        // to our for-statement's initializer var-statement list
                                        varInitializer.InsertAt(0, previousVar);

                                        // then remove the previous var statement
                                        node.RemoveAt(ndx - 1);
                                        // this will bump the for node up one position in the list, so the next iteration
                                        // will be right back on this node in case there are other var statements we need
                                        // to combine
                                    }
                                    else
                                    {
                                        // we want to see if the initializer expression is a series of one or more
                                        // simple assignments to variables that are in the previous var statement.
                                        // if all the expressions are assignments to variables that are defined in the
                                        // previous var statement, then we can just move the var statement into the 
                                        // for statement.
                                        var binaryOp = forNode.Initializer as BinaryOperator;
                                        if (binaryOp != null && AreAssignmentsInVar(binaryOp, previousVar))
                                        {
                                            // transform: var decls;for(expr1;...) to for(var decls,expr1;...)
                                            // WHERE expr1 only consists of assignments to variables that are declared
                                            // in that previous var-statement.
                                            // TODO: we *could* also do it is the expr1 assignments are to lookups that are
                                            // defined in THIS scope (not any outer scopes), because it wouldn't hurt to have
                                            // then in a var statement again.
                                            // create a list and fill it with all the var-decls created from the assignment
                                            // operators in the expression
                                            ConvertAssignmentsToVarDecls(binaryOp, previousVar, m_parser);

                                            // move the previous var-statement into our initializer
                                            forNode.Initializer = previousVar;

                                            // and remove the previous var-statement from the list.
                                            node.RemoveAt(ndx - 1);

                                            // this will bump the for node up one position in the list, so the next iteration
                                            // will be right back on this node, but the initializer will not be null
                                        }
                                    }
                                }
                                else
                                {
                                    // transform: var decls;for(;...) to for(var decls;...)
                                    // if it's empty, then we're free to add the previous var statement
                                    // to this for statement's initializer. remove it from it's current
                                    // position and add it as the initializer
                                    node.RemoveAt(ndx - 1);
                                    forNode.Initializer = previousVar;
                                    // this will bump the for node up one position in the list, so the next iteration
                                    // will be right back on this node, but the initializer will not be null
                                }
                            }
                        }
                        else if (previousVar != null 
                            && (whileNode = node[ndx] as WhileNode) != null
                            && m_parser.Settings.IsModificationAllowed(TreeModifications.ChangeWhileToFor))
                        {
                            // transform: var ...;while(cond)... => for(var ...;cond;)...
                            node[ndx] = new ForNode(whileNode.Context.FlattenToStart())
                                {
                                    Initializer = previousVar,
                                    Condition = whileNode.Condition,
                                    Body = whileNode.Body
                                };
                            node.RemoveAt(ndx - 1);
                        }
                        else if (previousVar != null
                            && (forInNode = node[ndx] as ForIn) != null)
                        {
                            // if the for-in's variable field is not a declaration, we should check to see
                            // if there is a single named reference, and whether the previous var's last declaration
                            // is for the same var. If so, we can move that declaration into the for-in.
                            if (!(forInNode.Variable is Declaration))
                            {
                                // now see if the LAST vardecl in the previous var statement is the 
                                // same field(s) as the variable, and there was either no initializer
                                // or the initializer was a constant ('cause we're going to kill it).
                                var lastDecl = previousVar[previousVar.Count - 1];
                                if (lastDecl.IsEquivalentTo(forInNode.Variable)
                                    && (lastDecl.Initializer == null || lastDecl.Initializer.IsConstant))
                                {
                                    // convert the reference inside the for-in to a declaration binding.
                                    // set the previous decl's binding to this new binding, delete any
                                    // initializer, and move the vardecl into the for-in.
                                    // Be sure to clean up the var-statement if it's now empty.
                                    var newBinding = BindingTransform.ToBinding(forInNode.Variable);
                                    if (newBinding != null)
                                    {
                                        var newVarDecl = new VariableDeclaration(forInNode.Variable.Context.Clone())
                                            {
                                                Binding = newBinding,
                                            };
                                        var newVar = new Var(forInNode.Variable.Context.Clone());
                                        newVar.Append(newVarDecl);
                                        forInNode.Variable = newVar;

                                        // clean up that last declaration, which might go all the way
                                        // up to the statement if removing it leaves the statement empty.
                                        // but ONLY remove declarations that are in the new for-binding.
                                        var oldBindings = BindingsVisitor.Bindings(lastDecl.Binding);
                                        foreach (var newName in BindingsVisitor.Bindings(newBinding))
                                        {
                                            foreach (var oldName in oldBindings)
                                            {
                                                if (oldName.IsEquivalentTo(newName))
                                                {
                                                    ActivationObject.RemoveBinding(oldName);
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // see if the last statement is a return statement
                ReturnNode lastReturn;
                if ((lastReturn = FindLastStatement(node) as ReturnNode) != null)
                {
                    // set this flag to true if we end up adding an expression to the block.
                    // before exiting, we'll go through and combine adjacent expressions again if this
                    // flag has been set to true.
                    bool changedStatementToExpression = false;

                    // get the index of the statement before the last return
                    // (skip over function decls and importand comments)
                    var indexPrevious = PreviousStatementIndex(node, lastReturn);

                    // just out of curiosity, let's see if we fit a common pattern:
                    //      var name=expr;return name;
                    // or
                    //      const name=expr;return name;
                    // if so, we can cut out the var and simply return the expression
                    Lookup lookup;
                    if ((lookup = lastReturn.Operand as Lookup) != null && indexPrevious >= 0)
                    {
                        // use the base class for both the var- and const-statements so we will
                        // pick them both up at the same time
                        var varStatement = node[indexPrevious] as Declaration;
                        if (varStatement != null)
                        {
                            // if the last vardecl in the var statement matches the return lookup, and no
                            // other references exist for this field (refcount == 1)...
                            var varDecl = varStatement[varStatement.Count - 1];
                            if (varDecl.Initializer != null
                                && varDecl.IsEquivalentTo(lookup))
                            {
                                // we only care about simple binding identifiers
                                var bindingIdentifier = varDecl.Binding as BindingIdentifier;
                                if (bindingIdentifier != null
                                    && bindingIdentifier.VariableField.IfNotNull(v => v.RefCount == 1))
                                {
                                    // clean up the field's references because we're removing both the lookup reference
                                    // in the return statement and the vardecl.
                                    bindingIdentifier.VariableField.References.Remove(lookup);
                                    bindingIdentifier.VariableField.Declarations.Remove(bindingIdentifier);

                                    if (varStatement.Count == 1)
                                    {
                                        // transform: ...;var name=expr;return name} to ...;return expr}
                                        // there's only one vardecl in the var, so get rid of the entire statement
                                        lastReturn.Operand = varDecl.Initializer;
                                        node.RemoveAt(indexPrevious);
                                    }
                                    else
                                    {
                                        // multiple vardecls are in the statement; we only need to get rid of the last one
                                        lastReturn.Operand = varDecl.Initializer;
                                        varStatement[varStatement.Count - 1] = null;
                                    }
                                }
                            }
                        }
                    }

                    // check to see if we can combine the return statement with a previous if-statement
                    // into a simple return-conditional. The true statement needs to have no false block,
                    // and only one statement in the true block.
                    Conditional conditional;
                    IfNode previousIf;
                    while (indexPrevious >= 0 
                        && lastReturn != null
                        && (previousIf = node[indexPrevious] as IfNode) != null
                        && previousIf.TrueBlock != null && previousIf.TrueBlock.Count == 1
                        && previousIf.FalseBlock == null)
                    {
                        // assume no change is made for this loop
                        bool somethingChanged = false;

                        // and that one true-block statement needs to be a return statement
                        var previousReturn = previousIf.TrueBlock[0] as ReturnNode;
                        if (previousReturn != null)
                        {
                            if (lastReturn.Operand == null)
                            {
                                if (previousReturn.Operand == null)
                                {
                                    // IF we are at the function level, then the block ends in an implicit return (undefined)
                                    // and we can change this if to just the condition. If we aren't at the function level,
                                    // then we have to leave the return, but we can replace the if with just the condition.
                                    if (!isFunctionLevel)
                                    {
                                        // not at the function level, so the return must stay.
                                        if (previousIf.Condition.IsConstant)
                                        {
                                            // transform: if(cond)return;return} to return}
                                            node.RemoveAt(indexPrevious);
                                            somethingChanged = true;
                                        }
                                        else
                                        {
                                            // transform: if(cond)return;return} to cond;return}
                                            node[indexPrevious] = previousIf.Condition;
                                        }
                                    }
                                    else if (previousIf.Condition.IsConstant)
                                    {
                                        // transform: remove if(cond)return;return} because cond is a constant
                                        node.ReplaceChild(lastReturn, null);
                                        node.RemoveAt(indexPrevious);
                                        somethingChanged = true;
                                    }
                                    else
                                    {
                                        // transform: if(cond)return;return} to cond}
                                        // replace the final return with just the condition, then remove the previous if
                                        if (node.ReplaceChild(lastReturn, previousIf.Condition))
                                        {
                                            node.RemoveAt(indexPrevious);
                                            somethingChanged = true;
                                        }
                                    }
                                }
                                else
                                {
                                    // transform: if(cond)return expr;return} to return cond?expr:void 0
                                    conditional = new Conditional(previousIf.Condition.Context.FlattenToStart())
                                        {
                                            Condition = previousIf.Condition,
                                            TrueExpression = previousReturn.Operand,
                                            FalseExpression = CreateVoidNode(previousReturn.Context.FlattenToStart())
                                        };

                                    // replace the final return with the new return, then delete the previous if-statement
                                    if (node.ReplaceChild(lastReturn, new ReturnNode(previousReturn.Context.FlattenToStart())
                                        {
                                            Operand = conditional
                                        }))
                                    {
                                        node.RemoveAt(indexPrevious);
                                        Optimize(conditional);
                                        somethingChanged = true;
                                    }
                                }
                            }
                            else
                            {
                                if (previousReturn.Operand == null)
                                {
                                    // transform: if(cond)return;return expr} to return cond?void 0:expr
                                    conditional = new Conditional(previousIf.Condition.Context.FlattenToStart())
                                        {
                                            Condition = previousIf.Condition,
                                            TrueExpression = CreateVoidNode(lastReturn.Context.FlattenToStart()),
                                            FalseExpression = lastReturn.Operand
                                        };

                                    // replace the final return with the new return, then delete the previous if-statement
                                    if (node.ReplaceChild(lastReturn, new ReturnNode(lastReturn.Context.FlattenToStart())
                                        {
                                            Operand = conditional
                                        }))
                                    {
                                        node.RemoveAt(indexPrevious);
                                        Optimize(conditional);
                                        somethingChanged = true;
                                    }
                                }
                                else if (previousReturn.Operand.IsEquivalentTo(lastReturn.Operand))
                                {
                                    if (previousIf.Condition.IsConstant)
                                    {
                                        // the condition is constant, and the returns return the same thing.
                                        // get rid of the if statement altogether.
                                        // transform: if(cond)return expr;return expr} to return expr}
                                        DetachReferences.Apply(previousReturn.Operand);
                                        node.RemoveAt(indexPrevious);
                                        somethingChanged = true;
                                    }
                                    else
                                    {
                                        // transform: if(cond)return expr;return expr} to return cond,expr}
                                        // create a new binary op with the condition and the final-return operand,
                                        // replace the operand on the final-return with the new binary operator,
                                        // and then delete the previous if-statement
                                        DetachReferences.Apply(previousReturn.Operand);
                                        lastReturn.Operand = CommaOperator.CombineWithComma(previousIf.Condition.Context.FlattenToStart(), previousIf.Condition, lastReturn.Operand);
                                        node.RemoveAt(indexPrevious);
                                        somethingChanged = true;
                                    }
                                }
                                else
                                {
                                    // transform: if(cond)return expr1;return expr2} to return cond?expr1:expr2}
                                    // create a new conditional with the condition and the return operands,
                                    // replace the operand on the final-return with the new conditional operator,
                                    // and then delete the previous if-statement
                                    // transform: if(cond)return expr1;return expr2} to return cond?expr1:expr2}
                                    conditional = new Conditional(previousIf.Condition.Context.FlattenToStart())
                                        {
                                            Condition = previousIf.Condition,
                                            TrueExpression = previousReturn.Operand,
                                            FalseExpression = lastReturn.Operand
                                        };

                                    // replace the operand on the final-return with the new conditional operator,
                                    // and then delete the previous if-statement
                                    lastReturn.Operand = conditional;
                                    node.RemoveAt(indexPrevious);
                                    Optimize(conditional);
                                    somethingChanged = true;
                                }
                            }
                        }

                        if (!somethingChanged)
                        {
                            // nothing changed -- break out of the loop
                            break;
                        }
                        else
                        {
                            // set the flag that indicates something changed in at least one of these loops
                            changedStatementToExpression = true;
                            
                            // and since we changed something, we need to bump the index down one
                            // AFTER we grab the last return node (which has slipped into the same position
                            // as the previous node)
                            lastReturn = node[indexPrevious--] as ReturnNode;
                        }
                    }

                    // if we added any more expressions since we ran our expression-combination logic, 
                    // run it again.
                    if (changedStatementToExpression
                        && m_parser.Settings.IsModificationAllowed(TreeModifications.CombineAdjacentExpressionStatements))
                    {
                        CombineExpressions(node);
                    }

                    // and FINALLY, we want to see if what we did previously didn't pan out and we end
                    // in something like return cond?expr:void 0, in which case we want to change it
                    // back to a simple if(condition)return expr; (saves four bytes).
                    // see if the last statement is a return statement that returns a conditional
                    if (lastReturn != null
                        && (conditional = lastReturn.Operand as Conditional) != null)
                    {
                        var unaryOperator = conditional.FalseExpression as UnaryOperator;
                        if (unaryOperator != null 
                            && unaryOperator.OperatorToken == JSToken.Void
                            && unaryOperator.Operand is ConstantWrapper)
                        {
                            unaryOperator = conditional.TrueExpression as UnaryOperator;
                            if (unaryOperator != null && unaryOperator.OperatorToken == JSToken.Void)
                            {
                                if (isFunctionLevel)
                                {
                                    // transform: ...;return cond?void 0:void 0} to ...;cond}
                                    // function level ends in an implicit "return void 0"
                                    node.ReplaceChild(lastReturn, conditional.Condition);
                                }
                                else
                                {
                                    // transform: ...;return cond?void 0:void 0} to ...;cond;return}
                                    // non-function level doesn't end in an implicit return,
                                    // so we need to break them out into two statements
                                    node.ReplaceChild(lastReturn, conditional.Condition);
                                    node.Append(new ReturnNode(lastReturn.Context.Clone()));
                                }
                            }
                            else if (isFunctionLevel)
                            {
                                // transform: ...;return cond?expr:void 0} to ...;if(cond)return expr}
                                // (only works at the function-level because of the implicit return statement)
                                var ifNode = new IfNode(lastReturn.Context)
                                    {
                                        Condition = conditional.Condition,
                                        TrueBlock = AstNode.ForceToBlock(new ReturnNode(lastReturn.Context.Clone())
                                            {
                                                Operand = conditional.TrueExpression
                                            })
                                    };
                                node.ReplaceChild(lastReturn, ifNode);
                            }
                        }
                        else if (isFunctionLevel)
                        {
                            unaryOperator = conditional.TrueExpression as UnaryOperator;
                            if (unaryOperator != null 
                                && unaryOperator.OperatorToken == JSToken.Void
                                && unaryOperator.Operand is ConstantWrapper)
                            {
                                // transform: ...;return cond?void 0;expr} to ...;if(!cond)return expr}
                                // (only works at the function level because of the implicit return)
                                // get the logical-not of the conditional
                                var logicalNot = new LogicalNot(conditional.Condition, m_parser.Settings);
                                logicalNot.Apply();

                                // create a new if-node based on the condition, with the branches swapped 
                                // (true-expression goes to false-branch, false-expression goes to true-branch
                                var ifNode = new IfNode(lastReturn.Context)
                                    {
                                        Condition = conditional.Condition,
                                        TrueBlock = AstNode.ForceToBlock(new ReturnNode(lastReturn.Context.Clone())
                                            {
                                                Operand = conditional.FalseExpression
                                            })
                                    };
                                node.ReplaceChild(lastReturn, ifNode);
                            }
                        }
                    }
                }

                if (m_parser.Settings.IsModificationAllowed(TreeModifications.CombineEquivalentIfReturns))
                {
                    // walk backwards looking for if(cond1)return expr1;if(cond2)return expr2;
                    // (backwards, because we'll be combining those into one statement, reducing the number of statements.
                    // don't go all the way to zero, because each loop will compare the statement to the PREVIOUS
                    // statement, and the first statement (index==0) has no previous statement.
                    for (var ndx = node.Count - 1; ndx > 0; --ndx)
                    {
                        // see if the current statement is an if-statement with no else block, and a true
                        // block that contains a single return-statement WITH an expression.
                        AstNode currentExpr = null;
                        AstNode condition2;
                        if (IsIfReturnExpr(node[ndx], out condition2, ref currentExpr) != null)
                        {
                            // see if the previous statement is also the same pattern, but with
                            // the equivalent expression as its return operand
                            AstNode condition1;
                            var matchedExpression = currentExpr;
                            var ifNode = IsIfReturnExpr(node[ndx - 1], out condition1, ref matchedExpression);
                            if (ifNode != null)
                            {
                                // it is a match!
                                // let's combine them -- we'll add the current condition to the
                                // previous condition with a logical-or and delete the current statement.
                                // transform: if(cond1)return expr;if(cond2)return expr; to if(cond1||cond2)return expr;
                                ifNode.Condition = new BinaryOperator(condition1.Context.FlattenToStart())
                                    {
                                        Operand1 = condition1,
                                        Operand2 = condition2,
                                        OperatorToken = JSToken.LogicalOr,
                                        TerminatingContext = ifNode.TerminatingContext ?? node.TerminatingContext
                                    };
                                DetachReferences.Apply(currentExpr);
                                node.RemoveAt(ndx);
                            }
                        }
                    }
                }

                if (isFunctionLevel
                    && m_parser.Settings.IsModificationAllowed(TreeModifications.InvertIfReturn))
                {
                    // walk backwards looking for if (cond) return; whenever we encounter that statement,
                    // we can change it to if (!cond) and put all subsequent statements in the block inside the
                    // if's true-block.
                    for (var ndx = node.Count - 1; ndx >= 0; --ndx)
                    {
                        var ifNode = node[ndx] as IfNode;
                        if (ifNode != null
                            && ifNode.FalseBlock == null
                            && ifNode.TrueBlock != null
                            && ifNode.TrueBlock.Count == 1)
                        {
                            var returnNode = ifNode.TrueBlock[0] as ReturnNode;
                            if (returnNode != null && returnNode.Operand == null)
                            {
                                // we have if(cond)return;
                                // logical-not the condition, remove the return statement,
                                // and move all subsequent sibling statements inside the if-statement.
                                LogicalNot.Apply(ifNode.Condition, m_parser.Settings);
                                ifNode.TrueBlock.Clear();

                                var ndxMove = ndx + 1;
                                if (node.Count == ndxMove + 1)
                                {
                                    // there's only one statement after our if-node.
                                    // see if it's ALSO an if-node with no else block.
                                    var secondIfNode = node[ndxMove] as IfNode;
                                    if (secondIfNode != null && (secondIfNode.FalseBlock == null || secondIfNode.FalseBlock.Count == 0))
                                    {
                                        // it is!
                                        // transform: if(cond1)return;if(cond2){...} => if(!cond1&&cond2){...}
                                        // (the cond1 is already inverted at this point)
                                        // combine cond2 with cond1 via a logical-and,
                                        // move all secondIf statements inside the if-node,
                                        // remove the secondIf node.
                                        node.RemoveAt(ndxMove);
                                        ifNode.Condition = new BinaryOperator(ifNode.Condition.Context.FlattenToStart())
                                            {
                                                Operand1 = ifNode.Condition,
                                                Operand2 = secondIfNode.Condition,
                                                OperatorToken = JSToken.LogicalAnd
                                            };

                                        ifNode.TrueBlock = secondIfNode.TrueBlock;
                                    }
                                    else if (node[ndxMove].IsExpression
                                        && m_parser.Settings.IsModificationAllowed(TreeModifications.IfConditionCallToConditionAndCall))
                                    {
                                        // now we have if(cond)expr; optimize that!
                                        var expression = node[ndxMove];
                                        node.RemoveAt(ndxMove);
                                        IfConditionExpressionToExpression(ifNode, expression);
                                    }
                                }

                                // just move all the following statements inside the if-statement
                                while (node.Count > ndxMove)
                                {
                                    var movedNode = node[ndxMove];
                                    node.RemoveAt(ndxMove);
                                    ifNode.TrueBlock.Append(movedNode);
                                }
                            }
                        }
                    }
                }
                else
                {
                    var isIteratorBlock = node.Parent is ForNode
                        || node.Parent is ForIn
                        || node.Parent is WhileNode
                        || node.Parent is DoWhile;

                    if (isIteratorBlock
                        && m_parser.Settings.IsModificationAllowed(TreeModifications.InvertIfContinue))
                    {
                        // walk backwards looking for if (cond) continue; whenever we encounter that statement,
                        // we can change it to if (!cond) and put all subsequent statements in the block inside the
                        // if's true-block.
                        for (var ndx = node.Count - 1; ndx >= 0; --ndx)
                        {
                            var ifNode = node[ndx] as IfNode;
                            if (ifNode != null
                                && ifNode.FalseBlock == null
                                && ifNode.TrueBlock != null
                                && ifNode.TrueBlock.Count == 1)
                            {
                                var continueNode = ifNode.TrueBlock[0] as ContinueNode;

                                // if there's no label, then we're good. Otherwise we can only make this optimization
                                // if the label refers to the parent iterator node.
                                if (continueNode != null 
                                    && (string.IsNullOrEmpty(continueNode.Label) || (LabelMatchesParent(continueNode.Label, node.Parent))))
                                {
                                    // if this is the last statement, then we don't really need the if at all
                                    // and can just replace it with its condition
                                    if (ndx < node.Count - 1)
                                    {
                                        // we have if(cond)continue;st1;...stn;
                                        // logical-not the condition, remove the continue statement,
                                        // and move all subsequent sibling statements inside the if-statement.
                                        LogicalNot.Apply(ifNode.Condition, m_parser.Settings);
                                        ifNode.TrueBlock.Clear();

                                        // TODO: if we removed a labeled continue, do we need to fix up some label references?

                                        var ndxMove = ndx + 1;
                                        if (node.Count == ndxMove + 1)
                                        {
                                            // there's only one statement after our if-node.
                                            // see if it's ALSO an if-node with no else block.
                                            var secondIfNode = node[ndxMove] as IfNode;
                                            if (secondIfNode != null && (secondIfNode.FalseBlock == null || secondIfNode.FalseBlock.Count == 0))
                                            {
                                                // it is!
                                                // transform: if(cond1)continue;if(cond2){...} => if(!cond1&&cond2){...}
                                                // (the cond1 is already inverted at this point)
                                                // combine cond2 with cond1 via a logical-and,
                                                // move all secondIf statements inside the if-node,
                                                // remove the secondIf node.
                                                ifNode.Condition = new BinaryOperator(ifNode.Condition.Context.FlattenToStart())
                                                    {
                                                        Operand1 = ifNode.Condition,
                                                        Operand2 = secondIfNode.Condition,
                                                        OperatorToken = JSToken.LogicalAnd
                                                    };

                                                ifNode.TrueBlock = secondIfNode.TrueBlock;
                                                node.RemoveAt(ndxMove);
                                            }
                                            else if (node[ndxMove].IsExpression
                                                && m_parser.Settings.IsModificationAllowed(TreeModifications.IfConditionCallToConditionAndCall))
                                            {
                                                // now we have if(cond)expr; optimize that!
                                                var expression = node[ndxMove];
                                                node.RemoveAt(ndxMove);
                                                IfConditionExpressionToExpression(ifNode, expression);
                                            }
                                        }

                                        // just move all the following statements inside the if-statement
                                        while (node.Count > ndxMove)
                                        {
                                            var movedNode = node[ndxMove];
                                            node.RemoveAt(ndxMove);
                                            ifNode.TrueBlock.Append(movedNode);
                                        }
                                    }
                                    else
                                    {
                                        // we have if(cond)continue} -- nothing after the if.
                                        // the loop is going to continue anyway, so replace the if-statement
                                        // with the condition and be done
                                        if (ifNode.Condition.IsConstant)
                                        {
                                            // consition is constant -- get rid of the if-statement altogether
                                            node.RemoveAt(ndx);
                                        }
                                        else
                                        {
                                            // condition isn't constant
                                            node[ndx] = ifNode.Condition;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        private static bool LabelMatchesParent(string label, AstNode parentNode)
        {
            var isMatch = false;

            // see if the parent's parent is a labeled statement
            LabeledStatement labeledStatement;
            while ((labeledStatement = parentNode.Parent as LabeledStatement) != null)
            {
                // see if the label we are looking for matches the labeled statement
                if (string.CompareOrdinal(label, labeledStatement.Label) == 0)
                {
                    // it's a match -- we're done
                    isMatch = true;
                    break;
                }

                // try the next node up (a labeled statement can itself be labeled)
                parentNode = labeledStatement;
            }
            return isMatch;
        }

        private static IfNode IsIfReturnExpr(AstNode node, out AstNode condition, ref AstNode matchExpression)
        {
            // set the condition to null initially
            condition = null;

            // must be an if-node with no false block, and a true block with one statement
            var ifNode = node as IfNode;
            if (ifNode != null
                && ifNode.FalseBlock == null
                && ifNode.TrueBlock != null
                && ifNode.TrueBlock.Count == 1)
            {
                // and that one statement needs to be a return statement
                var returnNode = ifNode.TrueBlock[0] as ReturnNode;
                if (returnNode != null)
                {
                    if (matchExpression == null
                        || matchExpression.IsEquivalentTo(returnNode.Operand))
                    {
                        // either we don't care what the return expression is,
                        // or we do care and it's a match.
                        matchExpression = returnNode.Operand;
                        condition = ifNode.Condition;
                    }
                }
            }

            // but we will only return the if-node IF the matchedExpression and the
            // condition are both non-null (our TRUE state)
            return condition != null && matchExpression != null ? ifNode : null;
        }

        private static int PreviousStatementIndex(Block node, AstNode child)
        {
            // get the index of the statement before the last return
            // (skip over function decls and importand comments)
            var indexPrevious = node.IndexOf(child) - 1;
            while (indexPrevious >= 0 && (node[indexPrevious] is FunctionObject || node[indexPrevious] is ImportantComment))
            {
                --indexPrevious;
            }

            return indexPrevious;
        }

        public override void Visit(Break node)
        {
            if (node != null)
            {
                // if the label isn't valid an we can remove them, remove it now
                if (!node.Label.IsNullOrWhiteSpace()
                    && node.LabelInfo == null
                    && m_parser.Settings.RemoveUnneededCode
                    && m_parser.Settings.IsModificationAllowed(TreeModifications.RemoveUnnecessaryLabels))
                {
                    node.Label = null;
                }

                if (!IsInsideLoop(node, true))
                {
                    node.Context.HandleError(JSError.BadBreak, true);
                }
            }
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1502:AvoidExcessiveComplexity")]
        public override void Visit(CallNode node)
        {
            if (node != null)
            {
                // see if this is a member (we'll need it for a couple checks)
                Member member = node.Function as Member;
                Lookup lookup;

                // if this is a constructor and we want to collapse
                // some of them to literals...
                if (node.IsConstructor)
                {
                    // array function as new operands will probably be wrapped in parens
                    var funcObject = node.Function as FunctionObject;
                    if (funcObject != null || (funcObject = (node.Function as GroupingOperator).IfNotNull(g => g.Operand as FunctionObject)) != null)
                    {
                        if (funcObject.FunctionType == FunctionType.ArrowFunction)
                        {
                            // arrow functions can't be constructors, and we explicitly have one here.
                            // throw an error
                            node.Function.Context.HandleError(JSError.ArrowCannotBeConstructor, true);
                        }
                    }
                    else if (m_parser.Settings.CollapseToLiteral)
                    {
                        // see if this is a lookup, and if so, if it's pointing to one
                        // of the two constructors we want to collapse
                        lookup = node.Function as Lookup;
                        if (lookup != null)
                        {
                            if (lookup.Name == "Object"
                                && m_parser.Settings.IsModificationAllowed(TreeModifications.NewObjectToObjectLiteral))
                            {
                                // no arguments -- the Object constructor with no arguments is the exact same as an empty
                                // object literal
                                if (node.Arguments == null || node.Arguments.Count == 0)
                                {
                                    // replace our node with an object literal
                                    var objLiteral = new ObjectLiteral(node.Context);
                                    if (node.Parent.ReplaceChild(node, objLiteral))
                                    {
                                        // and bail now. No need to recurse -- it's an empty literal
                                        return;
                                    }
                                }
                                else if (node.Arguments.Count == 1)
                                {
                                    // one argument
                                    // check to see if it's an object literal.
                                    var objectLiteral = node.Arguments[0] as ObjectLiteral;
                                    if (objectLiteral != null)
                                    {
                                        // the Object constructor with an argument that is a JavaScript object merely returns the
                                        // argument. Since the argument is an object literal, it is by definition a JavaScript object
                                        // and therefore we can replace the constructor call with the object literal
                                        node.Parent.ReplaceChild(node, objectLiteral);

                                        // don't forget to recurse the object now
                                        objectLiteral.Accept(this);

                                        // and then bail -- we don't want to process this call
                                        // operation any more; we've gotten rid of it
                                        return;
                                    }
                                }
                            }
                            else if (lookup.Name == "Array"
                                && m_parser.Settings.IsModificationAllowed(TreeModifications.NewArrayToArrayLiteral))
                            {
                                // Array is trickier. 
                                // If there are no arguments, then just use [].
                                // if there are multiple arguments, then use [arg0,arg1...argN].
                                // but if there is one argument and it's numeric, we can't crunch it.
                                // also can't crunch if it's a function call or a member or something, since we won't
                                // KNOW whether or not it's numeric.
                                //
                                // so first see if it even is a single-argument constant wrapper. 
                                ConstantWrapper constWrapper = (node.Arguments != null && node.Arguments.Count == 1
                                    ? node.Arguments[0] as ConstantWrapper
                                    : null);

                                // if the argument count is not one, then we crunch.
                                // if the argument count IS one, we only crunch if we have a constant wrapper, 
                                // AND it's not numeric.
                                if (node.Arguments == null
                                  || node.Arguments.Count != 1
                                  || (constWrapper != null && !constWrapper.IsNumericLiteral))
                                {
                                    // create the new array literal object
                                    var arrayLiteral = new ArrayLiteral(node.Context)
                                        {
                                            Elements = node.Arguments
                                        };

                                    // replace ourself within our parent
                                    if (node.Parent.ReplaceChild(node, arrayLiteral))
                                    {
                                        // recurse
                                        arrayLiteral.Accept(this);
                                        // and bail -- we don't want to recurse this node any more
                                        return;
                                    }
                                }
                            }
                        }
                    }
                }

                // if we are replacing resource references with strings generated from resource files
                // and this is a brackets call: lookup[args]
                var resourceList = m_parser.Settings.ResourceStrings;
                if (node.InBrackets && resourceList.Count > 0)
                {
                    // if we don't have a match visitor, create it now
                    if (m_matchVisitor == null)
                    {
                        m_matchVisitor = new MatchPropertiesVisitor();
                    }

                    // check each resource strings object to see if we have a match.
                    // Walk the list BACKWARDS so that later resource string definitions supercede previous ones.
                    for (var ndx = resourceList.Count - 1; ndx >= 0; --ndx)
                    {
                        var resourceStrings = resourceList[ndx];

                        // check to see if the resource strings name matches the function
                        if (resourceStrings != null && m_matchVisitor.Match(node.Function, resourceStrings.Name))
                        {
                            // we're going to replace this node with a string constant wrapper
                            // but first we need to make sure that this is a valid lookup.
                            // if the parameter contains anything that would vary at run-time, 
                            // then we need to throw an error.
                            // the parser will always have either one or zero nodes in the arguments
                            // arg list. We're not interested in zero args, so just make sure there is one
                            if (node.Arguments.Count == 1)
                            {
                                // must be a constant wrapper
                                ConstantWrapper argConstant = node.Arguments[0] as ConstantWrapper;
                                if (argConstant != null)
                                {
                                    string resourceName = argConstant.Value.ToString();

                                    // get the localized string from the resources object
                                    ConstantWrapper resourceLiteral = new ConstantWrapper(
                                        resourceStrings[resourceName],
                                        PrimitiveType.String,
                                        node.Context);

                                    // replace this node with localized string, analyze it, and bail
                                    // so we don't anaylze the tree we just replaced
                                    node.Parent.ReplaceChild(node, resourceLiteral);
                                    resourceLiteral.Accept(this);
                                    return;
                                }
                                else
                                {
                                    // error! must be a constant
                                    node.Context.HandleError(
                                        JSError.ResourceReferenceMustBeConstant,
                                        true);
                                }
                            }
                            else
                            {
                                // error! can only be a single constant argument to the string resource object.
                                // the parser will only have zero or one arguments, so this must be zero
                                // (since the parser won't pass multiple args to a [] operator)
                                node.Context.HandleError(
                                    JSError.ResourceReferenceMustBeConstant,
                                    true);
                            }
                        }
                    }
                }

                // and finally, if this is a backets call and the argument is a constantwrapper that can
                // be an identifier, just change us to a member node:  obj["prop"] to obj.prop.
                // but ONLY if the string value is "safe" to be an identifier. Even though the ECMA-262
                // spec says certain Unicode categories are okay, in practice the various major browsers
                // all seem to have problems with certain characters in identifiers. Rather than risking
                // some browsers breaking when we change this syntax, don't do it for those "danger" categories.
                if (node.InBrackets && node.Arguments != null)
                {
                    // see if there is a single, constant argument
                    string argText = node.Arguments.SingleConstantArgument;
                    if (argText != null)
                    {
                        // see if we want to replace the name
                        string newName;
                        if (m_parser.Settings.HasRenamePairs && m_parser.Settings.ManualRenamesProperties
                            && m_parser.Settings.IsModificationAllowed(TreeModifications.PropertyRenaming)
                            && !string.IsNullOrEmpty(newName = m_parser.Settings.GetNewName(argText)))
                        {
                            // yes -- we are going to replace the name, either as a string literal, or by converting
                            // to a member-dot operation.
                            // See if we can't turn it into a dot-operator. If we can't, then we just want to replace the operator with
                            // a new constant wrapper. Otherwise we'll just replace the operator with a new constant wrapper.
                            if (m_parser.Settings.IsModificationAllowed(TreeModifications.BracketMemberToDotMember)
                                && JSScanner.IsSafeIdentifier(newName)
                                && !JSScanner.IsKeyword(newName, (node.EnclosingScope ?? m_parser.GlobalScope).UseStrict))
                            {
                                // the new name is safe to convert to a member-dot operator.
                                // but we don't want to convert the node to the NEW name, because we still need to Analyze the
                                // new member node -- and it might convert the new name to something else. So instead we're
                                // just going to convert this existing string to a member node WITH THE OLD STRING, 
                                // and THEN analyze it (which will convert the old string to newName)
                                Member replacementMember = new Member(node.Context)
                                    {
                                        Root = node.Function,
                                        Name = argText,
                                        NameContext = node.Arguments[0].Context
                                    };
                                node.Parent.ReplaceChild(node, replacementMember);

                                // this analyze call will convert the old-name member to the newName value
                                replacementMember.Accept(this);
                                return;
                            }
                            else
                            {
                                // nope; can't convert to a dot-operator. 
                                // we're just going to replace the first argument with a new string literal
                                // and continue along our merry way.
                                node.Arguments[0] = new ConstantWrapper(newName, PrimitiveType.String, node.Arguments[0].Context);
                            }
                        }
                        else if (m_parser.Settings.IsModificationAllowed(TreeModifications.BracketMemberToDotMember)
                            && JSScanner.IsSafeIdentifier(argText)
                            && !JSScanner.IsKeyword(argText, (node.EnclosingScope ?? m_parser.GlobalScope).UseStrict))
                        {
                            // not a replacement, but the string literal is a safe identifier. So we will
                            // replace this call node with a Member-dot operation
                            Member replacementMember = new Member(node.Context)
                                {
                                    Root = node.Function,
                                    Name = argText,
                                    NameContext = node.Arguments[0].Context
                                };
                            node.Parent.ReplaceChild(node, replacementMember);
                            replacementMember.Accept(this);
                            return;
                        }
                    }
                }

                // call the base class to recurse
                base.Visit(node);

                if (node.Function != null && node.Function.IsDebugOnly)
                {
                    // if the funtion is debug-only, then we are too!
                    node.IsDebugOnly = true;

                    // if if this node is a constructor call....
                    if (node.IsConstructor)
                    {
                        // we have "new root.func(...)", root.func is a debug namespace, and we
                        // are stripping debug namespaces. Replace the new-operator with an 
                        // empty object literal.
                        node.Parent.ReplaceChild(node, new ObjectLiteral(node.Context)
                            {
                                IsDebugOnly = true
                            });
                    }
                }
                else
                {
                    // might have changed
                    member = node.Function as Member;
                    lookup = node.Function as Lookup;

                    var isEval = false;
                    if (lookup != null
                        && string.CompareOrdinal(lookup.Name, "eval") == 0
                        && lookup.VariableField.FieldType == FieldType.Predefined)
                    {
                        // call to predefined eval function
                        isEval = true;
                    }
                    else if (member != null && string.CompareOrdinal(member.Name, "eval") == 0)
                    {
                        // if this is a window.eval call, then we need to mark this scope as unknown just as
                        // we would if this was a regular eval call.
                        // (unless, of course, the parser settings say evals are safe)
                        // call AFTER recursing so we know the left-hand side properties have had a chance to
                        // lookup their fields to see if they are local or global
                        if (member.Root.IsWindowLookup)
                        {
                            // this is a call to window.eval()
                            isEval = true;
                        }
                    }
                    else
                    {
                        CallNode callNode = node.Function as CallNode;
                        if (callNode != null
                            && callNode.InBrackets
                            && callNode.Function.IsWindowLookup
                            && callNode.Arguments.IsSingleConstantArgument("eval"))
                        {
                            // this is a call to window["eval"]
                            isEval = true;
                        }
                    }

                    if (isEval)
                    {
                        if (m_parser.Settings.EvalTreatment != EvalTreatment.Ignore)
                        {
                            // mark this scope as unknown so we don't crunch out locals 
                            // we might reference in the eval at runtime
                            m_scopeStack.Peek().IsKnownAtCompileTime = false;
                        }
                    }
                }
            }
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1502:AvoidExcessiveComplexity")]
        public override void Visit(ClassNode node)
        {
            if (node != null)
            {
                base.Visit(node);

                // if this is a named class expression
                if (node.ClassType == ClassType.Expression && node.Binding != null)
                {
                    // it SHOULD be a simple identifier; if it's not, then leave it alone.
                    // but if it is, check to see if it's actually referenced, and if not, get rid of it
                    // because we don't need it.
                    var bindingIdentifier = node.Binding as BindingIdentifier;
                    if (bindingIdentifier != null
                        && bindingIdentifier.VariableField != null
                        && bindingIdentifier.VariableField.RefCount == 0
                        && m_parser.Settings.RemoveFunctionExpressionNames
                        && m_parser.Settings.IsModificationAllowed(TreeModifications.RemoveFunctionExpressionNames))
                    {
                        // if the class is a named expression and the name isn't
                        // referenced anywhere, delete it.
                        node.Binding = null;
                    }
                }

                if (node.Elements != null)
                {
                    // it is an error for a class to contain multiple methods with the same name
                    // (other than get/set pairs)
                    var nameHash = new HashSet<string>();
                    foreach (var element in node.Elements)
                    {
                        string functionName;
                        var functionObject = element as FunctionObject;
                        if (functionObject != null 
                            && functionObject.Binding != null 
                            && !(functionName = functionObject.Binding.Name).IsNullOrWhiteSpace())
                        {
                            var errorContext = functionObject.Binding.Context ?? functionObject.Context;

                            // the keyed name is the function type (get/set/other) plus the name
                            // make sure there's no duplicate with this name
                            if (!nameHash.Add(ClassElementKeyName(functionObject.FunctionType, functionName)))
                            {
                                // couldn't add because there's a duplicate, which is not allowed
                                errorContext.HandleError(JSError.DuplicateClassElementName, true);
                            }

                            if (functionObject.FunctionType == FunctionType.Getter || functionObject.FunctionType == FunctionType.Setter)
                            {
                                // make sure there's no method with this name
                                if (nameHash.Contains(ClassElementKeyName(FunctionType.Method, functionName)))
                                {
                                    // couldn't add because there's a duplicate, which is not allowed
                                    errorContext.HandleError(JSError.DuplicateClassElementName, true);
                                }
                            }
                            else
                            {
                                // make sure there's no getter or setter with this name
                                if (nameHash.Contains(ClassElementKeyName(FunctionType.Getter, functionName))
                                    || nameHash.Contains(ClassElementKeyName(FunctionType.Setter, functionName)))
                                {
                                    // couldn't add because there's a duplicate, which is not allowed
                                    errorContext.HandleError(JSError.DuplicateClassElementName, true);
                                }
                            }

                            if ((functionObject.FunctionType != FunctionType.Method || functionObject.IsGenerator)
                                && string.CompareOrdinal(functionName, "constructor") == 0)
                            {
                                errorContext.HandleError(JSError.SpecialConstructor, true);
                            }
                            else if (functionObject.IsStatic && string.CompareOrdinal(functionName, "prototype") == 0)
                            {
                                errorContext.HandleError(JSError.StaticPrototype, true);
                            }
                        }
                    }
                }
            }
        }

        private static string ClassElementKeyName(FunctionType funcType, string name)
        {
            switch (funcType)
            {
                case FunctionType.Getter:
                    return "get_" + name;

                case FunctionType.Setter:
                    return "set_" + name;

                default:
                    return "method_" + name;
            }
        }

        public override void Visit(ComprehensionNode node)
        {
            if (node != null)
            {
                // we need to push the scope onto the stack before we recurse
                node.BlockScope.IfNotNull(s => m_scopeStack.Push(s));
                try
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
                finally
                {
                    node.BlockScope.IfNotNull(s => m_scopeStack.Pop());
                }

                // TODO: verify that there are no naming collisions in the scope
            }
        }

        private void Optimize(Conditional node)
        {
            // if the condition is debug-only, then replace the condition with the false branch
            if (node.Condition != null && node.Condition.IsDebugOnly)
            {
                // if the false branch is debug-only, then replace the entire expression with a null
                if (node.FalseExpression == null || node.FalseExpression.IsDebugOnly)
                {
                    node.Parent.ReplaceChild(node, new ConstantWrapper(null, PrimitiveType.Null, node.Context)
                        {
                            IsDebugOnly = true
                        });
                }
                else
                {
                    node.Parent.ReplaceChild(node, node.FalseExpression);
                }
            }
            else
            {
                // now check to see if the condition starts with a not-operator. If so, we can get rid of it
                // and swap the true/false children
                var unary = node.Condition as UnaryOperator;
                if (unary != null && unary.OperatorToken == JSToken.LogicalNot
                    && !unary.OperatorInConditionalCompilationComment
                    && m_parser.Settings.IsModificationAllowed(TreeModifications.IfNotTrueFalseToIfFalseTrue))
                {
                    // get rid of the not by replacing it with its operand
                    // and swap the branches
                    node.Condition = unary.Operand;
                    node.SwapBranches();
                }

                // see if the two branches are both assignment operations to the same variable.
                // if so, we can pull the assignment outside the conditional and have the conditional
                // be the assignment
                var trueAssign = node.TrueExpression as BinaryOperator;
                if (trueAssign != null && trueAssign.IsAssign)
                {
                    var falseAssign = node.FalseExpression as BinaryOperator;
                    if (falseAssign != null && falseAssign.OperatorToken == trueAssign.OperatorToken)
                    {
                        // see if the left-hand-side is equivalent
                        if (trueAssign.Operand1.IsEquivalentTo(falseAssign.Operand1))
                        {
                            // we're going to be getting rid of the left-hand side in the false-block, 
                            // so we need to remove any references it may represent
                            DetachReferences.Apply(falseAssign.Operand1);

                            // transform: cond?lhs=expr1:lhs=expr2 to lhs=cond?expr1:expr2s
                            var binaryOp = new BinaryOperator(node.Context)
                                {
                                    Operand1 = trueAssign.Operand1,
                                    Operand2 = new Conditional(node.Context)
                                    {
                                        Condition = node.Condition,
                                        QuestionContext = node.QuestionContext,
                                        TrueExpression = trueAssign.Operand2,
                                        ColonContext = node.ColonContext,
                                        FalseExpression = falseAssign.Operand2
                                    },
                                    OperatorContext = trueAssign.OperatorContext,
                                    OperatorToken = trueAssign.OperatorToken,
                                    TerminatingContext = node.TerminatingContext
                                };

                            node.Parent.ReplaceChild(node, binaryOp);
                        }
                    }
                }
            }
        }

        public override void Visit(Conditional node)
        {
            if (node != null)
            {
                // analye all the children
                base.Visit(node);

                // and then optimize our node
                Optimize(node);
            }
        }

        public override void Visit(ConditionalCompilationOn node)
        {
            // well, we've encountered a cc_on statement now
            m_encounteredCCOn = true;
        }

        private static bool StringSourceIsNotInlineSafe(string source)
        {
            var isNotSafe = false;
            if (!string.IsNullOrEmpty(source))
            {
                // most browsers won't close the <script> tag unless they see </script, but the
                // user has explicitly set the flag to throw an error if the string isn't safe, so
                // let's err on the side of caution. Also check for the closing of a CDATA element.
                isNotSafe = source.IndexOf("</", StringComparison.Ordinal) >= 0
                    || source.IndexOf("]]>", StringComparison.Ordinal) >= 0;
            }

            return isNotSafe;
        }

        public override void Visit(ConstantWrapper node)
        {
            if (node != null)
            {
                if ((node.PrimitiveType == PrimitiveType.Other || node.PrimitiveType == PrimitiveType.String)
                    && m_parser.Settings.IsModificationAllowed(TreeModifications.CultureInfoTokenReplacement)
                    && JSScanner.IsReplacementToken(node.Value.ToString()))
                {
                    // either this is a regular replacement token, or it's a string that contains
                    // only a replacement token. See if we want to potentially replace it with the
                    // actual cultureinfo value.
                    var newNode = ReplaceCultureValue(node);

                    // cast the new node back to a constant wrapper. If it is, keep on processing
                    // as if nothing changed.
                    node = newNode as ConstantWrapper;
                    if (node == null)
                    {
                        // otherwise we're going to want to recurse this new node and exit this one.
                        newNode.Accept(this);
                        return;
                    }
                }

                // if we want to throw an error when the string's source isn't inline safe...
                if (node.PrimitiveType == PrimitiveType.String
                    && m_parser.Settings.ErrorIfNotInlineSafe
                    && node.Context != null
                    && StringSourceIsNotInlineSafe(node.Context.Code))
                {
                    // ...throw an error
                    node.Context.HandleError(JSError.StringNotInlineSafe, true);
                }

                // check to see if this node is an argument to a RegExp constructor.
                // if it is, we'll want to not use certain string escapes
                AstNode previousNode = null;
                AstNode parentNode = node.Parent;
                while (parentNode != null)
                {
                    // is this a call node and the previous node was one of the parameters?
                    CallNode callNode = parentNode as CallNode;
                    if (callNode != null && previousNode == callNode.Arguments)
                    {
                        // are we calling a simple lookup for "RegExp"?
                        Lookup lookup = callNode.Function as Lookup;
                        if (lookup != null && lookup.Name == "RegExp")
                        {
                            // we are -- so all string literals passed within this constructor should not use
                            // standard string escape sequences
                            node.IsParameterToRegExp = true;
                            // we can stop looking
                            break;
                        }
                    }

                    // next up the chain, keeping track of this current node as next iteration's "previous" node
                    previousNode = parentNode;
                    parentNode = parentNode.Parent;
                }
            }
        }

        public override void Visit(ConstStatement node)
        {
            if (node != null)
            {
                // we shouldn't have any duplicate constants
                // const a=1, a=2 is not okay!
                // but don't automatically remove them -- we don't know whether browsers implement first-wins
                // or last-wins.
                var uniqueNames = new HashSet<string>(StringComparer.Ordinal);
                foreach (var bindingIdentifier in BindingsVisitor.Bindings(node))
                {
                    // will return false if the name is already in the collection
                    if (!uniqueNames.Add(bindingIdentifier.Name))
                    {
                        bindingIdentifier.Context.HandleError(JSError.DuplicateConstantDeclaration, true);
                    }
                }

                // recurse the analyze
                base.Visit(node);
            }
        }

        public override void Visit(ContinueNode node)
        {
            if (node != null)
            {
                // if the label isn't valid an we can remove them, remove it now
                if (!node.Label.IsNullOrWhiteSpace()
                    && node.LabelInfo == null
                    && m_parser.Settings.RemoveUnneededCode
                    && m_parser.Settings.IsModificationAllowed(TreeModifications.RemoveUnnecessaryLabels))
                {
                    node.Label = null;
                }

                if (!IsInsideLoop(node, false))
                {
                    node.Context.HandleError(JSError.BadContinue, true);
                }
            }
        }

        public override void Visit(DebuggerNode node)
        {
            if (node != null)
            {
                // we ARE a debug statement!
                node.IsDebugOnly = true;
            }
        }

        public override void Visit(DoWhile node)
        {
            if (node != null)
            {
                // recurse
                base.Visit(node);

                // if the body is now empty, make it null
                if (node.Body != null && node.Body.Count == 0)
                {
                    node.Body = null;
                }

                if (node.Condition != null && node.Condition.IsDebugOnly)
                {
                    if (node.Body == null)
                    {
                        node.Parent.ReplaceChild(node, null);
                    }
                    else
                    {
                        node.Condition = new ConstantWrapper(0, PrimitiveType.Number, node.Condition.Context);
                    }
                }
            }
        }

        public override void Visit(ExportNode node)
        {
            if (node != null)
            {
                // export default is an assignment expression, so any function expression or
                // other expression it exports can be renamed. But straight exports of var/const/let,
                // function, and class cannot be renamed.
                if (!node.IsDefault)
                {
                    if (!node.ModuleName.IsNullOrWhiteSpace())
                    {
                        // re-export from external module, so the local value(s) cannot be redefined either, since it
                        // is coming from the external modules as well
                        foreach (var bindingIdentifier in BindingsVisitor.Bindings(node))
                        {
                            if (bindingIdentifier.VariableField != null)
                            {
                                bindingIdentifier.VariableField.CanCrunch = false;
                            }
                        }
                    }
                    else if (node.Count == 1 && (node[0] is Declaration || node[0] is FunctionObject || node[0] is ClassNode))
                    {
                        // we are explicitly exporting function or class names or declarations (var/let/const)
                        // make sure we don't rename them
                        foreach (var bindingIdentifier in BindingsVisitor.Bindings(node[0]))
                        {
                            if (bindingIdentifier.VariableField != null)
                            {
                                bindingIdentifier.VariableField.CanCrunch = false;
                            }
                        }
                    }
                }

                base.Visit(node);
            }
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1502:AvoidExcessiveComplexity")]
        public override void Visit(ForNode node)
        {
            if (node != null)
            {
                // if this for-statement has it's own lexical scope, then it's an error
                // if the any of the field names declared in this scope is also defined inside the body.
                if (node.BlockScope != null)
                {
                    foreach (var field in node.BlockScope.LexicallyDeclaredNames)
                    {
                        // if the block has a lexical scope, check it for conflicts
                        if (node.Body != null && node.Body.HasOwnScope)
                        {
                            var lexDecl = node.Body.EnclosingScope.LexicallyDeclaredName(field.Name);
                            if (lexDecl != null)
                            {
                                // report the error (lex/const/funcdecl collision)
                                lexDecl.Context.HandleError(JSError.DuplicateLexicalDeclaration, true);

                                // link the inner one to the outer one so any renaming stays in sync.
                                if (lexDecl.VariableField != null)
                                {
                                    lexDecl.VariableField.OuterField = field.VariableField;
                                    if (field.VariableField != null && !lexDecl.VariableField.CanCrunch)
                                    {
                                        field.VariableField.CanCrunch = false;
                                    }
                                }
                            }
                        }

                        // check to make sure there are no var-decl'd names with the same name. Those will
                        // get carried up to this scope so we don't need to check the block scope (if any)
                        var varDecl = node.BlockScope.VarDeclaredName(field.Name);
                        if (varDecl != null)
                        {
                            // report the error (lex/const collides with var) or warning (funcdecl collides with var)
                            varDecl.Context.HandleError(JSError.DuplicateLexicalDeclaration, field is LexicalDeclaration);

                            // and mark them both as no-rename
                            varDecl.VariableField.IfNotNull(v => v.CanCrunch = false);
                            field.VariableField.IfNotNull(v => v.CanCrunch = false);
                        }
                    }
                }

                // recurse
                base.Visit(node);

                // if the body is now empty (and doesn't have its own lexical scope), make it null
                if (node.Body != null && node.Body.Count == 0 && !node.Body.HasOwnScope)
                {
                    node.Body = null;
                }

                if (node.Initializer != null && node.Initializer.IsDebugOnly)
                {
                    node.Initializer = null;
                }

                if (node.Incrementer != null && node.Incrementer.IsDebugOnly)
                {
                    node.Incrementer = null;
                }

                if (node.Condition != null && node.Condition.IsDebugOnly)
                {
                    if (node.Initializer == null && node.Incrementer == null && node.Body == null)
                    {
                        node.IsDebugOnly = true;
                    }
                    else
                    {
                        node.Condition = new ConstantWrapper(0, PrimitiveType.Number, node.Condition.Context);
                    }
                }
            }
        }

        public override void Visit(ForIn node)
        {
            if (node != null)
            {
                // if this forIn-statement has it's own lexical scope, then it's an error
                // if the any of the field names declared in this scope is also defined inside the body.
                if (node.BlockScope != null)
                {
                    foreach (var field in node.BlockScope.LexicallyDeclaredNames)
                    {
                        // if the block has a lexical scope, check it for conflicts
                        if (node.Body != null && node.Body.HasOwnScope)
                        {
                            var lexDecl = node.Body.EnclosingScope.LexicallyDeclaredName(field.Name);
                            if (lexDecl != null)
                            {
                                // report the error (lex/const/funcdecl collision)
                                lexDecl.Context.HandleError(JSError.DuplicateLexicalDeclaration, true);

                                // link the inner one to the outer one so any renaming stays in sync.
                                if (lexDecl.VariableField != null)
                                {
                                    lexDecl.VariableField.OuterField = field.VariableField;
                                    if (field.VariableField != null && !lexDecl.VariableField.CanCrunch)
                                    {
                                        field.VariableField.CanCrunch = false;
                                    }
                                }
                            }
                        }

                        // check to make sure there are no var-decl'd names with the same name. Those will
                        // get carried up to this scope so we don't need to check the block scope (if any)
                        var varDecl = node.BlockScope.VarDeclaredName(field.Name);
                        if (varDecl != null)
                        {
                            // report the error (lex/const collides with var) or warning (funcdecl collides with var)
                            varDecl.Context.HandleError(JSError.DuplicateLexicalDeclaration, field is LexicalDeclaration);

                            // and mark them both as no-rename
                            varDecl.VariableField.IfNotNull(v => v.CanCrunch = false);
                            field.VariableField.IfNotNull(v => v.CanCrunch = false);
                        }
                    }
                }

                // recurse
                base.Visit(node);

                // if the body is now empty (and doesn't have its own lexical scope), make it null
                if (node.Body != null && node.Body.Count == 0 && !node.Body.HasOwnScope)
                {
                    node.Body = null;
                }

                if (node.Collection != null && node.Collection.IsDebugOnly)
                {
                    if (node.Body == null)
                    {
                        node.IsDebugOnly = true;
                    }
                    else
                    {
                        node.Collection = new ObjectLiteral(node.Collection.Context)
                            {
                                IsDebugOnly = true
                            };
                    }
                }
            }
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1502:AvoidExcessiveComplexity")]
        public override void Visit(FunctionObject node)
        {
            if (node != null)
            {
                // get the name of this function, calculate something if it's anonymous or if
                // the name isn't actually referenced
                if (node.Binding == null
                    || node.Binding.Name.IsNullOrWhiteSpace()
                    || (node.IsExpression
                        && node.Binding.VariableField.IfNotNull(v => v.RefCount == 0)
                        && m_parser.Settings.RemoveFunctionExpressionNames
                        && m_parser.Settings.IsModificationAllowed(TreeModifications.RemoveFunctionExpressionNames)))
                {
                    node.NameGuess = GuessAtName(node);
                }

                // don't analyze the identifier or we'll add an extra reference to it.
                var isStrict = m_scopeStack.Peek().UseStrict;
                if (isStrict && node.Binding != null)
                {
                    // we need to make sure the function isn't named "eval" or "arguments"
                    if (string.CompareOrdinal(node.Binding.Name, "eval") == 0
                        || string.CompareOrdinal(node.Binding.Name, "arguments") == 0)
                    {
                        if (node.Binding.Context != null)
                        {
                            node.Binding.Context.HandleError(JSError.StrictModeFunctionName, true);
                        }
                        else if (node.Context != null)
                        {
                            node.Context.HandleError(JSError.StrictModeFunctionName, true);
                        }
                    }
                }

                if (node.FunctionType == FunctionType.Setter
                    && (node.ParameterDeclarations == null || node.ParameterDeclarations.Count != 1))
                {
                    (node.ParameterDeclarations.IfNotNull(p => p.Context) ?? node.Context).HandleError(JSError.SetterMustHaveOneParameter, true);
                }
                else if (node.ParameterDeclarations.IfNotNull(p => p.Count > 1))
                {
                    // more than one parameter. Make sure there are no rest parameters BEFORE the last parameter
                    var lastParameterIndex = node.ParameterDeclarations.Count - 1;
                    node.ParameterDeclarations.ForEach<ParameterDeclaration>(paramDecl =>
                        {
                            if (paramDecl.Position != lastParameterIndex && paramDecl.HasRest)
                            {
                                paramDecl.Context.HandleError(JSError.RestParameterNotLast, true);
                            }
                        });
                }

                if (node.ParameterDeclarations != null && node.ParameterDeclarations.Count > 0)
                {
                    // recurse the parameters to catch any keywords or strict naming issues
                    var oldError = m_strictNameError;
                    m_strictNameError = JSError.StrictModeArgumentName;
                    node.ParameterDeclarations.Accept(this);
                    m_strictNameError = oldError;

                    // we need to make sure there are no duplicate argument names, so
                    // create map that we'll use to determine if there are any dups
                    var parameterMap = new HashSet<string>();
                    foreach (var bindingIdentifier in BindingsVisitor.Bindings(node.ParameterDeclarations))
                    {
                        // if it already exists in the map, then it's a dup
                        if (!parameterMap.Add(bindingIdentifier.Name))
                        {
                            // already exists -- throw an error
                            if (isStrict)
                            {
                                bindingIdentifier.Context.HandleError(JSError.StrictModeDuplicateArgument, true);
                            }
                            else
                            {
                                bindingIdentifier.Context.HandleError(JSError.DuplicateName, false);
                            }
                        }
                    }
                }

                if (node.Body != null)
                {
                    // push the stack and analyze the body
                    m_scopeStack.Push(node.EnclosingScope);
                    try
                    {
                        // recurse the body
                        node.Body.Accept(this);
                    }
                    finally
                    {
                        m_scopeStack.Pop();
                    }
                }

                if (node.ParameterDeclarations != null && node.ParameterDeclarations.Count > 0)
                {
                    // everything's been resolved and things may have been taken away away now that we've
                    // recursed, so walk backwards from the end of the parameters list
                    // and flag/remove any parameters that are not referenced until we hit the first one that is.
                    var removeIfUnreferenced = m_parser.Settings.RemoveUnneededCode
                        && m_parser.Settings.IsModificationAllowed(TreeModifications.RemoveUnusedParameters);
                    var foundLastReference = false;
                    for (var ndx = node.ParameterDeclarations.Count - 1; ndx >= 0; --ndx)
                    {
                        var paramDecl = node.ParameterDeclarations[ndx] as ParameterDeclaration;
                        if (paramDecl != null)
                        {
                            if (CheckParametersAreReferenced(paramDecl.Binding, removeIfUnreferenced, foundLastReference))
                            {
                                // if we've already hit a referenced parameter, then we couldn't delete this
                                // one if we wanted, so don't bother even reporting it.
                                if (!foundLastReference)
                                {
                                    // the entire parameter is unreferenced and we haven't found a referenced
                                    // parameter yet, so report the issue
                                    paramDecl.Context.HandleError(JSError.ArgumentNotReferenced);

                                    if (removeIfUnreferenced)
                                    {
                                        node.ParameterDeclarations.RemoveAt(ndx);
                                    }
                                }
                            }
                            else
                            {
                                // *something* is referenced in this parameter. But keep going so we can
                                // find unreferenced binding pattern identifiers in other parameters
                                foundLastReference = true;
                            }
                        }
                    }
                }

                // if this is an arrow function with a single statement in the body that's
                // a return statement, we can get rid of the return and just return keep the
                // operand by itself.
                ReturnNode returnNode;
                if (node.FunctionType == FunctionType.ArrowFunction
                    && node.Body.IfNotNull(b => b.Count == 1)
                    && (returnNode = node.Body[0] as ReturnNode) != null)
                {
                    node.Body.ReplaceChild(returnNode, returnNode.Operand);
                    node.Body.IsConcise = true;
                }
            }
        }

        private static bool CheckParametersAreReferenced(AstNode binding, bool removeIfUnreferenced, bool foundLastReference)
        {
            var isUnreferenced = false;

            // if it's either a simple binding identifier or a unary rest that's a binding operator...
            var bindingIdentifier = binding as BindingIdentifier;
            if (bindingIdentifier != null)
            {
                // simple binding identifier
                isUnreferenced = false;
                if (bindingIdentifier.VariableField != null)
                {
                    isUnreferenced = !bindingIdentifier.VariableField.IsReferenced;
                    if (isUnreferenced && removeIfUnreferenced && !foundLastReference)
                    {
                        // clean up the field - the parameter itself will be deleted when we return
                        bindingIdentifier.VariableField.Declarations.Remove(bindingIdentifier);
                        bindingIdentifier.VariableField.WasRemoved = true;
                    }
                }
            }
            else
            {
                // binding pattern
                // assume the whole thing UNreferenced unless we find something that IS referenced
                isUnreferenced = true;
                foreach (var nameDecl in BindingsVisitor.Bindings(binding))
                {
                    if (nameDecl.VariableField.IfNotNull(v => !v.IsReferenced))
                    {
                        // this declaration is unreferenced, and it's in a binding pattern.
                        // report it as unreferenced
                        nameDecl.Context.HandleError(JSError.ArgumentNotReferenced);

                        // and delete it now if we are deleting unreferenced parameters
                        if (removeIfUnreferenced)
                        {
                            // delete it, but don't clean up the containing binding because
                            // we will need to do special processing for argument binding patterns.
                            ActivationObject.DeleteFromBindingPattern(nameDecl, false);
                        }
                    }
                    else
                    {
                        // referenced (or no field). This entire binding is considered referenced
                        isUnreferenced = false;
                    }
                }

                // we should always trim the trailing elisions from array bindings
                TrimTrailingElisionsFromArrayBindings(binding);
            }

            return isUnreferenced;
        }

        private static void TrimTrailingElisionsFromArrayBindings(AstNode binding)
        {
            ObjectLiteral objectLiteral;
            var arrayBinding = binding as ArrayLiteral;
            if (arrayBinding != null)
            {
                // trim all trailing elisions
                var trailing = true;
                for (var ndx = arrayBinding.Elements.Count - 1; ndx >= 0; --ndx)
                {
                    // since this is a binding, the only constant allowed would be the missing
                    // value, so don't bother checking. If it's a constant, whack it.
                    var constantWrapper = arrayBinding.Elements[ndx] as ConstantWrapper;
                    if (constantWrapper != null)
                    {
                        // if it's no longer trailing, then just ignore it
                        if (trailing)
                        {
                            arrayBinding.Elements.RemoveAt(ndx);
                        }
                    }
                    else
                    {
                        // no longer elision, but recurse
                        trailing = false;
                        TrimTrailingElisionsFromArrayBindings(arrayBinding.Elements[ndx]);
                    }
                }
            }
            else if ((objectLiteral = binding as ObjectLiteral) != null)
            {
                objectLiteral.Properties.ForEach<ObjectLiteralProperty>(property => TrimTrailingElisionsFromArrayBindings(property.Value));
            }
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1502:AvoidExcessiveComplexity")]
        public override void Visit(IfNode node)
        {
            if (node != null)
            {
                // recurse....
                base.Visit(node);

                // now check to see if the two branches are now empty.
                // if they are, null them out.
                if (node.TrueBlock != null && node.TrueBlock.Count == 0)
                {
                    node.TrueBlock = null;
                }
                if (node.FalseBlock != null && node.FalseBlock.Count == 0)
                {
                    node.FalseBlock = null;
                }

                if (node.Condition != null && node.Condition.IsDebugOnly)
                {
                    node.Condition = new ConstantWrapper(0, PrimitiveType.Number, node.Condition.Context);
                    node.TrueBlock = null;
                }

                if (node.TrueBlock != null && node.FalseBlock != null)
                {
                    // neither true block nor false block is null.
                    // if they're both expressions, convert them to a condition operator
                    if (node.TrueBlock.IsExpression && node.FalseBlock.IsExpression
                        && m_parser.Settings.IsModificationAllowed(TreeModifications.IfExpressionsToExpression))
                    {
                        // if this statement has both true and false blocks, and they are both expressions,
                        // then we can simplify this to a conditional expression.
                        // because the blocks are expressions, we know they only have ONE statement in them,
                        // so we can just dereference them directly.
                        Conditional conditional;
                        var logicalNot = new LogicalNot(node.Condition, m_parser.Settings);
                        if (logicalNot.Measure() < 0)
                        {
                            // applying a logical-not makes the condition smaller -- reverse the branches
                            logicalNot.Apply();
                            conditional = new Conditional(node.Context)
                                {
                                    Condition = node.Condition,
                                    TrueExpression = node.FalseBlock[0],
                                    FalseExpression = node.TrueBlock[0]
                                };
                        }
                        else
                        {
                            // regular order
                            conditional = new Conditional(node.Context)
                                {
                                    Condition = node.Condition,
                                    TrueExpression = node.TrueBlock[0],
                                    FalseExpression = node.FalseBlock[0]
                                };
                        }

                        node.Parent.ReplaceChild(
                            node,
                            conditional);

                        Optimize(conditional);
                    }
                    else
                    {
                        // see if logical-notting the condition produces something smaller
                        var logicalNot = new LogicalNot(node.Condition, m_parser.Settings);
                        if (logicalNot.Measure() < 0)
                        {
                            // it does -- not the condition and swap the branches
                            logicalNot.Apply();
                            node.SwapBranches();
                        }

                        // see if the true- and false-branches each contain only a single statement
                        if (node.TrueBlock.Count == 1 && node.FalseBlock.Count == 1)
                        {
                            // they do -- see if the true-branch's statement is a return-statement
                            var trueReturn = node.TrueBlock[0] as ReturnNode;
                            if (trueReturn != null && trueReturn.Operand != null)
                            {
                                // it is -- see if the false-branch is also a return statement
                                var falseReturn = node.FalseBlock[0] as ReturnNode;
                                if (falseReturn != null && falseReturn.Operand != null)
                                {
                                    // transform: if(cond)return expr1;else return expr2 to return cond?expr1:expr2
                                    var conditional = new Conditional(node.Condition.Context.FlattenToStart())
                                        {
                                            Condition = node.Condition,
                                            TrueExpression = trueReturn.Operand,
                                            FalseExpression = falseReturn.Operand
                                        };

                                    // create a new return node from the conditional and replace
                                    // our if-node with it
                                    var returnNode = new ReturnNode(node.Context)
                                        {
                                            Operand = conditional
                                        };

                                    node.Parent.ReplaceChild(
                                        node,
                                        returnNode);

                                    Optimize(conditional);
                                }
                            }
                        }
                    }
                }
                else if (node.FalseBlock != null)
                {
                    // true block must be null.
                    // if there is no true branch but a false branch, then
                    // put a not on the condition and move the false branch to the true branch.
                    if (node.FalseBlock.IsExpression
                        && m_parser.Settings.IsModificationAllowed(TreeModifications.IfConditionCallToConditionAndCall))
                    {
                        // if (cond); else expr ==> cond || expr
                        // but first -- which operator to use? if(a);else b --> a||b, and if(!a);else b --> a&&b
                        // so determine which one is smaller: a or !a
                        // assume we'll use the logical-or, since that doesn't require changing the condition
                        var newOperator = JSToken.LogicalOr;
                        var logicalNot = new LogicalNot(node.Condition, m_parser.Settings);
                        if (logicalNot.Measure() < 0)
                        {
                            // !a is smaller, so apply it and use the logical-or operator
                            logicalNot.Apply();
                            newOperator = JSToken.LogicalAnd;
                        }

                        var binaryOp = new BinaryOperator(node.Context)
                            {
                                Operand1 = node.Condition,
                                Operand2 = node.FalseBlock[0],
                                OperatorToken = newOperator,
                            };

                        // we don't need to analyse this new node because we've already analyzed
                        // the pieces parts as part of the if. And this visitor's method for the BinaryOperator
                        // doesn't really do anything else. Just replace our current node with this
                        // new node
                        node.Parent.ReplaceChild(node, binaryOp);
                    }
                    else if (m_parser.Settings.IsModificationAllowed(TreeModifications.IfConditionFalseToIfNotConditionTrue))
                    {
                        // logical-not the condition
                        // if(cond);else stmt ==> if(!cond)stmt
                        var logicalNot = new LogicalNot(node.Condition, m_parser.Settings);
                        logicalNot.Apply();

                        // and swap the branches
                        node.SwapBranches();
                    }
                }
                else if (node.TrueBlock != null)
                {
                    // false block must be null
                    if (node.TrueBlock.IsExpression
                        && m_parser.Settings.IsModificationAllowed(TreeModifications.IfConditionCallToConditionAndCall))
                    {
                        // convert the if-node to an expression
                        IfConditionExpressionToExpression(node, node.TrueBlock[0]);
                    }
                }
                else if (m_parser.Settings.IsModificationAllowed(TreeModifications.IfEmptyToExpression))
                {
                    // NEITHER branches have anything now!

                    // as long as the condition doesn't
                    // contain calls or assignments, we should be able to completely delete
                    // the statement altogether rather than changing it to an expression
                    // statement on the condition.
                    // but how do we KNOW there are no side-effects?
                    // if the condition is a constant or operations on constants, delete it.
                    // or if the condition itself is a debugger statement -- a call, lookup, or member.
                    var remove = node.Condition == null || node.Condition.IsConstant || node.Condition.IsDebugOnly;
                    if (remove)
                    {
                        // we're pretty sure there are no side-effects; remove it altogether
                        node.Parent.ReplaceChild(node, null);
                    }
                    else
                    {
                        // We don't know what it is and what the side-effects may be, so
                        // just change this statement into an expression statement by replacing us with 
                        // the expression
                        // no need to analyze -- we already recursed
                        node.Parent.ReplaceChild(node, node.Condition);
                    }
                }

                if (node.FalseBlock == null
                    && node.TrueBlock != null
                    && node.TrueBlock.Count == 1
                    && m_parser.Settings.IsModificationAllowed(TreeModifications.CombineNestedIfs))
                {
                    var nestedIf = node.TrueBlock[0] as IfNode;
                    if (nestedIf != null && nestedIf.FalseBlock == null)
                    {
                        // we have nested if-blocks.
                        // transform if(cond1)if(cond2){...} to if(cond1&&cond2){...}
                        // change the first if-statement's condition to be cond1&&cond2
                        // move the nested if-statement's true block to the outer if-statement
                        node.Condition = new BinaryOperator(node.Condition.Context.FlattenToStart())
                            {
                                Operand1 = node.Condition,
                                Operand2 = nestedIf.Condition,
                                OperatorToken = JSToken.LogicalAnd
                            };
                        node.TrueBlock = nestedIf.TrueBlock;
                    }
                }
            }
        }

        private void IfConditionExpressionToExpression(IfNode ifNode, AstNode expression)
        {
            // but first -- which operator to use? if(a)b --> a&&b, and if(!a)b --> a||b
            // so determine which one is smaller: a or !a
            // assume we'll use the logical-and, since that doesn't require changing the condition
            var newOperator = JSToken.LogicalAnd;
            var logicalNot = new LogicalNot(ifNode.Condition, m_parser.Settings);
            if (logicalNot.Measure() < 0)
            {
                // !a is smaller, so apply it and use the logical-or operator
                logicalNot.Apply();
                newOperator = JSToken.LogicalOr;
            }

            // because the true block is an expression, we know it must only have
            // ONE statement in it, so we can just dereference it directly.
            var binaryOp = new BinaryOperator(ifNode.Context)
                {
                    Operand1 = ifNode.Condition,
                    Operand2 = expression,
                    OperatorToken = newOperator,
                };

            // we don't need to analyse this new node because we've already analyzed
            // the pieces parts as part of the if. And this visitor's method for the BinaryOperator
            // doesn't really do anything else. Just replace our current node with this
            // new node
            ifNode.Parent.ReplaceChild(ifNode, binaryOp);
        }

        public override void Visit(ImportNode node)
        {
            if (node != null)
            {
                base.Visit(node);

                // if there is only one binding and it's not a specifier, then we want to
                // make sure we do NOT rename them, because they are dependent on an external module.
                // but we CAN rename any of the other specifiers we may have. 
                if (node.Count == 1 && !(node[0] is ImportExportSpecifier))
                {
                    foreach (var bindingIdentifier in BindingsVisitor.Bindings(node[0]))
                    {
                        if (bindingIdentifier.VariableField != null)
                        {
                            bindingIdentifier.VariableField.CanCrunch = false;
                        }
                    }
                }
            }
        }

        public override void Visit(LabeledStatement node)
        {
            if (node != null)
            {
                // if we set the nest count to something greater than 0, then the label will
                // get renamed when we output it.

                // then recurse the statement
                if (node.Statement != null)
                {
                    node.Statement.Accept(this);
                }

                if (node.LabelInfo != null && !node.LabelInfo.HasIssues)
                {
                    if (node.LabelInfo.RefCount == 0)
                    {
                        // low-sev warning
                        node.LabelContext.HandleError(JSError.UnusedLabel);
                    }

                    if (node.LabelInfo.RefCount == 0
                        && m_parser.Settings.RemoveUnneededCode
                        && m_parser.Settings.IsModificationAllowed(TreeModifications.RemoveUnnecessaryLabels))
                    {
                        // just get rid of the label altogether
                        if (node.Statement == null)
                        {
                            // no statement; just delete this node from its parent
                            node.Parent.ReplaceChild(node, null);
                        }
                        else
                        {
                            // take the statement from this node and replace the node with
                            // this statement
                            node.Parent.ReplaceChild(node, node.Statement);
                        }
                    }
                    else if (m_parser.Settings.LocalRenaming != LocalRenaming.KeepAll
                        && m_parser.Settings.IsModificationAllowed(TreeModifications.LocalRenaming))
                    {
                        // it was either referenced or we don't want to get rid of unused labels,
                        // but we DO want to minify them. set the minified value.
                        node.LabelInfo.MinLabel = CrunchEnumerator.CrunchedLabel(node.LabelInfo.NestLevel);
                    }
                }
            }
        }

        public override void Visit(Lookup node)
        {
            // lookup is the start of a possible debug namespace, so assume we are NOT a match
            m_possibleDebugNamespace = false;
            if (node != null)
            {
                // figure out if our reference type is a function or a constructor
                if (node.Parent is CallNode)
                {
                    node.RefType = (
                      ((CallNode)(node.Parent)).IsConstructor
                      ? ReferenceType.Constructor
                      : ReferenceType.Function
                      );
                }

                // check the name of the variable for reserved words that aren't allowed
                ActivationObject scope = m_scopeStack.Peek();
                if (JSScanner.IsKeyword(node.Name, scope.UseStrict)
                    && node.VariableField.IfNotNull(v => v.FieldType != FieldType.Super))
                {
                    node.Context.HandleError(JSError.KeywordUsedAsIdentifier, true);
                }

                // no variable field means ignore it
                var parentIsMember = node.Parent is Member;
                if (node.VariableField != null && node.VariableField.FieldType == FieldType.Predefined)
                {
                    // this is a predefined field. If it's Nan or Infinity, we should
                    // replace it with the numeric value in case we need to later combine
                    // some literal expressions.
                    if (string.CompareOrdinal(node.Name, "NaN") == 0)
                    {
                        // don't analyze the new ConstantWrapper -- we don't want it to take part in the
                        // duplicate constant combination logic should it be turned on.
                        node.Parent.ReplaceChild(node, new ConstantWrapper(double.NaN, PrimitiveType.Number, node.Context));
                    }
                    else if (string.CompareOrdinal(node.Name, "Infinity") == 0)
                    {
                        // don't analyze the new ConstantWrapper -- we don't want it to take part in the
                        // duplicate constant combination logic should it be turned on.
                        node.Parent.ReplaceChild(node, new ConstantWrapper(double.PositiveInfinity, PrimitiveType.Number, node.Context));
                    }
                    else if (m_lookForDebugNamespaces 
                        && parentIsMember 
                        && string.CompareOrdinal(node.Name, "window") == 0)
                    {
                        // this is a lookup for the global window object. Might be the start of a debug namespace.
                        // leave the index at zero, because we haven't matched anything yet.
                        m_possibleDebugNamespace = true;
                        m_possibleDebugNamespaceIndex = 0;
                        m_possibleDebugMatches.Clear();
                    }
                }

                if (m_lookForDebugNamespaces && !m_possibleDebugNamespace)
                {
                    if (InitialDebugNameSpaceMatches(node.Name, parentIsMember))
                    {
                        // the initial search found a match! No need to keep looking; just replace
                        // the lookup with an empty object literal marked as debug-only.
                        node.IsDebugOnly = true;
                        node.Parent.ReplaceChild(node, new ObjectLiteral(node.Context)
                        {
                            IsDebugOnly = true
                        });
                    }
                }
            }
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1502:AvoidExcessiveComplexity")]
        public override void Visit(Member node)
        {
            if (node != null)
            {
                // if we don't even have any resource strings, then there's nothing
                // we need to do and we can just perform the base operation
                var resourceList = m_parser.Settings.ResourceStrings;
                if (resourceList.Count > 0)
                {
                    // if we haven't created the match visitor yet, do so now
                    if (m_matchVisitor == null)
                    {
                        m_matchVisitor = new MatchPropertiesVisitor();
                    }

                    // walk the list BACKWARDS so that later resource strings supercede previous ones
                    for (var ndx = resourceList.Count - 1; ndx >= 0; --ndx)
                    {
                        var resourceStrings = resourceList[ndx];

                        // see if the resource string name matches the root
                        if (m_matchVisitor.Match(node.Root, resourceStrings.Name))
                        {
                            // it is -- we're going to replace this with a string value.
                            // if this member name is a string on the object, we'll replacve it with
                            // the literal. Otherwise we'll replace it with an empty string.
                            // see if the string resource contains this value
                            ConstantWrapper stringLiteral = new ConstantWrapper(
                                resourceStrings[node.Name] ?? string.Empty,
                                PrimitiveType.String,
                                node.Context);

                            node.Parent.ReplaceChild(node, stringLiteral);

                            // analyze the literal
                            stringLiteral.Accept(this);
                            return;
                        }
                    }
                }

                // if we are replacing property names and we have something to replace
                if (m_parser.Settings.HasRenamePairs && m_parser.Settings.ManualRenamesProperties
                    && m_parser.Settings.IsModificationAllowed(TreeModifications.PropertyRenaming))
                {
                    // see if this name is a target for replacement
                    string newName = m_parser.Settings.GetNewName(node.Name);
                    if (!string.IsNullOrEmpty(newName))
                    {
                        // it is -- set the name to the new name
                        node.Name = newName;
                    }
                }

                // check the name of the member for reserved words that aren't allowed
                if (JSScanner.IsKeyword(node.Name, m_scopeStack.Peek().UseStrict))
                {
                    node.NameContext.HandleError(JSError.KeywordUsedAsIdentifier);
                }

                // recurse
                if (node.Root != null)
                {
                    node.Root.Accept(this);
                }

                if (m_stripDebug)
                {
                    var parentIsMember = node.Parent is Member;
                    if (node.Root.IfNotNull(r => r.IsDebugOnly))
                    {
                        // if the root is debug-only, WE are debug-only
                        node.IsDebugOnly = true;
                    }
                    else if (m_possibleDebugNamespace)
                    {
                        // if the matches are empty, then we need to populate the list to begin with
                        if (m_possibleDebugMatches.Count == 0)
                        {
                            if (InitialDebugNameSpaceMatches(node.Name, parentIsMember))
                            {
                                node.IsDebugOnly = true;
                            }
                        }
                        else
                        {
                            // if we are still a possible debug namespace, check the remaining patterns
                            for (var ndx = m_possibleDebugMatches.Count - 1; ndx >= 0; --ndx)
                            {
                                var debugParts = m_possibleDebugMatches[ndx];
                                if (string.CompareOrdinal(node.Name, debugParts[m_possibleDebugNamespaceIndex]) == 0)
                                {
                                    // another match. If that means we've matched a complete part list!
                                    // if not, if there are more parts available to check, then keep going.
                                    if (debugParts.Length == m_possibleDebugNamespaceIndex + 1)
                                    {
                                        node.IsDebugOnly = true;
                                        m_possibleDebugMatches.Clear();
                                        break;
                                    }
                                }
                                else
                                {
                                    // not a match; remove this possibility
                                    m_possibleDebugMatches.RemoveAt(ndx);
                                }
                            }

                            // if there are still patterns that we're matching, keep going with the next item if
                            // our parent is another member
                            if (m_possibleDebugMatches.Count > 0 && parentIsMember)
                            {
                                ++m_possibleDebugNamespaceIndex;
                            }
                            else
                            {
                                // otherwise we're done; make sure the list is cleared out.
                                m_possibleDebugMatches.Clear();
                                m_possibleDebugNamespace = false;
                            }
                        }

                        // if we found a match, replace ourselves with an object literal
                        if (node.IsDebugOnly)
                        {
                            node.Parent.ReplaceChild(node, new ObjectLiteral(node.Context)
                            {
                                IsDebugOnly = true
                            });
                        }
                    }
                }
            }
        }

        private bool InitialDebugNameSpaceMatches(string name, bool parentIsMember)
        {
            foreach (var parts in m_debugNamespaceParts)
            {
                if (string.CompareOrdinal(name, parts[0]) == 0)
                {
                    // we have a match. If there is only one part, we're done because we totally matched.
                    if (parts.Length == 1)
                    {
                        // clear out the list so we stop looking and return true
                        // as an indicator that we found a complete match
                        m_possibleDebugMatches.Clear();
                        m_possibleDebugNamespace = false;
                        return true;
                    }
                    else if (parentIsMember)
                    {
                        // otherwise add it to the list so we will keep looking when we go up a
                        // level to the next member operator
                        m_possibleDebugMatches.Add(parts);
                    }
                }
            }

            if (m_possibleDebugMatches.Count > 0)
            {
                // we found possible matches, so set the state so we keep looking
                m_possibleDebugNamespace = true;
                m_possibleDebugNamespaceIndex = 1;
            }

            // if we got here, we didn't find a complete match
            return false;
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1502:AvoidExcessiveComplexity")]
        public override void Visit(ObjectLiteral node)
        {
            if (node != null)
            {
                // recurse
                base.Visit(node);

                // if we are going to be renaming things...
                if (m_parser.Settings.LocalRenaming != LocalRenaming.KeepAll)
                {
                    node.Properties.ForEach<ObjectLiteralProperty>(property =>
                        {
                            if (property.Name == null)
                            {
                                // implicit object property name! if we change the variable name,
                                // we will pick up the WRONG property name!
                                // the value should be a binding identifier or a lookup, should be a valid identifier,
                                // and not be in the "norename" list
                                var propertyName = property.Value.ToString();
                                if (JSScanner.IsValidIdentifier(propertyName) && !m_noRename.Contains(propertyName))
                                {
                                    if (FieldCanBeRenamed(property.Value))
                                    {
                                        // it can be renamed. Let's add a property name now to lock the name down
                                        property.Name = new ObjectLiteralField(propertyName, PrimitiveType.String, property.Value.Context)
                                        {
                                            IsIdentifier = true
                                        };
                                    }
                                }
                            }
                        });
                }

                if (m_scopeStack.Peek().UseStrict)
                {
                    // now strict-mode checks
                    // go through all property names and make sure there are no duplicates.
                    // use a map to remember which ones we already have and of what type.
                    var nameMap = new Dictionary<string, string>();
                    node.Properties.ForEach<ObjectLiteralProperty>(property =>
                        {
                            var propertyType = GetPropertyType(property.Value as FunctionObject);

                            // key name is the name plus the type. Can't just use the name because 
                            // get and set will both have the same name (but different types)
                            var keyName = (property.Name ?? property.Value) + propertyType;

                            string mappedType;
                            if (propertyType == "data")
                            {
                                // can't have another data, get, or set
                                if (nameMap.TryGetValue(keyName, out mappedType)
                                    || nameMap.TryGetValue((property.Name ?? property.Value) + "get", out mappedType)
                                    || nameMap.TryGetValue((property.Name ?? property.Value) + "set", out mappedType))
                                {
                                    // throw the error
                                    (property.Name ?? property.Value).Context.HandleError(JSError.StrictModeDuplicateProperty, true);

                                    // if the mapped type isn't data, then we can add this data name/type to the map
                                    // because that means the first tryget failed and we don't have a data already
                                    if (mappedType != propertyType)
                                    {
                                        nameMap.Add(keyName, propertyType);
                                    }
                                }
                                else
                                {
                                    // not in the map at all. Add it now.
                                    nameMap.Add(keyName, propertyType);
                                }
                            }
                            else
                            {
                                // get can have a set, but can't have a data or another get
                                // set can have a get, but can't have a data or another set
                                if (nameMap.TryGetValue(keyName, out mappedType)
                                    || nameMap.TryGetValue((property.Name ?? property.Value) + "data", out mappedType))
                                {
                                    // throw the error
                                    (property.Name ?? property.Value).Context.HandleError(JSError.StrictModeDuplicateProperty, true);

                                    // if the mapped type isn't data, then we can add this data name/type to the map
                                    if (mappedType != propertyType)
                                    {
                                        nameMap.Add(keyName, propertyType);
                                    }
                                }
                                else
                                {
                                    // not in the map at all - add it now
                                    nameMap.Add(keyName, propertyType);
                                }
                            }
                        });
                }
            }
        }

        private static bool FieldCanBeRenamed(AstNode node)
        {
            var canBeRenamed = false;
            if (node != null)
            {
                canBeRenamed = (node as INameDeclaration).IfNotNull(n => !n.RenameNotAllowed && n.VariableField.IfNotNull(v => v.CanCrunch));
                if (!canBeRenamed)
                {
                    canBeRenamed = (node as INameReference).IfNotNull(n => n.VariableField.IfNotNull(v => v.CanCrunch));
                }
            }

            return canBeRenamed;
        }

        public override void Visit(ObjectLiteralField node)
        {
            if (node != null)
            {
                if (node.PrimitiveType == PrimitiveType.String
                    && m_parser.Settings.HasRenamePairs && m_parser.Settings.ManualRenamesProperties
                    && m_parser.Settings.IsModificationAllowed(TreeModifications.PropertyRenaming))
                {
                    string newName = m_parser.Settings.GetNewName(node.Value.ToString());
                    if (!string.IsNullOrEmpty(newName))
                    {
                        node.Value = newName;
                    }
                }

                // don't call the base -- we don't want to add the literal to
                // the combination logic, which is what the ConstantWrapper (base class) does
                //base.Visit(node);
            }
        }

        public override void Visit(ObjectLiteralProperty node)
        {
            if (node != null)
            {
                base.Visit(node);
                if (node.Value != null && node.Value.IsDebugOnly)
                {
                    node.Value = new ConstantWrapper(null, PrimitiveType.Null, node.Value.Context);
                }
            }
        }

        private static string GetPropertyType(FunctionObject funcObj)
        {
            // should never be a function declaration....
            switch(funcObj.IfNotNull(f => f.FunctionType))
            {
                case FunctionType.Getter:
                    return "get";

                case FunctionType.Setter:
                    return "set";

                case FunctionType.Method:
                    return "method";

                default:
                    return "data";
            }
        }

        public override void Visit(RegExpLiteral node)
        {
            if (node != null)
            {
                // verify the syntax
                try
                {
                    // just try instantiating a Regex object with this string.
                    // if it's invalid, it will throw an exception.
                    // we don't need to pass the flags -- we're just interested in the pattern
                    Regex re = new Regex(node.Pattern, RegexOptions.ECMAScript);

                    // basically we have this test here so the re variable is referenced
                    // and FxCop won't throw an error. There really aren't any cases where
                    // the constructor will return null (other than out-of-memory)
                    if (re == null)
                    {
                        node.Context.HandleError(JSError.RegExpSyntax, true);
                    }
                }
                catch (System.ArgumentException e)
                {
                    Debug.WriteLine(e.ToString());
                    node.Context.HandleError(JSError.RegExpSyntax, true);
                }
                // don't bother calling the base -- there are no children
            }
        }

        public override void Visit(ReturnNode node)
        {
            if (node != null)
            {
                // first we want to make sure that we are indeed within a function scope.
                // it makes no sense to have a return outside of a function
                ActivationObject scope = m_scopeStack.Peek();
                while (scope != null && !(scope is FunctionScope))
                {
                    scope = scope.Parent;
                }

                if (scope == null)
                {
                    node.Context.HandleError(JSError.BadReturn);
                }

                // recurse the operand if we have one
                if (node.Operand != null)
                {
                    node.Operand.Accept(this);

                    if (node.Operand == null || node.Operand.IsDebugOnly)
                    {
                        node.Operand = null;
                    }
                    else
                    {
                        // now see if it's a binary op assignment to a variable local to this scope.
                        // if it is, we can get rid of the assignment because we're leaving the scope.
                        var lookup = node.Operand.LeftHandSide as Lookup;
                        BinaryOperator binaryOp;
                        if (lookup != null
                            && lookup.VariableField != null
                            && lookup.VariableField.OuterField == null
                            && (binaryOp = lookup.Parent as BinaryOperator) != null
                            && binaryOp.IsAssign
                            && !lookup.VariableField.IsReferencedInnerScope)
                        {
                            if (binaryOp.OperatorToken != JSToken.Assign)
                            {
                                // it's an OP= assignment, so keep the lookup, but convert the operator to a non-assignment
                                binaryOp.OperatorToken = JSScanner.StripAssignment(binaryOp.OperatorToken);
                            }
                            else if (binaryOp.Parent == node)
                            {
                                // straight assignment. But we can only get rid of the assignment if
                                // it's the root operation of the return. If it's buried down in a complex
                                // assignment, then leave it be.
                                lookup.VariableField.References.Remove(lookup);
                                node.Operand = binaryOp.Operand2;
                            }
                        }
                    }
                }
            }
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1502:AvoidExcessiveComplexity")]
        public override void Visit(Switch node)
        {
            if (node != null)
            {
                base.Visit(node);

                if (node.Expression != null && node.Expression.IsDebugOnly)
                {
                    node.Expression = new ConstantWrapper(null, PrimitiveType.Null, node.Expression.Context);
                }

                // if the switch case has a lexical scope, we need to check to make sure anything declared lexically
                // doesn't collide with anything declared as a var underneath (which bubbles up to the variable scope).
                if (node.BlockScope != null)
                {
                    foreach (var lexDecl in node.BlockScope.LexicallyDeclaredNames)
                    {
                        var varDecl = node.BlockScope.VarDeclaredName(lexDecl.Name);
                        if (varDecl != null)
                        {
                            // report the error (lex/const collides with var) or warning (funcdecl collides with var)
                            varDecl.Context.HandleError(JSError.DuplicateLexicalDeclaration, lexDecl is LexicalDeclaration);

                            // mark them both a no-rename to preserve the collision
                            varDecl.VariableField.IfNotNull(v => v.CanCrunch = false);
                            lexDecl.VariableField.IfNotNull(v => v.CanCrunch = false);
                        }
                    }
                }

                // we only want to remove stuff if we are hypercrunching
                if (m_parser.Settings.RemoveUnneededCode)
                {
                    // because we are looking at breaks, we need to know if this
                    // switch statement is labeled
                    string thisLabel = string.Empty;
                    LabeledStatement label = node.Parent as LabeledStatement;
                    if (label != null)
                    {
                        thisLabel = label.Label;
                    }

                    // loop through all the cases, looking for the default.
                    // then, if it's empty (or just doesn't do anything), we can
                    // get rid of it altogether
                    int defaultCase = -1;
                    bool eliminateDefault = false;
                    for (int ndx = 0; ndx < node.Cases.Count; ++ndx)
                    {
                        // it should always be a switch case, but just in case...
                        SwitchCase switchCase = node.Cases[ndx] as SwitchCase;
                        if (switchCase != null)
                        {
                            if (switchCase.IsDefault)
                            {
                                // save the index for later
                                defaultCase = ndx;

                                // set the flag to true unless we can prove that we need it.
                                // we'll prove we need it by finding the statement block executed by
                                // this case and showing that it's neither empty nor containing
                                // just a single break statement.
                                eliminateDefault = true;
                            }

                            // if the default case is empty, then we need to keep going
                            // until we find the very next non-empty case
                            if (eliminateDefault && switchCase.Statements.Count > 0)
                            {
                                // this is the set of statements executed during default processing.
                                // if it does nothing -- one break statement -- then we can get rid
                                // of the default case. Otherwise we need to leave it in.
                                if (switchCase.Statements.Count == 1)
                                {
                                    // see if it's a break
                                    Break lastBreak = switchCase.Statements[0] as Break;

                                    // if the last statement is not a break,
                                    // OR it has a label and it's not this switch statement...
                                    if (lastBreak == null
                                      || (lastBreak.Label != null && lastBreak.Label != thisLabel))
                                    {
                                        // set the flag back to false to indicate that we need to keep it.
                                        eliminateDefault = false;
                                    }
                                }
                                else
                                {
                                    // set the flag back to false to indicate that we need to keep it.
                                    eliminateDefault = false;
                                }

                                // break out of the loop
                                break;
                            }
                        }
                    }

                    // if we get here and the flag is still true, then either the default case is
                    // empty, or it contains only a single break statement. Either way, we can get 
                    // rid of it.
                    if (eliminateDefault && defaultCase >= 0
                        && m_parser.Settings.IsModificationAllowed(TreeModifications.RemoveEmptyDefaultCase))
                    {
                        // remove it and reset the position index
                        node.Cases.RemoveAt(defaultCase);
                        defaultCase = -1;
                    }

                    // if we have no default handling, then we know we can get rid
                    // of any cases that don't do anything either.
                    if (defaultCase == -1
                        && m_parser.Settings.IsModificationAllowed(TreeModifications.RemoveEmptyCaseWhenNoDefault))
                    {
                        // when we delete a case statement, we set this flag to true.
                        // when we hit a non-empty case statement, we set the flag to false.
                        // if we hit an empty case statement when this flag is true, we can delete this case, too.
                        bool emptyStatements = true;
                        Break deletedBreak = null;

                        // walk the tree backwards because we don't know how many we will
                        // be deleting, and if we go backwards, we won't have to adjust the 
                        // index as we go.
                        for (int ndx = node.Cases.Count - 1; ndx >= 0; --ndx)
                        {
                            // should always be a switch case
                            SwitchCase switchCase = node.Cases[ndx] as SwitchCase;
                            if (switchCase != null)
                            {
                                // if the block is empty and the last block was empty, we can delete this case.
                                // OR if there is only one statement and it's a break, we can delete it, too.
                                if (switchCase.Statements.Count == 0 && emptyStatements)
                                {
                                    // remove this case statement because it falls through to a deleted case
                                    DetachReferences.Apply(switchCase.CaseValue);
                                    node.Cases.RemoveAt(ndx);
                                }
                                else
                                {
                                    // onlyBreak will be set to null if this block is not a single-statement break block
                                    Break onlyBreak = (switchCase.Statements.Count == 1 ? switchCase.Statements[0] as Break : null);
                                    if (onlyBreak != null)
                                    {
                                        // we'll only delete this case if the break either doesn't have a label
                                        // OR the label matches the switch statement
                                        if (onlyBreak.Label == null || onlyBreak.Label == thisLabel)
                                        {
                                            // if this is a block with only a break, then we need to keep a hold of the break
                                            // statement in case we need it later
                                            deletedBreak = onlyBreak;

                                            // remove this case statement
                                            DetachReferences.Apply(switchCase.CaseValue);
                                            node.Cases.RemoveAt(ndx);
                                            // make sure the flag is set so we delete any other empty
                                            // cases that fell through to this empty case block
                                            emptyStatements = true;
                                        }
                                        else
                                        {
                                            // the break statement has a label and it's not the switch statement.
                                            // we're going to keep this block
                                            emptyStatements = false;
                                            deletedBreak = null;
                                        }
                                    }
                                    else
                                    {
                                        // either this is a non-empty block, or it's an empty case that falls through
                                        // to a non-empty block. if we have been deleting case statements and this
                                        // is not an empty block....
                                        if (emptyStatements && switchCase.Statements.Count > 0 && deletedBreak != null)
                                        {
                                            // we'll need to append the deleted break statement if it doesn't already have
                                            // a flow-changing statement: break, continue, return, or throw
                                            AstNode lastStatement = switchCase.Statements[switchCase.Statements.Count - 1];
                                            if (!(lastStatement is Break) && !(lastStatement is ContinueNode)
                                              && !(lastStatement is ReturnNode) && !(lastStatement is ThrowNode))
                                            {
                                                switchCase.Statements.Append(deletedBreak);
                                            }
                                        }

                                        // make sure the deletedBreak flag is reset
                                        deletedBreak = null;

                                        // reset the flag
                                        emptyStatements = false;
                                    }
                                }
                            }
                        }
                    }

                    // if the last case's statement list ends in a break, 
                    // we can get rid of the break statement
                    if (node.Cases.Count > 0
                        && m_parser.Settings.IsModificationAllowed(TreeModifications.RemoveBreakFromLastCaseBlock))
                    {
                        SwitchCase lastCase = node.Cases[node.Cases.Count - 1] as SwitchCase;
                        if (lastCase != null)
                        {
                            // get the block of statements making up the last case block
                            Block lastBlock = lastCase.Statements;
                            // if the last statement is not a break, then lastBreak will be null
                            Break lastBreak = (lastBlock.Count > 0 ? lastBlock[lastBlock.Count - 1] as Break : null);
                            // if lastBreak is not null and it either has no label, or the label matches this switch statement...
                            if (lastBreak != null
                              && (lastBreak.Label == null || lastBreak.Label == thisLabel))
                            {
                                // remove the break statement
                                lastBlock.RemoveLast();
                            }
                        }
                    }
                }
            }
        }

        public override void Visit(TryNode node)
        {
            if (node != null)
            {
                // anaylze the blocks
                node.TryBlock.IfNotNull(b => b.Accept(this));
                // if the try block is empty, then set it to null
                if (node.TryBlock != null && node.TryBlock.Count == 0)
                {
                    node.TryBlock = null;
                }

                DoCatchBlock(node);

                node.FinallyBlock.IfNotNull(b => b.Accept(this));
                // eliminate an empty finally block UNLESS there is no catch block.
                if (node.FinallyBlock != null && node.FinallyBlock.Count == 0 && node.CatchBlock != null
                    && m_parser.Settings.IsModificationAllowed(TreeModifications.RemoveEmptyFinally))
                {
                    node.FinallyBlock = null;
                }
            }
        }

        private void DoCatchBlock(TryNode node)
        {
            node.CatchBlock.IfNotNull(b => b.Accept(this));
            if (node.CatchParameter != null)
            {
                // check for binding errors (strict names, etc)
                m_strictNameError = JSError.StrictModeCatchName;
                node.CatchParameter.Accept(this);
                m_strictNameError = JSError.StrictModeVariableName;

                // if the block has a lexical scope, check it for conflicts
                var catchBindings = BindingsVisitor.Bindings(node.CatchParameter);
                foreach (var lexDecl in node.CatchBlock.EnclosingScope.LexicallyDeclaredNames)
                {
                    foreach (var catchDecl in catchBindings)
                    {
                        if (lexDecl != catchDecl
                            && string.CompareOrdinal(lexDecl.Name, catchDecl.Name) == 0)
                        {
                            // report the error (catchvar collides with lex/const) or warning (catchvar collides with funcdecl)
                            lexDecl.Context.HandleError(JSError.DuplicateLexicalDeclaration, lexDecl is LexicalDeclaration);

                            // link the inner one to the outer one so any renaming stays in sync.
                            if (lexDecl.VariableField != null)
                            {
                                lexDecl.VariableField.OuterField = catchDecl.VariableField;
                                if (catchDecl.VariableField != null && !lexDecl.VariableField.CanCrunch)
                                {
                                    catchDecl.VariableField.CanCrunch = false;
                                }
                            }
                        }
                    }
                }

                // check to make sure there are no var-decl'd names with the same name. 
                foreach (var varDecl in node.CatchBlock.EnclosingScope.VarDeclaredNames)
                {
                    foreach (var catchDecl in catchBindings)
                    {
                        if (string.CompareOrdinal(varDecl.Name, catchDecl.Name) == 0)
                        {
                            // report the warning (catchvar collides with var)
                            // we shouldn't have to link them; the catchvar should already ghosted.
                            varDecl.Context.HandleError(JSError.DuplicateLexicalDeclaration, false);
                        }
                    }
                }
            }
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1502:AvoidExcessiveComplexity")]
        public override void Visit(UnaryOperator node)
        {
            if (node != null)
            {
                base.Visit(node);

                if (node.Operand != null && node.Operand.IsDebugOnly)
                {
                    node.IsDebugOnly = true;
                    switch (node.OperatorToken)
                    {
                        case JSToken.Void:
                            // void *anything* is the same as void 0
                            node.Operand = new ConstantWrapper(0, PrimitiveType.Number, node.Operand.Context);
                            break;

                        case JSToken.TypeOf:
                            // typeof null is "object"
                            node.Parent.ReplaceChild(node, new ConstantWrapper("object", PrimitiveType.String, node.Context)
                                {
                                    IsDebugOnly = true
                                });
                            break;

                        case JSToken.Delete:
                            // delete null is true
                            node.Operand = new ConstantWrapper(true, PrimitiveType.Boolean, node.Context);
                            break;

                        case JSToken.Increment:
                        case JSToken.Decrement:
                            // ++ and -- result in a number, so just replace with 0
                            node.Parent.ReplaceChild(node, new ConstantWrapper(0, PrimitiveType.Number, node.Context)
                                {
                                    IsDebugOnly = true
                                });
                            break;

                        case JSToken.LogicalNot:
                            // !null is true
                            node.Parent.ReplaceChild(node, new ConstantWrapper(true, PrimitiveType.Boolean, node.Context)
                                {
                                    IsDebugOnly = true
                                });
                            break;

                        case JSToken.BitwiseNot:
                            // ~null is -1
                            node.Parent.ReplaceChild(node, new ConstantWrapper(-1, PrimitiveType.Number, node.Context)
                                {
                                    IsDebugOnly = true
                                });
                            break;

                        case JSToken.Plus:
                            // +null is zero
                            node.Parent.ReplaceChild(node, new ConstantWrapper(0, PrimitiveType.Number, node.Context)
                                {
                                    IsDebugOnly = true
                                });
                            break;

                        case JSToken.Minus:
                            // -null is negative zero
                            node.Parent.ReplaceChild(node, new ConstantWrapper(-0, PrimitiveType.Number, node.Context)
                                {
                                    IsDebugOnly = true
                                });
                            break;

                        default:
                            node.Operand = ClearDebugExpression(node.Operand);
                            break;
                    }
                }
                else
                {
                    // strict mode has some restrictions
                    if (node.OperatorToken == JSToken.Delete)
                    {
                        if (m_scopeStack.Peek().UseStrict)
                        {
                            // operand of a delete operator cannot be a variable name, argument name, or function name
                            // which means it can't be a lookup
                            if (node.Operand is Lookup)
                            {
                                node.Context.HandleError(JSError.StrictModeInvalidDelete, true);
                            }
                        }
                    }
                    else if (node.OperatorToken == JSToken.Increment || node.OperatorToken == JSToken.Decrement)
                    {
                        var lookup = node.Operand as Lookup;
                        if (lookup != null)
                        {
                            if (lookup.VariableField != null && lookup.VariableField.InitializationOnly)
                            {
                                // can't increment or decrement a constant!
                                lookup.Context.HandleError(JSError.AssignmentToConstant, true);
                            }

                            // and strict mode has some restrictions we want to check now
                            if (m_scopeStack.Peek().UseStrict)
                            {
                                // the operator cannot be the eval function or arguments object.
                                // that means the operator is a lookup, and the field for that lookup
                                // is the arguments object or the predefined "eval" object.
                                if (lookup.VariableField == null
                                    || lookup.VariableField.FieldType == FieldType.UndefinedGlobal
                                    || lookup.VariableField.FieldType == FieldType.Arguments
                                    || (lookup.VariableField.FieldType == FieldType.Predefined 
                                    && string.CompareOrdinal(lookup.Name, "eval") == 0))
                                {
                                    node.Operand.Context.HandleError(JSError.StrictModeInvalidPreOrPost, true);
                                }
                            }
                        }
                    }
                    else if (node.OperatorToken == JSToken.TypeOf)
                    {
                        if (m_parser.Settings.RemoveUnneededCode
                            && m_parser.Settings.IsModificationAllowed(TreeModifications.RemoveWindowDotFromTypeOf))
                        {
                            // we want to see if the typeof operand is window.name -- which is getting the type string of 
                            // a potential global variable. If "name" would otherwise resolve to the global namespace (either
                            // defined or undefined), then we can really get rid of the "window." part because the typeof
                            // operator will work just fine if the operand is undefined (it won't throw a reference error).
                            var member = node.Operand as Member;
                            if (member != null)
                            {
                                var lookup = member.Root as Lookup;
                                if (lookup != null
                                    && lookup.VariableField != null
                                    && lookup.VariableField.FieldType == FieldType.Predefined
                                    && lookup.Name == "window")
                                {
                                    // we have window.name
                                    // now check to see if the name part of our member would resolve to something in
                                    // the global namespace.
                                    var name = member.Name;
                                    var enclosingScope = member.EnclosingScope;
                                    var existingField = enclosingScope.CanReference(name);
                                    if (existingField == null
                                        || existingField.FieldType == FieldType.Predefined
                                        || existingField.FieldType == FieldType.Global
                                        || existingField.FieldType == FieldType.UndefinedGlobal)
                                    {
                                        // replace the member with a lookup on the name.
                                        // first, detach the reference to window
                                        DetachReferences.Apply(lookup);

                                        // (just reuse the lookup for "window" by changing the name and doing
                                        // a formal reference lookup on it (which will generate fields if needed)
                                        lookup.Name = name;
                                        lookup.VariableField = enclosingScope.FindReference(name);
                                        node.Operand = lookup;

                                        // and make sure we increment the new reference
                                        lookup.VariableField.AddReference(lookup);
                                    }
                                }
                            }
                        }
                    }
                    else
                    {
                        // if the operand is a numeric literal
                        ConstantWrapper constantWrapper = node.Operand as ConstantWrapper;
                        if (constantWrapper != null && constantWrapper.IsNumericLiteral)
                        {
                            // get the value of the constant. We've already screened it for numeric, so
                            // we don't have to worry about catching any errors
                            double doubleValue = constantWrapper.ToNumber();

                            // if this is a unary minus...
                            if (node.OperatorToken == JSToken.Minus
                                && m_parser.Settings.IsModificationAllowed(TreeModifications.ApplyUnaryMinusToNumericLiteral))
                            {
                                // negate the value
                                constantWrapper.Value = -doubleValue;

                                // replace us with the negated constant
                                if (node.Parent.ReplaceChild(node, constantWrapper))
                                {
                                    // the context for the minus will include the number (its operand),
                                    // but the constant will just be the number. Update the context on
                                    // the constant to be a copy of the context on the operator
                                    constantWrapper.Context = node.Context.Clone();
                                }
                            }
                            else if (node.OperatorToken == JSToken.Plus
                                && m_parser.Settings.IsModificationAllowed(TreeModifications.RemoveUnaryPlusOnNumericLiteral))
                            {
                                // +NEG is still negative, +POS is still positive, and +0 is still 0.
                                // so just get rid of the unary operator altogether
                                if (node.Parent.ReplaceChild(node, constantWrapper))
                                {
                                    // the context for the unary will include the number (its operand),
                                    // but the constant will just be the number. Update the context on
                                    // the constant to be a copy of the context on the operator
                                    constantWrapper.Context = node.Context.Clone();
                                }
                            }
                        }
                    }
                }
            }
        }

        public override void Visit(Var node)
        {
            if (node != null)
            {
                // first we want to weed out duplicates that don't have initializers
                // var a=1, a=2 is okay, but var a, a=2 and var a=2, a should both be just var a=2, 
                // and var a, a should just be var a
                if (m_parser.Settings.IsModificationAllowed(TreeModifications.RemoveDuplicateVar))
                {
                    // first we want to weed out duplicates that don't have initializers
                    // var a=1, a=2 is okay, but var a, a=2 and var a=2, a should both be just var a=2, 
                    // and var a, a should just be var a
                    // only do this for simple binding identifier; leave binding patterns alone
                    int ndx = 0;
                    while (ndx < node.Count)
                    {
                        var bindingIdentifier = node[ndx].Binding as BindingIdentifier;
                        if (bindingIdentifier != null)
                        {
                            var thisName = bindingIdentifier.Name;

                            // handle differently if we have an initializer or not
                            if (node[ndx].Initializer != null)
                            {
                                // the current vardecl has an initializer, so we want to delete any other
                                // simple binding identifier vardecls of the same name in the rest of the 
                                // list with no initializer and move on to the next item afterwards
                                DeleteNoInits(node, ++ndx, thisName);
                            }
                            else
                            {
                                // this vardecl has no initializer, so we can delete it if there is ANY
                                // other vardecl with the same name (whether or not it has an initializer)
                                if (VarDeclExists(node, ndx + 1, thisName))
                                {
                                    // don't increment the index; we just deleted the current item,
                                    // so the next item just slid into this position
                                    bindingIdentifier.VariableField.Declarations.Remove(bindingIdentifier);
                                    node.RemoveAt(ndx);
                                }
                                else
                                {
                                    // nope -- it's the only one. Move on to the next
                                    ++ndx;
                                }
                            }
                        }
                        else
                        {
                            ++ndx;
                        }
                    }
                }

                // recurse the analyze
                base.Visit(node);
            }
        }

        public override void Visit(VariableDeclaration node)
        {
            if (node != null)
            {
                base.Visit(node);

                if (node.Initializer != null && node.Initializer.IsDebugOnly)
                {
                    node.Initializer = ClearDebugExpression(node.Initializer);
                }

                // if this is a binding pattern and the parent is NOT a for-in loop,
                // then we MUST have an initializer as per the language syntax!
                if (node.Initializer == null 
                    && !(node.Binding is BindingIdentifier)
                    && node.Parent.IfNotNull(p => !(p.Parent is ForIn)))
                {
                    // binding patterns in declarations (var/const/let) must always be followed by an assignment
                    node.Binding.Context.HandleError(JSError.BindingPatternRequiresInitializer, true);
                }

                // if this is a special-case vardecl (var foo/*@cc_on=EXPR@*/), set the flag indicating
                // we encountered a @cc_on statement if we found one
                if (node.IsCCSpecialCase && m_parser.Settings.IsModificationAllowed(TreeModifications.RemoveUnnecessaryCCOnStatements))
                {
                    node.UseCCOn = !m_encounteredCCOn;
                    m_encounteredCCOn = true;
                }
            }
        }

        public override void Visit(WhileNode node)
        {
            if (node != null)
            {
                // recurse
                base.Visit(node);

                // if the body is now empty, make it null
                if (node.Body != null && node.Body.Count == 0)
                {
                    node.Body = null;
                }

                if (node.Condition != null && node.Condition.IsDebugOnly)
                {
                    if (node.Body == null)
                    {
                        node.IsDebugOnly = true;
                    }
                    else
                    {
                        node.Condition = new ConstantWrapper(0, PrimitiveType.Number, node.Condition.Context);
                    }
                }
            }
        }

        public override void Visit(WithNode node)
        {
            if (node != null)
            {
                // throw a warning discouraging the use of this statement
                if (m_scopeStack.Peek().UseStrict)
                {
                    // with-statements not allowed in strict code at all
                    node.Context.HandleError(JSError.StrictModeNoWith, true);
                }
                else
                {
                    // not strict, but still not recommended
                    node.Context.HandleError(JSError.WithNotRecommended, false);
                }

                // hold onto the with-scope in case we need to do something with it
                var withScope = node.Body.IfNotNull(b => b.EnclosingScope);

                // recurse
                base.Visit(node);

                // we'd have to know what the object (obj) evaluates to before we
                // can figure out what to add to the scope -- not possible without actually
                // running the code. This could throw a whole bunch of 'undefined' errors.
                if (node.Body != null && node.Body.Count == 0)
                {
                    node.Body = null;
                }

                // we got rid of the block -- tidy up the no-longer-needed scope
                if (node.Body == null && withScope != null)
                {
                    // because the scope is empty, we now know it (it does nothing)
                    withScope.IsKnownAtCompileTime = true;
                }

                if (node.WithObject != null && node.WithObject.IsDebugOnly)
                {
                    if (node.Body == null)
                    {
                        node.IsDebugOnly = true;
                    }
                    else
                    {
                        node.WithObject = new ObjectLiteral(node.WithObject.Context)
                            {
                                IsDebugOnly = true
                            };
                    }
                }
            }
        }

        #endregion

        private static AstNode ClearDebugExpression(AstNode node)
        {
            if (node == null || node is ObjectLiteral || node is ConstantWrapper)
            {
                return node;
            }

            return new ObjectLiteral(node.Context)
                {
                    IsDebugOnly = true
                };
        }

        private static string GuessAtName(AstNode node)
        {
            string guess = string.Empty;
            var parent = node.Parent;

            if (parent != null)
            {
                if (parent is AstNodeList)
                {
                    // if the parent is an ASTList, then we're really interested
                    // in our parent's parent (probably a call)
                    parent = parent.Parent;
                }

                CallNode call = parent as CallNode;
                if (call != null && call.IsConstructor)
                {
                    // if this function expression is the object of a new, then we want the parent
                    parent = parent.Parent;
                }

                guess = parent.GetFunctionGuess(node);
            }

            return guess;
        }

        private static bool AreAssignmentsInVar(BinaryOperator binaryOp, Var varStatement)
        {
            bool areAssignmentsInVar = false;

            if (binaryOp != null)
            {
                // we only want to pop positive for the simple assign (=). If it's any of the 
                // complex assigns (+=, -=, etc) then we don't want to combine them.
                if (binaryOp.OperatorToken == JSToken.Assign)
                {
                    // see if the left-hand side is a simple lookup
                    Lookup lookup = binaryOp.Operand1 as Lookup;
                    if (lookup != null)
                    {
                        // it is. see if that variable is in the previous var statement
                        areAssignmentsInVar = varStatement.Contains(lookup.Name);
                    }
                }
                else if (binaryOp.OperatorToken == JSToken.Comma)
                {
                    // this is a comma operator, so we will return true only if both
                    // left and right operators are assignments to vars defined in the 
                    // var statement
                    areAssignmentsInVar = AreAssignmentsInVar(binaryOp.Operand1 as BinaryOperator, varStatement)
                        && AreAssignmentsInVar(binaryOp.Operand2 as BinaryOperator, varStatement);
                }
            }

            return areAssignmentsInVar;
        }

        private static void ConvertAssignmentsToVarDecls(BinaryOperator binaryOp, Declaration declaration, JSParser parser)
        {
            // we've already checked that the tree only contains simple assignments separate by commas,
            // but just in case we'll check for null anyway
            if (binaryOp != null)
            {
                if (binaryOp.OperatorToken == JSToken.Assign)
                {
                    // we've already cleared this as a simple lookup, but run the check just to be sure
                    Lookup lookup = binaryOp.Operand1 as Lookup;
                    if (lookup != null)
                    {
                        var bindingIdentifier = new BindingIdentifier(lookup.Context)
                                {
                                    Name = lookup.Name,
                                    TerminatingContext = lookup.TerminatingContext,
                                    VariableField = lookup.VariableField
                                };
                        var varDecl = new VariableDeclaration(binaryOp.Context.Clone())
                            {
                                Binding = bindingIdentifier,
                                AssignContext = binaryOp.OperatorContext,
                                Initializer = binaryOp.Operand2,
                            };
                        lookup.VariableField.Declarations.Add(bindingIdentifier);
                        declaration.Append(varDecl);
                    }
                }
                else if (binaryOp.OperatorToken == JSToken.Comma)
                {
                    // recurse both operands
                    ConvertAssignmentsToVarDecls(binaryOp.Operand1 as BinaryOperator, declaration, parser);
                    ConvertAssignmentsToVarDecls(binaryOp.Operand2 as BinaryOperator, declaration, parser);
                }
                // shouldn't ever be anything but these two operators
            }
        }

        private static bool VarDeclExists(Var node, int ndx, string name)
        {
            // only need to look forward from the index passed
            for (; ndx < node.Count; ++ndx)
            {
                var varDecl = node[ndx];
                foreach (var bindingIdentifier in BindingsVisitor.Bindings(varDecl))
                {
                    // string must be exact match
                    if (string.CompareOrdinal(name, bindingIdentifier.Name) == 0)
                    {
                        // there is at least one -- we can bail
                        return true;
                    }
                }
            }
            // if we got here, we didn't find any matches
            return false;
        }

        private static void DeleteNoInits(Var node, int min, string name)
        {
            // walk backwards from the end of the list down to (and including) the minimum index
            for (int ndx = node.Count - 1; ndx >= min; --ndx)
            {
                var varDecl = node[ndx];
                var bindingIdentifier = varDecl.Binding as BindingIdentifier;

                // if it's a simple binding identifier, the name matches and there is no initializer...
                if (bindingIdentifier != null
                    && string.CompareOrdinal(name, bindingIdentifier.Name) == 0
                    && varDecl.Initializer == null)
                {
                    // ...remove it from the list and from the field's declarations
                    node.RemoveAt(ndx);
                    bindingIdentifier.VariableField.Declarations.Remove(bindingIdentifier);
                }
            }
        }

        private static UnaryOperator CreateVoidNode(Context context)
        {
            return new UnaryOperator(context.FlattenToStart())
                {
                    Operand = new ConstantWrapper(0.0, PrimitiveType.Number, context),
                    OperatorToken = JSToken.Void
                };
        }

        private static void ValidateIdentifier(bool isStrict, string identifier, Context context, JSError error)
        {
            // check the name of the variable for reserved words that aren't allowed
            if (JSScanner.IsKeyword(identifier, isStrict))
            {
                context.HandleError(JSError.KeywordUsedAsIdentifier, true);
            }
            else if (isStrict
                && (string.CompareOrdinal(identifier, "eval") == 0
                || string.CompareOrdinal(identifier, "arguments") == 0))
            {
                // strict mode cannot declare variables named "eval" or "arguments"
                context.HandleError(error, true);
            }
        }

        private static bool IsInsideLoop(AstNode node, bool orSwitch)
        {
            // assume we are not
            var insideLoop = false;

            // loop until we get to the top or we get to a function object,
            // which is an entirely different scope.
            while (node != null && !(node is FunctionObject))
            {
                // while, do-while, and for/for-in are loops.
                // break can also appear in switch-statements, so check that too if the appropriate flag is passed.
                if (node is WhileNode
                    || node is DoWhile
                    || node is ForIn
                    || node is ForNode
                    || (orSwitch && node is SwitchCase))
                {
                    // we are in a loop (or maybe a switch)
                    return true;
                }

                // go up the tree
                node = node.Parent;
            }

            // if we get here, we're not in a loop
            return insideLoop;
        }

        private static AstNode ReplaceCultureValue(ConstantWrapper node)
        {
            // get the name of the token.
            var tokenName = node.Value.ToString().Trim('%');
            var path = tokenName.Split('.');
            if (path.Length > 0 && path[0].Equals("CurrentCulture", StringComparison.Ordinal))
            {
                object currentObject = CultureInfo.CurrentCulture;
                for(var ndx = 1; ndx < path.Length; ++ndx)
                {
                    var objectType = currentObject.GetType();
                    int index;
                    if (objectType.IsArray && int.TryParse(path[ndx], out index))
                    {
                        // integer index into an array
                        try
                        {
                            var getMethod = objectType.GetMethod("Get", new[] { typeof(int) });
                            if (getMethod != null)
                            {
                                currentObject = getMethod.Invoke(currentObject, new object[] { index });
                                continue;
                            }
                        }
                        catch(AmbiguousMatchException)
                        {
                            // eat this exception
                        }
                    }
                    else
                    {
                        // not an integer array index
                        try
                        {
                            var propertyInfo = objectType.GetProperty(path[ndx]);
                            if (propertyInfo != null)
                            {
                                currentObject = propertyInfo.GetValue(currentObject, null);
                                continue;
                            }
                        }
                        catch (AmbiguousMatchException)
                        {
                            // eat this exception
                        }
                    }

                    // if we get here, never mind
                    currentObject = null;
                    break;
                }

                if (currentObject != null)
                {
                    if (node.PrimitiveType == PrimitiveType.String)
                    {
                        // just make the value of the string be the string representation
                        // of the current object
                        node.Value = currentObject.ToString();
                    }
                    else 
                    {
                        // create an appropriate node and replace the token node with it
                        var newNode = CreateNodeFromObject(node.Context, currentObject);
                        node.Parent.ReplaceChild(node, newNode);
                        return newNode;
                    }
                }
            }

            return node;
        }

        private static AstNode CreateNodeFromObject(Context context, object item)
        {
            if (item == null)
            {
                return new ConstantWrapper(null, PrimitiveType.Null, context);
            }
            
            if (item is String)
            {
                // create a string literal
                return  new ConstantWrapper(item, PrimitiveType.String, context);
            }
            
            if (item is Boolean)
            {
                // create a boolean literal
                return new ConstantWrapper(item, PrimitiveType.Boolean, context);
            }
            
            if (item is Int16
                || item is UInt16
                || item is Int32
                || item is UInt32
                || item is Int64
                || item is UInt64
                || item is Single
                || item is Double)
            {
                // create a numeric literal, forcing the number to double
                return new ConstantWrapper(Convert.ToDouble(item, CultureInfo.InvariantCulture), PrimitiveType.Number, context);
            }

            if (item is DateTime)
            {
                return new ConstantWrapper(((DateTime)item).ToString("s", CultureInfo.InvariantCulture), PrimitiveType.String, context);
            }

            if (item.GetType().IsValueType)
            {
                return new ConstantWrapper(item.ToString(), PrimitiveType.String, context);
            }

            var arrayObject = item as Array;
            if (arrayObject != null)
            {
                // create an array literal from the array
                var arrayLiteral = new ArrayLiteral(context)
                    {
                        Elements = new AstNodeList(context)
                    };
                foreach (var element in arrayObject)
                {
                    arrayLiteral.Elements.Append(CreateNodeFromObject(context, element));
                }

                return arrayLiteral;
            }

            // create an object literal from all the public unambiguous properties on the item object
            var objectLiteral = new ObjectLiteral(context)
                {
                    Properties = new AstNodeList(context)
                };
            var properties = item.GetType().GetProperties(BindingFlags.Public | BindingFlags.Instance);
            foreach(var property in properties)
            {
                try
                {
                    var propertyValue = property.GetValue(item, null);
                    if (propertyValue != item)
                    {
                        var valueNode = CreateNodeFromObject(context, propertyValue);
                        objectLiteral.Properties.Append(new ObjectLiteralProperty(context)
                        {
                            Name = new ObjectLiteralField(property.Name, PrimitiveType.String, context),
                            Value = valueNode,
                        });
                    }
                }
                catch(AmbiguousMatchException)
                {
                    // ignore this property
                }
            }

            return objectLiteral;
        }
    }
}
