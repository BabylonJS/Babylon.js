using System.Runtime.Serialization;

namespace GLTFExport.Entities
{
    [DataContract]
    public class GLTFMaterial : GLTFIndexedChildRootProperty
    {
        public enum AlphaMode
        {
            OPAQUE,
            MASK,
            BLEND
        }

        [DataMember(EmitDefaultValue = false)]
        public GLTFPBRMetallicRoughness pbrMetallicRoughness { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public GLTFTextureInfo normalTexture { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public GLTFTextureInfo occlusionTexture { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public GLTFTextureInfo emissiveTexture { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public float[] emissiveFactor { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public string alphaMode { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public float? alphaCutoff { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public bool doubleSided { get; set; }

        public string id;
    }
}
