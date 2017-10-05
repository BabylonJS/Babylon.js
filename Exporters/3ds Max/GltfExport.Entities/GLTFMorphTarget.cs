using System.Collections.Generic;
using System.Runtime.Serialization;

namespace GLTFExport.Entities
{
    [DataContract]
    public class GLTFMorphTarget : Dictionary<string, int>
    {
        public enum Attribute
        {
            POSITION,
            NORMAL,
            TANGENT
        }
    }
}
