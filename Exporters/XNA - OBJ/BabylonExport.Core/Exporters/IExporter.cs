using System;

namespace BabylonExport.Core
{
    public interface IExporter
    {
        event Action<int> OnImportProgressChanged;

        string SupportedExtensions { get; }

        void GenerateBabylonFile(string file, string outputFile, bool skinned, bool rightToLeft);
    }
}
