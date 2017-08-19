using System.Runtime.Serialization;

namespace GLTFExport.Entities
{
    [DataContract]
    public class GLTFTextureInfo : GLTFChildRootProperty
    {
        [DataMember(IsRequired = true)]
        public int index { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public int? texCoord { get; set; }
    }
}
