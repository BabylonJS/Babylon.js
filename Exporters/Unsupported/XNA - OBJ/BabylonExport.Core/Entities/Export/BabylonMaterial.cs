using System.Runtime.Serialization;
using BabylonExport.Core.Exporters;

namespace BabylonExport.Core
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
        public float[] ambient { get; set; }

        [DataMember]
        public float[] diffuse { get; set; }

        [DataMember]
        public float[] specular { get; set; }

        [DataMember]
        public float[] emissive { get; set; }

        [DataMember]
        public float specularPower { get; set; }

        [DataMember]
        public float alpha { get; set; }

        [DataMember]
        public BabylonTexture diffuseTexture { get; set; }

        [DataMember]
        public BabylonTexture ambientTexture { get; set; }

        [DataMember]
        public BabylonTexture opacityTexture { get; set; }

        [DataMember]
        public BabylonTexture reflectionTexture { get; set; }

        [DataMember]
        public BabylonTexture emissiveTexture { get; set; }

        [DataMember]
        public BabylonTexture specularTexture { get; set; }

        [DataMember]
        public BabylonTexture bumpTexture { get; set; }

        public BabylonMaterial()
        {
            backFaceCulling = true;
            ambient = new[] {1.0f, 1.0f, 1.0f};
            diffuse = new[] { 1.0f, 1.0f, 1.0f };
            specular = new[] { 1.0f, 1.0f, 1.0f };
            emissive = new[] { 0f, 0f, 0f };
            specularPower = 64;
            alpha = 1.0f;
        }
    }
}
