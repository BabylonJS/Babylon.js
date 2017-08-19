using System.Runtime.Serialization;

namespace GLTFExport.Entities
{
    [DataContract]
    public class GLTFBufferView : GLTFIndexedChildRootProperty
    {
        [DataMember(IsRequired = true)]
        public int buffer { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public int byteOffset { get; set; }

        [DataMember(IsRequired = true)]
        public int byteLength { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public int? byteStride { get; set; }

        public GLTFBuffer Buffer;
    }
}
