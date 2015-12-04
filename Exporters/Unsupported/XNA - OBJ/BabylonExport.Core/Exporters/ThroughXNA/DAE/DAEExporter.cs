using System.Collections.Generic;
using BabylonExport.Core.Exporters.XNA;

namespace BabylonExport.Core.Exporters.DAE
{
    public class DAEExporter : XNAExporter
    {
        public override string SupportedExtensions
        {
            get { return ".dae"; }
        }

        public override string Importer
        {
            get { return "ColladaStdModelImporter"; }
        }

        static readonly string[] extraPipelineAssemblies =
        {
            "ColladaXnaImporter",
        };

        public override IEnumerable<string> ExtraPipelineAssemblies
        {
            get { return extraPipelineAssemblies; }
        }
    }
}
