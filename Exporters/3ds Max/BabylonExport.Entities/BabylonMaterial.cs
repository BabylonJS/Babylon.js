using System.Runtime.Serialization;
namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonMaterial
    {
        [DataMember]
        public string name { get; set; }

        [DataMember]
        public string id { get; set; }

        [DataMember]
        public bool backFaceCulling { get; set; }

        [DataMember]
        public bool wireframe { get; set; }

        [DataMember]
        public float alpha { get; set; }

        [DataMember]
        public int alphaMode { get; set; }

        public BabylonMaterial()
        {
            backFaceCulling = true;

            alpha = 1.0f;

            alphaMode = 2;
        }
    }
}
