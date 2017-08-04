using LegoConvertDat.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LegoConvertDat.Services
{
    public class LdrLoader : DatLoader
    {
        public LdrLoader(string rootpath, string path, string filename, bool hiqual)
        {
            HiQuality = hiqual;
            Path = path;
            if (Path.IndexOf('\\', Path.Length - 1) < 0)
                Path += "\\";
            RootPath = rootpath;
            if (RootPath.IndexOf('\\', RootPath.Length - 1) < 0)
                RootPath += "\\";
            FileName = filename;
            if (Polygones == null)
                Polygones = new List<Polygone>();
        }
        
    }
}
