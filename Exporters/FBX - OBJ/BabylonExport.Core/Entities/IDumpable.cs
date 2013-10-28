using System.Collections.Generic;

namespace BabylonExport.Core
{
    public interface IDumpable
    {
        void DumpPositions(List<float> list);
        void DumpNormals(List<float> list);
        void DumpUVs(List<float> list);
        void DumpUVs2(List<float> list);
        void DumpColors(List<float> list);
        void DumpMatricesIndices(List<int> list);
        void DumpMatricesWeights(List<float> list);
    }
}
