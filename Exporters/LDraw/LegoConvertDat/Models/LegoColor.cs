using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LegoConvertDat.Models
{
    public class LegoColor
    {
        public string Name { get; set; }
        public int Code { get; set; }
        public RGB Color { get; set; }
        public RGB Edge { get; set; }
        public int Alpha { get; set; }
        public int Luminance { get; set; }
        public string Material { get; set; }
    }

    public class RGB
    {
        public string Value { get; set; }
        public int R { get; set; }
        public int G { get; set; }
        public int B { get; set; }

        public RGB(string val)
        {
            try
            {
                R = int.Parse(val.Substring(1, 2),System.Globalization.NumberStyles.HexNumber);
                G = int.Parse(val.Substring(3, 2), System.Globalization.NumberStyles.HexNumber);
                B = int.Parse(val.Substring(5, 2), System.Globalization.NumberStyles.HexNumber);
            }
            catch (Exception)
            {

                
            }

        }

    }
}
