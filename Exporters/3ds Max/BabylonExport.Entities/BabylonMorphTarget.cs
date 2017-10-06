using System.Runtime.Serialization;

namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonMorphTarget
    {
        [DataMember(EmitDefaultValue = false)]
        public string name { get; set; }

        [DataMember(IsRequired = true)]
        public float influence { get; set; }

        [DataMember(IsRequired = true)]
        public float[] positions { get; set; }

        [DataMember(IsRequired = true)]
        public float[] normals { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public BabylonAnimation[] animations { get; set; }
    }
}
