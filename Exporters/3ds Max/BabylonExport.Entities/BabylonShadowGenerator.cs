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
        public bool useExponentialShadowMap { get; set; }

        [DataMember]
        public bool usePoissonSampling { get; set; }

        [DataMember]
        public bool useBlurExponentialShadowMap { get; set; }

        [DataMember]
        public float? depthScale { get; set; }

        [DataMember]
        public float darkness { get; set; }

        [DataMember]
        public float blurScale { get; set; }

        [DataMember]
        public float blurBoxOffset { get; set; }

        [DataMember]
        public string[] renderList { get; set; }

        [DataMember]
        public bool forceBackFacesOnly { get; set; }

        public BabylonShadowGenerator()
        {
            darkness = 0;
            blurScale = 2;
            blurBoxOffset = 0;
            bias = 0.00005f;
            depthScale = null;
            forceBackFacesOnly = false;
        }
    }
}
