using System.Runtime.Serialization;

namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonSubMesh
    {
        [DataMember]
        public int materialIndex { get; set; }

        [DataMember]
        public int verticesStart { get; set; }

        [DataMember]
        public int verticesCount { get; set; }

        [DataMember]
        public int indexStart { get; set; }

        [DataMember]
        public int indexCount { get; set; }

    }
}
