using System.Runtime.Serialization;

namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonActionsProperties
    {
        [DataMember]
        public string name { get; set; }

        [DataMember]
        public string value { get; set; }

        [DataMember]
        public string targetType { get; set; }
    }

    [DataContract]
    public class BabylonActions
    {
        [DataMember]
        public string name { get; set; }

        [DataMember]
        public int type { get; set; }

        [DataMember]
        public bool detached { get; set; }

        [DataMember]
        public BabylonActions[] children { get; set; }

        [DataMember]
        public BabylonActions[] combine { get; set; }

        [DataMember]
        public BabylonActionsProperties[] properties { get; set; }
    }
}
