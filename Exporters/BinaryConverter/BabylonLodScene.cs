using System;
using System.Collections.Generic;
using System.Runtime.Serialization;

using BabylonExport.Core;

namespace BabylonBinaryConverter
{
    [DataContract]
    public class BabylonLodScene : BabylonScene
    {
        [DataMember]
        public new BabylonLodMesh[] meshes { get; set; }

        [DataMember]
        public bool useDelayedTextureLoading { get; set; }


        public BabylonLodScene(string outputPath) : base(outputPath)
        {
        }


        public void Convert(string srcPath, string dstPath)
        {
            for (int x = 0; x < meshes.Length; x++)
            {
                meshes[x].Convert(srcPath, dstPath);
            }
        }
    }
}
