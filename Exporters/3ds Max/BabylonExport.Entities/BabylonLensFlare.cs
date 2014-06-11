using System.Runtime.Serialization;

namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonLensFlare
    {
        [DataMember]
        public float position { get; set; }

        [DataMember]
        public float size { get; set; }

        [DataMember]
        public float[] color { get; set; }

        [DataMember]
        public string textureName { get; set; }
    }
}
