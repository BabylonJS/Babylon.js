using System;

namespace BabylonExport.Entities
{
    public class BabylonVector3
    {
        public float X { get; set; }
        public float Y { get; set; }
        public float Z { get; set; }

        public float[] ToArray()
        {
            return new [] {X, Y, Z};
        }

        public float Length()
        {
            return (float)Math.Sqrt(X * X + Y * Y + Z * Z);
        }

        public static BabylonVector3 operator +(BabylonVector3 a, BabylonVector3 b)
        {
            return new BabylonVector3 {X = a.X + b.X, Y = a.Y + b.Y, Z = a.Z + b.Z};
        }

        public static BabylonVector3 operator -(BabylonVector3 a, BabylonVector3 b)
        {
            return new BabylonVector3 { X = a.X - b.X, Y = a.Y - b.Y, Z = a.Z - b.Z };
        }

        public static BabylonVector3 operator /(BabylonVector3 a, float b)
        {
            return new BabylonVector3 { X = a.X / b, Y = a.Y / b, Z = a.Z / b };
        }
    }
}
