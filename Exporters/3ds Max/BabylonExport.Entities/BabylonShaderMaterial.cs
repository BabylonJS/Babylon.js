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
		public object shaderPath { get; set; }

		[DataMember]
		public BabylonShaderOptions options { get; set; }

		[DataMember]
		public Dictionary<string, object> textures { get; set; }

		[DataMember]
		public Dictionary<string, object[]> textureArrays { get; set; }

		[DataMember]
		public Dictionary<string, object> floats { get; set; }

		[DataMember]
		public Dictionary<string, object[]> floatArrays { get; set; }

		[DataMember]
		public Dictionary<string, object> colors3 { get; set; }

		[DataMember]
		public Dictionary<string, object> colors4 { get; set; }

		[DataMember]
		public Dictionary<string, object> vectors2 { get; set; }

		[DataMember]
		public Dictionary<string, object> vectors3 { get; set; }

		[DataMember]
		public Dictionary<string, object> vectors4 { get; set; }

		[DataMember]
		public Dictionary<string, object> matrices { get; set; }

		[DataMember]
		public Dictionary<string, object> matrices2x2 { get; set; }

		[DataMember]
		public Dictionary<string, object> matrices3x3 { get; set; }

		[DataMember]
		public Dictionary<string, object[]> vectors3Arrays { get; set; }

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
		public string[] attributes { get; set; }

		[DataMember]
		public string[] uniforms { get; set; }

		[DataMember]
		public bool needAlphaBlending { get; set; }

		[DataMember]
		public bool needAlphaTesting { get; set; }

		[DataMember]
		public string[] samplers { get; set; }

		[DataMember]
		public string[] defines { get; set; }
	}
}