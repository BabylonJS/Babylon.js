using LegoConvertDat.Helpers;
using LegoConvertDat.Models;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace LegoConvertDat.Services
{
    public class DatLoader : ILdraw
    {
        static public string RootPath { get; set; }
        public string FileName { get; set; }
        public string Path { get; set; }
        public bool HiQuality { get; set; }
        public List<Polygone> Polygones { get; set; }

        public bool IsPart { get; set; }
        public DatLoader(string rootpath, string filename, bool hiqual)
        {
            RootPath = rootpath;
            if (RootPath.IndexOf('\\', RootPath.Length - 1) < 0)
                RootPath += "\\";
            FileName = filename;
            IsPart = false;
            if (Polygones == null)
                Polygones = new List<Polygone>();

            Path = RootPath;
            if (!File.Exists(Path + FileName))
                Path += @"parts\";
            CheckPath:
            // check if the file exist
            if (!File.Exists(Path + FileName))
            {
                //so change the path, check where we are and navigat to the possible ones
                if (Path.LastIndexOf(@"\parts\") == (Path.Length - 7))
                {

                    Path = RootPath + @"parts\s\";
                    goto CheckPath;
                }
                else if (Path.LastIndexOf(@"\s\") == (Path.Length - 3))
                {
                    if (HiQuality)
                        Path = RootPath + @"p\48\";
                    else
                        Path = RootPath + @"p\";
                    goto CheckPath;
                }
                else if (Path.LastIndexOf(@"\p\48\") == (Path.Length - 6))
                {
                    Path = RootPath + @"p\";
                    goto CheckPath;
                }
                else
                {
                    // finally try to find the file in the other path. 
                    // do it only last chance as it is slow.
                    var datfile = Loader.Files.Where(x => x.ToLower().Contains(filename.ToLower()));
                    if (datfile.Any())
                    {
                        //check if a high res very is available
                        var ret = datfile.Where(x => x.ToLower().LastIndexOf("48") == (x.Length - filename.Length - 3));
                        if (ret.Any())
                        {
                            Path = ret.First().Substring(0, ret.First().Length - FileName.Length);
                        }
                        else
                        {
                            Path = datfile.First().Substring(0, datfile.First().Length - FileName.Length);
                        }

                    }
                }
            }
        }

        public DatLoader()
        {
            if (Polygones == null)
                Polygones = new List<Polygone>();
        }

        public List<Polygone> DecryptLine(string strline)
        {
            var elems = strline.Split(' ');
            //What is the action?
            int action = GetFirstDigit(strline);
            switch (action)
            {
                case 1:
                    //there must be a file name at the end as it just can't be 1 point alone
                    if (elems.Length != 15)
                        break;
                    var poly = new List<Polygone>();
                    //check if element is existing
                    var ret = Loader.DatObj.Where(x => x.Name.ToLower() == elems.Last().ToLower());
                    if (!ret.Any())
                    {
                        Console.WriteLine($"Cloning {elems.Last()}");
                        DatLoader ld = new DatLoader(RootPath, elems.Last(), HiQuality);
                        poly = ld.LoadFromFile();
                    }
                    else
                    {
                        //Clone the existing part
                        poly = ret.First().Polygones.DeepClone<List<Polygone>>();
                    }


                    Point t = new Point(float.Parse(elems[2], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture),
                        float.Parse(elems[3], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture),
                        float.Parse(elems[4], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture));
                    Point m1 = new Point(float.Parse(elems[5], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture),
                        float.Parse(elems[6], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture),
                        float.Parse(elems[7], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture));
                    Point m2 = new Point(float.Parse(elems[8], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture),
                        float.Parse(elems[9], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture),
                        float.Parse(elems[10], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture));
                    Point m3 = new Point(float.Parse(elems[11], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture),
                        float.Parse(elems[12], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture),
                        float.Parse(elems[13], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture));
                    var col = int.Parse(elems[1]);
                    for (int i = 0; i < poly.Count; i++)
                    {
                        poly[i].Matrix(m1, m2, m3, t);
                        if (poly[i].Color == 16)
                            poly[i].Color = col;
                    }
                    return poly;
                    //break;
                case 2:
                    //We don't need the specific lines                    
                    break;

                case 3:
                    //it's the standard triangle
                    if (elems.Length != 11)
                        break;
                    Point ptc1 = new Point(float.Parse(elems[2], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture),
                        float.Parse(elems[3], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture),
                        float.Parse(elems[4], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture));
                    Point ptc2 = new Point(float.Parse(elems[5], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture),
                        float.Parse(elems[6], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture),
                        float.Parse(elems[7], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture));
                    Point ptc3 = new Point(float.Parse(elems[8], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture),
                        float.Parse(elems[9], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture),
                        float.Parse(elems[10], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture));
                    Polygone plc = new Polygone(ptc1, ptc2, ptc3);
                    plc.Color = int.Parse(elems[1]);
                    return new List<Polygone> { plc };
                    //break;
                case 4:
                    //it's a rectangle, will need to transform into 2 triuangles
                    if (elems.Length != 14)
                        break;
                    float a1 = float.Parse(elems[2], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture);
                    float a2 = float.Parse(elems[3], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture);
                    float a3 = float.Parse(elems[4], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture);
                    float b1 = float.Parse(elems[5], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture);
                    float b2 = float.Parse(elems[6], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture);
                    float b3 = float.Parse(elems[7], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture);
                    float c1 = float.Parse(elems[8], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture);
                    float c2 = float.Parse(elems[9], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture);
                    float c3 = float.Parse(elems[10], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture);
                    float d1 = float.Parse(elems[11], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture);
                    float d2 = float.Parse(elems[12], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture);
                    float d3 = float.Parse(elems[13], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture);
                    Polygone qq1;
                    Polygone qq2;
                    qq1 = new Polygone(new Point(a1, a2, a3),
                        new Point(b1, b2, b3), new Point(c1, c2, c3));
                    qq2 = new Polygone(new Point(c1, c2, c3),
                        new Point(d1, d2, d3), new Point(a1, a2, a3));

                    qq1.Color = int.Parse(elems[1]);
                    qq2.Color = int.Parse(elems[1]);
                    return new List<Polygone> { qq1, qq2 };
                    //break;
                case 5:
                    //As for case 2, there is no need of converting hidden lines
                    break;
                case 0:
                    //check if it is a part as we'll save it at the end
                    if (elems.Length > 3)
                    {
                        if (elems[1] == @"!LDRAW_ORG")
                            if (elems[2].ToLower() == @"part")
                                IsPart = true;
                    }
                    break;
                default:
                    break;
            }
            return new List<Polygone>();


        }

        private int GetFirstDigit(string strline)
        {
            strline = strline.TrimStart(' ');
            if (strline.Length < 3)
                return -1;
            return strline[0] - 48;
        }

        public List<Polygone> LoadFromFile()
        {
            if (Loader.NoPolygone.Where(x => x == FileName).Any())
                return Polygones;
            Console.WriteLine($"Reading file {FileName}");
            try
            {
                StreamReader file = new StreamReader(Path + FileName);
                while (!file.EndOfStream)
                {
                    var strline = file.ReadLine();
                    strline = strline.CleanSpace();
                    var ret = DecryptLine(strline);
                    if (ret.Any())
                        Polygones.AddRange(ret);
                }
                //Adding the new element to the main base
                // save only small sized elements, large ones take more time to be cloned
                if ((IsPart) && (Polygones.Count < 5000))
                {
                    DatPart dtobj = new DatPart();
                    Console.WriteLine($"Adding {FileName} to saved list");
                    dtobj.AddPolygones(Polygones.DeepClone<List<Polygone>>());
                    dtobj.Name = FileName;
                    Loader.DatObj.Add(dtobj);
                }
                if (!Polygones.Any())
                    Loader.NoPolygone.Add(FileName);
                
                file.Close();
                file.Dispose();
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex.Message);
            }
            return Polygones;
        }
    }
}
