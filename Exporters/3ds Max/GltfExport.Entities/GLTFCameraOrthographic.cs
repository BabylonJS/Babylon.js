using System.Runtime.Serialization;

namespace GLTFExport.Entities
{
    [DataContract]
    public class GLTFCameraOrthographic : GLTFProperty
    {
        [DataMember(IsRequired = true)]
        public float xmag { get; set; }

        [DataMember(IsRequired = true)]
        public float ymag { get; set; }

        [DataMember(IsRequired = true)]
        public float zfar { get; set; }

        [DataMember(IsRequired = true)]
        public float znear { get; set; }
    }
}
