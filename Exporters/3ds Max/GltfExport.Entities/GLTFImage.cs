using System.Runtime.Serialization;

namespace GLTFExport.Entities
{
    [DataContract]
    public class GLTFImage : GLTFIndexedChildRootProperty
    {
        [DataMember(EmitDefaultValue = false)]
        public string uri { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public string mimeType { get; set; } // "image/jpeg" or "image/png"

        [DataMember(EmitDefaultValue = false)]
        public int? bufferView { get; set; }
    }
}
