// ReorderScopeVisitor.cs
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

namespace Microsoft.Ajax.Utilities
{
    internal class ReorderScopeVisitor : TreeVisitor
    {
        // list of all function declarations found in this scope
        private List<FunctionObject> m_functionDeclarations;

        // list of all other functions found in this scope
        private List<FunctionObject> m_functionExpressions;

        // list of all modules found in this scope
        private List<ModuleDeclaration> m_moduleDeclarations;

        // all directive prologues we found BEYOND the initial grouping.
        // if we find any, it was probably because they were directive prologues
        // for modules that were batched together and no longer at the top, so
        // we will need to promote them to get them to the proper place.
        private List<DirectivePrologue> m_moduleDirectives;

        // list of all var statements found in this scope
        private List<Var> m_varStatements;

        // whether we want to move var statements
        private bool m_moveVarStatements;

        // whether we want to move function declarations
        private bool m_moveFunctionDecls;

        // whether we want to combine adjacent var statements
        private bool m_combineAdjacentVars;

        // whether we are renaming locals
        //private bool m_localRenaming;

        // counter for whether we are inside a conditional-compilation construct.
        // we need to know this because we do NOT move function declarations that
        // are inside that construct (between @if and @end or inside a single
        // conditional comment).
        // encountering @if or /*@ increments it; *@/ or @end decrements it.
        private int m_conditionalCommentLevel;

        // global scope
        private GlobalScope m_globalScope;

        private ReorderScopeVisitor(JSParser parser)
        {
            // save the mods we care about
            var settings = parser.Settings;
            m_moveVarStatements = settings.ReorderScopeDeclarations && settings.IsModificationAllowed(TreeModifications.CombineVarStatementsToTopOfScope);
            m_moveFunctionDecls = settings.ReorderScopeDeclarations && settings.IsModificationAllowed(TreeModifications.MoveFunctionToTopOfScope);
            m_combineAdjacentVars = settings.IsModificationAllowed(TreeModifications.CombineVarStatements);
            //m_localRenaming = settings.LocalRenaming != LocalRenaming.KeepAll && settings.IsModificationAllowed(TreeModifications.LocalRenaming);

            m_globalScope = parser.GlobalScope;
        }

        public static void Apply(Block block, JSParser parser)
        {
            if (parser == null)
            {
                throw new ArgumentNullException("parser");
            }

            if (block != null)
            {
                // create a new instance of the visitor and apply it to the block
                var visitor = new ReorderScopeVisitor(parser);
                block.Accept(visitor);

                // if there were any module directive prologues we need to promote, do them first
                var insertAt = 0;
                if (visitor.m_moduleDirectives != null)
                {
                    foreach (var directivePrologue in visitor.m_moduleDirectives)
                    {
                        insertAt = RelocateDirectivePrologue(block, insertAt, directivePrologue);
                    }
                }

                // Make sure that we skip over any remaining comments and directive prologues.
                // we do NOT want to insert anything between the start of the scope and any directive prologues.            
                while (insertAt < block.Count
                    && (block[insertAt] is DirectivePrologue || block[insertAt] is ImportantComment))
                {
                    ++insertAt;
                }

                // first, we want to move all function declarations to the top of this block
                if (visitor.m_functionDeclarations != null)
                {
                    foreach (var funcDecl in visitor.m_functionDeclarations)
                    {
                        insertAt = RelocateFunction(block, insertAt, funcDecl);
                    }
                }

                // special case: if there is only one var statement in the entire scope,
                // then just leave it alone because we will only add bytes by moving it around,
                // or be byte-neutral at best (no initializers and not in a for-statement).
                if (visitor.m_varStatements != null && visitor.m_varStatements.Count > 1)
                {
                    // then we want to move all variable declarations after to the top (after the functions)
                    foreach (var varStatement in visitor.m_varStatements)
                    {
                        insertAt = RelocateVar(block, insertAt, varStatement);
                    }
                }

                // then we want to do the same thing for all child functions (declarations AND other)
                if (visitor.m_functionDeclarations != null)
                {
                    foreach (var funcDecl in visitor.m_functionDeclarations)
                    {
                        Apply(funcDecl.Body, parser);
                    }
                }

                if (visitor.m_functionExpressions != null)
                {
                    foreach (var funcExpr in visitor.m_functionExpressions)
                    {
                        Apply(funcExpr.Body, parser);
                    }
                }

                // and then recurse the modules
                if (visitor.m_moduleDeclarations != null)
                {
                    foreach (var moduleDecl in visitor.m_moduleDeclarations)
                    {
                        Apply(moduleDecl.Body, parser);
                    }
                }
            }
        }

