// jsparser.cs
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
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Reflection;

namespace Microsoft.Ajax.Utilities
{
    public enum ScriptVersion
    {
        None = 0,
        EcmaScript5,
        EcmaScript6,
    }

    /// <summary>
    /// Class used to parse JavaScript source code into an abstract syntax tree.
    /// </summary>
    [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1506:AvoidExcessiveClassCoupling")]
    public class JSParser
    {
        #region private fields

        private static bool[] s_skippableTokens = InitializeSkippableTokens();

        private GlobalScope m_globalScope;
        private JSScanner m_scanner;
        private Context m_currentToken;

        private bool m_newModule;

        private CodeSettings m_settings;// = null;

        private bool m_foundEndOfLine;
        private IList<Context> m_importantComments;

        private Dictionary<string, LabelInfo> m_labelInfo;

        #endregion

        #region private properties

        private Context CurrentPositionContext
        {
            get
            {
                return m_currentToken.FlattenToStart();
            }
        }

        #endregion

        #region public properties

        // we're going to copy the debug lookups from the settings passed to us,
        // then use this collection, because we might programmatically add more
        // as we process the code, and we don't want to change the settings object.
        public ICollection<string> DebugLookups { get; private set; }

        public ScriptVersion ParsedVersion { get; private set; }

        public CodeSettings Settings
        {
            get
            {
                // if it's null....
                if (m_settings == null)
                {
                    // just use the default settings
                    m_settings = new CodeSettings();
                }
                return m_settings;
            }
            set
            {
                // if setting null, use the default settings object
                m_settings = value ?? new CodeSettings();
            }
        }

        /// <summary>
        /// Gets or sets a TextWriter instance to which raw preprocessed input will be
        /// written when Parse is called.
        /// </summary>
        public TextWriter EchoWriter { get; set; }

        public GlobalScope GlobalScope
        {
            get
            {
                // if we don't have one yet, create a new one
                if (m_globalScope == null)
                {
                    m_globalScope = new GlobalScope(m_settings);
                }

                return m_globalScope;
            }
            set
            {
                // if we are setting the global scope, we are using a shared global scope.
                m_globalScope = value;

                // mark all existing child scopes as existing so we don't go through
                // them again and re-optimize
                if (m_globalScope != null)
                {
                    foreach (var childScope in m_globalScope.ChildScopes)
                    {
                        childScope.Existing = true;
                    }
                }
            }
        }

        /// <summary>
        /// Gets the array of timing points from a Parse run
        /// </summary>
        private long[] m_timingPoints;
        public IList<long> TimingPoints { get { return m_timingPoints; } }

        #endregion

        #region public events

        /// <summary>
        /// Event sent whenever an error or warning is encountered during parsing
        /// </summary>
        public event EventHandler<ContextErrorEventArgs> CompilerError;

        /// <summary>
        /// Sent for undefined references found during parsing
        /// </summary>
        public event EventHandler<UndefinedReferenceEventArgs> UndefinedReference;

        #endregion

        #region public constructor

        /// <summary>
        /// Creates an instance of the JavaScript parser object
        /// </summary>
        public JSParser()
        {
            m_importantComments = new List<Context>();
            m_labelInfo = new Dictionary<string, LabelInfo>();
        }

        /// <summary>
        /// Creates an instance of the JSParser class that can be used to parse the given source code.
        /// </summary>
        /// <param name="source">Source code to parse.</param>
        [Obsolete("This Constructor will be removed in version 6. Please use the default constructor.", false)]
        public JSParser(string source) : this()
        {
            // set the source now using an empty context
            SetDocumentContext(new DocumentContext(source));
        }

        #endregion

        #region public methods

        /// <summary>
        /// Parse the given source context into an abstract syntax tree
        /// </summary>
        /// <param name="sourceContext">source code with context</param>
        /// <returns>a Block object representing the series of statements in abstract syntax tree form</returns>
        public Block Parse(DocumentContext sourceContext)
        {
            SetDocumentContext(sourceContext);

            // if a settings object hasn't been set yet, create a default settings object now
            if (m_settings == null)
            {
                m_settings = new CodeSettings();
            }

            // clear out some collections in case there was stuff left over from
            // a previous parse run
            m_importantComments.Clear();
            m_labelInfo.Clear();

            return InternalParse();
        }

        /// <summary>
        /// Parse the given source with context into an abstract syntax tree using the given settings
        /// </summary>
        /// <param name="sourceContext">source code with context</param>
        /// <param name="settings">settings to use for the parse operation</param>
        /// <returns>a Block object representing the series of statements in abstract syntax tree form</returns>
        public Block Parse(DocumentContext sourceContext, CodeSettings settings)
        {
            this.Settings = settings;
            return Parse(sourceContext);
        }

        /// <summary>
        /// Parse the given source into an abstract syntax tree with no context
        /// </summary>
        /// <param name="source">source code with no context</param>
        /// <returns>a Block object representing the series of statements in abstract syntax tree form</returns>
        public Block Parse(string source)
        {
            return Parse(new DocumentContext(source));
        }

        /// <summary>
        /// Parse the given source into an abstract syntax tree using the given settings
        /// </summary>
        /// <param name="source">source code to parse</param>
        /// <param name="settings">settings to use for the parse operation</param>
        /// <returns>a Block object representing the series of statements in abstract syntax tree form</returns>
        public Block Parse(string source, CodeSettings settings)
        {
            this.Settings = settings;
            return Parse(source);
        }

        /// <summary>
        /// Parse the source code using the given settings, getting back an abstract syntax tree Block node as the root
        /// representing the list of statements in the source code.
        /// </summary>
        /// <param name="settings">code settings to use to process the source code</param>
        /// <returns>root Block node representing the top-level statements</returns>
        [Obsolete("This method will be removed in version 6. Please use the default constructor and use a Parse override that is passed the source.", false)]
        public Block Parse(CodeSettings settings)
        {
            if (m_scanner == null)
            {
                throw new InvalidOperationException(JScript.NoSource);
            }

            // initialize the scanner with our settings
            // make sure the RawTokens setting is OFF or we won't be able to create our AST
            // save the settings
            // if we are passed null, just create a default settings object
            m_settings = settings = settings ?? new CodeSettings();

            return InternalParse();
        }

        #endregion

        #region common parse entry point

        /// <summary>
        /// Parse the document source using the scanner and settings that have all been set up already
        /// through various combinations of constructor/properties/Parse methods.
        /// </summary>
        /// <returns>Parsed Block node</returns>
        private Block InternalParse()
        {
            // if the settings list is not null, use it to initialize a new list
            // with the same settings. If it is null, initialize an empty list 
            // because we already determined that we want to strip debug statements,
            // and the scanner might add items to the list as it scans the source.
            DebugLookups = new HashSet<string>(m_settings.DebugLookupCollection);

            // pass our list to the scanner -- it might add more as we encounter special comments
            m_scanner.DebugLookupCollection = DebugLookups;

            m_scanner.AllowEmbeddedAspNetBlocks = m_settings.AllowEmbeddedAspNetBlocks;
            m_scanner.IgnoreConditionalCompilation = m_settings.IgnoreConditionalCompilation;

            // set any defines
            m_scanner.UsePreprocessorDefines = !m_settings.IgnorePreprocessorDefines;
            if (m_scanner.UsePreprocessorDefines)
            {
                m_scanner.SetPreprocessorDefines(m_settings.PreprocessorValues);
            }

            // if we want to strip debug statements, let's also strip ///#DEBUG comment
            // blocks for legacy reasons. ///#DEBUG will get stripped ONLY is this
            // flag is true AND the name "DEBUG" is not in the preprocessor defines.
            // Alternately, we will keep those blocks in the output is this flag is
            // set to false OR we define "DEBUG" in the preprocessor defines.
            m_scanner.StripDebugCommentBlocks = m_settings.StripDebugStatements;

            // assume ES5 unless we find ES6-specific constructs
            ParsedVersion = ScriptVersion.EcmaScript5;

            // make sure we initialize the global scope's strict mode to our flag, whether or not it
            // is true. This means if the setting is false, we will RESET the flag to false if we are 
            // reusing the scope and a previous Parse call had code that set it to strict with a 
            // program directive. 
            GlobalScope.UseStrict = m_settings.StrictMode;

            // make sure the global scope knows about our known global names
            GlobalScope.SetAssumedGlobals(m_settings);

            // start of a new module
            m_newModule = true;

            var timePoints = m_timingPoints = new long[9];
            var timeIndex = timePoints.Length;
            var stopWatch = new Stopwatch();
            stopWatch.Start();

            // get the first token.
            GetNextToken();

            Block scriptBlock = null;
            Block returnBlock = null;
            switch (m_settings.SourceMode)
            {
                case JavaScriptSourceMode.Program:
                    // simply parse a block of statements.
                    // however, when parsing this block, we mght determine it's really part of
                    // a larger structure, and we could return a different block that we would need
                    // to continue processing.
                    scriptBlock = returnBlock = ParseStatements(new Block(CurrentPositionContext)
                        {
                            EnclosingScope = this.GlobalScope
                        });
                    break;

                case JavaScriptSourceMode.Module:
                    // an implicit module as referenced by an import statement.
                    // create a root block with the global scope, add a module with its module body,
                    // then parse the input as statements into the module body.
                    returnBlock = scriptBlock = new Block(CurrentPositionContext)
                        {
                            EnclosingScope = this.GlobalScope
                        };
                    var module = new ModuleDeclaration(CurrentPositionContext)
                        {
                            IsImplicit = true,
                            Body = new Block(CurrentPositionContext)
                                {
                                    IsModule = true
                                }
                        };
                    scriptBlock.Append(module);

                    // we just created an implicit ES6 module, so we are already parsing as ES6
                    ParsedVersion = ScriptVersion.EcmaScript6;

                    // we don't need to worry about this function returning a different block, because
                    // we've already created the module structure.
                    ParseStatements(module.Body);
                    break;

                case JavaScriptSourceMode.Expression:
                    // create a block, get the first token, add in the parse of a single expression, 
                    // and we'll go fron there.
                    returnBlock = scriptBlock = new Block(CurrentPositionContext)
                        {
                            EnclosingScope = this.GlobalScope
                        };
                    try
                    {
                        var expr = ParseExpression();
                        if (expr != null)
                        {
                            scriptBlock.Append(expr);
                            scriptBlock.UpdateWith(expr.Context);
                        }
                    }
                    catch (EndOfStreamException)
                    {
                        Debug.WriteLine("EOF");
                    }
                    break;

                case JavaScriptSourceMode.EventHandler:
                    // we're going to create the global block, add in a function expression with a single
                    // parameter named "event", and then we're going to parse the input as the body of that
                    // function expression. We're going to resolve the global block, but only return the body
                    // of the function.
                    scriptBlock = new Block(CurrentPositionContext)
                        {
                            EnclosingScope = this.GlobalScope
                        };

                    var parameters = new AstNodeList(CurrentPositionContext);
                    parameters.Append(new ParameterDeclaration(CurrentPositionContext)
                        {
                            Binding = new BindingIdentifier(CurrentPositionContext)
                            {
                                Name = "event",
                                RenameNotAllowed = true
                            }
                        });

                    var funcExpression = new FunctionObject(CurrentPositionContext)
                        {
                            FunctionType = FunctionType.Expression,
                            ParameterDeclarations = parameters,
                            Body = new Block(CurrentPositionContext)
                        };
                    scriptBlock.Append(funcExpression);
                    ParseFunctionBody(funcExpression.Body);

                    // but we ONLY want to return the body
                    returnBlock = funcExpression.Body;
                    break;

                default:
                    Debug.Fail("Unexpected source mode enumeration");
                    return null;
            }

            timePoints[--timeIndex] = stopWatch.ElapsedTicks;

            // resolve everything
            ResolutionVisitor.Apply(scriptBlock, GlobalScope, this);
            timePoints[--timeIndex] = stopWatch.ElapsedTicks;

            if (Settings.AmdSupport)
            {
                // we're doing some AMD support. At this time, walk through the top-level
                // statements and if there are any duplicate define(name... calls, remove all
                // but the last one.
                RemoveDuplicateDefines(scriptBlock);
            }

            if (scriptBlock != null && Settings.MinifyCode && !Settings.PreprocessOnly)
            {
                // this visitor doesn't just reorder scopes. It also combines the adjacent var variables,
                // unnests blocks, identifies prologue directives, and sets the strict mode on scopes. 
                ReorderScopeVisitor.Apply(scriptBlock, this);

                timePoints[--timeIndex] = stopWatch.ElapsedTicks;

                // analyze the entire node tree (needed for hypercrunch)
                // root to leaf (top down)
                var analyzeVisitor = new AnalyzeNodeVisitor(this);
                scriptBlock.Accept(analyzeVisitor);

                timePoints[--timeIndex] = stopWatch.ElapsedTicks;

                // analyze the scope chain (also needed for hypercrunch)
                // root to leaf (top down)
                GlobalScope.AnalyzeScope();

                timePoints[--timeIndex] = stopWatch.ElapsedTicks;

                // if we want to crunch any names....
                if (m_settings.LocalRenaming != LocalRenaming.KeepAll
                    && m_settings.IsModificationAllowed(TreeModifications.LocalRenaming))
                {
                    // then do a top-down traversal of the scope tree. For each field that had not
                    // already been crunched (globals and outers will already be crunched), crunch
                    // the name with a crunch iterator that does not use any names in the verboten set.
                    GlobalScope.AutoRenameFields();
                }

                timePoints[--timeIndex] = stopWatch.ElapsedTicks;

                // if we want to evaluate literal expressions, do so now
                if (m_settings.EvalLiteralExpressions)
                {
                    var visitor = new EvaluateLiteralVisitor(this);
                    scriptBlock.Accept(visitor);
                }

                timePoints[--timeIndex] = stopWatch.ElapsedTicks;

                // make the final cleanup pass
                FinalPassVisitor.Apply(scriptBlock, m_settings);

                timePoints[--timeIndex] = stopWatch.ElapsedTicks;

                // we want to walk all the scopes to make sure that any generated
                // variables that haven't been crunched have been assigned valid
                // variable names that don't collide with any existing variables.
                GlobalScope.ValidateGeneratedNames();

                timePoints[--timeIndex] = stopWatch.ElapsedTicks;
                stopWatch.Stop();
            }

            // mark all child scopes under the global scope as existing so we don't go and re-optimize
            // them again should we parse another piece of source code using the same parser
            foreach (var childScope in GlobalScope.ChildScopes)
            {
                childScope.Existing = true;
            }

            // if the return block is not the entire script block, then we don't want to include
            // any thing we must've generated in the process of building our code. Take the scope
            // from the parent, but break the tree relationship.
            if (returnBlock != scriptBlock)
            {
                returnBlock.EnclosingScope = returnBlock.Parent.EnclosingScope;
                returnBlock.Parent = null;
            }

            return returnBlock;
        }

        /// <summary>
        /// Remove duplicate define calls, defined as defines with the same module name specified as the first
        /// parameter, if it's a string literal. Only the last define with a given name is preserved.
        /// </summary>
        /// <param name="scriptBlock">script block to remove defines from; not recursed</param>
        private static void RemoveDuplicateDefines(Block scriptBlock)
        {
            var defines = new HashSet<string>();

            // walk backwards so we keep the last one
            for(var ndx = scriptBlock.Count - 1; ndx >= 0; --ndx)
            {
                var callNode = scriptBlock[ndx] as CallNode;
                if (callNode != null)
                {
                    if (callNode.Function.IsGlobalNamed("define") 
                        && callNode.Arguments.IfNotNull(args => args.Count) > 0)
                    {
                        var firstArg = callNode.Arguments[0] as ConstantWrapper;
                        if (firstArg != null && firstArg.PrimitiveType == PrimitiveType.String)
                        {
                            var moduleName = firstArg.ToString();
                            if (!defines.Add(moduleName))
                            {
                                // couldn't add the name to the set -- must be a dupe!
                                // remove it altogether
                                scriptBlock.RemoveAt(ndx);
                            }
                        }
                    }
                }
            }
        }

        #endregion

        #region event methods

        internal void OnUndefinedReference(UndefinedReference ex)
        {
            if (UndefinedReference != null)
            {
                UndefinedReference(this, new UndefinedReferenceEventArgs(ex));
            }
        }

        internal void OnCompilerError(ContextError se)
        {
            if (CompilerError != null && !m_settings.IgnoreAllErrors)
            {
                // format the error code
                if (m_settings != null && !m_settings.IgnoreErrorCollection.Contains(se.ErrorCode))
                {
                    CompilerError(this, new ContextErrorEventArgs()
                        {
                            Error = se
                        });
                }
            }
        }

        #endregion

        #region ParseStatements

        //---------------------------------------------------------------------------------------
        // ParseStatements
        //
        // statements :
        //   <empty> |
        //   statement statements
        //
        //---------------------------------------------------------------------------------------
        private Block ParseStatements(Block block)
        {
            // by default we should return the block we were passed in.
            // the only time we might return a different block is if we decide later on if
            // this block is really an implicit module body, in which case we will return a
            // different block that contains the module declaration with the passed-in block
            // as the body.
            var returnBlock = block;
            try
            {
                var possibleDirectivePrologue = true;
                int lastEndPosition = m_currentToken.EndPosition;
                while (m_currentToken.IsNot(JSToken.EndOfFile))
                {
                    AstNode ast = null;
                    // parse a statement -- pass true because we really want a SourceElement,
                    // which is a Statement OR a FunctionDeclaration. Technically, FunctionDeclarations
                    // are not statements!
                    ast = ParseStatement(true);

                    // if we are still possibly looking for directive prologues
                    if (possibleDirectivePrologue)
                    {
                        var constantWrapper = ast as ConstantWrapper;
                        if (constantWrapper != null && constantWrapper.PrimitiveType == PrimitiveType.String)
                        {
                            if (!(constantWrapper is DirectivePrologue))
                            {
                                // use a directive prologue node instead
                                ast = new DirectivePrologue(constantWrapper.Value.ToString(), ast.Context)
                                    {
                                        MayHaveIssues = constantWrapper.MayHaveIssues
                                    };
                            }
                        }
                        else if (!m_newModule)
                        {
                            // nope -- no longer finding directive prologues
                            possibleDirectivePrologue = false;
                        }
                    }
                    else if (m_newModule)
                    {
                        // we aren't looking for directive prologues anymore, but we did scan
                        // into a new module after that last AST, so reset the flag because that
                        // new module might have directive prologues for next time
                        possibleDirectivePrologue = true;
                    }

                    if (ast != null)
                    {
                        // append the statement to the program
                        block.Append(ast);

                        // if this was an export statement, then we know the block as a module.
                        // if we didn't know that before, then we have some conversion to take
                        // care of.
                        if (ast is ExportNode && !block.IsModule)
                        {
                            // this block will be the module body
                            block.IsModule = true;

                            // should only happen if we are processing a root program
                            if (block.Parent == null)
                            {
                                // create a new block that has the global scope and remove the
                                // global scope from this block
                                returnBlock = new Block(block.Context.Clone())
                                    {
                                        EnclosingScope = block.EnclosingScope
                                    };
                                block.EnclosingScope = null;

                                // add a new implicit module declaration to the new global block, with the block
                                // we've been processing as its body. we'll return the new global block.
                                returnBlock.Append(new ModuleDeclaration(new Context(m_currentToken.Document))
                                    {
                                        IsImplicit = true,
                                        Body = block,
                                    });
                            }
                        }

                        // set the last end position to be the start of the current token.
                        // if we parse the next statement and the end is still the start, we know
                        // something is up and might get into an infinite loop.
                        lastEndPosition = m_currentToken.EndPosition;
                    }
                    else if (!m_scanner.IsEndOfFile && m_currentToken.StartLinePosition == lastEndPosition)
                    {
                        // didn't parse a statement, we're not at the EOF, and we didn't move
                        // anywhere in the input stream. If we just keep looping around, we're going
                        // to get into an infinite loop. Break it.
                        m_currentToken.HandleError(JSError.ApplicationError, true);
                        break;
                    }
                }

                AppendImportantComments(block);

            }
            catch (EndOfStreamException)
            {
                // we're done
            }

            block.UpdateWith(CurrentPositionContext);
            return returnBlock;
        }

        //---------------------------------------------------------------------------------------
        // ParseStatement
        //
        //  OptionalStatement:
        //    Statement |
        //    <empty>
        //
        //  Statement :
        //    Block |
        //  VariableStatement |
        //  EmptyStatement |
        //  ExpressionStatement |
        //  IfStatement |
        //  IterationStatement |
        //  ContinueStatement |
        //  BreakStatement |
        //  ReturnStatement |
        //  WithStatement |
        //  LabeledStatement |
        //  SwitchStatement |
        //  ThrowStatement |
        //  TryStatement |
        //  FunctionDeclaration
        //
        // IterationStatement :
        //    'for' '(' ForLoopControl ')' |                  ===> ForStatement
        //    'do' Statement 'while' '(' Expression ')' |     ===> DoStatement
        //    'while' '(' Expression ')' Statement            ===> WhileStatement
        //
        //---------------------------------------------------------------------------------------

        // ParseStatement deals with the end of statement issue (EOL vs ';') so if any of the
        // ParseXXX routine does it as well, it should return directly from the switch statement
        // without any further execution in the ParseStatement
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1502:AvoidExcessiveComplexity")]
        private AstNode ParseStatement(bool fSourceElement, bool skipImportantComment = false)
        {
            AstNode statement = null;

            // if we want to skip important comments, now is a good time to clear anything we may 
            // have picked up already.
            if (skipImportantComment)
            {
                m_importantComments.Clear();
            }

            if (m_importantComments.Count > 0
                && m_settings.PreserveImportantComments
                && m_settings.IsModificationAllowed(TreeModifications.PreserveImportantComments))
            {
                // we have at least one important comment before the upcoming statement.
                // pop the first important comment off the queue, return that node instead.
                // don't advance the token -- we'll probably be coming back again for the next one (if any)
                statement = new ImportantComment(m_importantComments[0]);
                m_importantComments.RemoveAt(0);
            }
            else
            {
                switch (m_currentToken.Token)
                {
                    case JSToken.EndOfFile:
                        ReportError(JSError.ErrorEndOfFile);
                        return null; // abort parsing, get back to the main parse routine

                    case JSToken.Semicolon:
                        // make an empty statement
                        statement = new EmptyStatement(m_currentToken.Clone());
                        GetNextToken();
                        return statement;

                    case JSToken.RightCurly:
                        ReportError(JSError.SyntaxError);
                        GetNextToken();
                        break;

                    case JSToken.LeftCurly:
                        return ParseBlock();

                    case JSToken.Debugger:
                        return ParseDebuggerStatement();

                    case JSToken.Var:
                    case JSToken.Const:
                    case JSToken.Let:
                        return ParseVariableStatement();

                    case JSToken.If:
                        return ParseIfStatement();

                    case JSToken.For:
                        return ParseForStatement();

                    case JSToken.Do:
                        return ParseDoStatement();

                    case JSToken.While:
                        return ParseWhileStatement();

                    case JSToken.Continue:
                        return ParseContinueStatement();

                    case JSToken.Break:
                        return ParseBreakStatement();

                    case JSToken.Return:
                        return ParseReturnStatement();

                    case JSToken.With:
                        return ParseWithStatement();

                    case JSToken.Switch:
                        return ParseSwitchStatement();

                    case JSToken.Throw:
                        return ParseThrowStatement();

                    case JSToken.Try:
                        return ParseTryStatement();

                    case JSToken.Function:
                        // parse a function declaration
                        var function = ParseFunction(FunctionType.Declaration, m_currentToken.Clone());
                        function.IsSourceElement = fSourceElement;
                        return function;

                    case JSToken.Class:
                        return ParseClassNode(ClassType.Declaration);

                    case JSToken.Else:
                        ReportError(JSError.InvalidElse);
                        GetNextToken();
                        break;

                    case JSToken.ConditionalCommentStart:
                        return ParseStatementLevelConditionalComment(fSourceElement);

                    case JSToken.ConditionalCompilationOn:
                        var ccOn = new ConditionalCompilationOn(m_currentToken.Clone());
                        GetNextToken();
                        return ccOn;

                    case JSToken.ConditionalCompilationSet:
                        return ParseConditionalCompilationSet();

                    case JSToken.ConditionalCompilationIf:
                        return ParseConditionalCompilationIf(false);

                    case JSToken.ConditionalCompilationElseIf:
                        return ParseConditionalCompilationIf(true);

                    case JSToken.ConditionalCompilationElse:
                        var elseStatement = new ConditionalCompilationElse(m_currentToken.Clone());
                        GetNextToken();
                        return elseStatement;

                    case JSToken.ConditionalCompilationEnd:
                        var endStatement = new ConditionalCompilationEnd(m_currentToken.Clone());
                        GetNextToken();
                        return endStatement;

                    case JSToken.Import:
                        // import can't be an identifier name, so it must be an import statement
                        return ParseImport();

                    case JSToken.Export:
                        // export can't be an identifier name, so it must be an export statement
                        return ParseExport();

                    case JSToken.Identifier:
                        if (m_currentToken.Is("module"))
                        {
                            goto case JSToken.Module;
                        }
                        goto default;

                    case JSToken.Module:
                        if (PeekCanBeModule())
                        {
                            return ParseModule();
                        }
                        goto default;

                    default:
                        statement = ParseExpressionStatement(fSourceElement);
                        break;
                }
            }

            return statement;
        }

        private AstNode ParseExpressionStatement(bool fSourceElement)
        {
            bool bAssign;
            var isNewModule = m_newModule;
            var statement = ParseUnaryExpression(out bAssign, false);
            if (statement != null)
            {
                // look for labels
                var lookup = statement as Lookup;
                if (lookup != null && m_currentToken.Is(JSToken.Colon))
                {
                    statement = ParseLabeledStatement(lookup, fSourceElement);
                }
                else
                {
                    // finish off the expression using the unary as teh starting point
                    statement = ParseExpression(statement, false, bAssign, JSToken.None);

                    // if we just started a new module and this statement happens to be an expression statement...
                    if (isNewModule && statement.IsExpression)
                    {
                        // see if it's a constant wrapper
                        var constantWrapper = statement as ConstantWrapper;
                        if (constantWrapper != null && constantWrapper.PrimitiveType == PrimitiveType.String)
                        {
                            // we found a string constant expression statement right after the start of a new
                            // module. Let's make it a DirectivePrologue if it isn't already
                            if (!(statement is DirectivePrologue))
                            {
                                statement = new DirectivePrologue(constantWrapper.Value.ToString(), constantWrapper.Context)
                                {
                                    MayHaveIssues = constantWrapper.MayHaveIssues
                                };
                            }
                        }
                    }

                    var binaryOp = statement as BinaryOperator;
                    if (binaryOp != null
                        && (binaryOp.OperatorToken == JSToken.Equal || binaryOp.OperatorToken == JSToken.StrictEqual))
                    {
                        // an expression statement with equality operator? Doesn't really do anything.
                        // Did the developer intend this to be an assignment operator instead? Low-pri warning.
                        binaryOp.OperatorContext.IfNotNull(c => c.HandleError(JSError.SuspectEquality, false));
                    }

                    lookup = statement as Lookup;
                    if (lookup != null
                        && lookup.Name.StartsWith("<%=", StringComparison.Ordinal) && lookup.Name.EndsWith("%>", StringComparison.Ordinal))
                    {
                        // single lookup, but it's actually one or more ASP.NET blocks.
                        // convert back to an asp.net block node
                        statement = new AspNetBlockNode(statement.Context)
                        {
                            AspNetBlockText = lookup.Name
                        };
                    }

                    var aspNetBlock = statement as AspNetBlockNode;
                    if (aspNetBlock != null && m_currentToken.Is(JSToken.Semicolon))
                    {
                        aspNetBlock.IsTerminatedByExplicitSemicolon = true;
                        statement.IfNotNull(s => s.TerminatingContext = m_currentToken.Clone());
                        GetNextToken();
                    }

                    // we just parsed an expression statement. Now see if we have an appropriate
                    // semicolon to terminate it.
                    ExpectSemicolon(statement);
                }
            }
            else
            {
                // couldn't parse a statement and couldn't parse an expression; skip it
                // TODO: error node?
                GetNextToken();
            }

            return statement;
        }

        private LabeledStatement ParseLabeledStatement(Lookup lookup, bool fSourceElement)
        {
            // can be a label
            var id = lookup.Name;
            var colonContext = m_currentToken.Clone();

            LabelInfo labelInfo;
            var removeInfo = true;
            if (m_labelInfo.TryGetValue(id, out labelInfo))
            {
                // already exists! throw an error and mark this label as having an error
                labelInfo.HasIssues = true;
                removeInfo = false;
                lookup.Context.HandleError(JSError.BadLabel, true);
            }
            else
            {
                // zero-based nest level corresponds to how many labels we are working with
                // so far. and a zero reference count
                labelInfo = new LabelInfo { NestLevel = m_labelInfo.Count, RefCount = 0 };
                m_labelInfo.Add(id, labelInfo);
            }

            GetNextToken();
            LabeledStatement labeledStatement;
            if (m_currentToken.IsNot(JSToken.EndOfFile))
            {
                // ignore any important comments between the label and its statement
                // because important comments are treated like statements, and we want
                // to make sure the label is attached to the right REAL statement.
                labeledStatement = new LabeledStatement(lookup.Context.Clone())
                {
                    Label = id,
                    LabelContext = lookup.Context,
                    LabelInfo = labelInfo,
                    ColonContext = colonContext,
                    Statement = ParseStatement(fSourceElement, true)
                };
            }
            else
            {
                // end of the file!
                // just pass null for the labeled statement
                labeledStatement = new LabeledStatement(lookup.Context.Clone())
                {
                    Label = id,
                    LabelContext = lookup.Context,
                    LabelInfo = labelInfo,
                    ColonContext = colonContext,
                };
            }

            if (removeInfo)
            {
                m_labelInfo.Remove(id);
            }

            return labeledStatement;
        }

        private AstNode ParseStatementLevelConditionalComment(bool fSourceElement)
        {
            Context context = m_currentToken.Clone();
            ConditionalCompilationComment conditionalComment = new ConditionalCompilationComment(context);

            GetNextToken();
            while (m_currentToken.IsNot(JSToken.ConditionalCommentEnd) && m_currentToken.IsNot(JSToken.EndOfFile))
            {
                // if we get ANOTHER start token, it's superfluous and we should ignore it.
                // otherwise parse another statement and keep going
                if (m_currentToken.Is(JSToken.ConditionalCommentStart))
                {
                    GetNextToken();
                }
                else
                {
                    conditionalComment.Append(ParseStatement(fSourceElement));
                }
            }

            GetNextToken();

            // if the conditional comment is empty (for whatever reason), then
            // we don't want to return anything -- we found nothing.
            return conditionalComment.Statements.Count > 0 ? conditionalComment : null;
        }

        private ConditionalCompilationSet ParseConditionalCompilationSet()
        {
            Context context = m_currentToken.Clone();
            string variableName = null;
            AstNode value = null;
            GetNextToken();
            if (m_currentToken.Is(JSToken.ConditionalCompilationVariable))
            {
                context.UpdateWith(m_currentToken);
                variableName = m_currentToken.Code;
                GetNextToken();
                if (m_currentToken.Is(JSToken.Assign))
                {
                    context.UpdateWith(m_currentToken);
                    GetNextToken();
                    value = ParseExpression(false);
                    if (value != null)
                    {
                        context.UpdateWith(value.Context);
                    }
                    else
                    {
                        m_currentToken.HandleError(JSError.ExpressionExpected);
                    }
                }
                else
                {
                    m_currentToken.HandleError(JSError.NoEqual);
                }
            }
            else
            {
                m_currentToken.HandleError(JSError.NoIdentifier);
            }

            return new ConditionalCompilationSet(context)
                {
                    VariableName = variableName,
                    Value = value
                };
        }

        private ConditionalCompilationStatement ParseConditionalCompilationIf(bool isElseIf)
        {
            Context context = m_currentToken.Clone();
            AstNode condition = null;
            GetNextToken();
            if (m_currentToken.Is(JSToken.LeftParenthesis))
            {
                context.UpdateWith(m_currentToken);
                GetNextToken();
                condition = ParseExpression(false);
                if (condition != null)
                {
                    context.UpdateWith(condition.Context);
                }
                else
                {
                    m_currentToken.HandleError(JSError.ExpressionExpected);
                }

                if (m_currentToken.Is(JSToken.RightParenthesis))
                {
                    context.UpdateWith(m_currentToken);
                    GetNextToken();
                }
                else
                {
                    m_currentToken.HandleError(JSError.NoRightParenthesis);
                }
            }
            else
            {
                m_currentToken.HandleError(JSError.NoLeftParenthesis);
            }

            if (isElseIf)
            {
                return new ConditionalCompilationElseIf(context)
                    {
                        Condition = condition
                    };
            }

            return new ConditionalCompilationIf(context)
                {
                    Condition = condition
                };
        }

        //---------------------------------------------------------------------------------------
        // ParseBlock
        //
        //  Block :
        //    '{' OptionalStatements '}'
        //---------------------------------------------------------------------------------------
        private Block ParseBlock()
        {
            // set the force-braces property to true because we are assuming this is only called
            // when we encounter a left-brace and we will want to keep it going forward. If we are optimizing
            // the code, we will reset these properties as we encounter them so that unneeded curly-braces 
            // can be removed.
            Block codeBlock = new Block(m_currentToken.Clone())
                {
                    ForceBraces = true
                };
            codeBlock.BraceOnNewLine = m_foundEndOfLine;
            GetNextToken();

            while (m_currentToken.IsNot(JSToken.RightCurly) && m_currentToken.IsNot(JSToken.EndOfFile))
            {
                // pass false because we really only want Statements, and FunctionDeclarations
                // are technically not statements. We'll still handle them, but we'll issue a warning.
                codeBlock.Append(ParseStatement(false));
            }

            // make sure any important comments before the closing brace are kept
            AppendImportantComments(codeBlock);

            if (m_currentToken.IsNot(JSToken.RightCurly))
            {
                ReportError(JSError.NoRightCurly);
                if (m_currentToken.Is(JSToken.EndOfFile))
                {
                    ReportError(JSError.ErrorEndOfFile);
                }
            }

            codeBlock.TerminatingContext = m_currentToken.Clone();
            // update the block context
            codeBlock.Context.UpdateWith(m_currentToken);
            GetNextToken();
            return codeBlock;
        }

        //---------------------------------------------------------------------------------------
        // ParseDebuggerStatement
        //
        //  DebuggerStatement :
        //    'debugger'
        //
        // This function may return a null AST under error condition. The caller should handle
        // that case.
        // Regardless of error conditions, on exit the parser points to the first token after
        // the debugger statement
        //---------------------------------------------------------------------------------------
        private AstNode ParseDebuggerStatement()
        {
            // clone the current context and skip it
            var node = new DebuggerNode(m_currentToken.Clone());
            GetNextToken();

            // this token can only be a stand-alone statement
            ExpectSemicolon(node);

            // return the new AST object
            return node;
        }

        //---------------------------------------------------------------------------------------
        // ParseVariableStatement
        //
        //  VariableStatement :
        //    'var' VariableDeclarationList
        //    or
        //    'const' VariableDeclarationList
        //    or
        //    'let' VariableDeclarationList
        //
        //  VariableDeclarationList :
        //    VariableDeclaration |
        //    VariableDeclaration ',' VariableDeclarationList
        //
        //  VariableDeclaration :
        //    Binding |
        //    Binding Initializer
        //
        //  Initializer :
        //    <empty> |
        //    '=' AssignmentExpression
        //---------------------------------------------------------------------------------------
        private AstNode ParseVariableStatement()
        {
            // create the appropriate statement: var- or const-statement
            Declaration varList;
            if (m_currentToken.Is(JSToken.Var))
            {
                varList = new Var(m_currentToken.Clone())
                    {
                        StatementToken = m_currentToken.Token,
                        KeywordContext = m_currentToken.Clone()
                    };
            }
            else if (m_currentToken.IsEither(JSToken.Const, JSToken.Let))
            {
                if (m_currentToken.Is(JSToken.Const) && m_settings.ConstStatementsMozilla)
                {
                    varList = new ConstStatement(m_currentToken.Clone())
                        {
                            StatementToken = m_currentToken.Token,
                            KeywordContext = m_currentToken.Clone()
                        };
                }
                else
                {
                    // this is EcmaScript6-specific statement
                    ParsedVersion = ScriptVersion.EcmaScript6;
                    varList = new LexicalDeclaration(m_currentToken.Clone())
                        {
                            StatementToken = m_currentToken.Token,
                            KeywordContext = m_currentToken.Clone()
                        };
                }
            }
            else
            {
                Debug.Fail("shouldn't get here");
                return null;
            }

            do
            {
                GetNextToken();
                var varDecl = ParseVarDecl(JSToken.None);
                if (varDecl != null)
                {
                    varList.Append(varDecl);
                    varList.Context.UpdateWith(varDecl.Context);
                }
            }
            while (m_currentToken.Is(JSToken.Comma));

            ExpectSemicolon(varList);
            return varList;
        }

        private VariableDeclaration ParseVarDecl(JSToken inToken)
        {
            Context context = m_currentToken.Clone();
            VariableDeclaration varDecl = null;
            var binding = ParseBinding();
            if (binding != null)
            {
                Context assignContext = null;
                AstNode initializer = null;

                bool ccSpecialCase = false;
                bool ccOn = false;

                if (m_currentToken.Is(JSToken.ConditionalCommentStart))
                {
                    ccSpecialCase = true;

                    GetNextToken();
                    if (m_currentToken.Is(JSToken.ConditionalCompilationOn))
                    {
                        GetNextToken();
                        if (m_currentToken.Is(JSToken.ConditionalCommentEnd))
                        {
                            // forget about it; just ignore the whole thing because it's empty
                            ccSpecialCase = false;
                        }
                        else
                        {
                            ccOn = true;
                        }
                    }
                }

                if (m_currentToken.IsEither(JSToken.Assign, JSToken.Equal))
                {
                    assignContext = m_currentToken.Clone();
                    if (m_currentToken.Is(JSToken.Equal))
                    {
                        ReportError(JSError.NoEqual);
                    }

                    // move past the equals sign
                    GetNextToken();
                    if (m_currentToken.Is(JSToken.ConditionalCommentEnd))
                    {
                        // so we have var id/*@ =@*/ or var id//@=<EOL>
                        // we only support the equal sign inside conditional comments IF
                        // the initializer value is there as well.
                        ccSpecialCase = false;
                        m_currentToken.HandleError(JSError.ConditionalCompilationTooComplex);
                        GetNextToken();
                    }

                    initializer = ParseExpression(true, inToken);
                    if (null != initializer)
                    {
                        context.UpdateWith(initializer.Context);
                    }
                }
                else if (ccSpecialCase)
                {
                    // so we have "var id /*@" or "var id //@", but the next character is NOT an equal sign.
                    // we don't support this structure, either.
                    ccSpecialCase = false;
                    m_currentToken.HandleError(JSError.ConditionalCompilationTooComplex);

                    // skip to end of conditional comment
                    while (m_currentToken.IsNot(JSToken.EndOfFile) && m_currentToken.IsNot(JSToken.ConditionalCommentEnd))
                    {
                        GetNextToken();
                    }
                    GetNextToken();
                }

                // if the current token is not an end-of-conditional-comment token now,
                // then we're not in our special case scenario
                if (m_currentToken.Is(JSToken.ConditionalCommentEnd))
                {
                    GetNextToken();
                }
                else if (ccSpecialCase)
                {
                    // we have "var id/*@=expr" but the next token is not the closing comment.
                    // we don't support this structure, either.
                    ccSpecialCase = false;
                    m_currentToken.HandleError(JSError.ConditionalCompilationTooComplex);

                    // the assignment expression was apparently within the conditional compilation
                    // comment, but we're going to ignore it. So clear it out.
                    initializer = null;

                    // skip to end of conditional comment
                    while (m_currentToken.IsNot(JSToken.EndOfFile) && m_currentToken.IsNot(JSToken.ConditionalCommentEnd))
                    {
                        GetNextToken();
                    }
                    GetNextToken();
                }

                varDecl = new VariableDeclaration(context)
                    {
                        Binding = binding,
                        AssignContext = assignContext,
                        Initializer = initializer,
                        IsCCSpecialCase = ccSpecialCase,
                        UseCCOn = ccOn
                    };
            }

            return varDecl;
        }

        //---------------------------------------------------------------------------------------
        // ParseBinding
        //
        //  Does the real work of parsing a single binding.
        //  inToken is JSToken.In whenever the potential expression that initialize a variable
        //  cannot contain an 'in', as in the for statement. inToken is JSToken.None otherwise
        //---------------------------------------------------------------------------------------
        private AstNode ParseBinding()
        {
            AstNode binding = null;
            if (m_currentToken.Is(JSToken.Identifier))
            {
                binding = new BindingIdentifier(m_currentToken.Clone())
                    {
                        Name = m_scanner.Identifier
                    };
                GetNextToken();
            }
            else if (m_currentToken.Is(JSToken.LeftBracket))
            {
                ParsedVersion = ScriptVersion.EcmaScript6;
                binding = ParseArrayLiteral(true);
            }
            else if (m_currentToken.Is(JSToken.LeftCurly))
            {
                ParsedVersion = ScriptVersion.EcmaScript6;
                binding = ParseObjectLiteral(true);
            }
            else
            {
                var identifier = JSKeyword.CanBeIdentifier(m_currentToken.Token);
                if (null != identifier)
                {
                    binding = new BindingIdentifier(m_currentToken.Clone())
                        {
                            Name = identifier
                        };
                    GetNextToken();
                }
                else if (JSScanner.IsValidIdentifier(identifier = m_currentToken.Code))
                {
                    // it's probably just a keyword
                    ReportError(JSError.NoIdentifier);
                    binding = new BindingIdentifier(m_currentToken.Clone())
                        {
                            Name = identifier
                        };
                    GetNextToken();
                }
                else
                {
                    ReportError(JSError.NoIdentifier);
                    return null;
                }
            }

            return binding;
        }

        //---------------------------------------------------------------------------------------
        // ParseIfStatement
        //
        //  IfStatement :
        //    'if' '(' Expression ')' Statement ElseStatement
        //
        //  ElseStatement :
        //    <empty> |
        //    'else' Statement
        //---------------------------------------------------------------------------------------
        private IfNode ParseIfStatement()
        {
            Context ifCtx = m_currentToken.Clone();
            AstNode condition = null;
            AstNode trueBranch = null;
            AstNode falseBranch = null;
            Context elseCtx = null;

            // parse condition
            GetNextToken();
            if (m_currentToken.IsNot(JSToken.LeftParenthesis))
            {
                ReportError(JSError.NoLeftParenthesis);
            }
            else
            {
                // skip the opening paren
                GetNextToken();
            }

            // get the condition
            condition = ParseExpression();

            // parse statements
            if (m_currentToken.Is(JSToken.RightParenthesis))
            {
                ifCtx.UpdateWith(m_currentToken);
                GetNextToken();
            }
            else
            {
                condition.IfNotNull(c => ifCtx.UpdateWith(c.Context));
                ReportError(JSError.NoRightParenthesis);
            }

            // if this is an assignment, throw a warning in case the developer
            // meant to use == instead of =
            // but no warning if the condition is wrapped in parens.
            var binOp = condition as BinaryOperator;
            if (binOp != null && binOp.OperatorToken == JSToken.Assign)
            {
                condition.Context.HandleError(JSError.SuspectAssignment);
            }

            if (m_currentToken.Is(JSToken.Semicolon))
            {
                // if the next token is just a .semicolon, that's weird to have
                // an empty true-block. flag a low-sev warning
                m_currentToken.HandleError(JSError.SuspectSemicolon);
            }
            else if (m_currentToken.IsNot(JSToken.LeftCurly))
            {
                // if the statements aren't withing curly-braces, throw a possible error
                ReportError(JSError.StatementBlockExpected, CurrentPositionContext);
            }

            // parse a Statement, not a SourceElement
            // and ignore any important comments that spring up right here.
            trueBranch = ParseStatement(false, true);
            if (trueBranch != null)
            {
                ifCtx.UpdateWith(trueBranch.Context);
            }

            // parse else, if any
            if (m_currentToken.Is(JSToken.Else))
            {
                elseCtx = m_currentToken.Clone();
                GetNextToken();
                if (m_currentToken.Is(JSToken.Semicolon))
                {
                    // again, an empty else-block is kinda weird.
                    m_currentToken.HandleError(JSError.SuspectSemicolon);
                }
                else if (m_currentToken.IsNot(JSToken.LeftCurly) && m_currentToken.IsNot(JSToken.If))
                {
                    // if the statements aren't withing curly-braces (or start another if-statement), throw a possible error
                    ReportError(JSError.StatementBlockExpected, CurrentPositionContext);
                }

                // parse a Statement, not a SourceElement
                // and ignore any important comments that spring up right here.
                falseBranch = ParseStatement(false, true);
                if (falseBranch != null)
                {
                    ifCtx.UpdateWith(falseBranch.Context);
                }
            }

            return new IfNode(ifCtx)
                {
                    Condition = condition,
                    TrueBlock = AstNode.ForceToBlock(trueBranch),
                    ElseContext = elseCtx,
                    FalseBlock = AstNode.ForceToBlock(falseBranch)
                };
        }

        //---------------------------------------------------------------------------------------
        // ParseForStatement
        //
        //  ForStatement :
        //    'for' '(' OptionalExpressionNoIn ';' OptionalExpression ';' OptionalExpression ')'
        //    'for' '(' 'var' VariableDeclarationListNoIn ';' OptionalExpression ';' OptionalExpression ')'
        //    'for' '(' LeftHandSideExpression 'in' Expression')'
        //    'for' '(' 'var' Identifier OptionalInitializerNoIn 'in' Expression')'
        //
        //  OptionalExpressionNoIn :
        //    <empty> |
        //    ExpressionNoIn // same as Expression but does not process 'in' as an operator
        //
        //  OptionalInitializerNoIn :
        //    <empty> |
        //    InitializerNoIn // same as initializer but does not process 'in' as an operator
        //---------------------------------------------------------------------------------------
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1502:AvoidExcessiveComplexity")]
        private AstNode ParseForStatement()
        {
            AstNode forNode = null;
            Context forCtx = m_currentToken.Clone();
            GetNextToken();
            if (m_currentToken.Is(JSToken.LeftParenthesis))
            {
                GetNextToken();
            }
            else
            {
                ReportError(JSError.NoLeftParenthesis);
            }

            AstNode initializer = null, condOrColl = null, increment = null;
            Context operatorContext = null;
            Context separator1Context = null;
            Context separator2Context = null;

            if (m_currentToken.IsOne(JSToken.Var, JSToken.Let, JSToken.Const))
            {
                Declaration declaration;
                if (m_currentToken.Is(JSToken.Var))
                {
                    declaration = new Var(m_currentToken.Clone())
                        {
                            StatementToken = m_currentToken.Token,
                            KeywordContext = m_currentToken.Clone()
                        };
                }
                else
                {
                    ParsedVersion = ScriptVersion.EcmaScript6;
                    declaration = new LexicalDeclaration(m_currentToken.Clone())
                        {
                            StatementToken = m_currentToken.Token,
                            KeywordContext = m_currentToken.Clone()
                        };
                }

                GetNextToken();
                declaration.Append(ParseVarDecl(JSToken.In));

                while (m_currentToken.Is(JSToken.Comma))
                {
                    // a list of variable initializers is ONLY allowed in a for(;;) statement,
                    // so we now know we are NOT a for..in or for..of statement.
                    GetNextToken();
                    declaration.Append(ParseVarDecl(JSToken.In));
                    //initializer = new Comma(initializer.context.CombineWith(var.context), initializer, var);
                }

                initializer = declaration;
            }
            else if (m_currentToken.IsNot(JSToken.Semicolon))
            {
                // not a declaration (var, const, let), so parse an expression with the no-in target
                initializer = ParseExpression(false, JSToken.In);
            }

            // either we are at a semicolon or an in/of token
            var isForIn = m_currentToken.Is(JSToken.In) || m_currentToken.Is("of");
            if (isForIn)
            {
                // this IS a for..in or for..of statement
                if (m_currentToken.IsNot(JSToken.In))
                {
                    ParsedVersion = ScriptVersion.EcmaScript6;
                }

                operatorContext = m_currentToken.Clone();
                GetNextToken();

                // parse the collection expression
                condOrColl = ParseExpression();
            }
            else
            {
                // NOT a for..in/for..of; this is a for(;;) statement
                if (m_currentToken.Is(JSToken.Semicolon))
                {
                    separator1Context = m_currentToken.Clone();
                    GetNextToken();
                }
                else
                {
                    ReportError(JSError.NoSemicolon);
                }

                if (m_currentToken.IsNot(JSToken.Semicolon))
                {
                    condOrColl = ParseExpression();
                }

                if (m_currentToken.Is(JSToken.Semicolon))
                {
                    separator2Context = m_currentToken.Clone();
                    GetNextToken();
                }
                else
                {
                    ReportError(JSError.NoSemicolon);
                }

                if (m_currentToken.IsNot(JSToken.RightParenthesis))
                {
                    increment = ParseExpression();
                }
            }

            if (m_currentToken.Is(JSToken.RightParenthesis))
            {
                forCtx.UpdateWith(m_currentToken);
                GetNextToken();
            }
            else
            {
                ReportError(JSError.NoRightParenthesis);
            }

            // if the statements aren't withing curly-braces, throw a possible error
            if (m_currentToken.IsNot(JSToken.LeftCurly))
            {
                ReportError(JSError.StatementBlockExpected, CurrentPositionContext);
            }

            // parse a Statement, not a SourceElement
            // and ignore any important comments that spring up right here.
            var body = ParseStatement(false, true);
            if (isForIn)
            {
                forNode = new ForIn(forCtx)
                    {
                        Variable = initializer,
                        OperatorContext = operatorContext,
                        Collection = condOrColl,
                        Body = AstNode.ForceToBlock(body),
                    };
            }
            else
            {
                // if the condition is an assignment, throw a warning in case the developer
                // meant to use == instead of =
                // but no warning if the condition is wrapped in parens.
                var binOp = condOrColl as BinaryOperator;
                if (binOp != null && binOp.OperatorToken == JSToken.Assign)
                {
                    condOrColl.Context.HandleError(JSError.SuspectAssignment);
                }

                forNode = new ForNode(forCtx)
                    {
                        Initializer = initializer,
                        Separator1Context = separator1Context,
                        Condition = condOrColl,
                        Separator2Context = separator2Context,
                        Incrementer = increment,
                        Body = AstNode.ForceToBlock(body)
                    };
            }

            return forNode;
        }

        //---------------------------------------------------------------------------------------
        // ParseDoStatement
        //
        //  DoStatement:
        //    'do' Statement 'while' '(' Expression ')'
        //---------------------------------------------------------------------------------------
        private DoWhile ParseDoStatement()
        {
            var doCtx = m_currentToken.Clone();
            Context whileContext = null;
            Context terminatorContext = null;
            AstNode body = null;
            AstNode condition = null;

            // skip the do-token
            GetNextToken();

            // if the statements aren't withing curly-braces, throw a possible error
            if (m_currentToken.IsNot(JSToken.LeftCurly))
            {
                ReportError(JSError.StatementBlockExpected, CurrentPositionContext);
            }

            // parse a Statement, not a SourceElement
            // and ignore any important comments that spring up right here.
            body = ParseStatement(false, true);

            if (m_currentToken.IsNot(JSToken.While))
            {
                ReportError(JSError.NoWhile);
            }
            else
            {
                whileContext = m_currentToken.Clone();
                doCtx.UpdateWith(whileContext);
                GetNextToken();
            }

            if (m_currentToken.IsNot(JSToken.LeftParenthesis))
            {
                ReportError(JSError.NoLeftParenthesis);
            }
            else
            {
                GetNextToken();
            }

            // catch here so the body of the do_while is not thrown away
            condition = ParseExpression();
            if (m_currentToken.IsNot(JSToken.RightParenthesis))
            {
                ReportError(JSError.NoRightParenthesis);
                doCtx.UpdateWith(condition.Context);
            }
            else
            {
                doCtx.UpdateWith(m_currentToken);
                GetNextToken();
            }

            if (m_currentToken.Is(JSToken.Semicolon))
            {
                // JScript 5 allowed statements like
                //   do{print(++x)}while(x<10) print(0)
                // even though that does not strictly follow the automatic semicolon insertion
                // rules for the required semi after the while().  For backwards compatibility
                // we should continue to support this.
                terminatorContext = m_currentToken.Clone();
                GetNextToken();
            }

            // if this is an assignment, throw a warning in case the developer
            // meant to use == instead of =
            // but no warning if the condition is wrapped in parens.
            var binOp = condition as BinaryOperator;
            if (binOp != null && binOp.OperatorToken == JSToken.Assign)
            {
                condition.Context.HandleError(JSError.SuspectAssignment);
            }

            return new DoWhile(doCtx)
                {
                    Body = AstNode.ForceToBlock(body),
                    WhileContext = whileContext,
                    Condition = condition,
                    TerminatingContext = terminatorContext
                };
        }

        //---------------------------------------------------------------------------------------
        // ParseWhileStatement
        //
        //  WhileStatement :
        //    'while' '(' Expression ')' Statement
        //---------------------------------------------------------------------------------------
        private WhileNode ParseWhileStatement()
        {
            Context whileCtx = m_currentToken.Clone();
            AstNode condition = null;
            AstNode body = null;

            GetNextToken();
            if (m_currentToken.IsNot(JSToken.LeftParenthesis))
            {
                ReportError(JSError.NoLeftParenthesis);
            }
            else
            {
                GetNextToken();
            }

            condition = ParseExpression();
            if (m_currentToken.IsNot(JSToken.RightParenthesis))
            {
                ReportError(JSError.NoRightParenthesis);
                whileCtx.UpdateWith(condition.Context);
            }
            else
            {
                whileCtx.UpdateWith(m_currentToken);
                GetNextToken();
            }

            // if this is an assignment, throw a warning in case the developer
            // meant to use == instead of =
            // but no warning if the condition is wrapped in parens.
            var binOp = condition as BinaryOperator;
            if (binOp != null && binOp.OperatorToken == JSToken.Assign)
            {
                condition.Context.HandleError(JSError.SuspectAssignment);
            }

            // if the statements aren't withing curly-braces, throw a possible error
            if (m_currentToken.IsNot(JSToken.LeftCurly))
            {
                ReportError(JSError.StatementBlockExpected, CurrentPositionContext);
            }

            // parse a Statement, not a SourceElement
            // and ignore any important comments that spring up right here.
            body = ParseStatement(false, true);

            return new WhileNode(whileCtx)
                {
                    Condition = condition,
                    Body = AstNode.ForceToBlock(body)
                };
        }

        //---------------------------------------------------------------------------------------
        // ParseContinueStatement
        //
        //  ContinueStatement :
        //    'continue' OptionalLabel
        //
        //  OptionalLabel :
        //    <empty> |
        //    Identifier
        //
        // This function may return a null AST under error condition. The caller should handle
        // that case.
        // Regardless of error conditions, on exit the parser points to the first token after
        // the continue statement
        //---------------------------------------------------------------------------------------
        private ContinueNode ParseContinueStatement()
        {
            var continueNode = new ContinueNode(m_currentToken.Clone());
            GetNextToken();

            string label = null;
            if (!m_foundEndOfLine && (m_currentToken.Is(JSToken.Identifier) || (label = JSKeyword.CanBeIdentifier(m_currentToken.Token)) != null))
            {
                continueNode.UpdateWith(m_currentToken);
                continueNode.LabelContext = m_currentToken.Clone();
                continueNode.Label = label ?? m_scanner.Identifier;

                // see if the label is already known
                LabelInfo labelInfo;
                if (m_labelInfo.TryGetValue(continueNode.Label, out labelInfo))
                {
                    // increment the refcount so we know this label is referenced
                    // and save a reference to the label info in this node.
                    ++labelInfo.RefCount;
                    continueNode.LabelInfo = labelInfo;
                }
                else
                {
                    // no such label!
                    continueNode.LabelContext.HandleError(JSError.NoLabel, true);
                }

                GetNextToken();
            }

            ExpectSemicolon(continueNode);
            return continueNode;
        }

        //---------------------------------------------------------------------------------------
        // ParseBreakStatement
        //
        //  BreakStatement :
        //    'break' OptionalLabel
        //
        // This function may return a null AST under error condition. The caller should handle
        // that case.
        // Regardless of error conditions, on exit the parser points to the first token after
        // the break statement.
        //---------------------------------------------------------------------------------------
        private Break ParseBreakStatement()
        {
            var breakNode = new Break(m_currentToken.Clone());
            GetNextToken();

            string label = null;
            if (!m_foundEndOfLine && (m_currentToken.Is(JSToken.Identifier) || (label = JSKeyword.CanBeIdentifier(m_currentToken.Token)) != null))
            {
                breakNode.UpdateWith(m_currentToken);
                breakNode.LabelContext = m_currentToken.Clone();
                breakNode.Label = label ?? m_scanner.Identifier;

                // see if the label is already known
                LabelInfo labelInfo;
                if (m_labelInfo.TryGetValue(breakNode.Label, out labelInfo))
                {
                    // increment the refcount so we know this label is referenced
                    // and save a reference to the label info in this node.
                    ++labelInfo.RefCount;
                    breakNode.LabelInfo = labelInfo;
                }
                else
                {
                    // no such label!
                    breakNode.LabelContext.HandleError(JSError.NoLabel, true);
                }

                GetNextToken();
            }

            ExpectSemicolon(breakNode);
            return breakNode;
        }

        //---------------------------------------------------------------------------------------
        // ParseReturnStatement
        //
        //  ReturnStatement :
        //    'return' Expression
        //
        // This function may return a null AST under error condition. The caller should handle
        // that case.
        // Regardless of error conditions, on exit the parser points to the first token after
        // the return statement.
        //---------------------------------------------------------------------------------------
        private ReturnNode ParseReturnStatement()
        {
            var returnNode = new ReturnNode(m_currentToken.Clone());
            GetNextToken();

            // CAN'T have a line-break between the "return" and its expression.
            if (!m_foundEndOfLine)
            {
                if (m_currentToken.IsNot(JSToken.Semicolon) && m_currentToken.IsNot(JSToken.RightCurly))
                {
                    returnNode.Operand = ParseExpression();
                    if (returnNode.Operand != null)
                    {
                        returnNode.UpdateWith(returnNode.Operand.Context);
                    }
                }

                ExpectSemicolon(returnNode);
            }
            else
            {
                // but we did find a line-break -- semicolon-insertion rules have kicked in
                ReportError(JSError.SemicolonInsertion, returnNode.Context.FlattenToEnd());
            }

            return returnNode;
        }

        //---------------------------------------------------------------------------------------
        // ParseWithStatement
        //
        //  WithStatement :
        //    'with' '(' Expression ')' Statement
        //---------------------------------------------------------------------------------------
        private WithNode ParseWithStatement()
        {
            Context withCtx = m_currentToken.Clone();
            AstNode obj = null;

            GetNextToken();
            if (m_currentToken.IsNot(JSToken.LeftParenthesis))
            {
                ReportError(JSError.NoLeftParenthesis);
            }
            else
            {
                GetNextToken();
            }

            obj = ParseExpression();
            if (m_currentToken.IsNot(JSToken.RightParenthesis))
            {
                withCtx.UpdateWith(obj.Context);
                ReportError(JSError.NoRightParenthesis);
            }
            else
            {
                withCtx.UpdateWith(m_currentToken);
                GetNextToken();
            }

            // if the statements aren't withing curly-braces, throw a possible error
            if (m_currentToken.IsNot(JSToken.LeftCurly))
            {
                ReportError(JSError.StatementBlockExpected, CurrentPositionContext);
            }

            // parse a Statement, not a SourceElement
            // and ignore any important comments that spring up right here.
            var statement = ParseStatement(false, true);

            return new WithNode(withCtx)
                {
                    WithObject = obj,
                    Body = AstNode.ForceToBlock(statement)
                };
        }

        //---------------------------------------------------------------------------------------
        // ParseSwitchStatement
        //
        //  SwitchStatement :
        //    'switch' '(' Expression ')' '{' CaseBlock '}'
        //
        //  CaseBlock :
        //    CaseList DefaultCaseClause CaseList
        //
        //  CaseList :
        //    <empty> |
        //    CaseClause CaseList
        //
        //  CaseClause :
        //    'case' Expression ':' OptionalStatements
        //
        //  DefaultCaseClause :
        //    <empty> |
        //    'default' ':' OptionalStatements
        //---------------------------------------------------------------------------------------
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1502:AvoidExcessiveComplexity")]
        private AstNode ParseSwitchStatement()
        {
            Context switchCtx = m_currentToken.Clone();
            AstNode expr = null;
            AstNodeList cases = null;
            var braceOnNewLine = false;
            Context braceContext = null;

            // read switch(expr)
            GetNextToken();
            if (m_currentToken.IsNot(JSToken.LeftParenthesis))
            {
                ReportError(JSError.NoLeftParenthesis);
            }
            else
            {
                GetNextToken();
            }

            expr = ParseExpression();

            if (m_currentToken.IsNot(JSToken.RightParenthesis))
            {
                ReportError(JSError.NoRightParenthesis);
            }
            else
            {
                GetNextToken();
            }

            if (m_currentToken.IsNot(JSToken.LeftCurly))
            {
                ReportError(JSError.NoLeftCurly);
            }
            else
            {
                braceOnNewLine = m_foundEndOfLine;
                braceContext = m_currentToken.Clone();
                GetNextToken();
            }

            // parse the switch body
            cases = new AstNodeList(CurrentPositionContext);
            bool defaultStatement = false;
            while (m_currentToken.IsNot(JSToken.RightCurly))
            {
                SwitchCase caseClause = null;
                AstNode caseValue = null;
                var caseCtx = m_currentToken.Clone();
                Context colonContext = null;
                if (m_currentToken.Is(JSToken.Case))
                {
                    // get the case
                    GetNextToken();
                    caseValue = ParseExpression();
                }
                else if (m_currentToken.Is(JSToken.Default))
                {
                    // get the default
                    if (defaultStatement)
                    {
                        // we report an error but we still accept the default
                        ReportError(JSError.DupDefault);
                    }
                    else
                    {
                        defaultStatement = true;
                    }
                    GetNextToken();
                }
                else
                {
                    // This is an error, there is no case or default. Assume a default was missing and keep going
                    defaultStatement = true;
                    ReportError(JSError.BadSwitch);
                }

                if (m_currentToken.IsNot(JSToken.Colon))
                {
                    ReportError(JSError.NoColon);
                }
                else
                {
                    colonContext = m_currentToken.Clone();
                    GetNextToken();
                }

                // read the statements inside the case or default
                var statements = new Block(m_currentToken.Clone());
                while (m_currentToken.IsNotAny(JSToken.RightCurly, JSToken.Case, JSToken.Default, JSToken.EndOfFile))
                {
                    // parse a Statement, not a SourceElement
                    statements.Append(ParseStatement(false));
                }

                caseCtx.UpdateWith(statements.Context);
                caseClause = new SwitchCase(caseCtx)
                    {
                        CaseValue = caseValue,
                        ColonContext = colonContext,
                        Statements = statements
                    };
                cases.Append(caseClause);
            }

            switchCtx.UpdateWith(m_currentToken);
            GetNextToken();

            return new Switch(switchCtx)
                {
                    Expression = expr,
                    BraceContext = braceContext,
                    Cases = cases,
                    BraceOnNewLine = braceOnNewLine
                };
        }

        //---------------------------------------------------------------------------------------
        // ParseThrowStatement
        //
        //  ThrowStatement :
        //    throw |
        //    throw Expression
        //---------------------------------------------------------------------------------------
        private AstNode ParseThrowStatement()
        {
            var throwNode = new ThrowNode(m_currentToken.Clone());
            GetNextToken();

            // cannot have a line break between "throw" and it's expression
            if (!m_foundEndOfLine)
            {
                if (m_currentToken.IsNot(JSToken.Semicolon))
                {
                    throwNode.Operand = ParseExpression();
                    if (throwNode.Operand != null)
                    {
                        throwNode.UpdateWith(throwNode.Operand.Context);
                    }
                }

                ExpectSemicolon(throwNode);
            }
            else
            {
                ReportError(JSError.SemicolonInsertion, throwNode.Context.FlattenToEnd());
            }

            return throwNode;
        }

        //---------------------------------------------------------------------------------------
        // ParseTryStatement
        //
        //  TryStatement :
        //    'try' Block Catch Finally
        //
        //  Catch :
        //    <empty> | 'catch' '(' Identifier ')' Block
        //
        //  Finally :
        //    <empty> |
        //    'finally' Block
        //---------------------------------------------------------------------------------------
        private AstNode ParseTryStatement()
        {
            Context tryCtx = m_currentToken.Clone();
            Block body = null;
            Context catchContext = null;
            ParameterDeclaration catchParameter = null;
            Block catchBlock = null;
            Context finallyContext = null;
            Block finallyBlock = null;

            bool catchOrFinally = false;
            GetNextToken();
            if (m_currentToken.IsNot(JSToken.LeftCurly))
            {
                ReportError(JSError.NoLeftCurly);
            }

            body = ParseBlock();

            if (m_currentToken.Is(JSToken.Catch))
            {
                catchOrFinally = true;
                catchContext = m_currentToken.Clone();
                GetNextToken();
                if (m_currentToken.IsNot(JSToken.LeftParenthesis))
                {
                    ReportError(JSError.NoLeftParenthesis);
                }
                else
                {
                    GetNextToken();
                }

                var catchBinding = ParseBinding();
                if (catchBinding == null)
                {
                    ReportError(JSError.NoBinding);
                }
                else
                {
                    catchParameter = new ParameterDeclaration(catchBinding.Context.Clone())
                    {
                        Binding = catchBinding
                    };
                }

                if (m_currentToken.IsNot(JSToken.RightParenthesis))
                {
                    ReportError(JSError.NoRightParenthesis);
                }
                else
                {
                    GetNextToken();
                }

                if (m_currentToken.IsNot(JSToken.LeftCurly))
                {
                    ReportError(JSError.NoLeftCurly);
                }

                // parse the block
                catchBlock = ParseBlock();

                tryCtx.UpdateWith(catchBlock.Context);
            }

            if (m_currentToken.Is(JSToken.Finally))
            {
                catchOrFinally = true;
                finallyContext = m_currentToken.Clone();
                GetNextToken();

                if (m_currentToken.IsNot(JSToken.LeftCurly))
                {
                    ReportError(JSError.NoLeftCurly);
                }

                finallyBlock = ParseBlock();
                tryCtx.UpdateWith(finallyBlock.Context);
            }

            if (!catchOrFinally)
            {
                ReportError(JSError.NoCatch);
            }

            return new TryNode(tryCtx)
                {
                    TryBlock = body,
                    CatchContext = catchContext,
                    CatchParameter = catchParameter,
                    CatchBlock = catchBlock,
                    FinallyContext = finallyContext,
                    FinallyBlock = finallyBlock
                };
        }

        private AstNode ParseModule()
        {
            // we know we're parsing an ES6 module
            ParsedVersion = ScriptVersion.EcmaScript6;
            var context = m_currentToken.Clone();
            GetNextToken();

            string moduleName = null;
            Context moduleContext = null;
            Block body = null;
            BindingIdentifier binding = null;
            Context fromContext = null;
            if (m_currentToken.Is(JSToken.StringLiteral))
            {
                if (m_foundEndOfLine)
                {
                    // throw an error, but keep on parsing
                    ReportError(JSError.NewLineNotAllowed, null, true);
                }

                moduleName = m_scanner.StringLiteralValue;
                moduleContext = m_currentToken.Clone();
                context.UpdateWith(moduleContext);
                GetNextToken();

                if (m_currentToken.IsNot(JSToken.LeftCurly))
                {
                    ReportError(JSError.NoLeftCurly);
                }
                else
                {
                    body = ParseBlock();
                    if (body != null)
                    {
                        context.UpdateWith(body.Context);
                        body.IsModule = true;
                    }
                }
            }
            else if (m_currentToken.Is(JSToken.Identifier) || JSKeyword.CanBeIdentifier(m_currentToken.Token) != null)
            {
                binding = (BindingIdentifier)ParseBinding();
                context.UpdateWith(binding.Context);

                if (m_currentToken.Is("from"))
                {
                    fromContext = m_currentToken.Clone();
                    context.UpdateWith(fromContext);
                    GetNextToken();
                }
                else
                {
                    ReportError(JSError.NoExpectedFrom);
                }

                if (m_currentToken.Is(JSToken.StringLiteral))
                {
                    moduleName = m_scanner.StringLiteralValue;
                    moduleContext = m_currentToken.Clone();
                    context.UpdateWith(moduleContext);
                    GetNextToken();
                }
                else
                {
                    ReportError(JSError.NoStringLiteral);
                }
            }
            else
            {
                ReportError(JSError.NoIdentifier);
            }

            var moduleDecl = new ModuleDeclaration(context)
                {
                    ModuleName = moduleName,
                    ModuleContext = moduleContext,
                    Body = body,
                    Binding = binding,
                    FromContext = fromContext
                };

            if (binding != null)
            {
                ExpectSemicolon(moduleDecl);
            }

            return moduleDecl;
        }

        private AstNode ParseExport()
        {
            // we know we're parsing an ES6 export
            ParsedVersion = ScriptVersion.EcmaScript6;
            var exportNode = new ExportNode(m_currentToken.Clone())
                {
                    KeywordContext = m_currentToken.Clone(),
                };
            GetNextToken();
            if (m_currentToken.IsOne(JSToken.Var, JSToken.Const, JSToken.Let, JSToken.Function, JSToken.Class))
            {
                // export var/const/let/funcdecl/classdecl
                var declaration = ParseStatement(true, true);
                if (declaration != null)
                {
                    exportNode.Append(declaration);
                }
                else
                {
                    // this shouldn't happen -- we already had the right token, so why didn't it parse???
                    // we probably already output another error, but throw a syntax error here, just in case.
                    ReportError(JSError.SyntaxError);
                }
            }
            else if (m_currentToken.Is(JSToken.Default))
            {
                // export default assignmentexpression ;
                exportNode.IsDefault = true;
                exportNode.DefaultContext = m_currentToken.Clone();
                exportNode.Context.UpdateWith(m_currentToken);
                GetNextToken();

                var expression = ParseExpression(true);
                if (expression != null)
                {
                    exportNode.Append(expression);
                }
                else
                {
                    ReportError(JSError.ExpressionExpected);
                }

                ExpectSemicolon(exportNode);
            }
            else 
            {
                if (m_currentToken.Is(JSToken.Identifier) || JSKeyword.CanBeIdentifier(m_currentToken.Token) != null)
                {
                    // export identifier ;
                    var lookup = new Lookup(m_currentToken.Clone())
                    {
                        Name = m_scanner.Identifier
                    };
                    exportNode.Append(lookup);
                    GetNextToken();
                } 
                else if (m_currentToken.Is(JSToken.Multiply))
                {
                    // export * (from "module")?
                    exportNode.OpenContext = m_currentToken.Clone();
                    exportNode.UpdateWith(exportNode.OpenContext);
                    GetNextToken();
                }
                else if (m_currentToken.Is(JSToken.LeftCurly))
                {
                    // export { specifier (, specifier)* ,? } (from "module")?
                    exportNode.OpenContext = m_currentToken.Clone();
                    exportNode.UpdateWith(exportNode.OpenContext);

                    do
                    {
                        GetNextToken();
                        if (m_currentToken.IsNot(JSToken.RightCurly))
                        {
                            string identifier = null;
                            if (m_currentToken.Is(JSToken.Identifier) || (identifier = JSKeyword.CanBeIdentifier(m_currentToken.Token)) != null)
                            {
                                var specifierContext = m_currentToken.Clone();
                                var lookup = new Lookup(m_currentToken.Clone())
                                    {
                                        Name = identifier ?? m_scanner.Identifier
                                    };
                                GetNextToken();

                                Context asContext = null;
                                Context nameContext = null;
                                string externalName = null;
                                if (m_currentToken.Is("as"))
                                {
                                    asContext = m_currentToken.Clone();
                                    specifierContext.UpdateWith(asContext);
                                    GetNextToken();

                                    externalName = m_scanner.Identifier;
                                    if (externalName != null)
                                    {
                                        nameContext = m_currentToken.Clone();
                                        specifierContext.UpdateWith(nameContext);
                                        GetNextToken();
                                    }
                                    else
                                    {
                                        ReportError(JSError.NoIdentifier);
                                    }
                                }

                                var specifier = new ImportExportSpecifier(specifierContext)
                                    {
                                        LocalIdentifier = lookup,
                                        AsContext = asContext,
                                        ExternalName = externalName,
                                        NameContext = nameContext
                                    };
                                exportNode.Append(specifier);

                                if (m_currentToken.Is(JSToken.Comma))
                                {
                                    specifier.TerminatingContext = m_currentToken.Clone();
                                }
                            }
                            else
                            {
                                ReportError(JSError.NoIdentifier);
                            }
                        }
                    }
                    while (m_currentToken.Is(JSToken.Comma));

                    if (m_currentToken.Is(JSToken.RightCurly))
                    {
                        exportNode.CloseContext = m_currentToken.Clone();
                        exportNode.UpdateWith(exportNode.CloseContext);
                        GetNextToken();
                    }
                    else
                    {
                        ReportError(JSError.NoRightCurly);
                    }
                }
                else
                {
                    ReportError(JSError.NoSpecifierSet);
                }

                if (m_currentToken.Is("from"))
                {
                    // re-exporting from another module.
                    exportNode.FromContext = m_currentToken.Clone();
                    exportNode.UpdateWith(exportNode.FromContext);
                    GetNextToken();

                    if (m_currentToken.Is(JSToken.StringLiteral))
                    {
                        exportNode.ModuleContext = m_currentToken.Clone();
                        exportNode.UpdateWith(exportNode.ModuleContext);
                        exportNode.ModuleName = m_scanner.StringLiteralValue;
                        GetNextToken();
                    }
                    else
                    {
                        ReportError(JSError.NoStringLiteral);
                    }
                }

                ExpectSemicolon(exportNode);
            }

            return exportNode;
        }

        private AstNode ParseImport()
        {
            // we know we're parsing an ES6 import
            ParsedVersion = ScriptVersion.EcmaScript6;
            var importNode = new ImportNode(m_currentToken.Clone())
                {
                    KeywordContext = m_currentToken.Clone(),
                };
            GetNextToken();
            if (m_currentToken.Is(JSToken.StringLiteral))
            {
                // import "module" ;
                importNode.ModuleName = m_scanner.StringLiteralValue;
                importNode.ModuleContext = m_currentToken.Clone();
                GetNextToken();
            }
            else
            {
                if (m_currentToken.Is(JSToken.LeftCurly))
                {
                    // import { specifier (, specifier)* ,? } from "module"
                    importNode.OpenContext = m_currentToken.Clone();
                    importNode.UpdateWith(importNode.OpenContext);

                    do
                    {
                        GetNextToken();
                        if (m_currentToken.IsNot(JSToken.RightCurly))
                        {
                            var externalName = m_scanner.Identifier;
                            if (externalName != null)
                            {
                                var nameContext = m_currentToken.Clone();
                                var specifierContext = nameContext.Clone();
                                GetNextToken();

                                Context asContext = null;
                                AstNode localIdentifier = null;
                                if (m_currentToken.Is("as"))
                                {
                                    asContext = m_currentToken.Clone();
                                    GetNextToken();

                                    if (m_currentToken.Is(JSToken.Identifier) || JSKeyword.CanBeIdentifier(m_currentToken.Token) != null)
                                    {
                                        localIdentifier = ParseBinding();
                                    }
                                    else
                                    {
                                        ReportError(JSError.NoIdentifier);
                                    }
                                }
                                else
                                {
                                    // the external name is also the local binding
                                    localIdentifier = new BindingIdentifier(nameContext)
                                        {
                                            Name = externalName
                                        };
                                    externalName = null;
                                    nameContext = null;
                                }

                                var specifier = new ImportExportSpecifier(specifierContext)
                                {
                                    ExternalName = externalName,
                                    NameContext = nameContext,
                                    AsContext = asContext,
                                    LocalIdentifier = localIdentifier,
                                };
                                importNode.Append(specifier);

                                if (m_currentToken.Is(JSToken.Comma))
                                {
                                    importNode.TerminatingContext = m_currentToken.Clone();
                                }
                            }
                            else
                            {
                                ReportError(JSError.NoIdentifier);
                            }
                        }
                    }
                    while (m_currentToken.Is(JSToken.Comma));

                    if (m_currentToken.Is(JSToken.RightCurly))
                    {
                        importNode.CloseContext = m_currentToken.Clone();
                        importNode.UpdateWith(importNode.CloseContext);
                        GetNextToken();
                    }
                    else
                    {
                        ReportError(JSError.NoRightCurly);
                    }
                }
                else if (m_currentToken.Is(JSToken.Identifier) || JSKeyword.CanBeIdentifier(m_currentToken.Token) != null)
                {
                    // import identifier from "module"
                    importNode.Append(ParseBinding());
                }

                if (m_currentToken.Is("from"))
                {
                    importNode.FromContext = m_currentToken.Clone();
                    importNode.UpdateWith(importNode.FromContext);
                    GetNextToken();
                }
                else
                {
                    ReportError(JSError.NoExpectedFrom);
                }

                if (m_currentToken.Is(JSToken.StringLiteral))
                {
                    importNode.ModuleName = m_scanner.StringLiteralValue;
                    importNode.ModuleContext = m_currentToken.Clone();
                    importNode.UpdateWith(importNode.ModuleContext);
                    GetNextToken();
                }
                else
                {
                    ReportError(JSError.NoStringLiteral);
                }
            }

            ExpectSemicolon(importNode);
            return importNode;
        }

        #endregion

        #region ParseFunction

        //---------------------------------------------------------------------------------------
        // ParseFunction
        //
        //  FunctionDeclaration :
        //    VisibilityModifier 'function' Identifier '('
        //                          FormalParameterList ')' '{' FunctionBody '}'
        //
        //  FormalParameterList :
        //    <empty> |
        //    IdentifierList Identifier
        //
        //  IdentifierList :
        //    <empty> |
        //    Identifier, IdentifierList
        //---------------------------------------------------------------------------------------
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1502:AvoidExcessiveComplexity")]
        private FunctionObject ParseFunction(FunctionType functionType, Context fncCtx)
        {
            BindingIdentifier name = null;
            AstNodeList formalParameters = null;
            Block body = null;
            bool inExpression = (functionType == FunctionType.Expression);

            // skip the opening token (function, get, or set).
            // methods will start off with no prefix -- right to the name.
            if (functionType != FunctionType.Method)
            {
                GetNextToken();
            }

            var isGenerator = m_currentToken.Is(JSToken.Multiply);
            if (isGenerator)
            {
                // skip the asterisk
                GetNextToken();
                ParsedVersion = ScriptVersion.EcmaScript6;
            }

            // get the function name or make an anonymous function if in expression "position"
            if (m_currentToken.Is(JSToken.Identifier))
            {
                name = new BindingIdentifier(m_currentToken.Clone())
                    {
                        Name = m_scanner.Identifier
                    };
                GetNextToken();
            }
            else
            {
                string identifier = JSKeyword.CanBeIdentifier(m_currentToken.Token);
                if (null != identifier)
                {
                    name = new BindingIdentifier(m_currentToken.Clone())
                        {
                            Name = identifier
                        };
                    GetNextToken();
                }
                else
                {
                    if (!inExpression)
                    {
                        // if this isn't a function expression, then we need to throw an error because
                        // function DECLARATIONS always need a valid identifier name
                        ReportError(JSError.NoIdentifier);

                        // BUT if the current token is a left paren, we don't want to use it as the name.
                        // (fix for issue #14152)
                        if (m_currentToken.IsNot(JSToken.LeftParenthesis)
                            && m_currentToken.IsNot(JSToken.LeftCurly))
                        {
                            identifier = m_currentToken.Code;
                            name = new BindingIdentifier(CurrentPositionContext)
                                {
                                    Name = identifier
                                };
                            GetNextToken();
                        }
                    }
                }
            }

            if (m_currentToken.IsNot(JSToken.LeftParenthesis))
            {
                // we expect a left paren at this point for standard cross-browser support.
                // BUT -- some versions of IE allow an object property expression to be a function name, like window.onclick. 
                // we still want to throw the error, because it syntax errors on most browsers, but we still want to
                // be able to parse it and return the intended results. 
                // Skip to the open paren and use whatever is in-between as the function name. Doesn't matter that it's 
                // an invalid identifier; it won't be accessible as a valid field anyway.
                bool expandedIndentifier = false;
                while (m_currentToken.IsNot(JSToken.LeftParenthesis)
                    && m_currentToken.IsNot(JSToken.LeftCurly)
                    && m_currentToken.IsNot(JSToken.Semicolon)
                    && m_currentToken.IsNot(JSToken.EndOfFile))
                {
                    name.Context.UpdateWith(m_currentToken);
                    GetNextToken();
                    expandedIndentifier = true;
                }

                // if we actually expanded the identifier context, then we want to report that
                // the function name needs to be an identifier. Otherwise we didn't expand the 
                // name, so just report that we expected an open paren at this point.
                if (expandedIndentifier)
                {
                    name.Name = name.Context.Code;
                    name.Context.HandleError(JSError.FunctionNameMustBeIdentifier, false);
                }
                else
                {
                    ReportError(JSError.NoLeftParenthesis);
                }
            }

            // get the formal parameters
            formalParameters = ParseFormalParameters();
            fncCtx.UpdateWith(formalParameters.IfNotNull(p => p.Context));

            // read the function body of non-abstract functions.
            if (m_currentToken.IsNot(JSToken.LeftCurly))
            {
                ReportError(JSError.NoLeftCurly);
            }

            try
            {
                // parse the block locally to get the exact end of function
                body = new Block(m_currentToken.Clone());
                body.BraceOnNewLine = m_foundEndOfLine;
                GetNextToken();

                // parse the function body statements
                ParseFunctionBody(body);

                if (m_currentToken.Is(JSToken.RightCurly))
                {
                    body.Context.UpdateWith(m_currentToken);
                    GetNextToken();
                }
                else
                {
                    if (m_currentToken.Is(JSToken.EndOfFile))
                    {
                        fncCtx.HandleError(JSError.UnclosedFunction, true);
                        ReportError(JSError.ErrorEndOfFile);
                    }
                    else
                    {
                        ReportError(JSError.NoRightCurly);
                    }
                }

                fncCtx.UpdateWith(body.Context);
            }
            catch (EndOfStreamException)
            {
                // if we get an EOF here, we never had a chance to find the closing curly-brace
                fncCtx.HandleError(JSError.UnclosedFunction, true);
            }

            return new FunctionObject(fncCtx)
                {
                    FunctionType = functionType,
                    Binding = name,
                    ParameterDeclarations = formalParameters,
                    Body = body,
                    IsGenerator = isGenerator
                };
        }

        private void ParseFunctionBody(Block body)
        {
            var possibleDirectivePrologue = true;
            while (m_currentToken.IsNot(JSToken.RightCurly)
                && m_currentToken.IsNot(JSToken.EndOfFile))
            {
                // function body's are SourceElements (Statements + FunctionDeclarations)
                var statement = ParseStatement(true);
                if (possibleDirectivePrologue)
                {
                    var constantWrapper = statement as ConstantWrapper;
                    if (constantWrapper != null && constantWrapper.PrimitiveType == PrimitiveType.String)
                    {
                        // if it's already a directive prologues, we're good to go
                        if (!(constantWrapper is DirectivePrologue))
                        {
                            // make the statement a directive prologue instead of a constant wrapper
                            statement = new DirectivePrologue(constantWrapper.Value.ToString(), constantWrapper.Context)
                            {
                                MayHaveIssues = constantWrapper.MayHaveIssues
                            };
                        }
                    }
                    else if (!m_newModule)
                    {
                        // no longer considering constant wrappers
                        possibleDirectivePrologue = false;
                    }
                }
                else if (m_newModule)
                {
                    // we scanned into a new module -- we might find directive prologues again
                    possibleDirectivePrologue = true;
                }

                // add it to the body
                body.Append(statement);
            }

            // make sure any important comments before the closing brace are kept
            AppendImportantComments(body);
        }

        private AstNodeList ParseFormalParameters()
        {
            AstNodeList formalParameters = null;
            if (m_currentToken.Is(JSToken.LeftParenthesis))
            {
                // create the parameter list
                formalParameters = new AstNodeList(m_currentToken.Clone());

                // create the list of arguments and update the context
                var token = JSToken.Comma;
                while (token == JSToken.Comma)
                {
                    ParameterDeclaration paramDecl = null;
                    GetNextToken();
                    if (m_currentToken.IsNot(JSToken.RightParenthesis))
                    {
                        Context restContext = null;
                        if (m_currentToken.Is(JSToken.RestSpread))
                        {
                            ParsedVersion = ScriptVersion.EcmaScript6;
                            restContext = m_currentToken.Clone();
                            GetNextToken();
                        }

                        var binding = ParseBinding();
                        if (binding != null)
                        {
                            paramDecl = new ParameterDeclaration(binding.Context.Clone())
                            {
                                Binding = binding,
                                Position = formalParameters.Count,
                                HasRest = restContext != null,
                                RestContext = restContext,
                            };
                            formalParameters.Append(paramDecl);
                        }
                        else
                        {
                            // We're missing an argument (or previous argument was malformed and
                            // we skipped to the comma.)  Keep trying to parse the argument list --
                            // we will skip the comma below.
                            ReportError(JSError.NoBinding);
                        }

                        // see if we have an optional default value
                        if (m_currentToken.Is(JSToken.Assign))
                        {
                            ParsedVersion = ScriptVersion.EcmaScript6;
                            paramDecl.IfNotNull(p => p.AssignContext = m_currentToken.Clone());
                            GetNextToken();

                            // parse an assignment expression
                            var initializer = ParseExpression(true);
                            paramDecl.IfNotNull(p => p.Initializer = initializer);
                        }
                    }

                    // by now we should have either a comma, which means we need to parse another parameter,
                    // or a right-parentheses, which means we are done. Anything else and it's an error.
                    token = m_currentToken.Token;
                    if (token == JSToken.Comma)
                    {
                        // append the comma context as the terminator for the parameter
                        if (paramDecl != null)
                        {
                            paramDecl.TerminatingContext = m_currentToken.Clone();
                        }
                    }
                    else if (token != JSToken.RightParenthesis)
                    {
                        ReportError(JSError.NoRightParenthesisOrComma);
                    }
                }

                if (m_currentToken.Is(JSToken.RightParenthesis))
                {
                    formalParameters.UpdateWith(m_currentToken);
                    GetNextToken();
                }
                else
                {
                    ReportError(JSError.NoRightParenthesis);
                }
            }

            return formalParameters;
        }

        private ClassNode ParseClassNode(ClassType classType)
        {
            ClassNode classNode = null;
            var classContext = m_currentToken.Clone();
            var context = classContext.Clone();
            GetNextToken();

            // [ or { will get parsed as a binding array/object, so we don't REALLY want to do that.
            // besides, if '{' is right after class, then there is no name or heritage.
            AstNode binding = null;
            if (m_currentToken.IsNot(JSToken.LeftCurly) && m_currentToken.IsNot(JSToken.Extends))
            {
                binding = ParseBinding();
            }

            var bindingIdentifier = binding as BindingIdentifier;
            if (bindingIdentifier == null && classType == ClassType.Declaration)
            {
                ReportError(JSError.NoIdentifier, binding.IfNotNull(b => b.Context));
            }

            Context extendsContext = null;
            AstNode heritage = null;
            Context openBrace = null;
            Context closeBrace = null;
            if (m_currentToken.Is(JSToken.Extends))
            {
                extendsContext = m_currentToken.Clone();
                context.UpdateWith(extendsContext);
                GetNextToken();

                heritage = ParseExpression(true);
                if (heritage != null)
                {
                    context.UpdateWith(heritage.Context);
                }
                else
                {
                    ReportError(JSError.ExpressionExpected);
                }
            }

            AstNodeList elements = null;
            if (m_currentToken.Is(JSToken.LeftCurly))
            {
                openBrace = m_currentToken.Clone();
                context.UpdateWith(openBrace);
                GetNextToken();

                elements = new AstNodeList(m_currentToken.FlattenToStart());
                while (m_currentToken.IsNot(JSToken.EndOfFile) && m_currentToken.IsNot(JSToken.RightCurly))
                {
                    if (m_currentToken.Is(JSToken.Semicolon))
                    {
                        // skip the semicolon
                        GetNextToken();
                    }
                    else
                    {
                        var element = ParseClassElement();
                        if (element != null)
                        {
                            elements.Append(element);
                            context.UpdateWith(element.Context);
                        }
                        else
                        {
                            ReportError(JSError.ClassElementExpected);
                        }
                    }
                }

                if (m_currentToken.Is(JSToken.RightCurly))
                {
                    closeBrace = m_currentToken.Clone();
                    context.UpdateWith(closeBrace);
                    GetNextToken();
                }
                else
                {
                    ReportError(JSError.NoRightCurly);
                }
            }
            else
            {
                ReportError(JSError.NoLeftCurly);
            }

            // create the class
            classNode = new ClassNode(context)
                {
                    ClassType = classType,
                    ClassContext = classContext,
                    Binding = binding,
                    ExtendsContext = extendsContext,
                    Heritage = heritage,
                    OpenBrace = openBrace,
                    Elements = elements,
                    CloseBrace = closeBrace,
                };

            return classNode;
        }

        private AstNode ParseClassElement()
        {
            // see if we're a static method
            var staticContext = m_currentToken.Is(JSToken.Static)
                ? m_currentToken.Clone()
                : null;
            if (staticContext != null)
            {
                GetNextToken();
            }

            // see if this is a getter/setter or a regular method
            var funcType = m_currentToken.Is(JSToken.Get)
                ? FunctionType.Getter
                : m_currentToken.Is(JSToken.Set) ? FunctionType.Setter : FunctionType.Method;

            // right now the ES6 spec just has method declarations.
            var method = ParseFunction(funcType, m_currentToken.FlattenToStart());
            if (method != null && staticContext != null)
            {
                method.IsStatic = true;
                method.StaticContext = staticContext;
            }

            return method;
        }

        #endregion

        #region ParseExpression

        //---------------------------------------------------------------------------------------
        // ParseExpression
        //
        //  Expression :
        //    AssignmentExpressionList AssignmentExpression
        //
        //  AssignmentExpressionList :
        //    <empty> |
        //    AssignmentExpression ',' AssignmentExpressionList
        //
        //  AssignmentExpression :
        //    ConditionalExpression |
        //    LeftHandSideExpression AssignmentOperator AssignmentExpression
        //
        //  ConditionalExpression :
        //    LogicalORExpression OptionalConditionalExpression
        //
        //  OptionalConditionalExpression :
        //    <empty> |
        //    '?' AssignmentExpression ':' AssignmentExpression
        //
        //  LogicalORExpression :
        //    LogicalANDExpression OptionalLogicalOrExpression
        //
        //  OptionalLogicalOrExpression :
        //    <empty> |
        //    '||' LogicalANDExpression OptionalLogicalOrExpression
        //
        //  LogicalANDExpression :
        //    BitwiseORExpression OptionalLogicalANDExpression
        //
        //  OptionalLogicalANDExpression :
        //    <empty> |
        //    '&&' BitwiseORExpression OptionalLogicalANDExpression
        //
        //  BitwiseORExpression :
        //    BitwiseXORExpression OptionalBitwiseORExpression
        //
        //  OptionalBitwiseORExpression :
        //    <empty> |
        //    '|' BitwiseXORExpression OptionalBitwiseORExpression
        //
        //  BitwiseXORExpression :
        //    BitwiseANDExpression OptionalBitwiseXORExpression
        //
        //  OptionalBitwiseXORExpression :
        //    <empty> |
        //    '^' BitwiseANDExpression OptionalBitwiseXORExpression
        //
        //  BitwiseANDExpression :
        //    EqualityExpression OptionalBitwiseANDExpression
        //
        //  OptionalBitwiseANDExpression :
        //    <empty> |
        //    '&' EqualityExpression OptionalBitwiseANDExpression
        //
        //  EqualityExpression :
        //    RelationalExpression |
        //    RelationalExpression '==' EqualityExpression |
        //    RelationalExpression '!=' EqualityExpression |
        //    RelationalExpression '===' EqualityExpression |
        //    RelationalExpression '!==' EqualityExpression
        //
        //  RelationalExpression :
        //    ShiftExpression |
        //    ShiftExpression '<' RelationalExpression |
        //    ShiftExpression '>' RelationalExpression |
        //    ShiftExpression '<=' RelationalExpression |
        //    ShiftExpression '>=' RelationalExpression
        //
        //  ShiftExpression :
        //    AdditiveExpression |
        //    AdditiveExpression '<<' ShiftExpression |
        //    AdditiveExpression '>>' ShiftExpression |
        //    AdditiveExpression '>>>' ShiftExpression
        //
        //  AdditiveExpression :
        //    MultiplicativeExpression |
        //    MultiplicativeExpression '+' AdditiveExpression |
        //    MultiplicativeExpression '-' AdditiveExpression
        //
        //  MultiplicativeExpression :
        //    UnaryExpression |
        //    UnaryExpression '*' MultiplicativeExpression |
        //    UnaryExpression '/' MultiplicativeExpression |
        //    UnaryExpression '%' MultiplicativeExpression
        //---------------------------------------------------------------------------------------
        private AstNode ParseExpression(bool single = false, JSToken inToken = JSToken.None)
        {
            bool bAssign;
            AstNode lhs = ParseUnaryExpression(out bAssign, false);
            return ParseExpression(lhs, single, bAssign, inToken);
        }

        private AstNode ParseExpression(AstNode leftHandSide, bool single, bool bCanAssign, JSToken inToken)
        {
            // new op stack with dummy op
            Stack<Context> opsStack = null;

            // term stack, push left-hand side onto it
            Stack<AstNode> termStack = null;

            AstNode expr = null;
            for (; ; )
            {
                // if 'binary op' or 'conditional'
                // if we are looking for a single expression, then also bail when we hit a comma
                // inToken is a special case because of the for..in syntax. When ParseExpression is called from
                // for, inToken = JSToken.In which excludes JSToken.In from the list of operators, otherwise
                // inToken = JSToken.None which is always true if the first condition is true
                if (JSScanner.IsProcessableOperator(m_currentToken.Token)
                    && m_currentToken.IsNot(inToken)
                    && (!single || m_currentToken.IsNot(JSToken.Comma)))
                {
                    if (opsStack == null)
                    {
                        opsStack = new Stack<Context>();
                        opsStack.Push(null);

                        termStack = new Stack<AstNode>();
                        termStack.Push(leftHandSide);
                    }

                    // for the current token, get the operator precedence and whether it's a right-association operator
                    var prec = JSScanner.GetOperatorPrecedence(m_currentToken);
                    bool rightAssoc = JSScanner.IsRightAssociativeOperator(m_currentToken.Token);

                    // while the current operator has lower precedence than the operator at the top of the stack
                    // or it has the same precedence and it is left associative (that is, no 'assign op' or 'conditional')
                    var stackPrec = JSScanner.GetOperatorPrecedence(opsStack.Peek());
                    while (prec < stackPrec || prec == stackPrec && !rightAssoc)
                    {
                        // pop the top two elements off the stack along with the current operator, 
                        // combine them, then push the results back onto the term stack
                        AstNode operand2 = termStack.Pop();
                        AstNode operand1 = termStack.Pop();
                        expr = CreateExpressionNode(opsStack.Pop(), operand1, operand2);
                        termStack.Push(expr);

                        // get the precendence of the current item on the top of the op stack
                        stackPrec = JSScanner.GetOperatorPrecedence(opsStack.Peek());
                    }

                    // now the current operator has higher precedence that every scanned operators on the stack, or
                    // it has the same precedence as the one at the top of the stack and it is right associative
                    // push operator and next term

                    // but first: special case conditional '?:'
                    if (m_currentToken.Is(JSToken.ConditionalIf))
                    {
                        // pop term stack
                        AstNode condition = termStack.Pop();

                        // if this is an assignment, throw a warning in case the developer
                        // meant to use == instead of =
                        // but no warning if the condition is wrapped in parens.
                        var binOp = condition as BinaryOperator;
                        if (binOp != null && binOp.OperatorToken == JSToken.Assign)
                        {
                            condition.Context.HandleError(JSError.SuspectAssignment);
                        }

                        var questionCtx = m_currentToken.Clone();
                        GetNextToken();

                        // get expr1 in logOrExpr ? expr1 : expr2
                        AstNode operand1 = ParseExpression(true);

                        Context colonCtx = null;
                        if (m_currentToken.IsNot(JSToken.Colon))
                        {
                            ReportError(JSError.NoColon);
                        }
                        else
                        {
                            colonCtx = m_currentToken.Clone();
                        }

                        GetNextToken();

                        // get expr2 in logOrExpr ? expr1 : expr2
                        AstNode operand2 = ParseExpression(true, inToken);

                        expr = new Conditional(condition.Context.CombineWith(operand2.Context))
                            {
                                Condition = condition,
                                QuestionContext = questionCtx,
                                TrueExpression = operand1,
                                ColonContext = colonCtx,
                                FalseExpression = operand2
                            };
                        termStack.Push(expr);
                    }
                    else
                    {
                        if (JSScanner.IsAssignmentOperator(m_currentToken.Token))
                        {
                            if (!bCanAssign)
                            {
                                ReportError(JSError.IllegalAssignment);
                            }
                        }
                        else
                        {
                            // if the operator is a comma, we can get another assign; otherwise we can't
                            bCanAssign = (m_currentToken.Is(JSToken.Comma));
                        }

                        // push the operator onto the operators stack
                        opsStack.Push(m_currentToken.Clone());

                        // push new term
                        GetNextToken();
                        if (bCanAssign)
                        {
                            termStack.Push(ParseUnaryExpression(out bCanAssign, false));
                        }
                        else
                        {
                            bool dummy;
                            termStack.Push(ParseUnaryExpression(out dummy, false));
                        }
                    }
                }
                else
                {
                    // done with expression; go and unwind the stack of expressions/operators.
                    break;
                }
            }

            if (opsStack != null)
            {
                // there are still operators to be processed
                while (opsStack.Peek() != null)
                {
                    // pop the top two term and the top operator, combine them into a new term,
                    // and push the results back onto the term stacck
                    AstNode operand2 = termStack.Pop();
                    AstNode operand1 = termStack.Pop();
                    expr = CreateExpressionNode(opsStack.Pop(), operand1, operand2);

                    // push node onto the stack
                    termStack.Push(expr);
                }
            }

            AstNode term = leftHandSide;

            if (termStack != null)
            {
                Debug.Assert(termStack.Count == 1);

                // see if the one remaining term is "yield". If so, that means we had a lone
                // yield token -- it might be a Mozilla yield operator
                term = termStack.Pop();
            }

            if (term != null)
            {
                if (term.Context.Token == JSToken.Yield && term is Lookup)
                {
                    var expression = ParseExpression(true);
                    if (expression != null)
                    {
                        // yield expression
                        term = new UnaryOperator(term.Context.CombineWith(expression.Context))
                            {
                                OperatorToken = JSToken.Yield,
                                OperatorContext = term.Context,
                                Operand = expression
                            };
                    }
                }
            }

            return term;
        }

        //---------------------------------------------------------------------------------------
        // ParseUnaryExpression
        //
        //  UnaryExpression :
        //    PostfixExpression |
        //    'delete' UnaryExpression |
        //    'void' UnaryExpression |
        //    'typeof' UnaryExpression |
        //    '++' UnaryExpression |
        //    '--' UnaryExpression |
        //    '+' UnaryExpression |
        //    '-' UnaryExpression |
        //    '~' UnaryExpression |
        //    '!' UnaryExpression
        //
        //---------------------------------------------------------------------------------------
        private AstNode ParseUnaryExpression(out bool isLeftHandSideExpr, bool isMinus)
        {
            isLeftHandSideExpr = false;
            bool dummy = false;
            Context exprCtx = null;
            AstNode expr = null;

        TryItAgain:
            AstNode ast = null;
            var opToken = m_currentToken.Token;
            switch (opToken)
            {
                case JSToken.RestSpread:
                    // technically, we don't want rest operators ANYWHERE. But we need to handle them
                    // here specifically for formal parameter lists for arrow functions. 
                    // TODO: we want to error if we aren't immediately preceeded by a comma operator,
                    // and if after parsing the next unary expression, we're aren't at a closing parenthesis.
                    ParsedVersion = ScriptVersion.EcmaScript6;
                    goto case JSToken.Void;

                case JSToken.Void:
                case JSToken.TypeOf:
                case JSToken.Plus:
                case JSToken.Minus:
                case JSToken.BitwiseNot:
                case JSToken.LogicalNot:
                case JSToken.Delete:
                case JSToken.Increment:
                case JSToken.Decrement:
                    // normal unary operators all follow the same pattern
                    exprCtx = m_currentToken.Clone();
                    GetNextToken();
                    expr = ParseUnaryExpression(out dummy, false);
                    ast = new UnaryOperator(exprCtx.CombineWith(expr.Context))
                        {
                            Operand = expr,
                            OperatorContext = exprCtx,
                            OperatorToken = opToken
                        };
                    break;

                case JSToken.ConditionalCommentStart:
                    // skip past the start to the next token
                    exprCtx = m_currentToken.Clone();
                    GetNextToken();
                    if (m_currentToken.Is(JSToken.ConditionalCommentEnd))
                    {
                        // empty conditional-compilation comment -- ignore
                        GetNextToken();
                        goto TryItAgain;
                    }
                    else if (m_currentToken.Is(JSToken.ConditionalCompilationOn))
                    {
                        // /*@cc_on -- check for @IDENT@*/ or !@*/
                        GetNextToken();
                        if (m_currentToken.Is(JSToken.ConditionalCompilationVariable))
                        {
                            // /*@cc_on@IDENT -- check for @*/
                            ast = new ConstantWrapperPP(m_currentToken.Clone())
                                {
                                    VarName = m_currentToken.Code,
                                    ForceComments = true
                                };

                            GetNextToken();

                            if (m_currentToken.Is(JSToken.ConditionalCommentEnd))
                            {
                                // skip the close and keep going
                                GetNextToken();
                            }
                            else
                            {
                                // too complicated
                                CCTooComplicated(null);
                                goto TryItAgain;
                            }
                        }
                        else if (m_currentToken.Is(JSToken.LogicalNot))
                        {
                            // /*@cc_on! -- check for @*/
                            var operatorContext = m_currentToken.Clone();
                            GetNextToken();
                            if (m_currentToken.Is(JSToken.ConditionalCommentEnd))
                            {
                                // we have /*@cc_on!@*/
                                GetNextToken();
                                expr = ParseUnaryExpression(out dummy, false);
                                exprCtx.UpdateWith(expr.Context);

                                var unary = new UnaryOperator(exprCtx)
                                    {
                                        Operand = expr,
                                        OperatorContext = operatorContext,
                                        OperatorToken = JSToken.LogicalNot
                                    };
                                unary.OperatorInConditionalCompilationComment = true;
                                unary.ConditionalCommentContainsOn = true;
                                ast = unary;
                            }
                            else
                            {
                                // too complicated
                                CCTooComplicated(null);
                                goto TryItAgain;
                            }
                        }
                        else
                        {
                            // too complicated
                            CCTooComplicated(null);
                            goto TryItAgain;
                        }
                    }
                    else if (m_currentToken.Is(JSToken.LogicalNot))
                    {
                        // /*@! -- check for @*/
                        var operatorContext = m_currentToken.Clone();
                        GetNextToken();
                        if (m_currentToken.Is(JSToken.ConditionalCommentEnd))
                        {
                            // we have /*@!@*/
                            GetNextToken();
                            expr = ParseUnaryExpression(out dummy, false);
                            exprCtx.UpdateWith(expr.Context);

                            var unary = new UnaryOperator(exprCtx)
                                {
                                    Operand = expr,
                                    OperatorContext = operatorContext,
                                    OperatorToken = JSToken.LogicalNot
                                };
                            unary.OperatorInConditionalCompilationComment = true;
                            ast = unary;
                        }
                        else
                        {
                            // too complicated
                            CCTooComplicated(null);
                            goto TryItAgain;
                        }
                    }
                    else if (m_currentToken.Is(JSToken.ConditionalCompilationVariable))
                    {
                        // @IDENT -- check for @*/
                        ast = new ConstantWrapperPP(m_currentToken.Clone())
                            {
                                VarName = m_currentToken.Code,
                                ForceComments = true
                            };
                        GetNextToken();

                        if (m_currentToken.Is(JSToken.ConditionalCommentEnd))
                        {
                            // skip the close and keep going
                            GetNextToken();
                        }
                        else
                        {
                            // too complicated
                            CCTooComplicated(null);
                            goto TryItAgain;
                        }
                    }
                    else
                    {
                        // we ONLY support /*@id@*/ or /*@cc_on@id@*/ or /*@!@*/ or /*@cc_on!@*/ in expressions right now. 
                        // throw an error, skip to the end of the comment, then ignore it and start
                        // looking for the next token.
                        CCTooComplicated(null);
                        goto TryItAgain;
                    }
                    break;

                default:
                    ast = ParseLeftHandSideExpression(isMinus);
                    ast = ParsePostfixExpression(ast, out isLeftHandSideExpr);
                    break;
            }

            return ast;
        }

        //---------------------------------------------------------------------------------------
        // ParsePostfixExpression
        //
        //  PostfixExpression:
        //    LeftHandSideExpression |
        //    LeftHandSideExpression '++' |
        //    LeftHandSideExpression  '--'
        //
        //---------------------------------------------------------------------------------------
        private AstNode ParsePostfixExpression(AstNode ast, out bool isLeftHandSideExpr)
        {
            isLeftHandSideExpr = true;
            Context exprCtx = null;
            if (null != ast)
            {
                if (!m_foundEndOfLine)
                {
                    if (m_currentToken.Is(JSToken.Increment))
                    {
                        isLeftHandSideExpr = false;
                        exprCtx = ast.Context.Clone();
                        exprCtx.UpdateWith(m_currentToken);
                        ast = new UnaryOperator(exprCtx)
                            {
                                Operand = ast,
                                OperatorToken = m_currentToken.Token,
                                OperatorContext = m_currentToken.Clone(),
                                IsPostfix = true
                            };
                        GetNextToken();
                    }
                    else if (m_currentToken.Is(JSToken.Decrement))
                    {
                        isLeftHandSideExpr = false;
                        exprCtx = ast.Context.Clone();
                        exprCtx.UpdateWith(m_currentToken);
                        ast = new UnaryOperator(exprCtx)
                            {
                                Operand = ast,
                                OperatorToken = m_currentToken.Token,
                                OperatorContext = m_currentToken.Clone(),
                                IsPostfix = true
                            };
                        GetNextToken();
                    }
                }
            }

            return ast;
        }

        //---------------------------------------------------------------------------------------
        // ParseLeftHandSideExpression
        //
        //  LeftHandSideExpression :
        //    PrimaryExpression Accessor  |
        //    'new' LeftHandSideExpression |
        //    FunctionExpression
        //
        //  PrimaryExpression :
        //    'this' |
        //    Identifier |
        //    Literal |
        //    '(' Expression ')'
        //
        //  FunctionExpression :
        //    'function' OptionalFuncName '(' FormalParameterList ')' { FunctionBody }
        //
        //  OptionalFuncName :
        //    <empty> |
        //    Identifier
        //---------------------------------------------------------------------------------------
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1505:AvoidUnmaintainableCode"), 
         System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1502:AvoidExcessiveComplexity")]
        private AstNode ParseLeftHandSideExpression(bool isMinus)
        {
            AstNode ast = null;
            List<Context> newContexts = null;

        TryItAgain:

            // new expression
            while (m_currentToken.Is(JSToken.New))
            {
                if (null == newContexts)
                    newContexts = new List<Context>(4);
                newContexts.Add(m_currentToken.Clone());
                GetNextToken();
            }
            JSToken token = m_currentToken.Token;
            switch (token)
            {
                // primary expression
                case JSToken.Identifier:
                    ast = new Lookup(m_currentToken.Clone())
                        {
                            Name = m_scanner.Identifier
                        };
                    GetNextToken();
                    break;

                case JSToken.TemplateLiteral:
                    ast = ParseTemplateLiteral();
                    break;

                case JSToken.ConditionalCommentStart:
                    // skip past the start to the next token
                    GetNextToken();
                    if (m_currentToken.Is(JSToken.ConditionalCompilationVariable))
                    {
                        // we have /*@id
                        ast = new ConstantWrapperPP(m_currentToken.Clone())
                            {
                                VarName = m_currentToken.Code,
                                ForceComments = true
                            };

                        GetNextToken();

                        if (m_currentToken.Is(JSToken.ConditionalCommentEnd))
                        {
                            // skip past the closing comment
                            GetNextToken();
                        }
                        else
                        {
                            // we ONLY support /*@id@*/ in expressions right now. If there's not
                            // a closing comment after the ID, then we don't support it.
                            // throw an error, skip to the end of the comment, then ignore it and start
                            // looking for the next token.
                            CCTooComplicated(null);
                            goto TryItAgain;
                        }
                    }
                    else if (m_currentToken.Is(JSToken.ConditionalCommentEnd))
                    {
                        // empty conditional comment! Ignore.
                        GetNextToken();
                        goto TryItAgain;
                    }
                    else
                    {
                        // we DON'T have "/*@IDENT". We only support "/*@IDENT @*/", so since this isn't
                        // and id, throw the error, skip to the end of the comment, and ignore it
                        // by looping back and looking for the NEXT token.
                        m_currentToken.HandleError(JSError.ConditionalCompilationTooComplex);

                        // skip to end of conditional comment
                        while (m_currentToken.IsNot(JSToken.EndOfFile) && m_currentToken.IsNot(JSToken.ConditionalCommentEnd))
                        {
                            GetNextToken();
                        }
                        GetNextToken();
                        goto TryItAgain;
                    }
                    break;

                case JSToken.This:
                    ast = new ThisLiteral(m_currentToken.Clone());
                    GetNextToken();
                    break;

                case JSToken.StringLiteral:
                    ast = new ConstantWrapper(m_scanner.StringLiteralValue, PrimitiveType.String, m_currentToken.Clone())
                        {
                            MayHaveIssues = m_scanner.LiteralHasIssues
                        };
                    GetNextToken();
                    break;

                case JSToken.IntegerLiteral:
                case JSToken.NumericLiteral:
                    {
                        Context numericContext = m_currentToken.Clone();
                        double doubleValue;
                        if (ConvertNumericLiteralToDouble(m_currentToken.Code, (token == JSToken.IntegerLiteral), out doubleValue))
                        {
                            // conversion worked fine
                            // check for some boundary conditions
                            var mayHaveIssues = m_scanner.LiteralHasIssues;
                            if (doubleValue == double.MaxValue)
                            {
                                ReportError(JSError.NumericMaximum, numericContext);
                            }
                            else if (isMinus && -doubleValue == double.MinValue)
                            {
                                ReportError(JSError.NumericMinimum, numericContext);
                            }

                            // create the constant wrapper from the value
                            ast = new ConstantWrapper(doubleValue, PrimitiveType.Number, numericContext)
                                {
                                    MayHaveIssues = mayHaveIssues
                                };
                        }
                        else
                        {
                            // if we went overflow or are not a number, then we will use the "Other"
                            // primitive type so we don't try doing any numeric calcs with it. 
                            if (double.IsInfinity(doubleValue))
                            {
                                // overflow
                                // and if we ARE an overflow, report it
                                ReportError(JSError.NumericOverflow, numericContext);
                            }

                            // regardless, we're going to create a special constant wrapper
                            // that simply echos the input as-is
                            ast = new ConstantWrapper(m_currentToken.Code, PrimitiveType.Other, numericContext)
                            {
                                MayHaveIssues = true
                            };
                        }

                        GetNextToken();
                        break;
                    }

                case JSToken.True:
                    ast = new ConstantWrapper(true, PrimitiveType.Boolean, m_currentToken.Clone());
                    GetNextToken();
                    break;

                case JSToken.False:
                    ast = new ConstantWrapper(false, PrimitiveType.Boolean, m_currentToken.Clone());
                    GetNextToken();
                    break;

                case JSToken.Null:
                    ast = new ConstantWrapper(null, PrimitiveType.Null, m_currentToken.Clone());
                    GetNextToken();
                    break;

                case JSToken.ConditionalCompilationVariable:
                    ast = new ConstantWrapperPP(m_currentToken.Clone())
                        {
                            VarName = m_currentToken.Code,
                            ForceComments = false
                        };
                    GetNextToken();
                    break;

                // normally this token is not allowed on the left-hand side of an expression.
                // BUT, this might be the start of a regular expression that begins with an equals sign!
                // we need to test to see if we can parse a regular expression, and if not, THEN
                // we can fail the parse.
                case JSToken.DivideAssign:
                case JSToken.Divide:
                    // could it be a regexp?
                    ast = ScanRegularExpression();
                    if (ast != null)
                    {
                        // yup -- we're done here
                        break;
                    }

                    // nope -- go to the default branch
                    goto default;

                case JSToken.Modulo:
                    // could it be a replacement token in the format %name%? If so, we 
                    // want to treat that as a constant wrapper.
                    ast = ScanReplacementToken();
                    if (ast != null)
                    {
                        break;
                    }

                    goto default;

                // expression
                case JSToken.LeftParenthesis:
                    {
                        var leftParen = m_currentToken.Clone();
                        GetNextToken();
                        if (m_currentToken.Is(JSToken.For))
                        {
                            // generator comprehension in ES6 format
                            ast = ParseComprehension(false, leftParen, null);
                        }
                        else
                        {
                            if (m_currentToken.Is(JSToken.RightParenthesis))
                            {
                                // shortcut the empty parenthetical grouping
                                // normally not allowed; however this might be the (empty) parameter list
                                // to an arrow function.
                                // add the closing paren to the expression context
                                ast = new GroupingOperator(leftParen);
                                ast.UpdateWith(m_currentToken);
                                GetNextToken();
                            }
                            else if (m_currentToken.Is(JSToken.RestSpread))
                            {
                                // we have (...
                                // parse an assignment expression, make it the operand of a unary with the rest.
                                var restContext = m_currentToken.Clone();
                                GetNextToken();
                                ast = ParseExpression(true);
                                if (ast != null)
                                {
                                    ast = new UnaryOperator(restContext.CombineWith(ast.Context))
                                        {
                                            OperatorContext = restContext,
                                            OperatorToken = JSToken.RestSpread,
                                            Operand = ast
                                        };
                                }

                                // now, we want to continue parsing if there is a comma
                                if (m_currentToken.Is(JSToken.Comma))
                                {
                                    ast = ParseExpression(ast, false, true, JSToken.None);
                                }

                                if (m_currentToken.Is(JSToken.RightParenthesis))
                                {
                                    ast = new GroupingOperator(leftParen)
                                        {
                                            Operand = ast
                                        };
                                    ast.UpdateWith(m_currentToken);
                                    GetNextToken();
                                }
                                else
                                {
                                    ReportError(JSError.NoRightParenthesis);
                                }
                            }
                            else
                            {
                                // parse an expression
                                var operand = ParseExpression();
                                if (m_currentToken.Is(JSToken.For))
                                {
                                    // generator comprehension in Mozille format
                                    ast = ParseComprehension(false, leftParen, operand);
                                }
                                else
                                {
                                    ast = new GroupingOperator(leftParen)
                                        {
                                            Operand = operand
                                        };
                                    ast.UpdateWith(operand.Context);

                                    if (m_currentToken.IsNot(JSToken.RightParenthesis))
                                    {
                                        ReportError(JSError.NoRightParenthesis);
                                    }
                                    else
                                    {
                                        // add the closing paren to the expression context
                                        ast.UpdateWith(m_currentToken);
                                        GetNextToken();
                                    }
                                }
                            }
                        }
                    }
                    break;

                // array initializer
                case JSToken.LeftBracket:
                    ast = ParseArrayLiteral(false);
                    break;

                // object initializer
                case JSToken.LeftCurly:
                    ast = ParseObjectLiteral(false);
                    break;

                // function expression
                case JSToken.Function:
                    ast = ParseFunction(FunctionType.Expression, m_currentToken.Clone());
                    break;

                // class expression
                case JSToken.Class:
                    ast = ParseClassNode(ClassType.Expression);
                    break;

                case JSToken.AspNetBlock:
                    ast = new AspNetBlockNode(m_currentToken.Clone())
                        {
                            AspNetBlockText = m_currentToken.Code
                        };
                    GetNextToken();
                    break;

                case JSToken.Yield:
                    {
                        // TODO: not sure if this is the right place to hook for the ES6 YieldExpression semantics!
                        if (ParsedVersion == ScriptVersion.EcmaScript6 || m_settings.ScriptVersion == ScriptVersion.EcmaScript6)
                        {
                            // we already KNOW we're ES6 code, so just parse this as a yield expression.
                            // in fact, we SHOULD already know, since yield should only be used within a generator
                            // function, which for ES6 code should have the "*" generator indicator, which when
                            // parsed should have already set the ES6 flag.
                            ast = ParseYieldExpression();
                        }
                        else
                        {
                            // we need to protect against non-ES6 code using "yield" as a variable name versus the
                            // Mozilla yield syntax. We'll do that further upstream.
                            ast = new Lookup(m_currentToken.Clone())
                                {
                                    Name = "yield"
                                };
                            GetNextToken();
                        }
                    }
                    break;

                default:
                    var identifier = JSKeyword.CanBeIdentifier(m_currentToken.Token);
                    if (identifier != null)
                    {
                        ast = new Lookup(m_currentToken.Clone())
                            {
                                Name = identifier
                            };
                        GetNextToken();
                    }
                    else
                    {
                        ReportError(JSError.ExpressionExpected);
                    }
                    break;
            }

            if (m_currentToken.Is(JSToken.ArrowFunction))
            {
                ParsedVersion = ScriptVersion.EcmaScript6;
                ast = ParseArrowFunction(ast);
            }

            // can be a CallExpression, that is, followed by '.' or '(' or '['
            return ParseMemberExpression(ast, newContexts);
        }

        private RegExpLiteral ScanRegularExpression()
        {
            RegExpLiteral regExp = null;
            m_currentToken = m_scanner.UpdateToken(UpdateHint.RegularExpression);
            if (m_currentToken.Is(JSToken.RegularExpression))
            {
                var regexContext = m_currentToken.Clone();
                GetNextToken();

                var literal = regexContext.Code;
                var lastSlash = literal.LastIndexOf('/');

                // flags are everything AFTER the last slash
                var flags = literal.Substring(lastSlash + 1);

                // don't include the leading or trailing slash in the pattern
                var pattern = literal.Substring(1, lastSlash - 1);

                // create the regexp node. 
                regExp = new RegExpLiteral(regexContext)
                {
                    Pattern = pattern,
                    PatternSwitches = flags
                };
            }

            // if we get here, there isn't a regular expression at the current position
            return regExp;
        }

        private ConstantWrapper ScanReplacementToken()
        {
            ConstantWrapper constWrapper = null;
            m_currentToken = m_scanner.UpdateToken(UpdateHint.ReplacementToken);
            if (m_currentToken.Is(JSToken.ReplacementToken))
            {
                constWrapper = new ConstantWrapper(m_currentToken.Code, PrimitiveType.Other, m_currentToken.Clone());
                GetNextToken();
            }

            return constWrapper;
        }

        private TemplateLiteral ParseTemplateLiteral()
        {
            // create the root literal node
            ParsedVersion = ScriptVersion.EcmaScript6;
            var literalContext = m_currentToken.Clone();
            var textContext = m_currentToken.Clone();

            Lookup lookup = null;
            var text = m_scanner.StringLiteralValue;

            // see if it starts with an identifier
            var indexBackquote = text.IndexOf('`');
            if (indexBackquote != 0)
            {
                var literalName = text.Substring(0, indexBackquote);
                text = text.Substring(indexBackquote);
                var tagContext = textContext.SplitStart(indexBackquote);

                // TODO: figure out how to get a context on just the literal part!
                lookup = new Lookup(tagContext)
                    {
                        Name = literalName
                    };
            }

            // if the token doesn't end with a terminator, then we'll need to parse replacement expressions
            var isContinue = text[text.Length - 1] != '`';

            // create the literal node
            var templateLiteral = new TemplateLiteral(literalContext)
            {
                Function = lookup,
                Text = text,
                TextContext = textContext,
                Expressions = isContinue ? new AstNodeList(literalContext.FlattenToEnd()) : null
            };

            GetNextToken();
            if (isContinue)
            {
                // keep going until we hit the final segment
                do
                {
                    isContinue = false;

                    // expression needs to be closed with a right-curly (whether or not we actually found an expression)
                    var expression = ParseExpression();
                    if (m_currentToken.Is(JSToken.RightCurly))
                    {
                        m_scanner.UpdateToken(UpdateHint.TemplateLiteral);
                        if (m_currentToken.Is(JSToken.TemplateLiteral))
                        {
                            text = m_scanner.StringLiteralValue;
                            var templateExpression = new TemplateLiteralExpression(expression.Context.Clone())
                                {
                                    Expression = expression,
                                    Text = text
                                };
                            templateLiteral.UpdateWith(templateExpression.Context);
                            templateLiteral.Expressions.Append(templateExpression);
                            GetNextToken();

                            isContinue = text[text.Length - 1] != '`';
                        }
                    }
                    else
                    {
                        ReportError(JSError.NoRightCurly);
                    }
                }
                while (isContinue);
            }

            return templateLiteral;
        }

        private AstNode ParseYieldExpression()
        {
            ParsedVersion = ScriptVersion.EcmaScript6;

            // save the context of the yield operator, then skip past it
            var context = m_currentToken.Clone();
            var operatorContext = context.Clone();
            GetNextToken();

            var isDelegator = m_currentToken.Is(JSToken.Multiply);
            if (isDelegator)
            {
                // delegator - move past the yield and the delegator token
                GetNextToken();
            }

            // must be followed by an expression
            var expression = ParseExpression(true);
            if (expression == null)
            {
                // we only call this method if we KNOW we are ES6, so if there is no expression,
                // then throw an error.
                ReportError(JSError.ExpressionExpected);
            }
            else
            {
                context.UpdateWith(expression.Context);
            }

            return new UnaryOperator(context)
                {
                    OperatorContext = operatorContext,
                    OperatorToken = JSToken.Yield,
                    Operand = expression,
                    IsDelegator = isDelegator
                };
        }

        private FunctionObject ParseArrowFunction(AstNode parameters)
        {
            // we are on the arrow-function operator now
            var arrowContext = m_currentToken.Clone();
            GetNextToken();
            ParsedVersion = ScriptVersion.EcmaScript6;

            var functionObject = new FunctionObject(parameters.Context.Clone())
                {
                    ParameterDeclarations = BindingTransform.ToParameters(parameters),
                    FunctionType = FunctionType.ArrowFunction,
                };
            functionObject.UpdateWith(arrowContext);
            if (m_currentToken.Is(JSToken.LeftCurly))
            {
                functionObject.Body = ParseBlock();
            }
            else
            {
                // parse an assignment expression as a concise block
                functionObject.Body = Block.ForceToBlock(ParseExpression(true));
                functionObject.Body.IsConcise = true;
            }

            functionObject.Body.IfNotNull(b => functionObject.UpdateWith(b.Context));
            return functionObject;
        }

        private AstNode ParseArrayLiteral(bool isBindingPattern)
        {
            var openDelimiter = m_currentToken.Clone();
            var listCtx = openDelimiter.Clone();
            var list = new AstNodeList(CurrentPositionContext);
            var hasTrailingCommas = false;

            Context commaContext = null;
            do
            {
                GetNextToken();
                AstNode element = null;
                if (m_currentToken.Is(JSToken.Comma))
                {
                    // comma -- missing array item in the list
                    element = new ConstantWrapper(Missing.Value, PrimitiveType.Other, m_currentToken.FlattenToStart());
                }
                else if (m_currentToken.Is(JSToken.RightBracket))
                {
                    // empty list just bails now
                    if (list.Count == 0)
                    {
                        break;
                    }

                    // if we're parsing a binding pattern, we don't care about the final trailing comma
                    if (!isBindingPattern)
                    {
                        // if the current token is the closing brace, then we ended with a comma -- and we need to
                        // add ANOTHER missing value to make sure this last comma doesn't get left off.
                        // TECHNICALLY, that puts an extra item into the array for most modern browsers, but not ALL.
                        hasTrailingCommas = true;
                        element = new ConstantWrapper(Missing.Value, PrimitiveType.Other, m_currentToken.FlattenToStart());

                        // throw a cross-browser warning about trailing commas
                        commaContext.HandleError(JSError.ArrayLiteralTrailingComma);
                    }
                }
                else if (m_currentToken.Is(JSToken.For))
                {
                    // array comprehension
                    return ParseComprehension(true, openDelimiter, null);
                }
                else
                {
                    // see if we have a spread token
                    Context spreadContext = null;
                    if (m_currentToken.Is(JSToken.RestSpread))
                    {
                        ParsedVersion = ScriptVersion.EcmaScript6;
                        spreadContext = m_currentToken.Clone();
                        GetNextToken();
                    }

                    if (isBindingPattern)
                    {
                        element = ParseBinding();
                        if (m_currentToken.Is(JSToken.Assign))
                        {
                            var assignContext = m_currentToken.Clone();
                            GetNextToken();
                            element = new InitializerNode(assignContext.Clone())
                            {
                                Binding = element,
                                AssignContext = assignContext,
                                Initializer = ParseExpression(true)
                            };
                        }
                    }
                    else
                    {
                        element = ParseExpression(true);
                    }

                    // if we had a spread operator on this item, wrap it in a special unary node
                    if (spreadContext != null)
                    {
                        element = new UnaryOperator(spreadContext.CombineWith(element.Context))
                            {
                                Operand = element,
                                OperatorToken = JSToken.RestSpread,
                                OperatorContext = spreadContext
                            };
                    }
                }

                if (m_currentToken.Is(JSToken.For))
                {
                    // mozilla-style array comprehension!
                    return ParseComprehension(true, openDelimiter, element);
                }

                list.Append(element);
                if (m_currentToken.Is(JSToken.Comma))
                {
                    commaContext = m_currentToken.Clone();

                    if (element != null)
                    {
                        element.TerminatingContext = commaContext;
                    }
                }
            }
            while (m_currentToken.Is(JSToken.Comma));

            if (m_currentToken.Is(JSToken.RightBracket))
            {
                listCtx.UpdateWith(m_currentToken);
                GetNextToken();
            }
            else
            {
                m_currentToken.HandleError(JSError.NoRightBracketOrComma, true);
            }

            return new ArrayLiteral(listCtx)
                {
                    Elements = list,
                    MayHaveIssues = hasTrailingCommas
                };
        }

        private ComprehensionNode ParseComprehension(bool isArray, Context openDelimiter, AstNode expression)
        {
            // we will be on the first FOR token, but Mozilla-style will have already
            // parsed the expression node
            var isMozilla = expression != null;
            var context = openDelimiter.Clone();
            Context closeDelimiter = null;
            expression.IfNotNull(e => context.UpdateWith(e.Context));

            var clauseList = new AstNodeList(m_currentToken.Clone());
            do
            {
                if (m_currentToken.IsEither(JSToken.For, JSToken.If))
                {
                    var clause = ParseComprehensionClause();
                    clause.IfNotNull(c => context.UpdateWith(c.Context));
                    clauseList.Append(clause);
                }
                else
                {
                    ReportError(JSError.NoForOrIf);
                }
            }
            while (m_currentToken.IsEither(JSToken.For, JSToken.If));
            
            context.UpdateWith(clauseList.Context);

            // if we didn't get an expression yet (and we shouldn't for ES6-spec comprehensions), 
            // parse one now
            if (expression == null)
            {
                expression = ParseExpression(true);
                expression.IfNotNull(e => context.UpdateWith(e.Context));
            }

            // should be at the closing delimiter now
            if (m_currentToken.IsNot(isArray ? JSToken.RightBracket : JSToken.RightParenthesis))
            {
                ReportError(isArray ? JSError.NoRightBracket : JSError.NoRightParenthesis);
            }
            else
            {
                closeDelimiter = m_currentToken.Clone();
                context.UpdateWith(closeDelimiter);
                GetNextToken();
            }

            ParsedVersion = ScriptVersion.EcmaScript6;
            return new ComprehensionNode(context)
                {
                    OpenDelimiter = openDelimiter,
                    Expression = expression,
                    Clauses = clauseList,
                    CloseDelimiter = closeDelimiter,
                    ComprehensionType = isArray ? ComprehensionType.Array : ComprehensionType.Generator,
                    MozillaOrdering = isMozilla
                };
        }

        private ComprehensionClause ParseComprehensionClause()
        {
            // save the token
            var forOrIfContext = m_currentToken.Clone();
            var clauseContext = forOrIfContext.Clone();
            GetNextToken();

            // open parenthesis
            Context leftParen = null;
            if (m_currentToken.IsNot(JSToken.LeftParenthesis))
            {
                ReportError(JSError.NoLeftParenthesis, forOrIfContext);
            }
            else
            {
                leftParen = m_currentToken.Clone();
                clauseContext.UpdateWith(leftParen);
                GetNextToken();
            }

            AstNode expression = null;
            AstNode binding = null;
            Context ofContext = null;
            var isInOperation = false;
            if (forOrIfContext.Is(JSToken.For))
            {
                // for-clause
                binding = ParseBinding();
                binding.IfNotNull(b => clauseContext.UpdateWith(b.Context));

                if (m_currentToken.Is(JSToken.In) || m_currentToken.Is("of"))
                {
                    isInOperation = m_currentToken.Is(JSToken.In);
                    ofContext = m_currentToken.Clone();
                    GetNextToken();
                    clauseContext.UpdateWith(ofContext);
                }
                else
                {
                    ReportError(JSError.NoForOrIf);
                }

                expression = ParseExpression(true);
                expression.IfNotNull(e => clauseContext.UpdateWith(e.Context));
            }
            else
            {
                // if-clause
                expression = ParseExpression(true);
                expression.IfNotNull(e => clauseContext.UpdateWith(e.Context));
            }

            // close paren
            Context rightParen = null;
            if (m_currentToken.IsNot(JSToken.RightParenthesis))
            {
                ReportError(JSError.NoRightParenthesis);
            }
            else
            {
                rightParen = m_currentToken.Clone();
                clauseContext.UpdateWith(rightParen);
                GetNextToken();
            }

            if (forOrIfContext.Is(JSToken.For))
            {
                // for-clause
                return new ComprehensionForClause(clauseContext)
                    {
                        OperatorContext = forOrIfContext,
                        OpenContext = leftParen,
                        Binding = binding,
                        IsInOperation = isInOperation,
                        OfContext = ofContext,
                        Expression = expression,
                        CloseContext = rightParen,
                    };
            }
            else //if (tokenContext.Is(JSToken.If))
            {
                // if-clause
                return new ComprehensionIfClause(clauseContext)
                    {
                        OperatorContext = forOrIfContext,
                        OpenContext = leftParen,
                        Condition = expression,
                        CloseContext = rightParen,
                    };
            }
        }

        private ObjectLiteral ParseObjectLiteral(bool isBindingPattern)
        {
            Context objCtx = m_currentToken.Clone();
            var propertyList = new AstNodeList(CurrentPositionContext);

            do
            {
                GetNextToken();

                // a trailing comma after the last property gets ignored
                if (m_currentToken.IsNot(JSToken.RightCurly))
                {
                    var property = ParseObjectLiteralProperty(isBindingPattern);
                    propertyList.Append(property);
                }
            }
            while (m_currentToken.Is(JSToken.Comma));

            if (m_currentToken.Is(JSToken.RightCurly))
            {
                objCtx.UpdateWith(m_currentToken);
                GetNextToken();
            }
            else
            {
                ReportError(JSError.NoRightCurly);
            }

            return new ObjectLiteral(objCtx) { Properties = propertyList };
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1502:AvoidExcessiveComplexity")]
        private ObjectLiteralProperty ParseObjectLiteralProperty(bool isBindingPattern)
        {
            ObjectLiteralProperty property = null;
            ObjectLiteralField field = null;
            AstNode value = null;

            // peek at the NEXT token so we can check if we have name followed by ':'
            var nextToken = PeekToken();
            Context propertyContext = m_currentToken.Clone();
            if (nextToken == JSToken.Colon)
            {
                // regular field name followed by a colon
                field = ParseObjectLiteralFieldName();
                if (m_currentToken.Is(JSToken.Colon))
                {
                    if (field != null)
                    {
                        field.ColonContext = m_currentToken.Clone();
                    }

                    GetNextToken();
                    value = ParseObjectPropertyValue(isBindingPattern);

                    if (isBindingPattern && m_currentToken.Is(JSToken.Assign))
                    {
                        var assignContext = m_currentToken.Clone();
                        GetNextToken();
                        value = new InitializerNode(assignContext.Clone())
                        {
                            Binding = value,
                            AssignContext = assignContext,
                            Initializer = ParseExpression(true)
                        };
                    }
                }
            }
            else if (nextToken == JSToken.Comma || nextToken == JSToken.RightCurly || nextToken == JSToken.Assign)
            {
                // just a name lookup; the property name is implicit
                ParsedVersion = ScriptVersion.EcmaScript6;
                value = ParseObjectPropertyValue(isBindingPattern);

                if (isBindingPattern && m_currentToken.Is(JSToken.Assign))
                {
                    var assignContext = m_currentToken.Clone();
                    GetNextToken();
                    value = new InitializerNode(assignContext.Clone())
                    {
                        Binding = value,
                        AssignContext = assignContext,
                        Initializer = ParseExpression(true)
                    };
                }
            }
            else if (m_currentToken.IsEither(JSToken.Get, JSToken.Set))
            {
                bool isGet = (m_currentToken.Is(JSToken.Get));
                var funcContext = m_currentToken.Clone();
                var funcExpr = ParseFunction(isGet ? FunctionType.Getter : FunctionType.Setter, funcContext);
                
                if (funcExpr != null)
                {
                    // getter/setter is just the literal name with a get/set flag
                    field = new GetterSetter(funcExpr.Binding.Name, isGet, funcExpr.Binding.Context.Clone());
                    value = funcExpr;

                    if (isBindingPattern)
                    {
                        funcContext.HandleError(JSError.MethodsNotAllowedInBindings, true);
                    }
                }
                else
                {
                    ReportError(JSError.FunctionExpressionExpected);
                }
            }
            else if (m_currentToken.Is(JSToken.Multiply) || nextToken == JSToken.LeftParenthesis)
            {
                // method declaration in ES6
                // starts off right with the name. Don't set the name field -- the method
                // itself takes care of it, like an implicit-named property
                value = ParseFunction(FunctionType.Method, m_currentToken.Clone());
                if (value != null)
                {
                    // definitely an ES6 construct
                    ParsedVersion = ScriptVersion.EcmaScript6;
                }
            }

            if (field != null || value != null)
            {
                // bundle the name/value pair into a property
                field.IfNotNull(f => propertyContext.UpdateWith(f.Context));
                value.IfNotNull(v => propertyContext.UpdateWith(v.Context));

                property = new ObjectLiteralProperty(propertyContext)
                {
                    Name = field,
                    Value = value,
                };

                if (m_currentToken.Is(JSToken.Comma))
                {
                    // skip the comma after adding it to the property as a terminating context
                    property.IfNotNull(p => p.TerminatingContext = m_currentToken.Clone());
                }
            }

            return property;
        }

        private ObjectLiteralField ParseObjectLiteralFieldName()
        {
            // simple property name
            ObjectLiteralField field = null;
            switch (m_currentToken.Token)
            {
                case JSToken.Identifier:
                case JSToken.Get:
                case JSToken.Set:
                    field = new ObjectLiteralField(m_scanner.Identifier, PrimitiveType.String, m_currentToken.Clone())
                        {
                            IsIdentifier = true
                        };
                    break;

                case JSToken.StringLiteral:
                    field = new ObjectLiteralField(m_scanner.StringLiteralValue, PrimitiveType.String, m_currentToken.Clone())
                        {
                            MayHaveIssues = m_scanner.LiteralHasIssues
                        };
                    break;

                case JSToken.IntegerLiteral:
                case JSToken.NumericLiteral:
                    {
                        double doubleValue;
                        if (ConvertNumericLiteralToDouble(m_currentToken.Code, (m_currentToken.Is(JSToken.IntegerLiteral)), out doubleValue))
                        {
                            // conversion worked fine
                            field = new ObjectLiteralField(doubleValue, PrimitiveType.Number, m_currentToken.Clone());
                        }
                        else
                        {
                            // something went wrong and we're not sure the string representation in the source is 
                            // going to convert to a numeric value well
                            if (double.IsInfinity(doubleValue))
                            {
                                ReportError(JSError.NumericOverflow);
                            }

                            // use the source as the field name, not the numeric value
                            field = new ObjectLiteralField(m_currentToken.Code, PrimitiveType.Other, m_currentToken.Clone());
                        }
                        break;
                    }

                default:
                    // NOT: identifier token, string, number, or getter/setter.
                    // see if it's a token that COULD be an identifierName.
                    var ident = m_scanner.Identifier;
                    if (JSScanner.IsValidIdentifier(ident))
                    {
                        // BY THE SPEC, if it's a valid identifierName -- which includes reserved words -- then it's
                        // okay for object literal syntax. However, reserved words here won't work in all browsers,
                        // so if it is a reserved word, let's throw a low-sev cross-browser warning on the code.
                        if (JSKeyword.CanBeIdentifier(m_currentToken.Token) == null)
                        {
                            ReportError(JSError.ObjectLiteralKeyword);
                        }

                        field = new ObjectLiteralField(ident, PrimitiveType.String, m_currentToken.Clone());
                    }
                    else
                    {
                        // throw an error but use it anyway, since that's what the developer has going on
                        ReportError(JSError.NoMemberIdentifier);
                        field = new ObjectLiteralField(m_currentToken.Code, PrimitiveType.String, m_currentToken.Clone());
                    }
                    break;
            }

            GetNextToken();
            return field;
        }

        private AstNode ParseObjectPropertyValue(bool isBindingPattern)
        {
            if (isBindingPattern)
            {
                // binding pattern
                return ParseBinding();
            }
            else
            {
                // parse a single expression
                return ParseExpression(true);
            }
        }

        //---------------------------------------------------------------------------------------
        // ParseMemberExpression
        //
        // Accessor :
        //  <empty> |
        //  Arguments Accessor
        //  '[' Expression ']' Accessor |
        //  '.' Identifier Accessor |
        //
        //  Don't have this function throwing an exception without checking all the calling sites.
        //  There is state in instance variable that is saved on the calling stack in some function
        //  (i.e ParseFunction and ParseClass) and you don't want to blow up the stack
        //---------------------------------------------------------------------------------------
        private AstNode ParseMemberExpression(AstNode expression, List<Context> newContexts)
        {
            for (; ; )
            {
                switch (m_currentToken.Token)
                {
                    case JSToken.LeftParenthesis:
                        AstNodeList args = null;
                        args = ParseExpressionList(JSToken.RightParenthesis);

                        expression = new CallNode(expression.Context.CombineWith(args.Context))
                            {
                                Function = expression,
                                Arguments = args,
                                InBrackets = false
                            };

                        if (null != newContexts && newContexts.Count > 0)
                        {
                            (newContexts[newContexts.Count - 1]).UpdateWith(expression.Context);
                            if (!(expression is CallNode))
                            {
                                expression = new CallNode(newContexts[newContexts.Count - 1])
                                    {
                                        Function = expression,
                                        Arguments = new AstNodeList(CurrentPositionContext)
                                    };
                            }
                            else
                            {
                                expression.Context = newContexts[newContexts.Count - 1];
                            }

                            ((CallNode)expression).IsConstructor = true;
                            newContexts.RemoveAt(newContexts.Count - 1);
                        }

                        GetNextToken();
                        break;

                    case JSToken.LeftBracket:
                        //
                        // ROTOR parses a[b,c] as a call to a, passing in the arguments b and c.
                        // the correct parse is a member lookup on a of c -- the "b,c" should be
                        // a single expression with a comma operator that evaluates b but only
                        // returns c.
                        // So we'll change the default behavior from parsing an expression list to
                        // parsing a single expression, but returning a single-item list (or an empty
                        // list if there is no expression) so the rest of the code will work.
                        //
                        //args = ParseExpressionList(JSToken.RightBracket);
                        GetNextToken();
                        args = new AstNodeList(CurrentPositionContext);

                        AstNode accessor = ParseExpression();
                        if (accessor != null)
                        {
                            args.Append(accessor);
                        }

                        expression = new CallNode(expression.Context.CombineWith(m_currentToken))
                            {
                                Function = expression,
                                Arguments = args,
                                InBrackets = true
                            };

                        // there originally was code here in the ROTOR sources that checked the new context list and
                        // changed this member call to a constructor call, effectively combining the two. I believe they
                        // need to remain separate.

                        // remove the close bracket token
                        GetNextToken();
                        break;

                    case JSToken.AccessField:
                        ConstantWrapper id = null;

                        string name = null;
                        // we want the name context to start with the dot
                        Context nameContext = m_currentToken.Clone();
                        GetNextToken();
                        if (m_currentToken.IsNot(JSToken.Identifier))
                        {
                            name = JSKeyword.CanBeIdentifier(m_currentToken.Token);
                            if (null != name)
                            {
                                // don't report an error here -- it's actually okay to have a property name
                                // that is a keyword which is okay to be an identifier. For instance,
                                // jQuery has a commonly-used method named "get" to make an ajax request
                                //ForceReportInfo(JSError.KeywordUsedAsIdentifier);
                                id = new ConstantWrapper(name, PrimitiveType.String, m_currentToken.Clone());
                            }
                            else if (JSScanner.IsValidIdentifier(m_currentToken.Code))
                            {
                                // it must be a keyword, because it can't technically be an identifier,
                                // but it IS a valid identifier format. Throw a warning but still
                                // create the constant wrapper so we can output it as-is
                                ReportError(JSError.KeywordUsedAsIdentifier);
                                name = m_currentToken.Code;
                                id = new ConstantWrapper(name, PrimitiveType.String, m_currentToken.Clone());
                            }
                            else
                            {
                                ReportError(JSError.NoIdentifier);
                            }
                        }
                        else
                        {
                            name = m_scanner.Identifier;
                            id = new ConstantWrapper(name, PrimitiveType.String, m_currentToken.Clone());
                        }

                        if (id != null)
                        {
                            nameContext.UpdateWith(id.Context);
                        }

                        GetNextToken();
                        expression = new Member(expression != null ? expression.Context.CombineWith(nameContext) : nameContext.Clone())
                            {
                                Root = expression,
                                Name = name,
                                NameContext = nameContext
                            };
                        break;
                    default:
                        if (null != newContexts)
                        {
                            while (newContexts.Count > 0)
                            {
                                (newContexts[newContexts.Count - 1]).UpdateWith(expression.Context);
                                expression = new CallNode(newContexts[newContexts.Count - 1])
                                    {
                                        Function = expression,
                                        Arguments = new AstNodeList(CurrentPositionContext)
                                    };
                                ((CallNode)expression).IsConstructor = true;
                                newContexts.RemoveAt(newContexts.Count - 1);
                            }
                        }
                        return expression;
                }
            }
        }

        //---------------------------------------------------------------------------------------
        // ParseExpressionList
        //
        //  Given a starting this.currentToken '(' or '[', parse a list of expression separated by
        //  ',' until matching ')' or ']'
        //---------------------------------------------------------------------------------------
        private AstNodeList ParseExpressionList(JSToken terminator)
        {
            var list = new AstNodeList(m_currentToken.Clone());
            do
            {
                // skip past the opening delimiter or comma
                GetNextToken();
                AstNode item = null;
                if (m_currentToken.Is(JSToken.Comma))
                {
                    // a comma here means a missing element. Not really valid, but
                    // let's be a little flexible here.
                    item = new ConstantWrapper(Missing.Value, PrimitiveType.Other, m_currentToken.FlattenToStart());
                    list.Append(item);
                    list.UpdateWith(m_currentToken);
                }
                else if (m_currentToken.IsNot(terminator))
                {
                    // if there's a spread context, save it now
                    Context spreadContext = null;
                    if (m_currentToken.Is(JSToken.RestSpread))
                    {
                        ParsedVersion = ScriptVersion.EcmaScript6;
                        spreadContext = m_currentToken.Clone();
                        GetNextToken();
                    }

                    // parse an expression
                    item = ParseExpression(true);

                    if (spreadContext != null)
                    {
                        item = new UnaryOperator(spreadContext.CombineWith(item.Context))
                            {
                                Operand = item,
                                OperatorToken = JSToken.RestSpread,
                                OperatorContext = spreadContext
                            };
                    }

                    list.Append(item);
                }

                if (m_currentToken.Is(JSToken.Comma))
                {
                    if (item != null)
                    {
                        item.TerminatingContext = m_currentToken.Clone();
                    }
                }
            }
            while (m_currentToken.Is(JSToken.Comma));

            if (m_currentToken.Is(terminator))
            {
                list.Context.UpdateWith(m_currentToken);
            }
            else if (terminator == JSToken.RightParenthesis)
            {
                //  in ASP+ it's easy to write a semicolon at the end of an expression
                //  not realizing it is going to go inside a function call
                //  (ie. Response.Write()), so make a special check here
                if (m_currentToken.Is(JSToken.Semicolon)
                    && PeekToken() == JSToken.RightParenthesis)
                {
                    ReportError(JSError.UnexpectedSemicolon);
                    GetNextToken();
                }
                else
                {
                    // expected a right-parenthesis but don't have one
                    ReportError(JSError.NoRightParenthesis);
                }
            }
            else
            {
                // expected a right-bracket but didn't have one
                ReportError(JSError.NoRightBracket);
            }

            return list;
        }

        #endregion

        #region helper methods

        /// <summary>
        /// set the source by creating a document from the actual source and its context,
        /// then create and initialize a scanner for that document.
        /// </summary>
        /// <param name="source">source code</param>
        /// <param name="sourceContext">optional context for the source code</param>
        private void SetDocumentContext(DocumentContext documentContext)
        {
            // set the document object to point to this parser.
            documentContext.Parser = this;

            // set up the scanner for the given document context
            m_scanner = new JSScanner(documentContext);
            m_currentToken = m_scanner.CurrentToken;

            // if the scanner encounters a special "globals" comment, it'll fire this event
            // at which point we will define a field with that name in the global scope. 
            m_scanner.GlobalDefine += (sender, ea) =>
            {
                var globalScope = GlobalScope;
                if (globalScope[ea.Name] == null)
                {
                    var field = globalScope.CreateField(ea.Name, null, FieldAttributes.SpecialName);
                    globalScope.AddField(field);
                }
            };

            // this event is fired whenever a ///#SOURCE comment is encountered
            m_scanner.NewModule += (sender, ea) =>
            {
                m_newModule = true;

                // we also want to assume that we found a newline character after
                // the comment
                m_foundEndOfLine = true;
            };
        }

        //---------------------------------------------------------------------------------------
        // CreateExpressionNode
        //
        //  Create the proper AST object according to operator
        //---------------------------------------------------------------------------------------
        private static AstNode CreateExpressionNode(Context operatorContext, AstNode operand1, AstNode operand2)
        {
            Debug.Assert(operatorContext != null);

            // create a context, but protect against one or the other operand being null (syntax error during parsing)
            var context = (operand1.IfNotNull(operand => operand.Context) ?? operatorContext)
                .CombineWith(operand2.IfNotNull(operand => operand.Context));

            switch (operatorContext.Token)
            {
                case JSToken.Assign:
                case JSToken.BitwiseAnd:
                case JSToken.BitwiseAndAssign:
                case JSToken.BitwiseOr:
                case JSToken.BitwiseOrAssign:
                case JSToken.BitwiseXor:
                case JSToken.BitwiseXorAssign:
                case JSToken.Divide:
                case JSToken.DivideAssign:
                case JSToken.Equal:
                case JSToken.GreaterThan:
                case JSToken.GreaterThanEqual:
                case JSToken.In:
                case JSToken.InstanceOf:
                case JSToken.LeftShift:
                case JSToken.LeftShiftAssign:
                case JSToken.LessThan:
                case JSToken.LessThanEqual:
                case JSToken.LogicalAnd:
                case JSToken.LogicalOr:
                case JSToken.Minus:
                case JSToken.MinusAssign:
                case JSToken.Modulo:
                case JSToken.ModuloAssign:
                case JSToken.Multiply:
                case JSToken.MultiplyAssign:
                case JSToken.NotEqual:
                case JSToken.Plus:
                case JSToken.PlusAssign:
                case JSToken.RightShift:
                case JSToken.RightShiftAssign:
                case JSToken.StrictEqual:
                case JSToken.StrictNotEqual:
                case JSToken.UnsignedRightShift:
                case JSToken.UnsignedRightShiftAssign:
                    // regular binary operator
                    return new BinaryOperator(context)
                        {
                            Operand1 = operand1,
                            Operand2 = operand2,
                            OperatorContext = operatorContext,
                            OperatorToken = operatorContext.Token
                        };

                case JSToken.Comma:
                    // use the special comma-operator class derived from binary operator.
                    // it has special logic to combine adjacent comma operators into a single
                    // node with an ast node list rather than nested binary operators
                    return CommaOperator.CombineWithComma(context, operand1, operand2);

                default:
                    // shouldn't get here!
                    Debug.Assert(false);
                    return null;
            }
        }

        /// <summary>
        /// Convert the given numeric string to a double value
        /// </summary>
        /// <param name="str">string representation of a number</param>
        /// <param name="isInteger">we should know alreasdy if it's an integer or not</param>
        /// <param name="doubleValue">output value</param>
        /// <returns>true if there were no problems; false if there were</returns>
        private bool ConvertNumericLiteralToDouble(string str, bool isInteger, out double doubleValue)
        {
            try
            {
                if (isInteger)
                {
                    if (str[0] == '0' && str.Length > 1)
                    {
                        if (str[1] == 'x' || str[1] == 'X')
                        {
                            if (str.Length == 2)
                            {
                                // 0x???? must be a parse error. Just return zero
                                doubleValue = 0;
                                return false;
                            }

                            // parse the number as a hex integer, converted to a double
                            doubleValue = (double)System.Convert.ToInt64(str, 16);
                        }
                        else if (str[1] == 'o' || str[1] == 'O')
                        {
                            if (str.Length == 2)
                            {
                                // 0o???? must be a parse error. Just return zero
                                doubleValue = 0;
                                return false;
                            }

                            // parse the number as an octal integer without the prefix, converted to a double
                            doubleValue = (double)System.Convert.ToInt64(str.Substring(2), 8);
                        }
                        else if (str[1] == 'b' || str[1] == 'B')
                        {
                            if (str.Length == 2)
                            {
                                // 0b???? must be a parse error. Just return zero
                                doubleValue = 0;
                                return false;
                            }

                            // parse the number as a binary integer without the prefix, converted to a double
                            doubleValue = (double)System.Convert.ToInt64(str.Substring(2), 2);
                        }
                        else
                        {
                            // might be an octal value... try converting to octal
                            // and if it fails, just convert to decimal
                            try
                            {
                                doubleValue = (double)System.Convert.ToInt64(str, 8);

                                // if we got here, we successfully converted it to octal.
                                // now, octal literals are deprecated -- not all JS implementations will
                                // decode them. If this decoded as an octal, it can also be a decimal. Check
                                // the decimal value, and if it's the same, then we'll just treat it
                                // as a normal decimal value. Otherwise we'll throw a warning and treat it
                                // as a special no-convert literal.
                                double decimalValue = (double)System.Convert.ToInt64(str, 10);
                                if (decimalValue != doubleValue)
                                {
                                    // throw a warning!
                                    ReportError(JSError.OctalLiteralsDeprecated);

                                    // return false because octals are deprecated and might have
                                    // cross-browser issues
                                    return false;
                                }
                            }
                            catch (FormatException)
                            {
                                // ignore the format exception and fall through to parsing
                                // the value as a base-10 decimal value
                                doubleValue = Convert.ToDouble(str, CultureInfo.InvariantCulture);
                            }
                        }
                    }
                    else
                    {
                        // just parse the integer as a decimal value
                        doubleValue = Convert.ToDouble(str, CultureInfo.InvariantCulture);
                    }

                    // check for out-of-bounds integer values -- if the integer can't EXACTLY be represented
                    // as a double, then we don't want to consider it "successful"
                    if (doubleValue < -0x20000000000000 || 0x20000000000000 < doubleValue)
                    {
                        return false;
                    }
                }
                else
                {
                    // use the system to convert the string to a double
                    doubleValue = Convert.ToDouble(str, CultureInfo.InvariantCulture);
                }

                // if we got here, we should have an appropriate value in doubleValue
                return true;
            }
            catch (OverflowException)
            {
                // overflow mean just return one of the infinity values
                doubleValue = (str[0] == '-'
                  ? Double.NegativeInfinity
                  : Double.PositiveInfinity
                  );

                // and it wasn't "successful"
                return false;
            }
            catch (FormatException)
            {
                // format exception converts to NaN
                doubleValue = double.NaN;

                // not successful
                return false;
            }
        }

        private void AppendImportantComments(Block block)
        {
            if (block != null)
            {
                // make sure any important comments before the closing brace are kept
                if (m_importantComments.Count > 0
                    && m_settings.PreserveImportantComments
                    && m_settings.IsModificationAllowed(TreeModifications.PreserveImportantComments))
                {
                    // we have important comments before the EOF. Add the comment(s) to the program.
                    foreach (var importantComment in m_importantComments)
                    {
                        block.Append(new ImportantComment(importantComment));
                    }

                    m_importantComments.Clear();
                }
            }
        }

        #endregion

        #region get/peek/scan tokens

        //---------------------------------------------------------------------------------------
        // GetNextToken
        //
        //  Return the next token or peeked token if this.errorToken is not null.
        //  Usually this.errorToken is set by AddError even though any code can look ahead
        //  by assigning this.errorToken.
        //  At this point the context is not saved so if position information is needed
        //  they have to be saved explicitely
        //---------------------------------------------------------------------------------------
        private void GetNextToken()
        {
            // the scanner reuses the same context object for performance,
            // so if we ever mean to hold onto it later, we need to clone it.
            m_currentToken = ScanNextToken();
        }

        private static bool[] InitializeSkippableTokens()
        {
            var skippableTokens = new bool[(int)JSToken.Limit];

            skippableTokens[(int)JSToken.WhiteSpace] =
                skippableTokens[(int)JSToken.EndOfLine] =
                skippableTokens[(int)JSToken.SingleLineComment] =
                skippableTokens[(int)JSToken.MultipleLineComment] =
                skippableTokens[(int)JSToken.PreprocessorDirective] =
                skippableTokens[(int)JSToken.Error] = true;

            return skippableTokens;
        }

        private Context ScanNextToken()
        {
            if (EchoWriter != null)
            {
                if (m_currentToken.IsNot(JSToken.None)) EchoWriter.Write(m_currentToken.Code);
            }

            m_newModule = false;
            m_foundEndOfLine = false;
            m_importantComments.Clear();

            var nextToken = m_scanner.ScanNextToken();
            while (nextToken.IsOne(s_skippableTokens))
            {
                if (nextToken.Is(JSToken.EndOfLine))
                {
                    m_foundEndOfLine = true;
                }
                else if (nextToken.IsEither(JSToken.MultipleLineComment, JSToken.SingleLineComment))
                {
                    if (nextToken.HasCode
                        && ((nextToken.Code.Length > 2 && nextToken.Code[2] == '!')
                        || (nextToken.Code.IndexOf("@preserve", StringComparison.OrdinalIgnoreCase) >= 0)
                        || (nextToken.Code.IndexOf("@license", StringComparison.OrdinalIgnoreCase) >= 0)))
                    {
                        // this is an important comment -- save it for later
                        m_importantComments.Add(nextToken.Clone());
                    }
                }

                // if we are preprocess-only, then don't output any preprocessor directive tokens
                if (EchoWriter != null)
                {
                    if (!Settings.PreprocessOnly || nextToken.Token != JSToken.PreprocessorDirective) EchoWriter.Write(nextToken.Code);
                }

                nextToken = m_scanner.ScanNextToken();
            }

            if (nextToken.Is(JSToken.EndOfFile))
            {
                m_foundEndOfLine = true;
            }

            return nextToken;
        }

        private JSToken PeekToken()
        {
            // clone the scanner, turn off any error reporting, and get the next token
            var clonedScanner = m_scanner.PeekClone();
            clonedScanner.SuppressErrors = true;
            var peekToken = clonedScanner.ScanNextToken();

            // there are some tokens we really don't care about when we peek
            // for the next token
            while (peekToken.IsOne(JSToken.WhiteSpace, JSToken.EndOfLine, JSToken.Error, JSToken.SingleLineComment,
                JSToken.MultipleLineComment, JSToken.PreprocessorDirective, JSToken.ConditionalCommentEnd, JSToken.ConditionalCommentStart,
                JSToken.ConditionalCompilationElse, JSToken.ConditionalCompilationElseIf, JSToken.ConditionalCompilationEnd,
                JSToken.ConditionalCompilationIf, JSToken.ConditionalCompilationOn, JSToken.ConditionalCompilationSet,
                JSToken.ConditionalCompilationVariable, JSToken.ConditionalIf))
            {
                peekToken = clonedScanner.ScanNextToken();
            }

            // return the token type
            return peekToken.Token;
        }

        //private IEnumerable<Context> PeekTokens()
        //{
        //    // clone the scanner, turn off any error reporting, and get the next token
        //    var clonedScanner = m_scanner.Clone();
        //    clonedScanner.SuppressErrors = true;

        //    Context peekToken;
        //    while ((peekToken = clonedScanner.ScanNextToken()).IsNot(JSToken.EndOfFile))
        //    {
        //        // there are some tokens we really don't care about when we peek for the next token
        //        while (peekToken.IsOne(JSToken.WhiteSpace, JSToken.EndOfLine, JSToken.Error, JSToken.SingleLineComment,
        //            JSToken.MultipleLineComment, JSToken.PreprocessorDirective, JSToken.ConditionalCommentEnd, JSToken.ConditionalCommentStart,
        //            JSToken.ConditionalCompilationElse, JSToken.ConditionalCompilationElseIf, JSToken.ConditionalCompilationEnd,
        //            JSToken.ConditionalCompilationIf, JSToken.ConditionalCompilationOn, JSToken.ConditionalCompilationSet,
        //            JSToken.ConditionalCompilationVariable, JSToken.ConditionalIf))
        //        {
        //            peekToken = clonedScanner.ScanNextToken();
        //        }

        //        // return the token type
        //        yield return peekToken;
        //    }
        //}

        private bool PeekCanBeModule()
        {
            // shortcut the whole process. If we KNOW we are parsing ES6, then yes: parse a module
            if (ParsedVersion == ScriptVersion.EcmaScript6 || m_settings.ScriptVersion == ScriptVersion.EcmaScript6)
            {
                return true;
            }

            // clone the scanner, turn off any error reporting, and get the next token
            var clonedScanner = m_scanner.PeekClone();
            clonedScanner.SuppressErrors = true;
            var peekToken = clonedScanner.ScanNextToken();

            // skip whitespace, but not linebreaks
            var lineBreak = false;
            while (peekToken.IsOne(JSToken.WhiteSpace, JSToken.EndOfLine, JSToken.Error, JSToken.SingleLineComment,
                JSToken.MultipleLineComment, JSToken.PreprocessorDirective, JSToken.ConditionalCommentEnd, JSToken.ConditionalCommentStart,
                JSToken.ConditionalCompilationElse, JSToken.ConditionalCompilationElseIf, JSToken.ConditionalCompilationEnd,
                JSToken.ConditionalCompilationIf, JSToken.ConditionalCompilationOn, JSToken.ConditionalCompilationSet,
                JSToken.ConditionalCompilationVariable, JSToken.ConditionalIf))
            {
                if (peekToken.Is(JSToken.EndOfLine))
                {
                    lineBreak = true;
                }

                peekToken = clonedScanner.ScanNextToken();
            }

            // if we have a string literal with no linebreaks in between, or an identifier, then we're good to go.
            return (peekToken.Is(JSToken.StringLiteral) && !lineBreak) || peekToken.Is(JSToken.Identifier) || JSKeyword.CanBeIdentifier(peekToken.Token) != null;
        }

        #endregion

        #region error handlers

        /// <summary>
        /// Handle the expected semicolon at the current position for the given node.
        /// </summary>
        /// <param name="node">node that should end with a semicolon</param>
        private void ExpectSemicolon(AstNode node)
        {
            if (m_currentToken.Is(JSToken.Semicolon))
            {
                node.TerminatingContext = m_currentToken.Clone();
                GetNextToken();
            }
            else if (m_foundEndOfLine || m_currentToken.IsEither(JSToken.RightCurly, JSToken.EndOfFile))
            {
                // semicolon insertion rules
                // a right-curly or an end of line is something we don't WANT to throw a warning for. 
                // Just too common and doesn't really warrant a warning (in my opinion)
                if (m_currentToken.IsNot(JSToken.RightCurly) && m_currentToken.IsNot(JSToken.EndOfFile))
                {
                    ReportError(JSError.SemicolonInsertion, node.Context.IfNotNull(c => c.FlattenToEnd()));
                }
            }
            else
            {
                ReportError(JSError.NoSemicolon, node.Context.IfNotNull(c => c.FlattenToEnd()));
            }
        }

        /// <summary>
        ///  Generate a parser error.
        ///  The function is told whether or not next call to GetToken() should return the same
        ///  token or not
        /// </summary>
        /// <param name="errorId">Error to report</param>
        /// <param name="skipToken">true to move to the next token when GetNextToken is called; false to stay on this token</param>
        /// <param name="context">context to report against, or current token if null</param>
        /// <param name="forceToError">whether to force to an error, or use the default severity</param>
        private void ReportError(JSError errorId, Context context = null, bool forceToError = false)
        {
            context = context ?? m_currentToken.Clone();
            // EOF error is special and it's the last error we can possibly get
            if (JSToken.EndOfFile == context.Token)
            {
                context.HandleError(errorId, true); // EOF context is special
            }
            else
            {
                context.HandleError(errorId, forceToError);
            }
        }

        private void CCTooComplicated(Context context)
        {
            // we ONLY support /*@id@*/ or /*@cc_on@id@*/ or /*@!@*/ or /*@cc_on!@*/ in expressions right now. 
            // throw an error, skip to the end of the comment, then ignore it and start
            // looking for the next token.
            (context ?? m_currentToken).HandleError(JSError.ConditionalCompilationTooComplex);

            // skip to end of conditional comment
            while (m_currentToken.IsNot(JSToken.EndOfFile) && m_currentToken.IsNot(JSToken.ConditionalCommentEnd))
            {
                GetNextToken();
            }
            GetNextToken();
        }

        #endregion
    }

    public sealed class UndefinedReference
    {
        private Context m_context;

        private Lookup m_lookup;
        public AstNode LookupNode
        {
            get { return m_lookup; }
        }

        private string m_name;
        private ReferenceType m_type;

        public string Name
        {
            get { return m_name; }
        }

        public ReferenceType ReferenceType
        {
            get { return m_type; }
        }

        public int Column
        {
            get
            {
                if (m_context != null)
                {
                    // one-based
                    return m_context.StartColumn + 1;
                }
                else
                {
                    return 0;
                }
            }
        }

        public int Line
        {
            get
            {
                if (m_context != null)
                {
                    return m_context.StartLineNumber;
                }
                else
                {
                    return 0;
                }
            }
        }

        internal UndefinedReference(Lookup lookup, Context context)
        {
            m_lookup = lookup;
            m_name = lookup.Name;
            m_type = lookup.RefType;
            m_context = context;
        }

        public override string ToString()
        {
            return m_name;
        }
    }

    public class UndefinedReferenceEventArgs : EventArgs
    {
        public UndefinedReference Reference { get; private set; }

        public UndefinedReferenceEventArgs(UndefinedReference reference)
        {
            Reference = reference;
        }
    }
}
