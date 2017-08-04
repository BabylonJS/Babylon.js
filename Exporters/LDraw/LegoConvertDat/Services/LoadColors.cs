using LegoConvertDat.Helpers;
using LegoConvertDat.Models;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LegoConvertDat.Services
{
    public class LoadColors
    {
        public string RootPath { get; set; }
        public string FileName { get; set; }
        public List<LegoColor> Colors { get; set; }
        public LoadColors(string rootpath, string filename)
        {
            RootPath = rootpath;
            if (RootPath.IndexOf('\\', RootPath.Length - 1) < 0)
                RootPath += "\\";
            FileName = filename;
            Colors = new List<LegoColor>();

            if (!File.Exists(RootPath + FileName))
                return;

            StreamReader file = new StreamReader(RootPath + FileName);
            while (!file.EndOfStream)
            {
                try
                {
                    var line = file.ReadLine();
                    var str = Text.CleanSpace(line).Split(' ');
                    if (str.Length > 2)
                        if (str[1] == "!COLOUR")
                        {
                            LegoColor lc = new LegoColor();
                            lc.Name = str[2];
                            lc.Code = int.Parse(str[4]);
                            lc.Color = new RGB(str[6]);
                            lc.Edge = new RGB(str[8]);
                            if (str.Length >= 10)
                            {

                                for (int i = 0; i < str.Length; i++)
                                {
                                    if (str[i] == "ALPHA")
                                    {
                                        lc.Alpha = int.Parse(str[i + 1]);
                                        break;
                                    }
                                }
                                for (int i = 0; i < str.Length; i++)
                                {
                                    if (str[i] == "LUMINANCE")
                                    {
                                        lc.Luminance = int.Parse(str[i + 1]);
                                        break;
                                    }
                                }
                                for (int i = 0; i < str.Length; i++)
                                {
                                    if ((str[i] == "CHROME") || (str[i] == "PEARLESCENT") || (str[i] == "RUBBER") || (str[i] == "MATERIAL") || (str[i] == "METAL"))
                                    {
                                        for (int j = i; j < str.Length; j++)
                                            lc.Material += str[j] + ' ';
                                        lc.Material = lc.Material.TrimEnd(' ');
                                    }
                                }

                            }
                            Colors.Add(lc);

                        }

                    
                }
                catch (Exception ex)
                {
                    Debug.WriteLine(ex.Message);

                }
                //create a 24 color as it's a no color for
                //this color is mapped to white. It is used when a raw dat part is loaded
                LegoColor Leg24 = new LegoColor();
                Leg24.Name = "Master Color";
                Leg24.Code = 24;
                Leg24.Color = new RGB("#FFFFFF");
                Colors.Add(Leg24);
            }
        }

    }
}
