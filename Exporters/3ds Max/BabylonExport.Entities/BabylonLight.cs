using System.Runtime.Serialization;

namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonLight : BabylonNode
    {
        [DataMember]
        public float[] position { get; set; }

        [DataMember]
        public float[] direction { get; set; }

        [DataMember]
        public int type { get; set; }

        [DataMember]
        public float[] diffuse { get; set; }

        [DataMember]
        public float[] specular { get; set; }

        [DataMember]
        public float intensity { get; set; }

        [DataMember]
        public float range { get; set; }

        [DataMember]
        public float exponent { get; set; }

        [DataMember]
        public float angle { get; set; }

        [DataMember]
        public float[] groundColor { get; set; }

        [DataMember]
        public string[] excludedMeshesIds { get; set; }

        [DataMember]
        public string[] includedOnlyMeshesIds { get; set; }

        [DataMember]
        public object metadata { get; set; }

        [DataMember]
        public string tags { get; set; }

        public BabylonLight()
        {
            diffuse = new[] {1.0f, 1.0f, 1.0f};
            specular = new[] { 1.0f, 1.0f, 1.0f };
            intensity = 1.0f;
            range = float.MaxValue;
        }
    }
}
