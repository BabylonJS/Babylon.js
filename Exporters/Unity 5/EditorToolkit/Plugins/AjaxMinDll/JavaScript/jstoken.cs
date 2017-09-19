// jstoken.cs
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

namespace Microsoft.Ajax.Utilities
{

    public enum JSToken : int
    {
        None = 0,
        EndOfFile,

        // main statement switch
        Semicolon,                      // ;
        RightCurly,                     // }
        LeftCurly,                      // {
        Debugger,
        Var,
        If,
        For,
        Do,
        While,
        Continue,
        Break,
        Return,
        With,
        Switch,
        Throw,
        Try,
        Function,
        Else,
        ConditionalCommentStart,        // /*@ or //@
        ConditionalCommentEnd,          // @*/ or EOL
        ConditionalCompilationOn,       // @cc_on
        ConditionalCompilationSet,      // @set
        ConditionalCompilationIf,       // @if
        ConditionalCompilationElseIf,   // @elif
        ConditionalCompilationElse,     // @else
        ConditionalCompilationEnd,      // @end
        ConditionalCompilationVariable,           // entity defined defined during preprocessing

        // used by both statement and expression switches

        // main expression switch
        Identifier,
        Null,
        True,
        False,
        This,
        StringLiteral,
        IntegerLiteral,
        NumericLiteral,
        TemplateLiteral,                // (may be complete, head, middle or tail)

        LeftParenthesis,                // (
        LeftBracket,                    // [
        AccessField,                    // .
        ArrowFunction,                  // =>
        RestSpread,                     // ...

        // operators
        FirstOperator,
        // unary ops
        Delete = FirstOperator,
        Increment,                      // ++
        Decrement,                      // --
        Void,
        TypeOf,
        LogicalNot,                     // !
        BitwiseNot,                     // ~

        FirstBinaryOperator,
        // binary ops
        Plus = FirstBinaryOperator,     // +
        Minus,                          // -
        Multiply,                       // *
        Divide,                         // /
        Modulo,                         // %
        BitwiseAnd,                     // &
        BitwiseOr,                      // |
        BitwiseXor,                     // ^
        LeftShift,                      // <<
        RightShift,                     // >>
        UnsignedRightShift,             // >>>

        Equal,                          // ==
        NotEqual,                       // !=
        StrictEqual,                    // ===
        StrictNotEqual,                 // !==
        LessThan,                       // <
        LessThanEqual,                  // <=
        GreaterThan,                    // >
        GreaterThanEqual,               // >=

        LogicalAnd,                     // &&
        LogicalOr,                      // ||

        InstanceOf,
        In,
        Comma,                          // ,

        Assign,                         // =
        PlusAssign,                     // +=
        MinusAssign,                    // -=
        MultiplyAssign,                 // *=
        DivideAssign,                   // /=
        ModuloAssign,                   // %=
        BitwiseAndAssign,               // &=
        BitwiseOrAssign,                // |=
        BitwiseXorAssign,               // ^=
        LeftShiftAssign,                // <<=
        RightShiftAssign,               // >>=
        UnsignedRightShiftAssign,       // >>>=
        LastAssign = UnsignedRightShiftAssign,

        ConditionalIf,                  // ? // MUST FOLLOW LastBinaryOp
        Colon,                          // :
        LastOperator = Colon,

        // context specific keywords
        Case,
        Catch,
        Default,
        Finally,
        New,
        RightParenthesis,               // )
        RightBracket,                   // ]
        SingleLineComment,              // for authoring
        MultipleLineComment,            // for authoring
        UnterminatedComment,            // for authoring
        PreprocessorDirective,

        // reserved words
        Enum,
        Extends,
        Super,
        Class,
        Const,
        Export,
        Import,

        // ECMAScript 6
        Module,

        // ECMA strict reserved words
        Let,
        Implements,
        Interface,
        Package,
        Private,
        Protected,
        Public,
        Static,
        Yield,

        // browser-specific don't uses
        Native, // Chrome

        // always okay for identifiers
        Get,
        Set,

        AspNetBlock,
        ReplacementToken,               // %name(.name)*%

        EndOfLine, // only returned if the RawTokens flag is set on the scanner, but also used in error-recovery
        WhiteSpace, // only returned if the RawTokens flag is set on the scanner
        Error, // only returned if the RawTokens flag is set on the scanner
        RegularExpression, // only returned if the RawTokens flag is set on the scanner

        // Do not use this one
        Limit
    }
}
