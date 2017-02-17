using System.Runtime.Serialization;
using Vertice.Nova.Animations;

namespace BabylonExport.Core
{
    [DataContract]
    public class BabylonBone
    {
        [DataMember]
        public string name { get; set; }

        [DataMember]
        public int index { get; set; }

        [DataMember]
        public int parentBoneIndex { get; set; }

        [DataMember]
        public float[] matrix { get; set; }

        [DataMember]
        public BabylonAnimation animation { get; set; }
    }
}
