// activationobject.cs
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

using System;
using System.Collections.Generic;
using System.Reflection;

namespace Microsoft.Ajax.Utilities
{
    public enum ScopeType
    {
        None = 0,
        Global,
        Function,
        Block,
        With,
        Catch,
        Class,
        Lexical,
        Module,
    }

    public abstract class ActivationObject
    {
        #region private fields

        private bool m_useStrict;//= false;
        private bool m_isKnownAtCompileTime;

        #endregion

        #region internal properties

        /// <summary>
        /// Gets or sets a boolean value for whether this is an existing scope or a new one
        /// generated during the current run.
        /// </summary>
        internal bool Existing { get; set; }

        #endregion

        #region public properties

        public AstNode Owner { get; set; }

        public bool HasSuperBinding { get; set; }

        public bool UseStrict
        {
            get
            {
                return m_useStrict;
            }
            set
            {
                // can set it to true, but can't set it to false
                if (value)
                {
                    // set our value
                    m_useStrict = value;

                    // and all our child scopes (recursive)
                    foreach (var child in ChildScopes)
                    {
                        child.UseStrict = value;
                    }
                }
            }
        }

        public bool IsKnownAtCompileTime
        {
            get { return m_isKnownAtCompileTime; }
            set 
            { 
                m_isKnownAtCompileTime = value;
                if (!value && Settings.EvalTreatment == EvalTreatment.MakeAllSafe)
                {
                    // are we a function scope?
                    var functionObject = this.Owner as FunctionObject;
                    if (functionObject == null)
                    {
                        // we are not a function, so the parent scope is unknown too
                        if (Parent != null)
                        {
                            Parent.IsKnownAtCompileTime = false;
                        }
                    }
                    else
                    {
                        // we are a function, check to see if the function object is actually
                        // referenced. (we don't want to mark the parent as unknown if this function 
                        // isn't even referenced).
                        if (functionObject.IsReferenced)
                        {
                            Parent.IsKnownAtCompileTime = false;
                        }
                    }
                }
            }
        }

        public ActivationObject Parent { get; private set; }
        public bool IsInWithScope { get; set; }

        public IDictionary<string, JSVariableField> NameTable { get; private set; }

        public IList<ActivationObject> ChildScopes { get; private set; }

        public ICollection<Lookup> ScopeLookups { get; private set; }
        public ICollection<INameDeclaration> VarDeclaredNames { get; private set; }
        public ICollection<INameDeclaration> LexicallyDeclaredNames { get; private set; }

        public ICollection<BindingIdentifier> GhostedCatchParameters { get; private set; }
        public ICollection<FunctionObject> GhostedFunctions { get; private set; }

        public string ScopeName { get; set; }
        public ScopeType ScopeType { get; protected set; }

        #endregion

        #region protected properties

        protected CodeSettings Settings { get; private set; }

        #endregion

        protected ActivationObject(ActivationObject parent, CodeSettings codeSettings)
        {
            m_isKnownAtCompileTime = true;
            m_useStrict = false;
            Settings = codeSettings;

            Parent = parent;
            NameTable = new Dictionary<string, JSVariableField>();
            ChildScopes = new List<ActivationObject>();

            // if our parent is a scope....
            if (parent != null)
            {
                // add us to the parent's list of child scopes
                parent.ChildScopes.Add(this);

                // if the parent is strict, so are we
                UseStrict = parent.UseStrict;
            }

            // create the two lists of declared items for this scope
            ScopeLookups = new HashSet<Lookup>();
            VarDeclaredNames = new HashSet<INameDeclaration>();
            LexicallyDeclaredNames = new HashSet<INameDeclaration>();

            GhostedCatchParameters = new HashSet<BindingIdentifier>();
            GhostedFunctions = new HashSet<FunctionObject>();
        }

        #region public static methods

