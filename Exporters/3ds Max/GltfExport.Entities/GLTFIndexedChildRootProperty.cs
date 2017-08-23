using System.Runtime.Serialization;

namespace GLTFExport.Entities
{
    [DataContract]
    public class GLTFIndexedChildRootProperty : GLTFChildRootProperty
    {
        public int index;
    }
}
