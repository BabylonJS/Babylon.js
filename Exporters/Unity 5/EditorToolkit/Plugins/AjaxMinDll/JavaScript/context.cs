// context.cs
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
using System.ComponentModel;

namespace Microsoft.Ajax.Utilities
{
    public class Context
    {
        public DocumentContext Document { get; private set; }

        public int StartLineNumber { get; internal set; }

        public int StartLinePosition { get; internal set; }

        public int StartPosition { get; internal set; }

        public int EndLineNumber { get; internal set; }

        public int EndLinePosition { get; internal set; }

        public int EndPosition { get; internal set; }

        public int SourceOffsetStart { get; internal set; }

        public int SourceOffsetEnd { get; internal set; }

        /// <summary>
        /// Gets and sets the output start line after running an AST through an output visitor 
        /// </summary>
        public int OutputLine { get; set; }

        /// <summary>
        /// Gets and sets the output start column after running an AST through an output visitor
        /// </summary>
        public int OutputColumn { get; set; }

        public JSToken Token { get; internal set; }

        public int StartColumn
        {
            get
            {
                return StartPosition - StartLinePosition;
            }
        }

        public int EndColumn
        {
            get
            {
                return EndPosition - EndLinePosition;
            }
        }

        public bool HasCode
        {
            get
            {
                return !Document.IsGenerated
                    && EndPosition > StartPosition
                    && EndPosition <= Document.Source.Length
                    && EndPosition != StartPosition;
            }
        }

        public String Code
        {
            get
            {
                return (!Document.IsGenerated && EndPosition > StartPosition && EndPosition <= Document.Source.Length)
                  ? Document.Source.Substring(StartPosition, EndPosition - StartPosition)
                  : null;
            }
        }

        private string ErrorSegment
        {
            get
            {
                string source = this.Document.Source;

                // just pull out the string that's between start position and end position
                if (this.StartPosition >= source.Length)
                {
                    return string.Empty;
                }
                else
                {
                    int length = this.EndPosition - this.StartPosition;
                    if (this.StartPosition + length <= source.Length)
                    {
                        return source.Substring(this.StartPosition, length).Trim();
                    }
                    else
                    {
                        return source.Substring(this.StartPosition).Trim();
                    }
                }
            }
        }

        public Context(DocumentContext document)
        {
            if (document == null)
            {
                throw new ArgumentNullException("document");
            }

            Document = document;

            StartLineNumber = 1;
            EndLineNumber = 1;

            if (Document.Source != null)
            {
                EndPosition = Document.Source.Length;
            }

            Token = JSToken.None;
        }

        public Context(DocumentContext document, int startLineNumber, int startLinePosition, int startPosition, int endLineNumber, int endLinePosition, int endPosition, JSToken token)
            : this(document)
        {
            StartLineNumber = startLineNumber;
            StartLinePosition = startLinePosition;
            StartPosition = startPosition;
            EndLineNumber = endLineNumber;
            EndLinePosition = endLinePosition;
            EndPosition = endPosition;
            Token = token;
        }

        protected Context()
        {
        }

        public void SetData(Context input)
        {
            if (input != null)
            {
                this.Document = input.Document;
                this.StartLineNumber = input.StartLineNumber;
                this.StartLinePosition = input.StartLinePosition;
                this.StartPosition = input.StartPosition;
                this.EndLineNumber = input.EndLineNumber;
                this.EndLinePosition = input.EndLinePosition;
                this.EndPosition = input.EndPosition;
                this.Token = input.Token;
                this.SourceOffsetStart = input.SourceOffsetStart;
                this.SourceOffsetEnd = input.SourceOffsetEnd;
            }
        }

        public Context Clone()
        {
            Context clone = new Context();

            clone.SetData(this);

            return clone;
        }

        public Context FlattenToStart()
        {
            // clone the context and flatten the end to be the start position
            var clone = Clone();
            clone.EndLineNumber = clone.StartLineNumber;
            clone.EndLinePosition = clone.StartLinePosition;
            clone.EndPosition = clone.StartPosition;
            clone.Token = JSToken.None;
            return clone;
        }

