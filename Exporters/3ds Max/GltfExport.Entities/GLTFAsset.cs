using System.Runtime.Serialization;

namespace GLTFExport.Entities
{
    [DataContract]
    public class GLTFAsset : GLTFProperty
    {
        [DataMember(IsRequired = true)]
        public string version { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public string generator { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public string copyright { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public string minVersion { get; set; }
    }
}
