using System.Runtime.Serialization;

namespace GLTFExport.Entities
{
    [DataContract]
    public class GLTFChannel : GLTFProperty
    {
        /// <summary>
        /// The index of a sampler in this animation used to compute the value for the target,
        /// e.g., a node's translation, rotation, or scale (TRS).
        /// </summary>
        [DataMember(IsRequired = true)]
        public int sampler { get; set; }

        /// <summary>
        /// The index of the node and TRS property to target.
        /// </summary>
        [DataMember(IsRequired = true)]
        public GLTFChannelTarget target { get; set; }
    }
}
