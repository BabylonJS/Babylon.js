using System.Runtime.Serialization;

namespace GLTFExport.Entities
{
    [DataContract]
    public class GLTFMesh : GLTFIndexedChildRootProperty
    {
        [DataMember (IsRequired = true)]
        public GLTFMeshPrimitive[] primitives { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public float[] weights { get; set; }

        public GLTFNode gltfNode;
    }
}
