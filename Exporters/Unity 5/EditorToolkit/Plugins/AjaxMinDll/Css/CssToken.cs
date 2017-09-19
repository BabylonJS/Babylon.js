// CssToken.cs
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
    using System.ComponentModel;

    /// <summary>
    /// Token class represents a parsed token of information consumed by the parser
    /// </summary>
    internal class CssToken
    {
        private TokenType m_tokenType;
        public TokenType TokenType { get { return m_tokenType; } }

        private string m_text;
        public string Text { get { return m_text; } }

        private CssContext m_context;
        public CssContext Context { get { return m_context; } }

        public CssToken(TokenType tokenType, [Localizable(false)] string text, CssContext context)
        {
            m_tokenType = tokenType;
            m_text = text;
            m_context = context.Clone();
        }

        public CssToken(TokenType tokenType, char ch, CssContext context)
            : this(tokenType, new string(ch, 1), context)
        {
        }
    }

    internal class CssContext
    {
        public Position Start
        {
            get { return m_start; }
        }
        private Position m_start;

        public Position End
        {
            get { return m_end; }
        }
        private Position m_end;

        internal CssContext()
        {
            m_start = new Position();
            m_end = new Position();
        }

        internal CssContext(Position start, Position end)
        {
            m_start = start.Clone();
            m_end = end.Clone();
        }

        public void Advance()
        {
            m_start = m_end.Clone();
        }

        public CssContext Clone()
        {
            return new CssContext(
              m_start.Clone(),
              m_end.Clone()
              );
        }

        public void Reset(int line, int column)
        {
            m_start = new Position(line, column);
            m_end = new Position(line, column);
        }
    }

    internal class Position
    {
        public int Line
        {
            get { return m_line; }
        }
        private int m_line;

        public int Char
        {
            get { return m_char; }
        }
        private int m_char;

        public Position()
        {
            m_line = 1;
            //m_char = 0;
        }

        public Position(int line, int character)
        {
            m_line = line;
            m_char = character;
        }

        public void NextLine()
        {
            ++m_line;
            m_char = 0;
        }

        public void NextChar()
        {
            ++m_char;
        }

        public void PreviousChar()
        {
            --m_char;
        }

        public Position Clone()
        {
            return new Position(m_line, m_char);
        }
    }

    internal enum TokenType
    {
        None = 0,
        Space,
        CommentOpen,
        CommentClose,
        Includes,
        DashMatch,
        PrefixMatch,
        SuffixMatch,
        SubstringMatch,
        String,
        Identifier,
        Hash,
        ImportSymbol,
        PageSymbol,
        MediaSymbol,
        FontFaceSymbol,
        CharacterSetSymbol,
        AtKeyword,
        ImportantSymbol,
        NamespaceSymbol,
        KeyFramesSymbol,
        RelativeLength,
        AbsoluteLength,
        Resolution,
        Angle,
        Time,
        Frequency,
        Speech,
        Dimension,
        Percentage,
        Number,
        Uri,
        Function,
        Not,
        Any,
        Matches,
        UnicodeRange,
        ProgId,
        Character,
        Comment,

        // CSS3 paged media at-symbols
        TopLeftCornerSymbol,
        TopLeftSymbol,
        TopCenterSymbol,
        TopRightSymbol,
        TopRightCornerSymbol,
        BottomLeftCornerSymbol,
        BottomLeftSymbol,
        BottomCenterSymbol,
        BottomRightSymbol,
        BottomRightCornerSymbol,
        LeftTopSymbol,
        LeftMiddleSymbol,
        LeftBottomSymbol,
        RightTopSymbol,
        RightMiddleSymbol,
        RightBottomSymbol,

		AspNetBlock,
        ReplacementToken,

        Error = -1
    }
}
