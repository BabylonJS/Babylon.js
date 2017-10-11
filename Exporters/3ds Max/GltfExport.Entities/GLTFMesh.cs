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

        // Identifier shared between a babylon mesh and its instances
        public int idGroupInstance;
		// Babylon stores reference to skeleton inside a mesh
		// While glTF stores it inside a node
        // Identifier of the skeleton temporary stored here for transition
        public int? idBabylonSkeleton;
    }
}