        /// <summary>
        /// Delete a binding from its parent pattern
        /// </summary>
        /// <param name="binding">binding to delete</param>
        /// <param name="normalizePattern">true to normalize the parent pattern and possibly delete it if now empty</param>
        /// <returns>true if deleted, otherwise false</returns>
        public static bool DeleteFromBindingPattern(AstNode binding, bool normalizePattern)
        {
            var deleted = false;
            if (binding != null)
            {
                // the parent might be an node list under an array literal, or
                // or a property under an object literal 
                ObjectLiteralProperty property = null;
                VariableDeclaration varDecl;
                var nodeList = binding.Parent as AstNodeList;
                if (nodeList != null && nodeList.Parent is ArrayLiteral)
                {
                    // name under an array literal so if this is the LAST element, we can delete it,
                    // otherwise we have to replace it with a missing constant
                    deleted = nodeList.ReplaceChild(
                        binding,
                        new ConstantWrapper(Missing.Value, PrimitiveType.Other, binding.Context.Clone()));
                }
                else if ((property = binding.Parent as ObjectLiteralProperty) != null)
                {
                    // delete the property from the list of properties after saving the list of properties for later
                    nodeList = property.Parent as AstNodeList;
                    deleted = property.Parent.ReplaceChild(property, null);
                }
                else if ((varDecl = binding.Parent as VariableDeclaration) != null)
                {
                    // we're at the top -- the empty binding we are deleting is defined within a vardecl.
                    // IF the declaration is not the variable of a for-in statement, and
                    // IF there are other vardecls in the var, and
                    // IF the initializer is null or constant, 
                    // THEN we can delete it. Otherwise we need to leave the empty pattern.
                    var declaration = varDecl.Parent as Declaration;
                    if (declaration != null)
                    {
                        var forIn = declaration.Parent as ForIn;
                        if ((forIn == null || forIn.Variable != declaration)
                            && (varDecl.Initializer == null || varDecl.Initializer.IsConstant))
                        {
                            // NOT in a for-in statement and the initializer is constant. We can delete the
                            // vardecl with the empty binding pattern from its parent and then check to see
                            // if the parent is now empty, and delete it if it is.
                            deleted = varDecl.Parent.ReplaceChild(varDecl, null);
                            if (declaration.Count == 0)
                            {
                                // the whole statement is now empty; whack it too
                                declaration.Parent.ReplaceChild(declaration, null);
                            }
                        }
                    }
                }

                if (deleted)
                {
                    var bindingIdentifier = binding as BindingIdentifier;
                    if (bindingIdentifier != null)
                    {
                        // because this is a binding parameter, the binding should be listed
                        // in the field's declarations collection. Remove it, too
                        bindingIdentifier.VariableField.Declarations.Remove(bindingIdentifier);

                        // mark the field as deleted IF there are no more references
                        // or declarations
                        if (!bindingIdentifier.VariableField.IsReferenced
                            && bindingIdentifier.VariableField.Declarations.Count == 0)
                        {
                            bindingIdentifier.VariableField.WasRemoved = true;
                        }
                    }

                    // see if we also want to possibly clean up this pattern, now that we've
                    // removed something from it
                    if (normalizePattern && nodeList != null)
                    {
                        // if this nodelist is the child of an array literal, make sure we remove 
                        // any trailing elisions. 
                        if (nodeList.Parent is ArrayLiteral)
                        {
                            for (var ndx = nodeList.Count - 1; ndx >= 0; --ndx)
                            {
                                var constantWrapper = nodeList[ndx] as ConstantWrapper;
                                if (constantWrapper != null && constantWrapper.Value == Missing.Value)
                                {
                                    nodeList.RemoveAt(ndx);
                                }
                                else
                                {
                                    // no longer an elision; stop iterating
                                    break;
                                }
                            }
                        }

                        if (nodeList.Count == 0)
                        {
                            // the list is now empty!
                            // let's recursively get rid of the parent array or object literal
                            // from ITS binding pattern
                            DeleteFromBindingPattern(nodeList.Parent, normalizePattern);
                        }
                    }
                }
            }

            return deleted;
        }

        public static void RemoveBinding(AstNode binding)
        {
            // first unhook all the declarations in the binding pattern
            foreach (var boundName in BindingsVisitor.Bindings(binding))
            {
                var variableField = boundName.VariableField;
                if (variableField != null)
                {
                    variableField.Declarations.Remove(boundName);
                }
            }

            // then remove the binding from it's parent and clean up any cascade
            DeleteFromBindingPattern(binding, true);
        }

        #endregion

        #region scope setup methods

        /// <summary>
        /// Set up this scope's fields from the declarations it contains
        /// </summary>
        public abstract void DeclareScope();

        protected void DefineLexicalDeclarations()
        {
            foreach (var lexDecl in LexicallyDeclaredNames)
            {
                // use the function as the field value if its parent is a function
                // or the class node if its a class
                AstNode fieldValue = lexDecl.Parent as FunctionObject;
                if (fieldValue == null)
                {
                    fieldValue = lexDecl.Parent as ClassNode;
                }

                DefineField(lexDecl, fieldValue);
            }
        }

        protected void DefineVarDeclarations()
        {
            foreach (var varDecl in VarDeclaredNames)
            {
                // var-decls are always initialized to null
                DefineField(varDecl, null);
            }
        }

