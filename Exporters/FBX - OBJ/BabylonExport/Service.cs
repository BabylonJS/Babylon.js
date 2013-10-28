using BabylonExport.Core;
using BabylonExport.Core.Exporters;
using BabylonExport.Interface;
using System;
using System.Collections.Generic;
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
            var form = new Form();
            BabylonExport.Core.Exporters.FBX.GraphicsDeviceService.AddRef(form.Handle, 1, 1);

            var extension = Path.GetExtension(input).ToLower();
            try
            {
                foreach (var type in Assembly.LoadFrom("BabylonExport.Core.dll").GetTypes())
                {
                    var interf = type.GetInterface("BabylonExport.Core.IExporter");
                    if (interf != null)
                    {
                        var importer = (IExporter)Activator.CreateInstance(type);

                        if (!importer.SupportedExtensions.Contains(extension))
                        {
                            continue;
                        }

                        Console.WriteLine("Using " + type);

                        // Importation
                        try
                        {
                            Console.WriteLine(input);
                            importer.GenerateBabylonFile(input, outputName, false);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine(ex.Message);
                        }
                    }
                }
                return true;
            }
            catch (ReflectionTypeLoadException ex)
            {
                Console.WriteLine(ex.LoaderExceptions[0].Message);
                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return false;
            } 
            
        }


    }
}
