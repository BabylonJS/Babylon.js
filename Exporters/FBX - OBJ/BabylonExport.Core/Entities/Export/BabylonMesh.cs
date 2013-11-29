using System.Runtime.Serialization;

namespace BabylonExport.Core
{
    [DataContract]
    public class BabylonMesh
    {
        [DataMember]
        public string name { get; set; }

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
        public float[] position { get; set; }

        [DataMember]
        public float[] rotation { get; set; }

        [DataMember]
        public float[] scaling { get; set; }

        [DataMember]
        public float[] localMatrix { get; set; }

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
        public int skeletonId { get; set; }

        [DataMember]
        public bool autoAnimate { get; set; }

        [DataMember]
        public int autoAnimateFrom { get; set; }

        [DataMember]
        public int autoAnimateTo { get; set; }

        [DataMember]
        public bool autoAnimateLoop { get; set; }

        [DataMember]
        public BabylonAnimation[] animations { get; set; }

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
        }
    }
}
