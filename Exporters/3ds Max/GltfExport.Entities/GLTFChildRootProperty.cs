using System.Runtime.Serialization;

namespace GLTFExport.Entities
{
    [DataContract]
    public class GLTFChildRootProperty : GLTFProperty
    {
        [DataMember(EmitDefaultValue = false)]
        public string name { get; set; }
    }
}
