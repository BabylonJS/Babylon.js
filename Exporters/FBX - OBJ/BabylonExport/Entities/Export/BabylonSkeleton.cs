using System.Runtime.Serialization;
using Vertice.Nova.Animations;

namespace BabylonExport
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
