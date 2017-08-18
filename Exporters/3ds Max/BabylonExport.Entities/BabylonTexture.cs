using System.Runtime.Serialization;

namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonTexture
    {
        public enum AddressMode
        {
            CLAMP_ADDRESSMODE = 0,
            WRAP_ADDRESSMODE = 1,
            MIRROR_ADDRESSMODE = 2
        }

        public enum SamplingMode
        {
            // Constants
            NEAREST_NEAREST_MIPLINEAR = 1, // nearest is mag = nearest and min = nearest and mip = linear
            LINEAR_LINEAR_MIPNEAREST = 2, // Bilinear is mag = linear and min = linear and mip = nearest
            LINEAR_LINEAR_MIPLINEAR = 3, // Trilinear is mag = linear and min = linear and mip = linear
            NEAREST_NEAREST_MIPNEAREST = 4,
            NEAREST_LINEAR_MIPNEAREST = 5,
            NEAREST_LINEAR_MIPLINEAR = 6,
            NEAREST_LINEAR = 7,
            NEAREST_NEAREST = 8,
            LINEAR_NEAREST_MIPNEAREST = 9,
            LINEAR_NEAREST_MIPLINEAR = 10,
            LINEAR_LINEAR = 11,
            LINEAR_NEAREST = 12
        }

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
        public AddressMode wrapU { get; set; }

        [DataMember]
        public AddressMode wrapV { get; set; }

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
        public SamplingMode samplingMode { get; set; }

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
            wrapU = AddressMode.WRAP_ADDRESSMODE;
            wrapV = AddressMode.WRAP_ADDRESSMODE;
            hasAlpha = false;
            coordinatesIndex = 0;
            samplingMode = SamplingMode.LINEAR_LINEAR_MIPLINEAR;
        }
    }
}
