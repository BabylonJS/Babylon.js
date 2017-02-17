using System.Runtime.Serialization;

namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonAnimationKey
    {
        [DataMember]
        public int frame { get; set; }

        [DataMember]
        public float[] values { get; set; }
    }
}
