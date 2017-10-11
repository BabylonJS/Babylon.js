using System.Runtime.Serialization;

namespace GLTFExport.Entities
{
    [DataContract]
    public class GLTFChannelTarget : GLTFProperty
    {
        /// <summary>
        /// The index of the node to target.
        /// </summary>
        [DataMember(EmitDefaultValue = false)]
        public int? node { get; set; }

        /// <summary>
        /// The name of the node's TRS property to modify, or the "weights" of the Morph Targets it instantiates.
        /// </summary>
        [DataMember(IsRequired = true)]
        public string path { get; set; }
    }
}
