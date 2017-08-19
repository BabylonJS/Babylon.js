using System.Runtime.Serialization;

namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonCamera : BabylonNode
    {
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
        public float interaxialDistance { get; set; }

        [DataMember]
        public bool checkCollisions { get; set; }

        [DataMember]
        public bool applyGravity { get; set; }

        [DataMember]
        public float[] ellipsoid { get; set; }

        [DataMember]
        public int mode { get; set; }

        [DataMember]
        public float? orthoLeft { get; set; }

        [DataMember]
        public float? orthoRight { get; set; }

        [DataMember]
        public float? orthoBottom { get; set; }

        [DataMember]
        public float? orthoTop { get; set; }

        [DataMember]
        public bool isStereoscopicSideBySide;

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
            interaxialDistance = 0.0637f;

            mode = 0;
            orthoLeft = null;
            orthoRight = null;
            orthoBottom = null;
            orthoTop = null;

            type = "FreeCamera";
        }
    }
}
