using System.Runtime.Serialization;

namespace BabylonExport
{
    [DataContract]
    public class BabylonCamera
    {
        [DataMember]
        public string name { get; set; }

        [DataMember]
        public string id { get; set; }

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