        private void DefineField(INameDeclaration nameDecl, AstNode fieldValue)
        {
            var field = this[nameDecl.Name];
            if (nameDecl.IsParameter)
            {
                // function parameters are handled separately, so if this is a parameter declaration,
                // then it must be a catch variable. 
                if (field == null)
                {
                    // no collision - create the catch-error field
                    field = new JSVariableField(FieldType.CatchError, nameDecl.Name, 0, null)
                    {
                        OriginalContext = nameDecl.Context,
                        IsDeclared = true
                    };

                    this.AddField(field);
                }
                else
                {
                    // it's an error to declare anything in the catch scope with the same name as the
                    // error variable
                    field.OriginalContext.HandleError(JSError.DuplicateCatch, true);
                }
            }
            else
            {
                if (field == null)
                {
                    // could be global or local depending on the scope, so let the scope create it.
                    field = this.CreateField(nameDecl.Name, null, 0);
                    field.OriginalContext = nameDecl.Context;
                    field.IsDeclared = true;
                    field.IsFunction = (nameDecl is FunctionObject);
                    field.FieldValue = fieldValue;

                    // if this field is a constant or an import, mark it now as initialize only.
                    // Mozilla const statements will be const => vardecl => node
                    // ES6 const statements will be lexdecl(StatementToken == JSToken.Cont) => vardecl => node
                    // imports can be import => 
                    var parentParent = nameDecl.Parent.IfNotNull(p => p.Parent);
                    LexicalDeclaration lexDeclaration;
                    field.InitializationOnly = parentParent is ConstStatement
                        || ((lexDeclaration = parentParent as LexicalDeclaration) != null && lexDeclaration.StatementToken == JSToken.Const);

                    this.AddField(field);
                }
                else
                {
                    // already defined! 
                    // if this is a lexical declaration, then it's an error because we have two
                    // lexical declarations with the same name in the same scope.
                    if (nameDecl.Parent.IfNotNull(p => p.Parent) is LexicalDeclaration)
                    {
                        nameDecl.Context.HandleError(JSError.DuplicateLexicalDeclaration, true);
                    }

                    if (nameDecl.Initializer != null)
                    {
                        // if this is an initialized declaration, then the var part is
                        // superfluous and the "initializer" is really a lookup assignment. 
                        // So bump up the ref-count for those cases.
                        var nameReference = nameDecl as INameReference;
                        if (nameReference != null)
                        {
                            field.AddReference(nameReference);
                        }
                    }

                    // don't clobber an existing field value with null. For instance, the last 
                    // function declaration is the winner, so always set the value if we have something,
                    // but a var following a function shouldn't reset it to null.
                    if (fieldValue != null)
                    {
                        field.FieldValue = fieldValue;
                    }
                }

                // if this is a field that was declared with an export statement, then we want to set the
                // IsExported flag. Stop if we get to a block, because that means we aren't in an export
                // statement.
                var parent = (AstNode)nameDecl;
                while ((parent = parent.Parent) != null && !(parent is Block))
                {
                    if (parent is ExportNode)
                    {
                        field.IsExported = true;
                        break;
                    }
                    else if (parent is ImportNode)
                    {
                        // import fields cannot be assigned to.
                        field.InitializationOnly = true;
                        break;
                    }
                }
            }

            nameDecl.VariableField = field;
            field.Declarations.Add(nameDecl);

            // if this scope is within a with-statement, or if the declaration was flagged
            // as not being renamable, then mark the field as not crunchable
            if (IsInWithScope || nameDecl.RenameNotAllowed)
            {
                field.CanCrunch = false;
            }
        }

        #endregion

        #region AnalyzeScope functionality

        internal virtual void AnalyzeScope()
        {
            // global scopes override this and don't call the next
            AnalyzeNonGlobalScope();

            // rename fields if we need to
            ManualRenameFields();

            // recurse 
            foreach (var activationObject in ChildScopes)
            {
                activationObject.AnalyzeScope();
            }
        }

        private void AnalyzeNonGlobalScope()
        {
            foreach (var variableField in NameTable.Values)
            {
                if (variableField.OuterField == null)
                {
                    // not referenced, not generated, and has an original context so not added after the fact.
                    // and we don't care if ghosted, catch-error fields or exports are unreferenced.
                    if (!variableField.IsReferenced
                        && !variableField.IsGenerated
                        && variableField.FieldType != FieldType.CatchError
                        && variableField.FieldType != FieldType.GhostCatch
                        && !variableField.IsExported
                        && variableField.OriginalContext != null)
                    {
                        UnreferencedVariableField(variableField);
                    }
                    else if (variableField.FieldType == FieldType.Local
                        && variableField.RefCount == 1
                        && this.IsKnownAtCompileTime
                        && Settings.RemoveUnneededCode
                        && Settings.IsModificationAllowed(TreeModifications.RemoveUnusedVariables))
                    {
                        SingleReferenceVariableField(variableField);
                    }
                }
            }
        }

