using Autodesk.Max;

namespace Max2Babylon
{
    public struct GlobalVertex
    {
        public int BaseIndex { get; set; }
        public int CurrentIndex { get; set; }
        public IPoint3 Position { get; set; }
        public IPoint3 Normal { get; set; }
        public IPoint2 UV { get; set; }
        public IPoint2 UV2 { get; set; }
        public int BonesIndices { get; set; }
        public IPoint4 Weights { get; set; }
        public float[] Color { get; set; }

        public override int GetHashCode()
        {
            return base.GetHashCode();
        }

        public override bool Equals(object obj)
        {
            if (!(obj is GlobalVertex))
            {
                return false;
            }

            var other = (GlobalVertex)obj;

            if (other.BaseIndex != BaseIndex)
            {
                return false;
            }

            if (!other.Position.IsAlmostEqualTo(Position, Tools.Epsilon))
            {
                return false;
            }

            if (!other.Normal.IsAlmostEqualTo(Normal, Tools.Epsilon))
            {
                return false;
            }

            if (UV != null && !other.UV.IsAlmostEqualTo(UV, Tools.Epsilon))
            {
                return false;
            }

            if (UV2 != null && !other.UV2.IsAlmostEqualTo(UV2, Tools.Epsilon))
            {
                return false;
            }

            if (Weights != null && !other.Weights.IsAlmostEqualTo(Weights, Tools.Epsilon))
            {
                return false;
            }

            if (Color != null && !other.Color.IsAlmostEqualTo(Color, Tools.Epsilon))
            {
                return false;
            }

            return other.BonesIndices == BonesIndices;
        }
    }
}
