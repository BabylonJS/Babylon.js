using System.Runtime.Serialization;

namespace GLTFExport.Entities
{
    [DataContract]
    public class GLTFSkin : GLTFIndexedChildRootProperty
    {
        /// <summary>
        /// The index of the accessor containing the floating-point 4x4 inverse-bind matrices.
        /// The default is that each matrix is a 4x4 identity matrix, which implies that inverse-bind matrices were pre-applied.
        /// </summary>
        [DataMember(EmitDefaultValue = false)]
        public int? inverseBindMatrices { get; set; }

        /// <summary>
        /// The index of the node used as a skeleton root. When undefined, joints transforms resolve to scene root.
        /// </summary>
        [DataMember(EmitDefaultValue = false)]
        public int? skeleton { get; set; }

        /// <summary>
        /// Indices of skeleton nodes, used as joints in this skin.
        /// </summary>
        [DataMember(IsRequired = true)]
        public int[] joints { get; set; }
    }
}
