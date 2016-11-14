using System.Runtime.Serialization;

namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonHDRCubeTexture : BabylonTexture
    {
        [DataMember]
        public string customType { get; private set; }

        [DataMember]
        public int size { get; set; }

        [DataMember]
        public bool useInGammaSpace { get; set; }

        [DataMember]
        public bool generateHarmonics { get; set; }

        [DataMember]
        public bool usePMREMGenerator { get; set; }

        [DataMember]
        public bool isBABYLONPreprocessed { get; set; }

        public BabylonHDRCubeTexture()
        {
            this.customType = "BABYLON.HDRCubeTexture";
            this.size = 0;
            this.isCube = true;
            this.useInGammaSpace = false;
            this.generateHarmonics = true;
            this.usePMREMGenerator = false;
            this.isBABYLONPreprocessed = false;
        }
    }
}
