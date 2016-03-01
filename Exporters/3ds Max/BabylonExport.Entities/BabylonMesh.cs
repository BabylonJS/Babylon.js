using System.Runtime.Serialization;

namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonMesh : BabylonAbstractMesh
    {
        [DataMember]
        public string id { get; set; }

        [DataMember]
        public string parentId { get; set; }

        [DataMember]
        public string materialId { get; set; }

        [DataMember]
        public bool isEnabled { get; set; }

        [DataMember]
        public bool isVisible { get; set; }

        [DataMember]
        public bool pickable { get; set; }

        [DataMember]
        public float[] pivotMatrix { get; set; }

        [DataMember]
        public float[] positions { get; set; }

        [DataMember]
        public float[] normals { get; set; }

        [DataMember]
        public float[] uvs { get; set; }

        [DataMember]
        public float[] uvs2 { get; set; }

        [DataMember]
        public float[] colors { get; set; }

        [DataMember]
        public bool hasVertexAlpha { get; set; }

        [DataMember]
        public int[] matricesIndices { get; set; }

        [DataMember]
        public float[] matricesWeights { get; set; }

        [DataMember]
        public int[] indices { get; set; }

        [DataMember]
        public bool checkCollisions { get; set; }

        [DataMember]
        public bool receiveShadows { get; set; }    
    
        [DataMember]
        public bool infiniteDistance { get; set; }
        
        [DataMember]
        public int billboardMode { get; set; }

        [DataMember]
        public float visibility { get; set; }

        [DataMember]
        public BabylonSubMesh[] subMeshes { get; set; }

        [DataMember]
        public BabylonAbstractMesh[] instances { get; set; }

        [DataMember]
        public int skeletonId { get; set; }

        [DataMember]
        public bool showBoundingBox { get; set; }

        [DataMember]
        public bool showSubMeshesBoundingBox { get; set; }

        [DataMember]
        public bool applyFog { get; set; }

        [DataMember]
        public int alphaIndex { get; set; }

        [DataMember]
        public int physicsImpostor { get; set; }

        [DataMember]
        public float physicsMass { get; set; }

        [DataMember]
        public float physicsFriction { get; set; }

        [DataMember]
        public float physicsRestitution { get; set; }

        public BabylonMesh()
        {
            isEnabled = true;
            isVisible = true;

            position = new[] { 0f, 0f, 0f };
            rotation = new[] { 0f, 0f, 0f };
            scaling = new[] { 1f, 1f, 1f };

            billboardMode = 0;

            visibility = 1.0f;

            skeletonId = -1;

            pickable = true;
        }
    }
}
