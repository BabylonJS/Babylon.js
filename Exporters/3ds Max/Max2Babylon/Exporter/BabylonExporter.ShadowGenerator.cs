using System.Collections.Generic;
using Autodesk.Max;
using BabylonExport.Entities;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
        private BabylonShadowGenerator ExportShadowGenerator(IINode lightNode, BabylonScene babylonScene)
        {
            var maxLight = (lightNode.ObjectRef as ILightObject);
            var babylonShadowGenerator = new BabylonShadowGenerator();

            RaiseMessage("Exporting shadow map", 2);

            babylonShadowGenerator.lightId = lightNode.GetGuid().ToString();

            babylonShadowGenerator.mapSize = maxLight.GetMapSize(0, Tools.Forever);

            babylonShadowGenerator.bias = lightNode.GetFloatProperty("babylonjs_shadows_bias", 0.00005f);
            babylonShadowGenerator.forceBackFacesOnly = lightNode.GetBoolProperty("babylonjs_forcebackfaces");

            var shadowsType = lightNode.GetStringProperty("babylonjs_shadows_type", "Blurred Variance");

            switch (shadowsType)
            {
                case "Hard shadows":
                    break;
                case "Poisson Sampling":
                    babylonShadowGenerator.usePoissonSampling = true;
                    break;
                case "Variance":
                    babylonShadowGenerator.useVarianceShadowMap = true;
                    break;
                case"Blurred Variance":
                    babylonShadowGenerator.useBlurVarianceShadowMap = true;
                    babylonShadowGenerator.blurScale = lightNode.GetFloatProperty("babylonjs_shadows_blurScale", 2);
                    babylonShadowGenerator.blurBoxOffset = lightNode.GetFloatProperty("babylonjs_shadows_blurBoxOffset", 1);
                    break;
            }

            
            var list = new List<string>();

            var inclusion = maxLight.ExclList.TestFlag(1); //NT_INCLUDE 
            var checkExclusionList = maxLight.ExclList.TestFlag(4); //NT_AFFECT_SHADOWCAST 

            foreach (var meshNode in Loader.Core.RootNode.NodesListBySuperClass(SClass_ID.Geomobject))
            {
#if MAX2017
                if (meshNode.CastShadows)
#else
                if (meshNode.CastShadows == 1)
#endif
                {
                    var inList = maxLight.ExclList.FindNode(meshNode) != -1;

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
