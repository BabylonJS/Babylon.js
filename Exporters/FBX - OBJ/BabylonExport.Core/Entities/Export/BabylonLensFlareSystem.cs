using System.Runtime.Serialization;

namespace BabylonExport.Core
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