        private void UnreferencedVariableField(JSVariableField variableField)
        {
            // see if the value is a function
            var functionObject = variableField.FieldValue as FunctionObject;
            if (functionObject != null)
            {
                UnreferencedFunction(variableField, functionObject);
            }
            else if (variableField.FieldType != FieldType.Argument && !variableField.WasRemoved)
            {
                UnreferencedVariable(variableField);
            }
        }

        private void UnreferencedFunction(JSVariableField variableField, FunctionObject functionObject)
        {
            // if there is no name, then ignore this declaration because it's malformed.
            // (won't be a function expression because those are automatically referenced).
            // also ignore ghosted function fields.
            if (functionObject.Binding != null && variableField.FieldType != FieldType.GhostFunction)
            {
                // if the function name isn't a simple identifier, then leave it there and mark it as
                // not renamable because it's probably one of those darn IE-extension event handlers or something.
                if (JSScanner.IsValidIdentifier(functionObject.Binding.Name))
                {
                    // unreferenced function declaration. fire a warning.
                    var ctx = functionObject.Binding.Context ?? variableField.OriginalContext;
                    ctx.HandleError(JSError.FunctionNotReferenced, false);

                    // hide it from the output if our settings say we can.
                    // we don't want to delete it, per se, because we still want it to 
                    // show up in the scope report so the user can see that it was unreachable
                    // in case they are wondering where it went.
                    // ES6 has the notion of block-scoped function declarations. ES5 says functions can't
                    // be defined inside blocks -- only at the root level of the global scope or function scopes.
                    // so if this is a block scope, don't hide the function, even if it is unreferenced because
                    // of the cross-browser difference.
                    if (this.IsKnownAtCompileTime
                        && Settings.MinifyCode
                        && Settings.RemoveUnneededCode
                        && !(this is BlockScope))
                    {
                        // REMOVE the unreferened function, don't dance around trying to "hide" it
                        //functionObject.HideFromOutput = true;
                        functionObject.Parent.IfNotNull(p => p.ReplaceChild(functionObject, null));
                    }
                }
                else
                {
                    // not a valid identifier name for this function. Don't rename it because it's
                    // malformed and we don't want to mess up the developer's intent.
                    variableField.CanCrunch = false;
                }
            }
        }

        private void UnreferencedVariable(JSVariableField variableField)
        {
            var throwWarning = true;

            // not a function, not an argument, not a catch-arg, not a global.
            // not referenced. If there's a single definition, and it either has no
            // initializer or the initializer is constant, get rid of it. 
            // (unless we aren't removing unneeded code, or the scope is unknown)
            if (variableField.Declarations.Count == 1 && this.IsKnownAtCompileTime)
            {
                BindingIdentifier bindingIdentifier;
                var nameDeclaration = variableField.OnlyDeclaration;
                var varDecl = nameDeclaration.IfNotNull(decl => decl.Parent as VariableDeclaration);
                if (varDecl != null)
                {
                    var declaration = varDecl.Parent as Declaration;
                    if (declaration != null
                        && (varDecl.Initializer == null || varDecl.Initializer.IsConstant))
                    {
                        // if the decl parent is a for-in and the decl is the variable part
                        // of the statement, then just leave it alone. Don't even throw a warning
                        var forInStatement = declaration.Parent as ForIn;
                        if (forInStatement != null
                            && declaration == forInStatement.Variable)
                        {
                            // just leave it alone, and don't even throw a warning for it.
                            // TODO: try to reuse some pre-existing variable, or maybe replace
                            // this vardecl with a ref to an unused parameter if this is inside
                            // a function.
                            throwWarning = false;
                        }
                        else if (Settings.RemoveUnneededCode
                            && Settings.IsModificationAllowed(TreeModifications.RemoveUnusedVariables))
                        {
                            variableField.Declarations.Remove(nameDeclaration);

                            // don't "remove" the field if it's a ghost to another field
                            if (variableField.GhostedField == null)
                            {
                                variableField.WasRemoved = true;
                            }

                            // remove the vardecl from the declaration list, and if the
                            // declaration list is now empty, remove it, too
                            declaration.Remove(varDecl);
                            if (declaration.Count == 0)
                            {
                                declaration.Parent.ReplaceChild(declaration, null);
                            }
                        }
                    }
                    else if (varDecl.Parent is ForIn)
                    {
                        // then this is okay
                        throwWarning = false;
                    }
                }
                else if ((bindingIdentifier = nameDeclaration as BindingIdentifier) != null)
                {
                    // try deleting the binding pattern declaration
                    DeleteFromBindingPattern(bindingIdentifier, true);
                }
            }

            if (throwWarning && variableField.HasNoReferences)
            {
                // not referenced -- throw a warning, assuming it hasn't been "removed" 
                // via an optimization or something.
                variableField.OriginalContext.HandleError(
                    JSError.VariableDefinedNotReferenced,
                    false);
            }
        }

