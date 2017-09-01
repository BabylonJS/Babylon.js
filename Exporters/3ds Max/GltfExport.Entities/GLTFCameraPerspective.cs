using System.Runtime.Serialization;

namespace GLTFExport.Entities
{
    [DataContract]
    public class GLTFCameraPerspective : GLTFProperty
    {
        [DataMember(EmitDefaultValue = false)]
        public float? aspectRatio { get; set; }

        [DataMember(IsRequired = true)]
        public float yfov { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public float? zfar { get; set; }

        [DataMember(IsRequired = true)]
        public float znear { get; set; }
    }
}
