using System.Runtime.Serialization;

namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonShadowGenerator
    {
        [DataMember]
        public int mapSize { get; set; }

        [DataMember]
        public string lightId { get; set; }

        [DataMember]
        public bool useVarianceShadowMap { get; set; }

        [DataMember]
        public bool usePoissonSampling { get; set; }

        [DataMember]
        public string[] renderList { get; set; }

    }
}