        private static void SingleReferenceVariableField(JSVariableField variableField)
        {
            // local fields that only have one declaration
            if (variableField.Declarations.Count == 1)
            {
                // there should only be one, it should be a vardecl, and 
                // either no initializer or a constant initializer
                var nameDeclaration = variableField.OnlyDeclaration;
                var varDecl = nameDeclaration.IfNotNull(d => d.Parent as VariableDeclaration);
                if (varDecl != null
                    && varDecl.Initializer != null
                    && varDecl.Initializer.IsConstant)
                {
                    // there should only be one
                    var reference = variableField.OnlyReference;
                    if (reference != null)
                    {
                        // if the reference is not being assigned to, it is not an outer reference
                        // (meaning the lookup is in the same scope as the declaration), and the
                        // lookup is after the declaration
                        if (!reference.IsAssignment
                            && reference.VariableField != null
                            && reference.VariableField.OuterField == null
                            && reference.VariableField.CanCrunch
                            && !reference.VariableField.IsExported
                            && varDecl.Index < reference.Index
                            && !IsIterativeReference(varDecl.Initializer, reference))
                        {
                            // so we have a declaration assigning a constant value, and only one
                            // reference reading that value. replace the reference with the constant
                            // and get rid of the declaration.
                            // transform: var lookup=constant;lookup   ==>   constant
                            // remove the vardecl
                            var declaration = varDecl.Parent as Declaration;
                            if (declaration != null)
                            {
                                // replace the reference with the constant
                                variableField.References.Remove(reference);
                                var refNode = reference as AstNode;
                                refNode.Parent.IfNotNull(p => p.ReplaceChild(refNode, varDecl.Initializer));

                                // we're also going to remove the declaration itself
                                variableField.Declarations.Remove(nameDeclaration);
                                variableField.WasRemoved = true;

                                // remove the vardecl from the declaration list
                                // and if the declaration is now empty, remove it, too
                                declaration.Remove(varDecl);
                                if (declaration.Count == 0)
                                {
                                    declaration.Parent.IfNotNull(p => p.ReplaceChild(declaration, null));
                                }
                            }
                        }
                    }
                }
            }
        }

        private static bool IsIterativeReference(AstNode initializer, INameReference reference)
        {
            // we only care about array and regular expressions with the global switch at this point.
            // if it's not one of those types, then go ahead and assume iterative reference doesn't matter.
            var regExp = initializer as RegExpLiteral;
            if (initializer is ArrayLiteral 
                || initializer is ObjectLiteral
                || (regExp != null && regExp.PatternSwitches != null && regExp.PatternSwitches.IndexOf("g", StringComparison.OrdinalIgnoreCase) >= 0))
            {
                // get the parent block for the initializer. We'll use this as a stopping point in our loop.
                var parentBlock = GetParentBlock(initializer);

                // walk up the parent chain from the reference. If we find a while, a for, or a do-while,
                // then we know this reference is iteratively called.
                // stop when the parent is null, the same block containing the initializer, or a function object.
                // (because a function object will step out of scope, and we know we should be in the same scope)
                var child = reference as AstNode;
                var parent = child.Parent;
                while (parent != null && parent != parentBlock && !(parent is FunctionObject))
                {
                    // while or do-while is iterative -- the condition and the body are both called repeatedly.
                    if (parent is WhileNode || parent is DoWhile)
                    {
                        return true;
                    }

                    // for-statements call the condition, the incrementer, and the body repeatedly, but not the
                    // initializer.
                    var forNode = parent as ForNode;
                    if (forNode != null && child != forNode.Initializer)
                    {
                        return true;
                    }

                    // in forin-statements, only the body is repeated, the collection is evaluated only once.
                    var forInStatement = parent as ForIn;
                    if (forInStatement != null && child == forInStatement.Body)
                    {
                        return true;
                    }

                    // go up
                    child = parent;
                    parent = parent.Parent;
                }
            }

            return false;
        }

