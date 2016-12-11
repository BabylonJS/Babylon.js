using System.Runtime.Serialization;
namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonUniversalCamera : BabylonCamera
    {
        [DataMember]
        public int mode { get; set; }

        [DataMember]
        public float? orthoLeft { get; set; }

        [DataMember]
        public float? orthoRight { get; set; }

        [DataMember]
        public float? orthoBottom { get; set; }

        [DataMember]
        public float? orthoTop { get; set; }

        [DataMember]
        public bool isStereoscopicSideBySide;

        public BabylonUniversalCamera()
        {
            this.mode = 0;
            this.orthoLeft = null;
            this.orthoRight = null;
            this.orthoBottom = null;
            this.orthoTop = null;
            this.type = "BABYLON.UniversalCamera";
        }
    }
}