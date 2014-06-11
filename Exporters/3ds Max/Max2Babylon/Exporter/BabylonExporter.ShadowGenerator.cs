using System.Collections.Generic;
using BabylonExport.Entities;
using MaxSharp;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
        private BabylonShadowGenerator ExportShadowGenerator(Node lightNode, BabylonScene babylonScene)
        {
            var maxLight = (lightNode.Object as Light);
            var babylonShadowGenerator = new BabylonShadowGenerator();

            RaiseMessage("Exporting shadow map", true, false, true);

            babylonShadowGenerator.lightId = lightNode.GetGuid().ToString();

            babylonShadowGenerator.mapSize = maxLight.GetMapSize(0, Interval.Forever);

            var maxScene = Kernel.Scene;
            var list = new List<string>();

            var inclusion = maxLight._Light.ExclList.TestFlag(1); //NT_INCLUDE 
            var checkExclusionList = maxLight._Light.ExclList.TestFlag(4); //NT_AFFECT_SHADOWCAST 

            foreach (var meshNode in maxScene.NodesListBySuperClass(SuperClassID.GeometricObject))
            {
                if (meshNode._Node.CastShadows == 1)
                {
                    var inList = maxLight._Light.ExclList.FindNode(meshNode._Node) != -1;

                    if (!checkExclusionList || (inList && inclusion) || (!inList && !inclusion))
                    {
                        list.Add(meshNode.GetGuid().ToString());
                    }
                }
            }
            babylonShadowGenerator.renderList = list.ToArray();

            babylonScene.ShadowGeneratorsList.Add(babylonShadowGenerator);
            return babylonShadowGenerator;
        }
    }
}
