using System.Runtime.Serialization;

namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonAnimationKey
    {
        [DataMember]
        public float frame { get; set; }

        [DataMember]
        public float[] values { get; set; }
    }
}
