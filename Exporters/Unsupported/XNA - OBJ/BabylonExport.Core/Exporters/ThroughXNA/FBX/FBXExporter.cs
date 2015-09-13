using System.Collections.Generic;
using BabylonExport.Core.Exporters.XNA;

namespace BabylonExport.Core.Exporters.FBX
{
    public class FBXExporter : XNAExporter
    {
        public override string SupportedExtensions
        {
            get { return ".fbx"; }
        }

        public override string Importer
        {
            get { return null; } // use default one
        }

        static readonly string[] extraPipelineAssemblies =
        {
            "Microsoft.Xna.Framework.Content.Pipeline.FBXImporter, Version=4.0.0.0, PublicKeyToken=842cf8be1de50553",
        };

        public override IEnumerable<string> ExtraPipelineAssemblies 
        {
            get { return extraPipelineAssemblies; } 
        }
    }
}