        private static int RelocateDirectivePrologue(Block block, int insertAt, DirectivePrologue directivePrologue)
        {
            // skip over any important comments
            while (insertAt < block.Count && (block[insertAt] is ImportantComment))
            {
                ++insertAt;
            }

            // if the one we want to insert is already at this spot, then we're good to go
            if (block[insertAt] != directivePrologue)
            {
                // remove it from where it is right now and insert it into the proper location
                directivePrologue.Parent.ReplaceChild(directivePrologue, null);
                block.Insert(insertAt, directivePrologue);
            }

            // and move up to the next slot
            return ++insertAt;
        }

        private static int RelocateFunction(Block block, int insertAt, AstNode funcDecl)
        {
            // if this function declaration is being exported, then we need to work with the export
            // statement, not the function declaration.
            if (funcDecl.Parent is ExportNode)
            {
                funcDecl = funcDecl.Parent;
            }

            if (block[insertAt] != funcDecl)
            {
                // technically function declarations can only be direct children of the program or a function block.
                // and since we are passing in such a block, the parent of the function declaration better be that
                // block. If it isn't, we don't want to move it because it's not in an allowed place, and different
                // browsers treat that situation differently. Some browsers would process such funcdecls as if
                // they were a direct child of the main block. Others will treat it like a function expression with
                // an external name, and only assign the function to the name if that line of code is actually
                // executed. So since there's a difference, just leave them as-is and only move valid funcdecls.
                if (funcDecl.Parent == block)
                {
                    // remove the function from it's parent, which will take it away from where it is right now.
                    funcDecl.Parent.ReplaceChild(funcDecl, null);

                    // now insert it into the block at the new location, incrementing the location so the next function
                    // will be inserted after it. It is important that they be in the same order as the source, or the semantics
                    // will change when there are functions with the same name.
                    block.Insert(insertAt++, funcDecl);
                }
            }
            else
            {
                // we're already in the right place. Just increment the pointer to move to the next position
                // for next time
                ++insertAt;
            }

            // return the new position
            return insertAt;
        }

