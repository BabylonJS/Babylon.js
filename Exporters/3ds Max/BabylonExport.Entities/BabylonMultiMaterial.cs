using System.Runtime.Serialization;

namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonMultiMaterial
    {
        [DataMember]
        public string name { get; set; }

        [DataMember]
        public string id { get; set; }

        [DataMember]
        public string[] materials { get; set; }        
    }
}
