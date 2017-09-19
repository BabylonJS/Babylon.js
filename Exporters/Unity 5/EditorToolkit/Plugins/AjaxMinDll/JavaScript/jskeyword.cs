// jskeyword.cs
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

    internal sealed class JSKeyword
    {
        private JSKeyword m_next;
        private JSToken m_token;
        private string m_name;
        private int m_length;

        private JSKeyword(JSToken token, string name)
            : this(token, name, null)
        {
        }

        private JSKeyword(JSToken token, string name, JSKeyword next)
        {
            m_name = name;
            m_token = token;
            m_length = m_name.Length;
            m_next = next;
        }

        /*internal bool Exists(string target)
        {
            JSKeyword keyword = this;
            while (keyword != null)
            {
                if (keyword.m_name == target)
                {
                    return true;
                }
                keyword = keyword.m_next;
            }
            return false;
        }*/

        internal static string CanBeIdentifier(JSToken keyword)
        {
            switch (keyword)
            {
                // always allowed
                case JSToken.Get: return "get";
                case JSToken.Set: return "set";
                case JSToken.Super: return "super";

                // what about EcmaScript 6? Does this become a reserved word?
                case JSToken.Module: return "module";

                // not in strict mode
                case JSToken.Implements: return "implements";
                case JSToken.Interface: return "interface";
                case JSToken.Let: return "let";
                case JSToken.Package: return "package";
                case JSToken.Private: return "private";
                case JSToken.Protected: return "protected";
                case JSToken.Public: return "public";
                case JSToken.Static: return "static";
                case JSToken.Yield: return "yield";

                // apparently never allowed for Chrome, so we want to treat it
                // differently, too
                case JSToken.Native: return "native";

                // no other tokens can be identifiers
                default: return null;
            }
        }

        internal JSToken GetKeyword(string source, int startPosition, int wordLength)
        {
            var keyword = this;
            while (null != keyword)
            {
                if (wordLength == keyword.m_length)
                {
                    // equal number of characters
                    // we know the first char has to match, so start with the second
                    var comparison = string.CompareOrdinal(keyword.m_name, 0, source, startPosition, wordLength);
                    if (comparison == 0)
                    {
                        // found a match
                        return keyword.m_token;
                    }
                    else if (comparison > 0)
                    {
                        // because the list is in order, if we're past this guy, there's no match
                        return JSToken.Identifier;
                    }
                }
                else if (wordLength < keyword.m_length)
                {
                    // in word-length order first of all, so if the length of the test string is
                    // less than the length of the keyword node, this is an identifier
                    return JSToken.Identifier;
                }

                keyword = keyword.m_next;
            }

            // walked th list without finding a map
            return JSToken.Identifier;
        }

        // each list must in order or length first, shortest to longest.
        // for equal length words, in alphabetical order
        internal static JSKeyword[] InitKeywords()
        {
            JSKeyword[] keywords = new JSKeyword[26];
            // a
            // b
            keywords['b' - 'a'] = new JSKeyword(JSToken.Break, "break");
            // c
            keywords['c' - 'a'] = new JSKeyword(JSToken.Case, "case",
                new JSKeyword(JSToken.Catch, "catch",
                    new JSKeyword(JSToken.Class, "class",
                        new JSKeyword(JSToken.Const, "const", 
                            new JSKeyword(JSToken.Continue, "continue")))));
            // d
            keywords['d' - 'a'] = new JSKeyword(JSToken.Do, "do", 
                new JSKeyword(JSToken.Delete, "delete",
                    new JSKeyword(JSToken.Default, "default", 
                        new JSKeyword(JSToken.Debugger, "debugger"))));
            // e
            keywords['e' - 'a'] = new JSKeyword(JSToken.Else, "else",
                new JSKeyword(JSToken.Enum, "enum", 
                    new JSKeyword(JSToken.Export, "export", 
                        new JSKeyword(JSToken.Extends, "extends"))));
            // f
            keywords['f' - 'a'] = new JSKeyword(JSToken.For, "for", 
                new JSKeyword(JSToken.False, "false", 
                    new JSKeyword(JSToken.Finally, "finally",
                        new JSKeyword(JSToken.Function, "function"))));
            // g
            keywords['g' - 'a'] = new JSKeyword(JSToken.Get, "get");
            // i
            keywords['i' - 'a'] = new JSKeyword(JSToken.If, "if",
                new JSKeyword(JSToken.In, "in", 
                    new JSKeyword(JSToken.Import, "import", 
                        new JSKeyword(JSToken.Interface, "interface",
                            new JSKeyword(JSToken.Implements, "implements",
                                new JSKeyword(JSToken.InstanceOf, "instanceof"))))));
            // l
            keywords['l' - 'a'] = new JSKeyword(JSToken.Let, "let");
            // m
            //keywords['m' - 'a'] = new JSKeyword(JSToken.Module, "module");
            // n
            keywords['n' - 'a'] = new JSKeyword(JSToken.New, "new",
                new JSKeyword(JSToken.Null, "null",
                    new JSKeyword(JSToken.Native, "native")));
            // p
            keywords['p' - 'a'] = new JSKeyword(JSToken.Public, "public",
                new JSKeyword(JSToken.Package, "package",
                    new JSKeyword(JSToken.Private, "private", 
                        new JSKeyword(JSToken.Protected, "protected"))));
            // r
            keywords['r' - 'a'] = new JSKeyword(JSToken.Return, "return");
            // s
            keywords['s' - 'a'] = new JSKeyword(JSToken.Set, "set",
                new JSKeyword(JSToken.Super, "super", 
                    new JSKeyword(JSToken.Static, "static",
                        new JSKeyword(JSToken.Switch, "switch"))));
            // t
            keywords['t' - 'a'] = new JSKeyword(JSToken.Try, "try", 
                new JSKeyword(JSToken.This, "this",
                    new JSKeyword(JSToken.True, "true", 
                        new JSKeyword(JSToken.Throw, "throw",
                            new JSKeyword(JSToken.TypeOf, "typeof")))));
            // u
            // v
            keywords['v' - 'a'] = new JSKeyword(JSToken.Var, "var", 
                new JSKeyword(JSToken.Void, "void"));
            // w
            keywords['w' - 'a'] = new JSKeyword(JSToken.With, "with",
                new JSKeyword(JSToken.While, "while"));
            // y
            keywords['y' - 'a'] = new JSKeyword(JSToken.Yield, "yield");

            return keywords;
        }
    }
}
