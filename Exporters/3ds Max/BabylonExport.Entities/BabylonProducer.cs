using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;

namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonProducer
    {
        [DataMember]
        public string name { get; set; }

        [DataMember]
        public string version { get; set; }

        [DataMember]
        public string exporter_version { get; set; }

        [DataMember]
        public string file { get; set; }
    }
}
