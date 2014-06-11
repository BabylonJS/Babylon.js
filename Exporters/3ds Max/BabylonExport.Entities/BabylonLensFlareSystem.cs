using System.Runtime.Serialization;

namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonLensFlareSystem
    {
        [DataMember]
        public string emitterId { get; set; }

        [DataMember]
        public int borderLimit { get; set; }

        [DataMember]
        public BabylonLensFlare[] flares { get; set; }
    }
}
