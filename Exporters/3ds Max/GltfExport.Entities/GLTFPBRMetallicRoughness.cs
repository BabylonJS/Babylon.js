using System.Runtime.Serialization;

namespace GLTFExport.Entities
{
    [DataContract]
    public class GLTFPBRMetallicRoughness : GLTFProperty
    {
        [DataMember(EmitDefaultValue = false)]
        public float[] baseColorFactor { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public GLTFTextureInfo baseColorTexture { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public float? metallicFactor { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public float? roughnessFactor { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public GLTFTextureInfo metallicRoughnessTexture { get; set; }
    }
}
