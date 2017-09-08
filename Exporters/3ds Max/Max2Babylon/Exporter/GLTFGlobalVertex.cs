using Autodesk.Max;

namespace Max2Babylon
{
    public class GLTFGlobalVertex
    {
        public IPoint3 Position { get; set; }
        public IPoint3 Normal { get; set; }
        public IPoint2 UV { get; set; }
        public IPoint2 UV2 { get; set; }
        public float[] Color { get; set; }
    }
}
