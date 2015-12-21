using System.Runtime.Serialization;

namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonAnimation
    {
        [DataMember]
        public string name { get; set; }

        [DataMember]
        public string property { get; set; }

        [DataMember]
        public int dataType { get; set; }

        [DataMember]
        public int loopBehavior { get; set; }

        [DataMember]
        public int framePerSecond { get; set; }

        [DataMember]
        public BabylonAnimationKey[] keys { get; set; }

        public enum DataType
        {
            Float = 0,
            Vector3 = 1,
            Quaternion = 2,
            Matrix = 3,
            Color3 = 4,
        }

        public enum LoopBehavior
        {
            Relative = 0,
            Cycle = 1,
            Constant = 2
        }
    }
}