        public Context FlattenToEnd()
        {
            // clone the context and flatten the start to the end position
            var clone = Clone();
            clone.StartLineNumber = clone.EndLineNumber;
            clone.StartLinePosition = clone.EndLinePosition;
            clone.StartPosition = clone.EndPosition;
            clone.Token = JSToken.None;
            return clone;
        }

        /// <summary>
        /// Create a new context by combining the current and other contexts
        /// </summary>
        /// <param name="other">other context</param>
        /// <returns>new context instance</returns>
        public Context CombineWith(Context other)
        {
            var clone = new Context();

            clone.SetData(this);

            return clone.UpdateWith(other);
        }

        /// <summary>
        /// Trim off the first few characters of the context and return those characters
        /// as a new context. Doesn't work if the length crosses a line boundary!
        /// </summary>
        /// <param name="length">number of characters to trim off the front of this token</param>
        /// <returns>context for the trimmed-off portion</returns>
        public Context SplitStart(int length)
        {
            // create the new context for the trimmed-off part
            // while adjusting this context to start after the trimmed-off part
            var clone = this.Clone();
            clone.EndPosition = this.StartPosition += length;
            clone.EndLineNumber = clone.StartLineNumber;
            clone.EndLinePosition = clone.StartLinePosition;
            return clone;
        }

        /// <summary>
        /// updates the current context with the other context
        /// </summary>
        /// <param name="other">other context</param>
        /// <returns>current context for chaining purposes</returns>
        public Context UpdateWith(Context other)
        {
            if (other != null)
            {
                if (other.StartPosition < this.StartPosition)
                {
                    this.StartPosition = other.StartPosition;
                    this.StartLineNumber = other.StartLineNumber;
                    this.StartLinePosition = other.StartLinePosition;
                    this.SourceOffsetStart = other.SourceOffsetStart;
                }

                if (other.EndPosition > this.EndPosition)
                {
                    this.EndPosition = other.EndPosition;
                    this.EndLineNumber = other.EndLineNumber;
                    this.EndLinePosition = other.EndLinePosition;
                    this.SourceOffsetEnd = other.SourceOffsetEnd;
                }

                if (this.Token != other.Token)
                {
                    this.Token = JSToken.None;
                }
            }

            return this;
        }

        public bool Is(JSToken token)
        {
            return Token == token;
        }

        public bool IsEither(JSToken token1, JSToken token2)
        {
            var target = this.Token;

            return (target == token1) || (target == token2);
        }

        public bool IsOne(params JSToken[] tokens)
        {
            // if any one of the tokens match what we have, we're good
            if (tokens != null)
            {
                var target = this.Token;
                for (var ndx = tokens.Length - 1; ndx >= 0; --ndx)
                {
                    if (tokens[ndx] == target)
                    {
                        return true;
                    }
                }
            }

            // otherwise we're not
            return false;
        }

        public bool IsOne(bool[] tokenMap)
        {
            return tokenMap == null ? false : tokenMap[(int)this.Token];
        }

        public bool IsNot(JSToken token)
        {
            return Token != token;
        }

        public bool IsNotAny(params JSToken[] tokens)
        {
            // if any of the tokens match, return false; otherwise we're good.
            if (tokens != null)
            {
                var target = this.Token;
                for (var ndx = tokens.Length - 1; ndx >= 0; --ndx)
                {
                    if (tokens[ndx] == target)
                    {
                        return false;
                    }
                }
            }

            return true;
        }

        [Localizable(false)]
        public bool Is(string text)
        {
            // the lengths needs to be the same before we'll even TRY looking at the document source.
            // then verify the values of the indexes into the source,
            // THEN try doing the text comparison
            return text != null
                && EndPosition - StartPosition == text.Length
                && EndPosition <= Document.Source.Length
                && StartPosition >= 0
                && StartPosition <= EndPosition
                && string.CompareOrdinal(Document.Source, StartPosition, text, 0, text.Length) == 0;
        }

        internal void ReportUndefined(Lookup lookup)
        {
            var reference = new UndefinedReference(lookup, this);
            Document.ReportUndefined(reference);
        }

