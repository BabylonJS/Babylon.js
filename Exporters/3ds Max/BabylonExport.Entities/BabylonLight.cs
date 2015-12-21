using System.Runtime.Serialization;

namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonLight : BabylonIAnimatable
    {
        [DataMember]
        public string name { get; set; }

        [DataMember]
        public string id { get; set; }

        [DataMember]
        public string parentId { get; set; }

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
        public bool autoAnimate { get; set; }

        [DataMember]
        public int autoAnimateFrom { get; set; }

        [DataMember]
        public int autoAnimateTo { get; set; }

        [DataMember]
        public bool autoAnimateLoop { get; set; }

        [DataMember]
        public BabylonAnimation[] animations { get; set; }

        public BabylonLight()
        {
            diffuse = new[] {1.0f, 1.0f, 1.0f};
            specular = new[] { 1.0f, 1.0f, 1.0f };
            intensity = 1.0f;
            range = float.MaxValue;
        }
    }
}