        /// <summary>
        /// Return the first Block node in the tree starting from the given node and working up through the parent nodes.
        /// </summary>
        /// <param name="node">initial node</param>
        /// <returns>first block node in the node tree</returns>
        private static Block GetParentBlock(AstNode node)
        {
            while(node != null)
            {
                // see if the current node is a block, and if so, return it.
                var block = node as Block;
                if (block != null)
                {
                    return block;
                }

                // try the parent
                node = node.Parent;
            }

            // if we get here, we never found a parent block.
            return null;
        }

        protected void ManualRenameFields()
        {
            // if the local-renaming kill switch is on, we won't be renaming ANYTHING, so we'll have nothing to do.
            if (Settings.IsModificationAllowed(TreeModifications.LocalRenaming))
            {
                // if the parser settings has a list of rename pairs, we will want to go through and rename
                // any matches
                if (Settings.HasRenamePairs)
                {
                    // go through the list of fields in this scope. Anything defined in the script that
                    // is in the parser rename map should be renamed and the auto-rename flag reset so
                    // we don't change it later.
                    foreach (var varField in NameTable.Values)
                    {
                        // don't rename outer fields (only actual fields), 
                        // and we're only concerned with global or local variables --
                        // those which are defined by the script (not predefined, not the arguments object)
                        if (varField.OuterField == null 
                            && (varField.FieldType != FieldType.Arguments && varField.FieldType != FieldType.Predefined))
                        {
                            // see if the name is in the parser's rename map
                            string newName = Settings.GetNewName(varField.Name);
                            if (!string.IsNullOrEmpty(newName))
                            {
                                // it is! Change the name of the field, but make sure we reset the CanCrunch flag
                                // or setting the "crunched" name won't work.
                                // and don't bother making sure the name doesn't collide with anything else that
                                // already exists -- if it does, that's the developer's fault.
                                // TODO: should we at least throw a warning?
                                varField.CanCrunch = true;
                                varField.CrunchedName = newName;

                                // and make sure we don't crunch it later
                                varField.CanCrunch = false;
                            }
                        }
                    }
                }

                // if the parser settings has a list of no-rename names, then we will want to also mark any
                // fields that match and are still slated to rename as uncrunchable so they won't get renamed.
                // if the settings say we're not going to renaming anything automatically (KeepAll), then we 
                // have nothing to do.
                if (Settings.LocalRenaming != LocalRenaming.KeepAll)
                {
                    foreach (var noRename in Settings.NoAutoRenameCollection)
                    {
                        // don't rename outer fields (only actual fields), 
                        // and we're only concerned with fields that can still
                        // be automatically renamed. If the field is all that AND is listed in
                        // the collection, set the CanCrunch to false
                        JSVariableField varField;
                        if (NameTable.TryGetValue(noRename, out varField)
                            && varField.OuterField == null
                            && varField.CanCrunch)
                        {
                            // no, we don't want to crunch this field
                            varField.CanCrunch = false;
                        }
                    }
                }
            }
        }

        #endregion

        #region crunching methods

        internal void ValidateGeneratedNames()
        {
            // check all the variables defined within this scope.
            // we're looking for uncrunched generated fields.
            foreach (JSVariableField variableField in NameTable.Values)
            {
                if (variableField.IsGenerated
                    && variableField.CrunchedName == null)
                {
                    // we need to rename this field.
                    // first we need to walk all the child scopes depth-first
                    // looking for references to this field. Once we find a reference,
                    // we then need to add all the other variables referenced in those
                    // scopes and all above them (from here) so we know what names we
                    // can't use.
                    var avoidTable = new HashSet<string>();
                    GenerateAvoidList(avoidTable, variableField.Name);

                    // now that we have our avoid list, create a crunch enumerator from it
                    CrunchEnumerator crunchEnum = new CrunchEnumerator(avoidTable);

                    // and use it to generate a new name
                    variableField.CrunchedName = crunchEnum.NextName();
                }
            }

            // recursively traverse through our children
            foreach (ActivationObject scope in ChildScopes)
            {
                if (!scope.Existing)
                {
                    scope.ValidateGeneratedNames();
                }
            }
        }

