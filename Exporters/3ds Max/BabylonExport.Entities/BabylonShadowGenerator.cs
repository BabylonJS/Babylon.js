using System.Runtime.Serialization;

namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonShadowGenerator
    {
        [DataMember]
        public int mapSize { get; set; }

        [DataMember]
        public float bias { get; set; }

        [DataMember]
        public string lightId { get; set; }

        [DataMember]
        public bool useVarianceShadowMap { get; set; }

        [DataMember]
        public bool usePoissonSampling { get; set; }

        [DataMember]
        public bool useBlurVarianceShadowMap { get; set; }

        [DataMember]
        public float blurScale { get; set; }

        [DataMember]
        public float blurBoxOffset { get; set; }

        [DataMember]
        public string[] renderList { get; set; }

        [DataMember]
        public bool forceBackFacesOnly { get; set; }

    }
}
