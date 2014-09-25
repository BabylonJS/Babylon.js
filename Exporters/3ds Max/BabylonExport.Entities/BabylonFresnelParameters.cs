using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;

namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonFresnelParameters
    {
        [DataMember]
        public float[] leftColor { get; set; }

        [DataMember]
        public float[] rightColor { get; set; }

        [DataMember]
        public bool isEnabled { get; set; }

        [DataMember]
        public float bias { get; set; }

        [DataMember]
        public float power { get; set; }
    }
}