        internal void ChangeFileContext(string fileContext)
        {
            // if the file context is the same, then there's nothing to change
            if (string.Compare(Document.FileContext, fileContext, StringComparison.OrdinalIgnoreCase) != 0)
            {
                // different source. Need to create a clone of the current document context but
                // with the new file context so we don't change the file context for all existing
                // context objects with the same document.
                Document = Document.Clone();
                Document.FileContext = fileContext;
            }
        }

        public static string GetErrorString(JSError errorCode)
        {
            return JScript.ResourceManager.GetString(errorCode.ToString(), JScript.Culture);
        }

        internal void HandleError(JSError errorId, bool forceToError = false)
        {
            if ((errorId != JSError.UndeclaredVariable && errorId != JSError.UndeclaredFunction) || !Document.HasAlreadySeenErrorFor(Code))
            {
                var severity = GetSeverity(errorId);
                var errorMessage = GetErrorString(errorId);
                var context = this.ErrorSegment;
                if (!context.IsNullOrWhiteSpace())
                {
                    errorMessage += CommonStrings.ContextSeparator + context;
                }

                var error = new ContextError()
                    {
                        IsError = forceToError || severity < 2,
                        File = Document.FileContext,
                        Severity = severity,
                        Subcategory = ContextError.GetSubcategory(severity),
                        ErrorNumber = (int)errorId,
                        ErrorCode = "JS{0}".FormatInvariant((int)errorId),
                        StartLine = this.StartLineNumber,
                        StartColumn = this.StartColumn + 1,
                        EndLine = this.EndLineNumber,
                        EndColumn = this.EndColumn + 1,
                        Message = errorMessage,
                    };

                Document.HandleError(error);
            }
        }

        public bool IsBefore(Context other)
        {
            // this context is BEFORE the other context if it starts on an earlier line,
            // OR if it starts on the same line but at an earlier column
            // (or if the other context is null)
            return other == null
                || StartLineNumber < other.StartLineNumber
                || (StartLineNumber == other.StartLineNumber && StartColumn < other.StartColumn);
        }

        public override string ToString()
        {
            return Code;
        }

        #region private static methods

        /// <summary>
        /// Return the default severity for a given JSError value
        /// guide: 0 == there will be a run-time error if this code executes
        ///        1 == the programmer probably did not intend to do this
        ///        2 == this can lead to cross-browser or future problems.
        ///        3 == this can lead to performance problems
        ///        4 == this is just not right
        /// </summary>
        /// <param name="errorCode">error code</param>
        /// <returns>severity</returns>
        private static int GetSeverity(JSError errorCode)
        {
            switch (errorCode)
            {
                case JSError.AmbiguousCatchVar:
                case JSError.AmbiguousNamedFunctionExpression:
                case JSError.ExportNotAtModuleLevel:
                case JSError.NumericOverflow:
                case JSError.StrictComparisonIsAlwaysTrueOrFalse:
                    return 1;

                case JSError.ArrayLiteralTrailingComma:
                case JSError.DuplicateCatch:
                case JSError.DuplicateConstantDeclaration:
                case JSError.DuplicateLexicalDeclaration:
                case JSError.HighSurrogate:
                case JSError.KeywordUsedAsIdentifier:
                case JSError.LowSurrogate:
                case JSError.MisplacedFunctionDeclaration:
                case JSError.ObjectLiteralKeyword:
                    return 2;

                case JSError.ArgumentNotReferenced:
                case JSError.DuplicateName:
                case JSError.FunctionNotReferenced:
                case JSError.UndeclaredFunction:
                case JSError.UndeclaredVariable:
                case JSError.VariableDefinedNotReferenced:
                    return 3;

                case JSError.FunctionNameMustBeIdentifier:
                case JSError.ObjectConstructorTakesNoArguments:
                case JSError.OctalLiteralsDeprecated:
                case JSError.NewLineNotAllowed:
                case JSError.NoModuleExport:
                case JSError.NumericMaximum:
                case JSError.NumericMinimum:
                case JSError.SemicolonInsertion:
                case JSError.StatementBlockExpected:
                case JSError.SuspectAssignment:
                case JSError.SuspectEquality:
                case JSError.SuspectSemicolon:
                case JSError.UnusedLabel:
                case JSError.WithNotRecommended:
                    return 4;

                default:
                    // all others
                    return 0;
            }
        }

        #endregion
    }
}