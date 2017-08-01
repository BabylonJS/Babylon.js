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
            SetCustomType("BABYLON.HDRCubeTexture");
            size = 0;
            isCube = true;
            useInGammaSpace = false;
            generateHarmonics = true;
            usePMREMGenerator = false;
            isBABYLONPreprocessed = false;
        }

        public void SetCustomType(string type)
        {
            customType = type;
        }
    }
}
