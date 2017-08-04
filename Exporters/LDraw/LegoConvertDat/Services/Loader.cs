using LegoConvertDat.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LegoConvertDat.Services
{
    public class Loader
    {
        static public List<string> Files = new List<string>();
        static public List<string> NoPolygone = new List<string>();
        static public List<DatPart> DatObj { get; set;  }
        string RootPath { get; set; }
        string Path { get; set; }
        string FileName { get; set; }
        public List<Polygone> Polygones { get; set; }
        private bool HiQuality { get; set; }

        public Loader(string rootpath, string path, string filename, bool hiqual)
        {
            HiQuality = hiqual;
            RootPath = rootpath;
            Path = path;
            FileName = filename;

            if (DatObj == null)
            { 
                DatObj = new List<DatPart>();
                //load the stud as used a lot
                LoadPart(@"stud.dat");
                // do same with 1-4cyli.dat
                LoadPart(@"1-4cyli.dat");
            }

            try
            {
                Files.AddRange(Directory.GetFiles(RootPath, "*.*", SearchOption.AllDirectories));
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }

            if (FileName.ToLower().Contains(".mpd"))
            {
                var fileMpd = new MpdLoader(RootPath, Path, FileName, hiqual);
                Polygones = fileMpd.LoadFromFile();
            }
            else if (FileName.ToLower().Contains(".ldr"))
            {
                var fileLdr = new LdrLoader(RootPath, Path, FileName, hiqual);
                Polygones = fileLdr.LoadFromFile();
            }
            else if (FileName.ToLower().Contains(".dat"))
            {
                var filetoload = new DatLoader(RootPath, FileName, hiqual);
                Polygones = filetoload.LoadFromFile();
            }        
        }

        private void LoadPart(string partname)
        {
            var flstud = new DatLoader(RootPath, partname, HiQuality);
            var poly = flstud.LoadFromFile();
            DatPart dt = new DatPart();
            dt.Name = partname;
            dt.Polygones = poly;
            DatObj.Add(dt);

        }
    }
}
