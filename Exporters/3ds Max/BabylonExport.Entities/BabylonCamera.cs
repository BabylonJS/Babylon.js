using System.Runtime.Serialization;

namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonCamera : BabylonIAnimatable
    {
        [DataMember]
        public string name { get; set; }

        [DataMember]
        public string id { get; set; }

        [DataMember]
        public string parentId { get; set; }

        [DataMember]
        public string lockedTargetId { get; set; }

        [DataMember]
        public string type { get; set; }

        [DataMember]
        public float[] position { get; set; }

        [DataMember]
        public float[] rotation { get; set; }

        [DataMember]
        public float[] target { get; set; }

        [DataMember]
        public float fov { get; set; }

        [DataMember]
        public float minZ { get; set; }

        [DataMember]
        public float maxZ { get; set; }

        [DataMember]
        public float speed { get; set; }

        [DataMember]
        public float inertia { get; set; }

        [DataMember]
        public bool checkCollisions { get; set; }

        [DataMember]
        public bool applyGravity { get; set; }

        [DataMember]
        public float[] ellipsoid { get; set; }

        [DataMember]
        public bool autoAnimate { get; set; }

        [DataMember]
        public int autoAnimateFrom { get; set; }

        [DataMember]
        public int autoAnimateTo { get; set; }

        [DataMember]
        public bool autoAnimateLoop { get; set; }

        [DataMember]
        public BabylonAnimation[] animations { get; set; }

        [DataMember]
        public object metadata { get; set; }

        [DataMember]
        public string tags { get; set; }

        public BabylonCamera()
        {
            position = new[] { 0f, 0f, 0f };
            rotation = new[] { 0f, 0f, 0f };

            // Default values
            fov = 0.8f;
            minZ = 0.1f;
            maxZ = 5000.0f;
            speed = 1.0f;
            inertia = 0.9f;
        }
    }
}
