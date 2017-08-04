using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LegoConvertDat.Models
{
    [Serializable]
    public class Point
    {
        public float X { get; set; }
        public float Y { get; set; }
        public float Z { get; set; }

        public Point(float x, float y, float z)
        {
            X = x; Y = y; Z = z;
        }
        public Point()
        { }

        public void Translation(Point pt)
        {
            X += pt.X;
            Y += pt.Y;
            Z += pt.Z;
        }

        public void Translation(float scale)
        {
            X += scale;
            Y += scale;
            Z += scale;
        }

        public void Scale(Point pt)
        {
            X *= pt.X;
            Y *= pt.Y;
            Z *= pt.Z;
        }

        public void Scale(float scale)
        {
            X *= scale;
            Y *= scale;
            Z *= scale;
        }

        public void Matrix(Point m1, Point m2, Point m3, Point t)
        {
            var x = m1.X * X + m1.Y * Y + m1.Z * Z + t.X;
            var y = m2.X * X + m2.Y * Y + m2.Z * Z + t.Y;
            var z = m3.X * X + m3.Y * Y + m3.Z * Z + t.Z;
            X = x;
            Y = y;
            Z = z;
        }
        public override string ToString()
        {
            return $"{X};{Y};{Z}";
        }

        public static Point operator -(Point A, Point B)
        {
            return new Point(A.X - B.X, A.Y - B.Y, A.Z - B.Z);
        }

        public static Point operator -(Point A)
        {
            return new Point(-A.X, -A.Y, -A.Z);
        }

        public static Point operator +(Point A, Point B)
        {
            return new Point(A.X + B.X, A.Y + B.Y, A.Z + B.Z);
        }

        public static Point operator *(Point A, Point B)
        {
            return new Point(A.Y * B.Z - A.Z * B.Y,
                A.Z * B.X - A.X * B.Z,
                A.X * B.Y - A.Y * B.X);
        }

        public static bool operator ==(Point A, Point B)
        {
            if ((A.X == B.X) && (A.Y == B.Y) && (A.Z == B.Z))
                return true;
            return false;
        }
        public static bool operator !=(Point A, Point B)
        {
            return !(A == B);
        }

        public float Dot(Point A, Point B)
        {
            return (A.X * B.X + A.Y * B.Y + A.Z * B.Z);
        }

        public float Dot(Point A)
        {
            return (A.X * X + A.Y * Y + A.Z * Z);
        }

        public float Length()
        {
            return (float)Math.Sqrt(X * X + Y * Y + Z * Z);
        }

        public Point Normalize()
        {
            float length = Length();
            if (length < 0)
                length = -length;
            if (length == 0)
                return new Point(0, 0, 0);
            return new Point(X / length,
                Y / length,
                Z / length);
        }

    }
}