        private static int RelocateVar(Block block, int insertAt, Var varStatement)
        {
            var forInParent = varStatement.Parent as ForIn;
            if (forInParent != null)
            {
                insertAt = ReorderScopeVisitor.RelocateForInVar(block, insertAt, varStatement, forInParent);
            }
            else
            {
                // if the var statement is at the next position to insert, then we don't need
                // to do anything.
                if (block[insertAt] != varStatement)
                {
                    // check to see if the current position is a var and we are the NEXT statement.
                    // if that's the case, we don't need to break out the initializer, just append all the
                    // vardecls as-is to the current position.
                    ForNode forNode;
                    var existingVar = block[insertAt] as Var;
                    if (existingVar != null && block[insertAt + 1] == varStatement)
                    {
                        // two var-s one right after the other.
                        // just append our vardecls to the insertion point, then delete our statement
                        existingVar.Append(varStatement);
                        block.RemoveAt(insertAt + 1);
                    }
                    else if (existingVar != null
                        && (forNode = varStatement.Parent as ForNode) != null
                        && forNode.Initializer == varStatement
                        && forNode == block[insertAt + 1])
                    {
                        // this var statement is the initializer of a for-statement, which is
                        // immediately after the var we would insert our vardecls into.
                        // rather than moving our vardecls into the outside var-statement, let's
                        // move the outside var-statement into our for-statement.
                        varStatement.InsertAt(0, existingVar);
                        block.RemoveAt(insertAt);
                    }
                    else
                    {
                        // iterate through the decls and count how many have initializers
                        var initializerCount = 0;
                        for (var ndx = 0; ndx < varStatement.Count; ++ndx)
                        {
                            // count the number of vardecls with initializers
                            if (varStatement[ndx].Initializer != null)
                            {
                                ++initializerCount;
                            }
                        }

                        // if there are more than two decls with initializers, then we won't actually
                        // be gaining anything by moving the var to the top. We'll get rid of the four
                        // bytes for the "var ", but we'll be adding two bytes for the name and comma
                        // because name=init will still need to remain behind.
                        if (initializerCount <= 2)
                        {
                            // first iterate through all the declarations in the var statement,
                            // constructing an expression statement that is made up of assignment
                            // operators for each of the declarations that have initializers (if any)
                            // and removing all the initializers
                            var assignments = new List<AstNode>();
                            for (var ndx = 0; ndx < varStatement.Count; ++ndx)
                            {
                                var varDecl = varStatement[ndx];
                                if (varDecl.Initializer != null)
                                {
                                    // hold on to the object so we don't lose it to the GC
                                    var initializer = varDecl.Initializer;

                                    // remove it from the vardecl
                                    varDecl.Initializer = null;

                                    var reference = BindingTransform.FromBinding(varDecl.Binding);
                                    if (varDecl.IsCCSpecialCase)
                                    {
                                        // we don't want to add the special-case to the binary operator class,
                                        // so just create a copy of the vardecl for this location, using a reference
                                        // for the "binding"
                                        assignments.Add(new VariableDeclaration(varDecl.Context)
                                            {
                                                Binding = reference,
                                                AssignContext = varDecl.AssignContext,
                                                Initializer = initializer,
                                                IsCCSpecialCase = true,
                                                UseCCOn = varDecl.UseCCOn,
                                                TerminatingContext = varDecl.TerminatingContext
                                            });
                                    }
                                    else
                                    {
                                        assignments.Add(new BinaryOperator(varDecl.Context)
                                            {
                                                Operand1 = reference,
                                                Operand2 = initializer,
                                                OperatorToken = JSToken.Assign,
                                                OperatorContext = varDecl.AssignContext
                                            });
                                    }
                                }

                                // if the vardecl we are moving isn't a binding pattern, we need to 
                                // break it down into a simple list of names.
                                if (!(varDecl.Binding is BindingIdentifier))
                                {
                                    // place the original vardecl with the first one
                                    var first = true;
                                    foreach (var declName in BindingsVisitor.Bindings(varDecl.Binding))
                                    {
                                        if (first)
                                        {
                                            varStatement[ndx] = new VariableDeclaration(declName.Context)
                                                {
                                                    Binding = new BindingIdentifier(declName.Context)
                                                    {
                                                        Name = declName.Name,
                                                        VariableField = declName.VariableField
                                                    }
                                                };
                                            first = false;
                                        }
                                        else
                                        {
                                            // otherwise we want to insert a new one at the current position + 1
                                            varStatement.InsertAt(++ndx, new VariableDeclaration(declName.Context)
                                                {
                                                    Binding = new BindingIdentifier(declName.Context)
                                                    {
                                                        Name = declName.Name,
                                                        VariableField = declName.VariableField
                                                    }
                                                });
                                        }
                                    }
                                }
                            }

                            // now if there were any initializers...
                            if (assignments.Count > 0)
                            {
                                // we want to create one big expression from all the assignments and replace the
                                // var statement with the assignment(s) expression. Start at position n=1 and create
                                // a binary operator of n-1 as the left, n as the right, and using a comma operator.
                                var expression = assignments[0];
                                for (var ndx = 1; ndx < assignments.Count; ++ndx)
                                {
                                    expression = CommaOperator.CombineWithComma(expression.Context.FlattenToStart(), expression, assignments[ndx]);
                                }

                                // replace the var with the expression.
                                // we still have a pointer to the var, so we can insert it back into the proper
                                // place next.
                                varStatement.Parent.ReplaceChild(varStatement, expression);
                            }
                            else
                            {
                                // no initializers.
                                // just remove the var statement altogether
                                varStatement.Parent.ReplaceChild(varStatement, null);
                            }

                            // if the statement at the insertion point is a var-statement already,
                            // then we just need to append our vardecls to it. Otherwise we'll insert our
                            // var statement at the right point
                            if (existingVar != null)
                            {
                                // append the varstatement we want to move to the existing var, which will
                                // transfer all the vardecls to it.
                                existingVar.Append(varStatement);
                            }
                            else
                            {
                                // move the var to the insert point, incrementing the position or next time
                                block.Insert(insertAt, varStatement);
                            }
                        }
                    }
                }
            }

            return insertAt;
        }

