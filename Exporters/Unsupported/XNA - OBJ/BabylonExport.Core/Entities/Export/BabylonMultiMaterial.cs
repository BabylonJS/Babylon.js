using System.Runtime.Serialization;

namespace BabylonExport.Core
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
