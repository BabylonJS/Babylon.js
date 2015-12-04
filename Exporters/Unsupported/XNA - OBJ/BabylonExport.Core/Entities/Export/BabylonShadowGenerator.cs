using System.Runtime.Serialization;
using Vertice.Nova.Animations;

namespace BabylonExport.Core
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
        public string[] renderList { get; set; }

    }
}
