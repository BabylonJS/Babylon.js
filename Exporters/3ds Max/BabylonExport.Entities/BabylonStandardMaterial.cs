using System.Runtime.Serialization;
namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonStandardMaterial: BabylonMaterial
    {
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
        public BabylonTexture diffuseTexture { get; set; }

        [DataMember]
        public BabylonFresnelParameters diffuseFresnelParameters { get; set; }

        [DataMember]
        public BabylonTexture ambientTexture { get; set; }

        [DataMember]
        public BabylonTexture opacityTexture { get; set; }

        [DataMember]
        public BabylonFresnelParameters opacityFresnelParameters { get; set; }

        [DataMember]
        public BabylonTexture reflectionTexture { get; set; }

        [DataMember]
        public BabylonFresnelParameters reflectionFresnelParameters { get; set; }

        [DataMember]
        public BabylonTexture emissiveTexture { get; set; }
        [DataMember]
        public BabylonTexture lightmapTexture { get; set; }
        [DataMember]
        public bool useLightmapAsShadowmap { get; set; }

        [DataMember]
        public BabylonFresnelParameters emissiveFresnelParameters { get; set; }

        [DataMember]
        public BabylonTexture specularTexture { get; set; }

        [DataMember]
        public BabylonTexture bumpTexture { get; set; }

        [DataMember]
        public bool useSpecularOverAlpha { get; set; }

        [DataMember]
        public bool disableLighting { get; set; }

        public BabylonStandardMaterial() : base()
        {
            ambient = new[] {1.0f, 1.0f, 1.0f};
            diffuse = new[] { 1.0f, 1.0f, 1.0f };
            specular = new[] { 1.0f, 1.0f, 1.0f };
            emissive = new[] { 0f, 0f, 0f };
            specularPower = 64;
            useSpecularOverAlpha = true;
        }
    }
}
