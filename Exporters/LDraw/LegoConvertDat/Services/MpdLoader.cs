using LegoConvertDat.Helpers;
using LegoConvertDat.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LegoConvertDat.Services
{
    public class MpdLoader : DatLoader
    {
        public MpdLoader(string rootpath, string path, string filename, bool hiqual)
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

        public new List<Polygone> LoadFromFile()
        {
            try
            {
                StreamReader file = new StreamReader(Path + FileName);
                string firstldr = "";
                string strline = "";
                bool IsOutOfLdr = false;
                while (!file.EndOfStream)
                {
                    if (!IsOutOfLdr)
                        strline = file.ReadLine();
                    else
                        IsOutOfLdr = false;
                    strline = Text.CleanSpace(strline);
                    var IsLdrEmbedded = IsBeginningLdrEmbedded(strline);
                    //check if it is an embedded file
                    if (IsLdrEmbedded != "")
                    {
                        if (firstldr == "")
                            firstldr = IsLdrEmbedded;
                        Console.WriteLine($"Reading file {IsLdrEmbedded}");
                        //get the lines related to this one
                        strline = Text.CleanSpace(file.ReadLine());
                        StreamWriter ldrwrite = new StreamWriter(RootPath + IsLdrEmbedded, false);
                        while ((IsBeginningLdrEmbedded(strline) == "") && (!file.EndOfStream))
                        {
                            strline = Text.CleanSpace(file.ReadLine());
                            ldrwrite.WriteLine(strline);
                            IsOutOfLdr = true;
                        }
                        ldrwrite.Close();
                        ldrwrite.Dispose();
                    }
                }
                file.Close();
                file.Dispose();

                DatLoader mydat = new DatLoader(RootPath, firstldr, HiQuality);
                Polygones = mydat.LoadFromFile();

            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exceptoin: {ex.Message}");
                //do nothing
            }
            return Polygones;
        }

        private string CheckIfLdrFile(string strline)
        {
            strline = Text.CleanSpace(strline);
            //is it a file to read?
            if (strline.IndexOf('1') == 0)
                if (strline.ToLower().IndexOf(".ldr") >= 0)
                    return strline.Split(' ').Last();
            return "";
        }

        private string IsBeginningLdrEmbedded(string strline)
        {
            strline = Text.CleanSpace(strline);
            var elems = strline.Split(' ');
            if (elems.Length < 3)
                return "";
            //is it a file to read?
            if ((elems[0] == "0") && (elems[1] == "FILE"))
                return elems[2];
            return "";
        }
    }
}