        private static int RelocateForInVar(Block block, int insertAt, Var varStatement, ForIn forIn)
        {
            // there should only be one decl in the for-in var statement. There should not be any initializer.
            // If not, then ignore it
            VariableDeclaration varDecl;
            if (varStatement.Count == 1 && (varDecl = varStatement[0]).Initializer == null)
            {
                // if there are more than three names, then we don't want to move them
                var bindingNames = BindingsVisitor.Bindings(varDecl.Binding);
                //if (bindingNames.Count < 3)
                {
                    // replace the varStatement in the for-in with a reference version of the binding
                    forIn.Variable = BindingTransform.FromBinding(varDecl.Binding);

                    // if this is a simple binding identifier, then leave it as-is. Otherwise we
                    // need to flatten it for the move to the front of the scope.
                    if (!(varDecl.Binding is BindingIdentifier))
                    {
                        // then flatten all the name in the binding and add them to the 
                        var first = true;
                        foreach (var declName in bindingNames)
                        {
                            if (first)
                            {
                                varStatement[0] = new VariableDeclaration(declName.Context)
                                {
                                    Binding = new BindingIdentifier(declName.Context)
                                    {
                                        Name = declName.Name,
                                        VariableField = declName.VariableField 
                                    }
                                };
                                first = false;
                            }
                            else
                            {
                                // otherwise we want to insert a new one at the current position + 1
                                varStatement.Append(new VariableDeclaration(declName.Context)
                                {
                                    Binding = new BindingIdentifier(declName.Context)
                                    {
                                        Name = declName.Name,
                                        VariableField = declName.VariableField
                                    }
                                });
                            }
                        }
                    }

                    // then move the var statement to the front of the scope
                    // if the statement at the insertion point is a var-statement already,
                    // then we just need to append our vardecls to it. Otherwise we'll insert our
                    // var statement at the right point
                    var existingVar = block[insertAt] as Var;
                    if (existingVar != null)
                    {
                        // append the varstatement we want to move to the existing var, which will
                        // transfer all the vardecls to it.
                        existingVar.Append(varStatement);
                    }
                    else
                    {
                        // insert it at the insert point
                        block.Insert(insertAt, varStatement);
                    }
                }
            }

            return insertAt;
        }

