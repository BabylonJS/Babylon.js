using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.Serialization.Formatters.Binary;
using System.Text;
using System.Threading.Tasks;

namespace LegoConvertDat.Models
{
    [Serializable]
    public class Polygone
    {
        //using 3 floats instead of an array of float improve the speed of conversion
        //difference is quite significants when the know parts are cloned
        public Point A { get; set; }
        public Point B { get; set; }
        public Point C { get; set; }
        public int Color { get; set; }

        public Polygone(Point[] points)
        {
            if (points.Length != 3)
                new Exception("Dimention must be 3");
            A = points[0];
            B = points[1];
            C = points[2];
        }

        public Polygone(Point a, Point b, Point c)
        {
            A = a; B = b; C = c;
        }

        public int Dimentions()
        {
                return 3;           
        }

        public void Translation(Point pt)
        {
            A.Translation(pt);
            B.Translation(pt);
            C.Translation(pt);

        }

        public void Translation(float scale)
        {
            A.Translation(scale);
            B.Translation(scale);
            C.Translation(scale);
        }

        public void Scale(Point pt)
        {
            A.Scale(pt);
            B.Scale(pt);
            C.Scale(pt);
        }
        public void Scale(float scale)
        {
            A.Scale(scale);
            B.Scale(scale);
            C.Scale(scale);
        }

        public void Matrix(Point m1, Point m2, Point m3, Point t)
        {
            A.Matrix(m1, m2, m3, t);
            B.Matrix(m1, m2, m3, t);
            C.Matrix(m1, m2, m3, t);
        }
        public override string ToString()
        {
            return $"{A} {B} {C}";
        }

        public Point GetNormal()
        {
            Point Vector1 = B - A; 
            Point Vector2 = C - B; 
            Point Normal = Vector1 * Vector2;
            Normal = Normal.Normalize();
            return Normal;
        }

        public Point Points(int i)
        {
            if (i == 0)
                return A;
            else if (i == 1)
                return B;
            return C;
        }
    }
}