        private bool GenerateAvoidList(HashSet<string> table, string name)
        {
            // our reference flag is based on what was passed to us
            bool isReferenced = false;

            // depth first, so walk all the children
            foreach (ActivationObject childScope in ChildScopes)
            {
                // if any child returns true, then it or one of its descendents
                // reference this variable. So we reference it, too
                if (childScope.GenerateAvoidList(table, name))
                {
                    // we'll return true because we reference it
                    isReferenced = true;
                }
            }

            if (!isReferenced)
            {
                // none of our children reference the scope, so see if we do
                isReferenced = NameTable.ContainsKey(name);
            }

            if (isReferenced)
            {
                // if we reference the name or are in line to reference the name,
                // we need to add all the variables we reference to the list
                foreach (var variableField in NameTable.Values)
                {
                    table.Add(variableField.ToString());
                }
            }

            // return whether or not we are in the reference chain
            return isReferenced;
        }

        internal virtual void AutoRenameFields()
        {
            // if we're not known at compile time, then we can't crunch
            // the local variables in this scope, because we can't know if
            // something will reference any of it at runtime.
            // eval is something that will make the scope unknown because we
            // don't know what eval will evaluate to until runtime
            if (m_isKnownAtCompileTime)
            {
                // get an array of all the uncrunched local variables defined in this scope
                var localFields = GetUncrunchedLocals();
                if (localFields != null)
                {
                    // create a crunch-name enumerator, taking into account any fields within our
                    // scope that have already been crunched.
                    var avoidSet = new HashSet<string>();
                    foreach (var field in NameTable.Values)
                    {
                        // if the field can't be crunched, or if it can but we've already crunched it,
                        // or if it's an outer variable (that hasn't been generated) and its OWNING scope isn't known 
                        // (and therefore we CANNOT crunch it),
                        // then add it to the avoid list so we don't reuse that name
                        if (!field.CanCrunch || field.CrunchedName != null
                            || (field.OuterField != null && !field.IsGenerated && field.OwningScope != null && !field.OwningScope.IsKnownAtCompileTime))
                        {
                            avoidSet.Add(field.ToString());
                        }
                    }

                    var crunchEnum = new CrunchEnumerator(avoidSet);
                    foreach (var localField in localFields)
                    {
                        // if we are an unambiguous reference to a named function expression and we are not
                        // referenced by anyone else, then we can just skip this variable because the
                        // name will be stripped from the output anyway.
                        // we also always want to crunch "placeholder" fields.
                        if (localField.CanCrunch
                            && (localField.RefCount > 0 || localField.IsDeclared || localField.IsPlaceholder
                            || !(Settings.RemoveFunctionExpressionNames && Settings.IsModificationAllowed(TreeModifications.RemoveFunctionExpressionNames))))
                        {
                            localField.CrunchedName = crunchEnum.NextName();
                        }
                    }
                }
            }

            // then traverse through our children
            foreach (ActivationObject scope in ChildScopes)
            {
                scope.AutoRenameFields();
            }
        }

        internal IEnumerable<JSVariableField> GetUncrunchedLocals()
        {
            // there can't be more uncrunched fields than total fields
            var list = new List<JSVariableField>(NameTable.Count);
            foreach (var variableField in NameTable.Values)
            {
                // if the field is defined in this scope and hasn't been crunched
                // AND can still be crunched AND wasn't removed during the optimization process
                if (variableField != null && variableField.OuterField == null && variableField.CrunchedName == null
                    && variableField.CanCrunch && !variableField.WasRemoved)
                {
                    // if local renaming is not crunch all, then it must be crunch all but localization
                    // (we don't get called if we aren't crunching anything). 
                    // SO for the first clause:
                    // IF we are crunch all, we're good; but if we aren't crunch all, then we're only good if
                    //    the name doesn't start with "L_".
                    // The second clause is only computed IF we already think we're good to go.
                    // IF we aren't preserving function names, then we're good. BUT if we are, we're
                    // only good to go if this field doesn't represent a function object.
                    if ((Settings.LocalRenaming == LocalRenaming.CrunchAll
                        || !variableField.Name.StartsWith("L_", StringComparison.Ordinal))
                        && !(Settings.PreserveFunctionNames && variableField.IsFunction))
                    {
                        list.Add(variableField);
                    }
                }
            }

            if (list.Count == 0)
            {
                return null;
            }

            // sort the array and return it
            list.Sort(ReferenceComparer.Instance);
            return list;
        }

        #endregion

        #region field-management methods

        public virtual JSVariableField this[string name]
        {
            get
            {
                JSVariableField variableField;
                // check to see if this name is already defined in this scope
                if (!NameTable.TryGetValue(name, out variableField))
                {
                    // not in this scope
                    variableField = null;
                }
                return variableField;
            }
        }

