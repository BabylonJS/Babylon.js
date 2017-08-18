using System.Collections.Generic;
using System.Runtime.Serialization;

namespace GLTFExport.Entities
{
    [DataContract]
    public class GLTFMeshPrimitive : GLTFProperty
    {
        public enum FillMode
        {
            POINTS = 0,
            LINES = 1,
            LINE_LOOP = 2,
            LINE_STRIP = 3,
            TRIANGLES = 4,
            TRIANGLE_STRIP = 5,
            TRIANGLE_FAN = 6
        }

        public enum Attribute
        {
            POSITION,
            NORMAL,
            TANGENT,
            TEXCOORD_0,
            TEXCOORD_1,
            COLOR_0,
            JOINTS_0,
            WEIGHTS_0
        }

        [DataMember(IsRequired = true)]
        public Dictionary<string, int> attributes { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public int? indices { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public FillMode? mode { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public int? material { get; set; }

        //[DataMember]
        //public Dictionary<string, int>[] targets { get; set; }
    }
}
