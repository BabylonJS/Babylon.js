using System.Runtime.Serialization;

namespace GLTFExport.Entities
{
    [DataContract]
    public class GLTFBuffer : GLTFIndexedChildRootProperty
    {
        [DataMember(EmitDefaultValue = false)]
        public string uri { get; set; }

        [DataMember(IsRequired = true)]
        public int byteLength { get; set; }
    }
}
