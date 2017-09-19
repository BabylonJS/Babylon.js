// CssStringMgr.cs
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
    public enum CssErrorCode
    {
        NoError = 0,
        UnknownError = 1000,
        UnterminatedComment = 1001,
        UnterminatedString = 1002,
        UnnecessaryUnits = 1003,
        UnexpectedNumberCharacter = 1004,
        ExpectedOpenParenthesis = 1005,
        InvalidLowSurrogate = 1006,
        HighSurrogateNoLow = 1007,
        UnderscoreNotValid = 1008,
        UnexpectedEscape = 1009,
        UnexpectedStringCharacter = 1010,
        DecimalNoDigit = 1011,
        EquivalentNumbers = 1012,
        ScannerSubsystem = 1013,
        UnknownCharacterEncoding = 1015,
        ParserSubsystem = 1016,
        ExpectedCharset = 1017,
        ExpectedSemicolon = 1018,
        UnexpectedToken = 1019,
        UnexpectedAtKeyword = 1020,
        ExpectedNamespace = 1021,
        ExpectedImport = 1022,
        ExpectedCommaOrSemicolon = 1023,
        ExpectedMediaIdentifier = 1024,
        ExpectedCommaOrOpenBrace = 1025,
        ExpectedOpenBrace = 1026,
        ExpectedSemicolonOrOpenBrace = 1027,
        DeclarationIgnoredFormat = 1028,
        DeclarationIgnored = 1029,
        ExpectedIdentifier = 1030,
        ExpectedSelector = 1031,
        ExpectedIdentifierOrString = 1032,
        ExpectedClosingBracket = 1033,
        ExpectedClosingParenthesis = 1034,
        ExpectedColon = 1035,
        ExpectedExpression = 1036,
        HashAfterUnaryNotAllowed = 1037,
        ExpectedHexColor = 1038,
        TokenAfterUnaryNotAllowed = 1039,
        UnexpectedDimension = 1040,
        ExpectedProgId = 1041,
        ExpectedFunction = 1042,
        ProgIdIEOnly = 1043,
        ExpectedEqualSign = 1044,
        ExpectedTerm = 1045,
        ExpectedComma = 1046,
        ExpectedRgbNumberOrPercentage = 1047,
        ColorCanBeCollapsed = 1048,
        HackGeneratesInvalidCss = 1049,
        ExpectedEndOfFile = 1050,
        DuplicateNamespaceDeclaration = 1051,
        UndeclaredNamespace = 1052,
        InvalidUnicodeRange = 1053,
        ExpressionError = 1054,
        ExpectedMediaQueryExpression = 1055,
        ExpectedMediaFeature = 1056,
        ExpectedMediaQuery = 1057,
        MediaQueryRequiresSpace = 1058,
        PossibleInvalidClassName = 1059,
        ExpectedClosingBrace = 1060,
        ExpectedPercentageFromOrTo = 1061,
        ExpectedSemicolonOrClosingBrace = 1062,
        ExpectedUnit = 1063,
        ExpectedProduct = 1064,
        ExpectedSum = 1065,
        UnexpectedEndOfFile = 1066,
        ExpectedNumber = 1067,
        UnexpectedCharset = 1068,
        PossibleCharsetError = 1069,
        UnexpectedFunction = 1070,
    };
}