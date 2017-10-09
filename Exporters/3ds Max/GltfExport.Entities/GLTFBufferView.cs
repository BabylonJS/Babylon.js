using System.Collections.Generic;
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
        public int? byteStride { get; set; } // Field only defined for buffer views that contain vertex attributes.

        public GLTFBuffer Buffer;
        public List<GLTFAccessor> Accessors = new List<GLTFAccessor>();
        public List<byte> bytesList = new List<byte>();
    }
}
