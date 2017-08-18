using System.Runtime.Serialization;

namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonNode : BabylonIAnimatable
    {
        [DataMember]
        public string name { get; set; }

        [DataMember]
        public string id { get; set; }

        [DataMember]
        public string parentId { get; set; }

        [DataMember]
        public BabylonAnimation[] animations { get; set; }

        [DataMember]
        public bool autoAnimate { get; set; }

        [DataMember]
        public int autoAnimateFrom { get; set; }

        [DataMember]
        public int autoAnimateTo { get; set; }

        [DataMember]
        public bool autoAnimateLoop { get; set; }
    }
}
