using System.Runtime.Serialization;

namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonTexture
    {
        [DataMember]
        public string name { get; set; }

        [DataMember]
        public float level { get; set; }

        [DataMember]
        public bool hasAlpha { get; set; }

        [DataMember]
        public bool getAlphaFromRGB { get; set; }

        [DataMember]
        public int coordinatesMode { get; set; }
        
        [DataMember]
        public bool isCube { get; set; }

        [DataMember]
        public float uOffset { get; set; }

        [DataMember]
        public float vOffset { get; set; }

        [DataMember]
        public float uScale { get; set; }

        [DataMember]
        public float vScale { get; set; }

        [DataMember]
        public float uAng { get; set; }

        [DataMember]
        public float vAng { get; set; }

        [DataMember]
        public float wAng { get; set; }

        [DataMember]
        public int wrapU { get; set; }

        [DataMember]
        public int wrapV { get; set; }

        [DataMember]
        public int coordinatesIndex { get; set; }

        [DataMember]
        public bool isRenderTarget { get; set; }

        [DataMember]
        public int renderTargetSize { get; set; }

        [DataMember]
        public float[] mirrorPlane { get; set; }

        [DataMember]
        public string[] renderList { get; set; }

        [DataMember]
        public BabylonAnimation[] animations { get; set; }
        
        public BabylonTexture()
        {
            level = 1.0f;
            uOffset = 0;
            vOffset = 0;
            uScale = 1.0f;
            vScale = 1.0f;
            uAng = 0;
            vAng = 0;
            wAng = 0;
            wrapU = 1;
            wrapV = 1;
            hasAlpha = false;
            coordinatesIndex = 0;
        }
    }
}