        // unnest any child blocks
        private static void UnnestBlocks(Block node)
        {
            // walk the list of items backwards -- if we come
            // to any blocks, unnest the block recursively. 
            // Remove any empty statements as well.
            // We walk backwards because we could be adding any number of statements 
            // and we don't want to have to modify the counter.
            for (int ndx = node.Count - 1; ndx >= 0; --ndx)
            {
                var nestedBlock = node[ndx] as Block;
                if (nestedBlock != null)
                {
                    // unnest recursively
                    UnnestBlocks(nestedBlock);

                    // if the block has a block scope, then we can't really unnest it
                    // without merging lexical scopes
                    if (!nestedBlock.HasOwnScope)
                    {
                        // remove the nested block
                        node.RemoveAt(ndx);

                        // then start adding the statements in the nested block to our own.
                        // go backwards so we can just keep using the same index
                        node.InsertRange(ndx, nestedBlock.Children);
                    }
                }
                else if (node[ndx] is EmptyStatement)
                {
                    // remove empty statements (lone semicolons)
                    node.RemoveAt(ndx);
                }
                else if (ndx > 0)
                {
                    // see if the previous node is a conditional-compilation comment, because
                    // we will also combine adjacent those
                    var previousComment = node[ndx - 1] as ConditionalCompilationComment;
                    if (previousComment != null)
                    {
                        ConditionalCompilationComment thisComment = node[ndx] as ConditionalCompilationComment;
                        if (thisComment != null)
                        {
                            // two adjacent conditional comments -- combine them into the first.
                            previousComment.Statements.Append(thisComment.Statements);

                            // and remove the second one (which is now a duplicate)
                            node.RemoveAt(ndx);
                        }
                    }
                }
            }
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1502:AvoidExcessiveComplexity")]
        public override void Visit(Block node)
        {
            if (node != null)
            {
                // there really is no point in nesting blocks that don't have any special scopes
                // attached to them. Unnest any now, before we start combining var statements.
                UnnestBlocks(node);

                // if we get here, we are going to want to optimize the curly-braces to eliminate
                // unneeded ones in all blocks except try/catch/finally. So make sure we reset the 
                // force-braces properties for all blocks whose parent isn't a try-statement.
                node.ForceBraces = node.Parent is TryNode;

                if (m_combineAdjacentVars)
                {
                    // look at the statements in the block. 
                    // if there are multiple var statements adjacent to each other, combine them.
                    // walk BACKWARDS down the list because we'll be removing items when we encounter
                    // multiple vars, etc.
                    // we also don't need to check the first one, since there is nothing before it.
                    for (int ndx = node.Count - 1; ndx > 0; --ndx)
                    {
                        var previousDeclaration = node[ndx - 1] as Declaration;
                        if (previousDeclaration != null)
                        {
                            if (previousDeclaration.StatementToken == DeclarationType(node[ndx]))
                            {
                                // add the items in this VAR to the end of the previous
                                previousDeclaration.Append(node[ndx]);

                                // delete this item from the block
                                node.RemoveAt(ndx);
                            }
                        }
                        else
                        {
                            // if this node and hte previous node are both export declaration statements of the same type...
                            var previousExport = node[ndx - 1] as ExportNode;
                            if (previousExport != null && previousExport.Count == 1 && previousExport.ModuleName.IsNullOrWhiteSpace())
                            {
                                var declarationType = DeclarationType(previousExport[0]);
                                if (declarationType != JSToken.None)
                                {
                                    var thisExport = node[ndx] as ExportNode;
                                    if (thisExport != null && thisExport.Count == 1 && thisExport.ModuleName.IsNullOrWhiteSpace()
                                        && declarationType == DeclarationType(thisExport[0]))
                                    {
                                        // merge our specifiers into the previous declaration's specifiers
                                        // and remove this statement from the block
                                        ((Declaration)previousExport[0]).Append(thisExport[0]);
                                        node.RemoveAt(ndx);
                                    }
                                }
                            }
                        }
                    }
                }

                if (node.IsModule)
                {
                    // walk backwards until we find the last non-comment statement
                    var ndxLast = node.Count - 1;
                    while (ndxLast >= 0 && node[ndxLast] is ImportantComment)
                    {
                        --ndxLast;
                    }

                    // if the last non-comment statement isn't the first....
                    if (ndxLast > 0)
                    {
                        // check to see if the last statement is already a target export
                        var finalExport = IfTargetExport(node[ndxLast]);
                        var startIndex = node.Count - (finalExport == null ? 1 : 2);

                        // we're going to keep track of any export declarations we may have because
                        // we'll only move them if it makes sense.
                        var exportDeclarations = new List<ExportNode>();

                        // walk backwards from the last to the first looking for export statements
                        // with no 'from' clause (those would be re-export statements) and specifiers
                        // as children (we don't want to count the export declaration statements yet.
                        for (var ndx = startIndex; ndx >= 0; --ndx)
                        {
                            // we are only interested in exports nodes that DON'T have a module name.
                            // those are re-exports, and we just want to leave them alone for now.
                            var exportNode = node[ndx] as ExportNode;
                            if (exportNode != null && exportNode.ModuleName.IsNullOrWhiteSpace())
                            {
                                if (IfTargetExport(exportNode) != null)
                                {
                                    if (exportNode != finalExport)
                                    {
                                        // we have a target export statement
                                        if (finalExport != null)
                                        {
                                            // if we already have a final export, then we just need to prepend our specifiers to 
                                            // the existing export's specifiers and delete this one
                                            finalExport.Insert(0, exportNode);
                                            node.RemoveAt(ndx);
                                        }
                                        else
                                        {
                                            // we don't already have a final export, so just move this one to the end
                                            node.RemoveAt(ndx);
                                            node.Append(exportNode);
                                            finalExport = exportNode;
                                        }
                                    }
                                }
                                else if (exportNode.Count == 1)
                                {
                                    // it's not a target export node (one with specifiers), and it's not a re-export,
                                    // and it has only one child -- must be an export declaration statement. Save it for later.
                                    exportDeclarations.Add(exportNode);
                                }
                            }
                        }

                        // if we found any export declarations
                        if (exportDeclarations.Count > 0)
                        {
                            // we need to see if it's worth it to remove the export keyword from the declaration and
                            // add a new specifier to an existing export statement, or create a new one.
                        }
                    }
                }

                // recurse down the tree after we've combined the adjacent var statements
                base.Visit(node);
            }
        }

        private static JSToken DeclarationType(AstNode node)
        {
            var declaration = node as Declaration;
            if (declaration != null)
            {
                return declaration.StatementToken;
            }

            return JSToken.None;
        }

        //private static ImportExportSpecifier CreateSpecifierLookup(BindingIdentifier bindingIdentifier)
        //{
        //    // create the lookup
        //    var lookup = new Lookup(bindingIdentifier.Context)
        //        {
        //            Name = bindingIdentifier.Name,
        //            VariableField = bindingIdentifier.VariableField,
        //        };

        //    // add a new reference to the variable field. And since we are creating a
        //    // specifier for this field, we can now minify it if we wanted to.
        //    bindingIdentifier.VariableField.IfNotNull(v =>
        //        {
        //            v.References.Add(lookup);
        //            v.CanCrunch = true;
        //        });

        //    // create the specifier and return it
        //    return new ImportExportSpecifier(bindingIdentifier.Context)
        //        {
        //            LocalIdentifier = lookup
        //        };
        //}

        private static ExportNode IfTargetExport(AstNode node)
        {
            var exportNode = node as ExportNode;
            return (exportNode != null
                && exportNode.ModuleName.IsNullOrWhiteSpace()
                && exportNode.Count > 0
                && exportNode[0] is ImportExportSpecifier) ? exportNode : null;
        }

        public override void Visit(ConditionalCompilationComment node)
        {
            if (node != null && node.Statements != null && node.Statements.Count > 0)
            {
                // increment the conditional comment level, recurse (process all the
                // statements), then decrement the level when we are through.
                ++m_conditionalCommentLevel;
                base.Visit(node);
                --m_conditionalCommentLevel;
            }
        }

        public override void Visit(ConditionalCompilationIf node)
        {
            if (node != null)
            {
                // increment the conditional comment level and then recurse the condition
                ++m_conditionalCommentLevel;
                base.Visit(node);
            }
        }

        public override void Visit(ConditionalCompilationEnd node)
        {
            if (node != null)
            {
                // just decrement the level, because there's nothing to recurse
                --m_conditionalCommentLevel;
            }
        }

        public override void Visit(ConstantWrapper node)
        {
            // by default this node has nothing to do and no children to recurse.
            // but if this node's parent is a block, then this is an expression statement
            // consisting of a single string literal. Normally we would ignore these -- if
            // they occured at the top of the block they would be DirectivePrologues. So because
            // this exists, it must not be at the top. But we still want to check it for the nomunge
            // hints and respect them if that's what it is.
            if (node != null && node.Parent is Block)
            {
                // if this is a hint, process it as such.
                if (IsMinificationHint(node))
                {
                    // and then remove it. We can do that here, because blocks are processed
                    // in reverse order.
                    node.Parent.ReplaceChild(node, null);
                }
            }
        }

        public override void Visit(DirectivePrologue node)
        {
            if (node != null)
            {
                // if this is a minification hint, then process it now
                // and then remove it. Otherwise treat it as a directive prologue that
                // we need to preserve
                if (IsMinificationHint(node))
                {
                    node.Parent.ReplaceChild(node, null);
                }
                else
                {
                    // no need to call the base, just add it to the list
                    if (m_moduleDirectives == null)
                    {
                        m_moduleDirectives = new List<DirectivePrologue>();
                    }

                    m_moduleDirectives.Add(node);
                }
            }
        }

        public override void Visit(FunctionObject node)
        {
            if (node != null)
            {
                // if we are reordering ANYTHING, then we need to do the reordering on a scope level.
                // so if that's the case, we need to create a list of all the child functions and NOT
                // recurse at this point. Then we'll reorder, then we'll use the lists to recurse.
                // BUT if we are not reordering anything, no sense making the lists and recursing later.
                // if that's the case, we can just recurse now and not have to worry about anything later.
                if (m_moveVarStatements || m_moveFunctionDecls)
                {
                    // add the node to the appropriate list: either function expression or function declaration.
                    // assume if it's not a function declaration, it must be an expression since the other types
                    // are not declaration (getter, setter) and we want to treat declarations special.
                    // if the conditional comment level isn't zero, then something funky is going on with
                    // the conditional-compilation statements, and we don't want to move the declarations, so
                    // don't add them to the declaration list. But we still want to recurse them, so add them
                    // to the expression list (which get recursed but not moved).
                    if (node.FunctionType == FunctionType.Declaration && m_conditionalCommentLevel == 0)
                    {
                        if (m_functionDeclarations == null)
                        {
                            m_functionDeclarations = new List<FunctionObject>();
                        }

                        m_functionDeclarations.Add(node);
                    }
                    else
                    {
                        if (m_functionExpressions == null)
                        {
                            m_functionExpressions = new List<FunctionObject>();
                        }

                        m_functionExpressions.Add(node);
                    }

                    // BUT DO NOT RECURSE!!!!
                    // we only want the functions and variables in THIS scope, not child function scopes.
                    //base.Visit(node);
                }
                else
                {
                    // we're not reordering, so just recurse now to save the hassle
                    base.Visit(node);
                }
            }
        }

        public override void Visit(Var node)
        {
            if (node != null)
            {
                // don't bother creating a list of var-statements if we're not going to move them.
                // and if we are inside a conditional-compilation comment level, then don't move them
                // either.
                // don't bother moving const-statements.
                if (m_moveVarStatements && m_conditionalCommentLevel == 0)
                {
                    if (m_varStatements == null)
                    {
                        m_varStatements = new List<Var>();
                    }

                    // add the node to the list of variable declarations
                    m_varStatements.Add(node);
                }

                // and recurse
                base.Visit(node);
            }
        }

        public override void Visit(GroupingOperator node)
        {
            if (node != null)
            {
                // if the parent isn't null, we need to run some checks
                // to see if we can be removed for being superfluous.
                if (node.Parent != null)
                {
                    var deleteParens = false;
                    if (node.Operand == null)
                    {
                        // delete self - no operand make the parens superfluous
                        // TODO: or should we leave them to preserve the "error"?
                        deleteParens = true;
                    }
                    else if (node.Parent is Block)
                    {
                        // function expressions and object literals need to keep the parens 
                        // or they'll be mistaken for function delcarations and blocks, respectively.
                        // all others get axed.
                        if (!(node.Operand is FunctionObject) && !(node.Operand is ObjectLiteral))
                        {
                            // delete self
                            deleteParens = true;
                        }
                    }
                    else if (node.Parent is AstNodeList)
                    {
                        // keep the parens if the node is itself a comma-operator
                        // question: do we need to check for ANY comma-operators in the entire expression,
                        // or will precedence rules dictate that there will be parens lower down if this
                        // expression isn't a comma-operator?
                        var binOp = node.Operand as BinaryOperator;
                        if (binOp == null || binOp.OperatorToken != JSToken.Comma)
                        {
                            // delete self
                            deleteParens = true;
                        }
                    }
                    else if (node.Parent.IsExpression)
                    {
                        var targetPrecedence = node.Parent.Precedence;
                        var conditional = node.Parent as Conditional;
                        if (conditional != null)
                        {
                            // the conditional is weird in that the different parts need to be
                            // compared against different precedences, not the precedence of the
                            // conditional itself. The condition should be compared to logical-or,
                            // and the true/false expressions against assignment.
                            targetPrecedence = conditional.Condition == node
                                ? OperatorPrecedence.LogicalOr
                                : OperatorPrecedence.Assignment;
                        }
                        
                        if (targetPrecedence <= node.Operand.Precedence)
                        {
                            // if the target precedence is less than or equal to the 
                            // precedence of the operand, then the parens are superfluous.
                            deleteParens = true;
                        }
                    }
                    else
                    {
                        // delete self
                        deleteParens = true;
                    }

                    if (deleteParens)
                    {
                        // delete the parens by replacing the grouping opertor node
                        // with its own operand
                        node.Parent.ReplaceChild(node, node.Operand);
                    }
                }
                
                // always recurse the operand
                if (node.Operand != null)
                {
                    node.Operand.Accept(this);
                }
            }
        }

        public override void Visit(ModuleDeclaration node)
        {
            if (node != null)
            {
                if (node.Body != null)
                {
                    // the module is an inline declration. Add it to the list of modules so we will
                    // recurse them later, AFTER this current scope has already been taken care of.
                    // AND DON'T RECURSE NOW
                    if (m_moduleDeclarations == null)
                    {
                        m_moduleDeclarations = new List<ModuleDeclaration>();
                    }

                    m_moduleDeclarations.Add(node);

                }
            }
        }

        private bool IsMinificationHint(ConstantWrapper node)
        {
            var isHint = false;
            if (node.PrimitiveType == PrimitiveType.String)
            {
                // try splitting on commas and removing empty items
                var sections = node.ToString().Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
                foreach (var section in sections)
                {
                    // valid hints are:
                    //      name:nomunge    don't automatically rename the field defined in this scope named "name"
                    //                      if name is missing (colon is the first character) or "*", then don't rename ANY
                    //                      fields defined in the current scope.
                    var ndxColon = section.IndexOf(':');
                    if (ndxColon >= 0)
                    {
                        // make sure this is a "nomunge" hint. If it is, then the entire node is treated as a hint and
                        // will be removed from the AST.
                        if (string.Compare(section.Substring(ndxColon + 1).Trim(), "nomunge", StringComparison.OrdinalIgnoreCase) == 0)
                        {
                            // it is.
                            isHint = true;

                            // get the name that we don't want to munge. Null means all. Convert "*"
                            // to null.
                            var identifier = section.Substring(0, ndxColon).Trim();
                            if (string.IsNullOrEmpty(identifier) || string.CompareOrdinal(identifier, "*") == 0)
                            {
                                identifier = null;
                            }

                            // get the current scope and iterate over all the fields within it
                            // looking for just the ones that are defined here (outer is null)
                            var currentScope = node.EnclosingScope ?? m_globalScope;
                            foreach (var field in currentScope.NameTable.Values)
                            {
                                if (field.OuterField == null)
                                {
                                    // if the identifier is null or matches exactly, mark it as not crunchable
                                    if (identifier == null || string.CompareOrdinal(identifier, field.Name) == 0)
                                    {
                                        field.CanCrunch = false;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            return isHint;
        }
    }
}
