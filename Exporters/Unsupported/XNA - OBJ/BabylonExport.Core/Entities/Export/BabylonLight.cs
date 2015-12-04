using System.Runtime.Serialization;

namespace BabylonExport.Core
{
    [DataContract]
    public class BabylonLight
    {
        [DataMember]
        public string name { get; set; }

        [DataMember]
        public string id { get; set; }

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

        public BabylonLight()
        {
            diffuse = new[] {1.0f, 1.0f, 1.0f};
            specular = new[] { 1.0f, 1.0f, 1.0f };
            intensity = 1.0f;
        }
    }
}
