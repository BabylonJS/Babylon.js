using System.Runtime.Serialization;

namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonDirectionalLight : BabylonLight
    {
        [DataMember]
        public float shadowOrthoScale { get; set; }

        public BabylonDirectionalLight()
        {
            shadowOrthoScale = 0.5f;
        }
    }
}
