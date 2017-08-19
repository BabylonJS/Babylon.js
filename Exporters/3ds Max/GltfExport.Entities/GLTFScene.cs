using System.Collections.Generic;
using System.Runtime.Serialization;

namespace GLTFExport.Entities
{
    [DataContract]
    public class GLTFScene : GLTFChildRootProperty
    {
        [DataMember(EmitDefaultValue = false)]
        public int[] nodes { get; set; }

        public List<int> NodesList { get; private set; }

        public GLTFScene()
        {
            NodesList = new List<int>();
        }

        public void Prepare()
        {
            // Do not export empty arrays
            if (NodesList.Count > 0)
            {
                nodes = NodesList.ToArray();
            }
        }
    }
}
