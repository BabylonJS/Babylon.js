using BabylonExport.Core;
using BabylonExport.Core.Exporters;
using BabylonExport.Interface;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace BabylonExport
{
    public class Service : IService
    {
        public bool Convert(string input, string outputName)
        {
            try
            {
                Console.WriteLine("input:" + input);
                Console.WriteLine("outputName:" + outputName);
                System.Diagnostics.Process p = new System.Diagnostics.Process();
                p.StartInfo.FileName = "BabylonExport.exe";
                p.StartInfo.Arguments = "/i:" + input + " /o:" + outputName;
                p.Start();
                if (p.WaitForExit(1000 * 60 * 3))
                {
                    p.Close();
                    return true;
                }
                else
                {
                    p.Close();
                    return false;
                }
                
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return false;
            }
            
        }


    }
}
