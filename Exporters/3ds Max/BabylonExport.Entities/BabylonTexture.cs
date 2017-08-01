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

        [DataMember]
        public string[] extensions { get; set; }

        [DataMember]
        public int samplingMode { get; set; }

        public BabylonTexture()
        {
            this.level = 1.0f;
            this.uOffset = 0;
            this.vOffset = 0;
            this.uScale = 1.0f;
            this.vScale = 1.0f;
            this.uAng = 0;
            this.vAng = 0;
            this.wAng = 0;
            this.wrapU = 1;
            this.wrapV = 1;
            this.hasAlpha = false;
            this.coordinatesIndex = 0;
            this.samplingMode = 3;
        }
    }
}
