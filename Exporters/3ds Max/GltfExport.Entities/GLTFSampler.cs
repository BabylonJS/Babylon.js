using System.Runtime.Serialization;

namespace GLTFExport.Entities
{
    [DataContract]
    public class GLTFSampler : GLTFIndexedChildRootProperty
    {
        public enum TextureMagFilter
        {
            NEAREST = 9728,
            LINEAR = 9729
        }

        public enum TextureMinFilter
        {
            NEAREST = 9728,
            LINEAR = 9729,
            NEAREST_MIPMAP_NEAREST = 9984,
            LINEAR_MIPMAP_NEAREST = 9985,
            NEAREST_MIPMAP_LINEAR = 9986,
            LINEAR_MIPMAP_LINEAR = 9987
        }

        public enum TextureWrapMode
        {
            CLAMP_TO_EDGE = 33071,
            MIRRORED_REPEAT = 33648,
            REPEAT = 10497
        }

        [DataMember(EmitDefaultValue = false)]
        public TextureMagFilter? magFilter { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public TextureMinFilter? minFilter { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public TextureWrapMode? wrapS { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public TextureWrapMode? wrapT { get; set; }
    }
}
