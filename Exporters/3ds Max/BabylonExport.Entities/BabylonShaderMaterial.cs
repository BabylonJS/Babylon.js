using System.Collections.Generic;
using System.Runtime.Serialization;

namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonShaderMaterial : BabylonMaterial
    {
        [DataMember]
        public string customType { get; private set; }

        [DataMember]
        public object shaderPath;

        [DataMember]
        public BabylonShaderOptions options;

        [DataMember]
        public Dictionary<string, object> textures;

        [DataMember]
        public Dictionary<string, object[]> textureArrays;

        [DataMember]
        public Dictionary<string, object> floats;

        [DataMember]
        public Dictionary<string, object[]> floatArrays;

        [DataMember]
        public Dictionary<string, object> colors3;

        [DataMember]
        public Dictionary<string, object> colors4;

        [DataMember]
        public Dictionary<string, object> vectors2;

        [DataMember]
        public Dictionary<string, object> vectors3;

        [DataMember]
        public Dictionary<string, object> vectors4;

        [DataMember]
        public Dictionary<string, object> matrices;

        [DataMember]
        public Dictionary<string, object> matrices2x2;

        [DataMember]
        public Dictionary<string, object> matrices3x3;

        [DataMember]
        public Dictionary<string, object[]> vectors3Arrays;

        public BabylonShaderMaterial()
        {
            this.customType = "BABYLON.ShaderMaterial";
            this.shaderPath = null;
            this.options = new BabylonShaderOptions();
            this.textures = new Dictionary<string, object>();
            this.textureArrays = new Dictionary<string, object[]>();
            this.floats = new Dictionary<string, object>();
            this.floatArrays = new Dictionary<string, object[]>();
            this.colors3 = new Dictionary<string, object>();
            this.colors4 = new Dictionary<string, object>();
            this.vectors2 = new Dictionary<string, object>();
            this.vectors3 = new Dictionary<string, object>();
            this.vectors4 = new Dictionary<string, object>();
            this.matrices = new Dictionary<string, object>();
            this.matrices2x2 = new Dictionary<string, object>();
            this.matrices3x3 = new Dictionary<string, object>();
            this.vectors3Arrays = new Dictionary<string, object[]>();
        }
    }

    [DataContract]
    public class BabylonShaderOptions
    {
        [DataMember]
        public string[] attributes;

        [DataMember]
        public string[] uniforms;

        [DataMember]
        public bool needAlphaBlending;

        [DataMember]
        public bool needAlphaTesting;

        [DataMember]
        public string[] samplers;

        [DataMember]
        public string[] defines;
    }
}
