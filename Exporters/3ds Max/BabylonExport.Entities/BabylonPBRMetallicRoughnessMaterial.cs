using System.Runtime.Serialization;

namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonPBRMetallicRoughnessMaterial : BabylonMaterial
    {
        public enum TransparencyMode
        {
            OPAQUE = 0,
            ALPHATEST = 1,
            ALPHABLEND = 2,
            ALPHATESTANDBLEND = 3
        }

        [DataMember]
        public string customType { get; private set; }

        [DataMember]
        public float[] baseColor { get; set; }

        [DataMember]
        public BabylonTexture baseTexture { get; set; }

        [DataMember]
        public float metallic { get; set; }

        [DataMember]
        public float roughness { get; set; }

        [DataMember]
        public BabylonTexture metallicRoughnessTexture { get; set; }

        [DataMember]
        public int maxSimultaneousLights { get; set; }

        [DataMember]
        public bool disableLighting { get; set; }

        [DataMember]
        public BabylonTexture environmentTexture { get; set; }

        [DataMember]
        public bool invertNormalMapX { get; set; }

        [DataMember]
        public bool invertNormalMapY { get; set; }

        [DataMember]
        public BabylonTexture normalTexture { get; set; }

        [DataMember]
        public float[] emissiveColor { get; set; }

        [DataMember]
        public BabylonTexture emissiveTexture { get; set; }

        [DataMember]
        public float occlusionStrength { get; set; }

        [DataMember]
        public BabylonTexture occlusionTexture { get; set; } // ignored

        [DataMember]
        public float alphaCutOff { get; set; }

        [DataMember]
        public int transparencyMode { get; set; }

        [DataMember]
        public bool doubleSided { get; set; } // ignored

        public BabylonPBRMetallicRoughnessMaterial() : base()
        {
            customType = "BABYLON.PBRMetallicRoughnessMaterial";

            maxSimultaneousLights = 4;
            emissiveColor = new[] { 0f, 0f, 0f };
            occlusionStrength = 1.0f;
            alphaCutOff = 0.4f;
            transparencyMode = (int)TransparencyMode.OPAQUE;
        }
    }
}
