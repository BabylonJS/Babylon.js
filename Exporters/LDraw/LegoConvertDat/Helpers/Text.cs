using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LegoConvertDat.Helpers
{
    public static class Text
    {
        static public string CleanSpace(this string str)
        {
            while (str.IndexOf("  ") > 0)
                str = str.Replace("  ", " ");
            if (str.Length > 0)
            {
                while (str[0] == ' ')
                    str = str.Substring(1);
                while (str[str.Length - 1] == ' ')
                    str = str.Substring(0, str.Length - 1);
            }
            return str;
        }

        static public string CheckSlashPath(this string path)
        {
            if (path.IndexOf('\\', path.Length - 1) < 0)
                path += "\\";
            return path;
        }
    }
}
