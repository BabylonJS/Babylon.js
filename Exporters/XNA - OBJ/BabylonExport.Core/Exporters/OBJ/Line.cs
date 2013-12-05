using System;
using System.Globalization;
using SharpDX;

namespace BabylonExport.Core
{
    internal abstract class Line
    {
        string[] tokens;

        public bool IsValid
        {
            get
            {
                return Tokens.Length > 0 && !string.IsNullOrEmpty(Tokens[0]);
            }
        }

        public bool IsComment
        {
            get
            {
                return Tokens[0].StartsWith("#");
            }
        }

        public int Index { get; internal set; }

        public abstract string BlockSperator { get; }

        public string[] Tokens
        {
            get { return tokens; }
        }

        internal void SetLine(string line)
        {
            char[] blank = { ' ', '\t' };
            tokens = line.Split(blank, StringSplitOptions.RemoveEmptyEntries);
        }

        public float ToFloat()
        {
            return float.Parse(Tokens[1], CultureInfo.InvariantCulture);
        }

        public Vector2 ToVector2()
        {
            return new Vector2(float.Parse(Tokens[1], CultureInfo.InvariantCulture),
                               float.Parse(Tokens[2], CultureInfo.InvariantCulture));
        }

        public Vector3 ToVector3()
        {
            return new Vector3(float.Parse(Tokens[1], CultureInfo.InvariantCulture),
                               float.Parse(Tokens[2], CultureInfo.InvariantCulture),
                               float.Parse(Tokens[3], CultureInfo.InvariantCulture));
        }


        public Color3 ToColor()
        {
            return new Color3(float.Parse(Tokens[1], CultureInfo.InvariantCulture),
                             float.Parse(Tokens[2], CultureInfo.InvariantCulture),
                             float.Parse(Tokens[3], CultureInfo.InvariantCulture));
        }

        public override string ToString()
        {
            return string.Join(" ", Tokens);
        }
    }
}