        /// <summary>
        /// See if the given name will resolve to a field; do not create any inner fields
        /// or unknown global fields along the way.
        /// </summary>
        /// <param name="name">name to resolve</param>
        /// <returns>an existing resolved field, or null if nothing exists</returns>
        public JSVariableField CanReference(string name)
        {
            // check for this scope.
            var variableField = this[name];

            // if we didn't find anything, go up the chain until we find something.
            if (variableField == null)
            {
                var parentScope = this.Parent;
                while (parentScope != null && variableField == null)
                {
                    variableField = parentScope[name];
                    parentScope = parentScope.Parent;
                }
            }

            return variableField;
        }

        /// <summary>
        /// Resolve the name in this scope, or go up the chain adding inner fields
        /// along the way until the final reference is found, creating an unknown global
        /// field if necessary.
        /// </summary>
        /// <param name="name">name to resolve</param>
        /// <returns>resolved variable field (should never be null)</returns>
        public JSVariableField FindReference(string name)
        {
            // see if we have it
            var variableField = this[name];

            // if we didn't find anything and this scope has a parent
            if (variableField == null && name != null)
            {
                // if this is the super reference and we have one....
                if (string.CompareOrdinal(name, "super") == 0 && this.HasSuperBinding)
                {
                    variableField = new JSVariableField(FieldType.Super, name, 0, null);
                    NameTable.Add(name, variableField);
                }
                else if (this.Parent != null)
                {
                    // recursively go up the scope chain to find a reference,
                    // then create an inner field to point to it and we'll return
                    // that one.
                    variableField = CreateInnerField(this.Parent.FindReference(name));

                    // mark it as a placeholder. we might be going down a chain of scopes,
                    // where we will want to reserve the variable name, but not actually reference it.
                    // at the end where it is actually referenced we will reset the flag.
                    variableField.IsPlaceholder = true;
                }
                else
                {
                    // must be global scope. the field is undefined!
                    variableField = AddField(new JSVariableField(FieldType.UndefinedGlobal, name, 0, null));
                }
            }

            return variableField;
        }

        public virtual JSVariableField DeclareField(string name, object value, FieldAttributes attributes)
        {
            JSVariableField variableField;
            if (!NameTable.TryGetValue(name, out variableField))
            {
                variableField = CreateField(name, value, attributes);
                AddField(variableField);
            }
            return variableField;
        }

        public virtual JSVariableField CreateField(JSVariableField outerField)
        {
            // use the same type as the outer field by default
            return outerField.IfNotNull(o => new JSVariableField(o.FieldType, o));
        }

        public abstract JSVariableField CreateField(string name, object value, FieldAttributes attributes);

        public virtual JSVariableField CreateInnerField(JSVariableField outerField)
        {
            JSVariableField innerField = null;
            if (outerField != null)
            {
                // create a new inner field to be added to our scope
                innerField = CreateField(outerField);
                AddField(innerField);
            }

            return innerField;
        }

        internal JSVariableField AddField(JSVariableField variableField)
        {
            // add it to our name table 
            NameTable[variableField.Name] = variableField;

            // set the owning scope to this is we are the outer field, or the outer field's
            // owning scope if this is an inner field
            variableField.OwningScope = variableField.OuterField == null ? this : variableField.OuterField.OwningScope;
            return variableField;
        }

        public INameDeclaration VarDeclaredName(string name)
        {
            // check each var-decl name from inside this scope
            foreach (var varDecl in this.VarDeclaredNames)
            {
                // if the name matches, return the field
                if (string.CompareOrdinal(varDecl.Name, name) == 0)
                {
                    return varDecl;
                }
            }

            // if we get here, we didn't find a match
            return null;
        }

        public INameDeclaration LexicallyDeclaredName(string name)
        {
            // check each var-decl name from inside this scope
            foreach (var lexDecl in this.LexicallyDeclaredNames)
            {
                // if the name matches, return the field
                if (string.CompareOrdinal(lexDecl.Name, name) == 0)
                {
                    return lexDecl;
                }
            }

            // if we get here, we didn't find a match
            return null;
        }

        public void AddGlobal(string name)
        {
            // first, go up to the global scope
            var scope = this;
            while (scope.Parent != null)
            {
                scope = scope.Parent;
            }

            // now see if there is a field with that name already; 
            // will return a non-null field object if there is.
            var field = scope[name];
            if (field == null)
            {
                // nothing with this name. Add it as a global field
                scope.AddField(scope.CreateField(name, null, 0));
            }
        }

        #endregion
    }
}