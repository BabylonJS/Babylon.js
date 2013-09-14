using SharpDX;

namespace BabylonExport
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
