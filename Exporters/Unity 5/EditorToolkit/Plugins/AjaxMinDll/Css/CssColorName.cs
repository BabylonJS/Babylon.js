// CssColorNames.cs
//
// Copyright 2012 Microsoft Corporation
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
    using System.Collections.Generic;
    using System.Linq;

    /// <summary>
    /// ColorSlice class
    /// </summary>
    public class ColorSlice
    {
        #region private field

        // array of all the color-name objects
        private ColorName[] _colorArray;

        #endregion

        #region constructor

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Performance", "CA1809:AvoidExcessiveLocals", Justification="there are a lot of colors")]
        private ColorSlice()
        {
            _colorArray = new[] {
                new ColorName {Strict=false,Name="aliceblue",Hex="#f0f8ff"},
                new ColorName {Strict=false,Name="antiquewhite",Hex="#faebd7"},
                new ColorName {Strict=true, Name="aqua",Hex="#0ff"},
                new ColorName {Strict=false,Name="aquamarine",Hex="#7fffd4"},
                new ColorName {Strict=false,Name="azure",Hex="#f0ffff"},
                new ColorName {Strict=false,Name="beige",Hex="#f5f5dc"},
                new ColorName {Strict=false,Name="bisque",Hex="#ffe4c4"},
                new ColorName {Strict=true, Name="black",Hex="#000"},
                new ColorName {Strict=false,Name="blanchedalmond",Hex="#ffebcd"},
                new ColorName {Strict=true, Name="blue",Hex="#00f"},
                new ColorName {Strict=false,Name="blueviolet",Hex="#8a2be2"},
                new ColorName {Strict=false,Name="brown",Hex="#a52a2a"},
                new ColorName {Strict=false,Name="burlywood",Hex="#deb887"},
                new ColorName {Strict=false,Name="cadetblue",Hex="#5f9ea0"},
                new ColorName {Strict=false,Name="chartreuse",Hex="#7fff00"},
                new ColorName {Strict=false,Name="chocolate",Hex="#d2691e"},
                new ColorName {Strict=false,Name="coral",Hex="#ff7f50"},
                new ColorName {Strict=false,Name="cornflowerblue",Hex="#6495ed"},
                new ColorName {Strict=false,Name="cornsilk",Hex="#fff8dc"},
                new ColorName {Strict=false,Name="crimson",Hex="#dc143c"},
                new ColorName {Strict=false,Name="cyan",Hex="#0ff"},
                new ColorName {Strict=false,Name="darkblue",Hex="#00008b"},
                new ColorName {Strict=false,Name="darkcyan",Hex="#008b8b"},
                new ColorName {Strict=false,Name="darkgoldenrod",Hex="#b8860b"},
                new ColorName {Strict=false,Name="darkgray",Hex="#a9a9a9"},
                new ColorName {Strict=false,Name="darkgrey",Hex="#a9a9a9"},
                new ColorName {Strict=false,Name="darkgreen",Hex="#006400"},
                new ColorName {Strict=false,Name="darkkhaki",Hex="#bdb76b"},
                new ColorName {Strict=false,Name="darkmagenta",Hex="#8b008b"},
                new ColorName {Strict=false,Name="darkolivegreen",Hex="#556b2f"},
                new ColorName {Strict=false,Name="darkorange",Hex="#ff8c00"},
                new ColorName {Strict=false,Name="darkorchid",Hex="#9932cc"},
                new ColorName {Strict=false,Name="darkred",Hex="#8b0000"},
                new ColorName {Strict=false,Name="darksalmon",Hex="#e9967a"},
                new ColorName {Strict=false,Name="darkseagreen",Hex="#8fbc8f"},
                new ColorName {Strict=false,Name="darkslateblue",Hex="#483d8b"},
                new ColorName {Strict=false,Name="darkslategray",Hex="#2f4f4f"},
                new ColorName {Strict=false,Name="darkslategrey",Hex="#2f4f4f"},
                new ColorName {Strict=false,Name="darkturquoise",Hex="#00ced1"},
                new ColorName {Strict=false,Name="darkviolet",Hex="#9400d3"},
                new ColorName {Strict=false,Name="deeppink",Hex="#ff1493"},
                new ColorName {Strict=false,Name="deepskyblue",Hex="#00bfff"},
                new ColorName {Strict=false,Name="dimgray",Hex="#696969"},
                new ColorName {Strict=false,Name="dimgrey",Hex="#696969"},
                new ColorName {Strict=false,Name="dodgerblue",Hex="#1e90ff"},
                new ColorName {Strict=false,Name="firebrick",Hex="#b22222"},
                new ColorName {Strict=false,Name="floralwhite",Hex="#fffaf0"},
                new ColorName {Strict=false,Name="forestgreen",Hex="#228b22"},
                new ColorName {Strict=true, Name="fuchsia",Hex="#f0f"},
                new ColorName {Strict=false,Name="gainsboro",Hex="#dcdcdc"},
                new ColorName {Strict=false,Name="ghostwhite",Hex="#f8f8ff"},
                new ColorName {Strict=false,Name="gold",Hex="#ffd700"},
                new ColorName {Strict=false,Name="goldenrod",Hex="#daa520"},
                new ColorName {Strict=true, Name="gray",Hex="#808080"},
                new ColorName {Strict=true, Name="grey",Hex="#808080"},
                new ColorName {Strict=true, Name="green",Hex="#008000"},
                new ColorName {Strict=false,Name="greenyellow",Hex="#adff2f"},
                new ColorName {Strict=false,Name="honeydew",Hex="#f0fff0"},
                new ColorName {Strict=false,Name="hotpink",Hex="#ff69b4"},
                new ColorName {Strict=false,Name="indianred",Hex="#cd5c5c"},
                new ColorName {Strict=false,Name="indigo",Hex="#4b0082"},
                new ColorName {Strict=false,Name="ivory",Hex="#fffff0"},
                new ColorName {Strict=false,Name="khaki",Hex="#f0e68c"},
                new ColorName {Strict=false,Name="lavender",Hex="#e6e6fa"},
                new ColorName {Strict=false,Name="lavenderblush",Hex="#fff0f5"},
                new ColorName {Strict=false,Name="lawngreen",Hex="#7cfc00"},
                new ColorName {Strict=false,Name="lemonchiffon",Hex="#fffacd"},
                new ColorName {Strict=false,Name="lightblue",Hex="#add8e6"},
                new ColorName {Strict=false,Name="lightcoral",Hex="#f08080"},
                new ColorName {Strict=false,Name="lightcyan",Hex="#e0ffff"},
                new ColorName {Strict=false,Name="lightgoldenrodyellow",Hex="#fafad2"},
                new ColorName {Strict=false,Name="lightgray",Hex="#d3d3d3"},
                new ColorName {Strict=false,Name="lightgrey",Hex="#d3d3d3"},
                new ColorName {Strict=false,Name="lightgreen",Hex="#90ee90"},
                new ColorName {Strict=false,Name="lightpink",Hex="#ffb6c1"},
                new ColorName {Strict=false,Name="lightsalmon",Hex="#ffa07a"},
                new ColorName {Strict=false,Name="lightseagreen",Hex="#20b2aa"},
                new ColorName {Strict=false,Name="lightskyblue",Hex="#87cefa"},
                new ColorName {Strict=false,Name="lightslategray",Hex="#778899"},
                new ColorName {Strict=false,Name="lightslategrey",Hex="#778899"},
                new ColorName {Strict=false,Name="lightsteelblue",Hex="#b0c4de"},
                new ColorName {Strict=false,Name="lightyellow",Hex="#ffffe0"},
                new ColorName {Strict=true, Name="lime",Hex="#0f0"},
                new ColorName {Strict=false,Name="limegreen",Hex="#32cd32"},
                new ColorName {Strict=false,Name="linen",Hex="#faf0e6"},
                new ColorName {Strict=false,Name="magenta",Hex="#f0f"},
                new ColorName {Strict=true, Name="maroon",Hex="#800000"},
                new ColorName {Strict=false,Name="mediumaquamarine",Hex="#66cdaa"},
                new ColorName {Strict=false,Name="mediumblue",Hex="#0000cd"},
                new ColorName {Strict=false,Name="mediumorchid",Hex="#ba55d3"},
                new ColorName {Strict=false,Name="mediumpurple",Hex="#9370d8"},
                new ColorName {Strict=false,Name="mediumseagreen",Hex="#3cb371"},
                new ColorName {Strict=false,Name="mediumslateblue",Hex="#7b68ee"},
                new ColorName {Strict=false,Name="mediumspringgreen",Hex="#00fa9a"},
                new ColorName {Strict=false,Name="mediumturquoise",Hex="#48d1cc"},
                new ColorName {Strict=false,Name="mediumvioletred",Hex="#c71585"},
                new ColorName {Strict=false,Name="midnightblue",Hex="#191970"},
                new ColorName {Strict=false,Name="mintcream",Hex="#f5fffa"},
                new ColorName {Strict=false,Name="mistyrose",Hex="#ffe4e1"},
                new ColorName {Strict=false,Name="moccasin",Hex="#ffe4b5"},
                new ColorName {Strict=false,Name="navajowhite",Hex="#ffdead"},
                new ColorName {Strict=true, Name="navy",Hex="#000080"},
                new ColorName {Strict=false,Name="oldlace",Hex="#fdf5e6"},
                new ColorName {Strict=true, Name="olive",Hex="#808000"},
                new ColorName {Strict=false,Name="olivedrab",Hex="#6b8e23"},
                new ColorName {Strict=false,Name="orange",Hex="#ffa500"},
                new ColorName {Strict=false,Name="orangered",Hex="#ff4500"},
                new ColorName {Strict=false,Name="orchid",Hex="#da70d6"},
                new ColorName {Strict=false,Name="palegoldenrod",Hex="#eee8aa"},
                new ColorName {Strict=false,Name="palegreen",Hex="#98fb98"},
                new ColorName {Strict=false,Name="paleturquoise",Hex="#afeeee"},
                new ColorName {Strict=false,Name="palevioletred",Hex="#d87093"},
                new ColorName {Strict=false,Name="papayawhip",Hex="#ffefd5"},
                new ColorName {Strict=false,Name="peachpuff",Hex="#ffdab9"},
                new ColorName {Strict=false,Name="peru",Hex="#cd853f"},
                new ColorName {Strict=false,Name="pink",Hex="#ffc0cb"},
                new ColorName {Strict=false,Name="plum",Hex="#dda0dd"},
                new ColorName {Strict=false,Name="powderblue",Hex="#b0e0e6"},
                new ColorName {Strict=true, Name="purple",Hex="#800080"},
                new ColorName {Strict=true, Name="red",Hex="#f00"},
                new ColorName {Strict=false,Name="rosybrown",Hex="#bc8f8f"},
                new ColorName {Strict=false,Name="royalblue",Hex="#4169e1"},
                new ColorName {Strict=false,Name="saddlebrown",Hex="#8b4513"},
                new ColorName {Strict=false,Name="salmon",Hex="#fa8072"},
                new ColorName {Strict=false,Name="sandybrown",Hex="#f4a460"},
                new ColorName {Strict=false,Name="seagreen",Hex="#2e8b57"},
                new ColorName {Strict=false,Name="seashell",Hex="#fff5ee"},
                new ColorName {Strict=false,Name="sienna",Hex="#a0522d"},
                new ColorName {Strict=true, Name="silver",Hex="#c0c0c0"},
                new ColorName {Strict=false,Name="skyblue",Hex="#87ceeb"},
                new ColorName {Strict=false,Name="slateblue",Hex="#6a5acd"},
                new ColorName {Strict=false,Name="slategray",Hex="#708090"},
                new ColorName {Strict=false,Name="slategrey",Hex="#708090"},
                new ColorName {Strict=false,Name="snow",Hex="#fffafa"},
                new ColorName {Strict=false,Name="springgreen",Hex="#00ff7f"},
                new ColorName {Strict=false,Name="steelblue",Hex="#4682b4"},
                new ColorName {Strict=false,Name="tan",Hex="#d2b48c"},
                new ColorName {Strict=true, Name="teal",Hex="#008080"},
                new ColorName {Strict=false,Name="thistle",Hex="#d8bfd8"},
                new ColorName {Strict=false,Name="tomato",Hex="#ff6347"},
                new ColorName {Strict=false,Name="turquoise",Hex="#40e0d0"},
                new ColorName {Strict=false,Name="violet",Hex="#ee82ee"},
                new ColorName {Strict=false,Name="wheat",Hex="#f5deb3"},
                new ColorName {Strict=true, Name="white",Hex="#fff"},
                new ColorName {Strict=false,Name="whitesmoke",Hex="#f5f5f5"},
                new ColorName {Strict=true, Name="yellow",Hex="#ff0"},
                new ColorName {Strict=false,Name="yellowgreen",Hex="#9acd32"},
            };
        }

        #endregion

        #region public static slice properties

        public static Dictionary<string, string> NameShorterThanHex
        {
            get
            {
                return NestedNameShorterThanHex.Data;
            }
        }

        public static Dictionary<string, string> StrictNameShorterThanHex
        {
            get
            {
                return NestedStrictNameShorterThanHex.Data;
            }
        }

        public static Dictionary<string, string> HexShorterThanName
        {
            get
            {
                return NestedHexShorterThanName.Data;
            }
        }

        public static Dictionary<string, string> StrictHexShorterThanNameAndAllNonStrict
        {
            get
            {
                return NestedStrictHexShorterThanNameAndAllNonStrict.Data;
            }
        }

        public static Dictionary<string, string> AllColorNames
        {
            get
            {
                return NestedAllColorNames.Data;
            }
        }

        #endregion

        #region private colorname class

        private class ColorName
        {
            public bool Strict { get; set; }
            public string Name { get; set; }
            public string Hex { get; set; }
        }

        #endregion

        #region private nested classes

        private static class NestedFactory
        {
            public readonly static ColorSlice Instance = new ColorSlice();
        }

        private static class NestedNameShorterThanHex
        {
            public readonly static Dictionary<string, string> Data = Create(NestedFactory.Instance);

            private static Dictionary<string, string> Create(ColorSlice singleton)
            {
                return (from colorName in singleton._colorArray
                        where colorName.Hex.Length > colorName.Name.Length
                        select colorName).DistinctBy(c => c.Hex).ToDictionary(p => p.Hex, p => p.Name);
            }
        }

        private static class NestedStrictNameShorterThanHex
        {
            public readonly static Dictionary<string, string> Data = Create(NestedFactory.Instance);

            private static Dictionary<string, string> Create(ColorSlice singleton)
            {
                return (from colorName in singleton._colorArray
                        where colorName.Strict == true && colorName.Hex.Length > colorName.Name.Length
                        select colorName).DistinctBy(c => c.Hex).ToDictionary(p => p.Hex, p => p.Name);
            }
        }

        private static class NestedHexShorterThanName
        {
            public readonly static Dictionary<string, string> Data = Create(NestedFactory.Instance);

            private static Dictionary<string, string> Create(ColorSlice singleton)
            {
                return (from colorName in singleton._colorArray
                        where colorName.Name.Length > colorName.Hex.Length
                        select colorName).DistinctBy(c => c.Name).ToDictionary(p => p.Name, p => p.Hex);
            }
        }

        private static class NestedStrictHexShorterThanNameAndAllNonStrict
        {
            public readonly static Dictionary<string, string> Data = Create(NestedFactory.Instance);

            private static Dictionary<string, string> Create(ColorSlice singleton)
            {
                return (from colorName in singleton._colorArray
                        where (colorName.Strict == true && colorName.Name.Length > colorName.Hex.Length) || colorName.Strict == false
                        select colorName).DistinctBy(c => c.Name).ToDictionary(p => p.Name, p => p.Hex);
            }
        }

        private static class NestedAllColorNames
        {
            public readonly static Dictionary<string, string> Data = Create(NestedFactory.Instance);

            private static Dictionary<string, string> Create(ColorSlice singleton)
            {
                return (from colorName in singleton._colorArray
                        select colorName).DistinctBy(c => c.Name).ToDictionary(p => p.Name, p => p.Hex);
            }
        }

        #endregion
    }
}
