using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LegoConvertDat.Models
{
    interface ILdraw
    {
        string Path { get; set; }
        string FileName { get; set; }
        bool HiQuality { get; set; }
        List<Polygone> LoadFromFile();
        List<Polygone> DecryptLine(string strline);
    }
}
