using Autodesk.Max;

namespace Max2Babylon
{
    public struct GlobalVertex
    {
        const float epsilon = 0.001f;
        public IPoint3 Position { get; set; }
        public IPoint3 Normal { get; set; }
        public IPoint2 UV { get; set; }
        public IPoint2 UV2 { get; set; }

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

            if (!other.Position.IsAlmostEqualTo(Position, epsilon))
            {
                return false;
            }

            if (!other.Normal.IsAlmostEqualTo(Normal, epsilon))
            {
                return false;
            }

            if (UV != null && !other.UV.IsAlmostEqualTo(UV, epsilon))
            {
                return false;
            }

            if (UV2 != null && !other.UV2.IsAlmostEqualTo(UV2, epsilon))
            {
                return false;
            }

            return true;
        }
    }
}
