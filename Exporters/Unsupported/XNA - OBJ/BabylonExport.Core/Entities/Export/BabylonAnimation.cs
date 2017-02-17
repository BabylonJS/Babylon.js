using System.Runtime.Serialization;
using Vertice.Nova.Animations;

namespace BabylonExport.Core
{
    [DataContract]
    public class BabylonAnimation
    {
        [DataMember]
        public string name { get; set; }

        [DataMember]
        public string property { get; set; }

        [DataMember]
        public DataType dataType { get; set; }

        [DataMember]
        public InterpolationLoop loopBehavior { get; set; }

        [DataMember]
        public int framePerSecond { get; set; }

        [DataMember]
        public BabylonAnimationKey[] keys { get; set; }

        public enum DataType
        {
            Float = 0,
            Vector3 = 1,
            Quaternion = 2,
            Matrix = 3
        }
    }
}
