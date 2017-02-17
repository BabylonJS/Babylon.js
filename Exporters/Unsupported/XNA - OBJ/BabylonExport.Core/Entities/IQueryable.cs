using SharpDX;

namespace BabylonExport.Core
{
    public interface IQueryable
    {
        bool HasWeights
        {
            get;
        }

        Vector3 GetPosition();
    }
}
