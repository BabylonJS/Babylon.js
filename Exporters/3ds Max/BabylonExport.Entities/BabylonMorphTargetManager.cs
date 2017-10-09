using System.Runtime.Serialization;

namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonMorphTargetManager
    {
        private static int NB_BABYLON_MORPH_TARGET_MANAGER;

        [DataMember(IsRequired = true)]
        public int id { get; set; }

        [DataMember(IsRequired = true)]
        public BabylonMorphTarget[] targets { get; set; }

        public static void Reset()
        {
            NB_BABYLON_MORPH_TARGET_MANAGER = 0;
        }

        public BabylonMorphTargetManager()
        {
            id = NB_BABYLON_MORPH_TARGET_MANAGER++;
        }
    }
}
