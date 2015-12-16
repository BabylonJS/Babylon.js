using System.Runtime.Serialization;

namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonSkeleton
    {
        [DataMember]
        public int id { get; set; }
        
        [DataMember]
        public string name { get; set; }

        [DataMember]
        public BabylonBone[] bones { get; set; }
    }
}
