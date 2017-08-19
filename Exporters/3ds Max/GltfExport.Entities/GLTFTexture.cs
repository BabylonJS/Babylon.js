using System.Runtime.Serialization;

namespace GLTFExport.Entities
{
    [DataContract]
    public class GLTFTexture : GLTFIndexedChildRootProperty
    {
        [DataMember(EmitDefaultValue = false)]
        public int? sampler { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public int? source { get; set; }
    }
}
