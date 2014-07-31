using System;
using System.Collections.Generic;
using Autodesk.Max;
using BabylonExport.Entities;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
        readonly List<IMtl> referencedMaterials = new List<IMtl>();

        private void ExportMaterial(IMtl materialNode, BabylonScene babylonScene)
        {
            var name = materialNode.Name;
            var id = materialNode.GetGuid().ToString();

            RaiseMessage(name, 1);

            if (materialNode.NumSubMtls > 0)
            {
                var babylonMultimaterial = new BabylonMultiMaterial();
                babylonMultimaterial.name = name;
                babylonMultimaterial.id = id;

                var guids = new List<string>();

                for (var index = 0; index < materialNode.NumSubMtls; index++)
                {
                    var subMat = materialNode.GetSubMtl(index);

                    if (subMat != null)
                    {
                        guids.Add(subMat.GetGuid().ToString());

                        if (!referencedMaterials.Contains(subMat))
                        {
                            referencedMaterials.Add(subMat);
                            ExportMaterial(subMat, babylonScene);
                        }
                    }
                    else
                    {
                        guids.Add(Guid.Empty.ToString());
                    }
                }

                babylonMultimaterial.materials = guids.ToArray();

                babylonScene.MultiMaterialsList.Add(babylonMultimaterial);
                return;
            }


            var babylonMaterial = new BabylonMaterial();
            babylonMaterial.name = name;
            babylonMaterial.id = id;

            

            babylonMaterial.ambient = materialNode.GetAmbient(0, false).ToArray();
            babylonMaterial.diffuse = materialNode.GetDiffuse(0, false).ToArray();
            babylonMaterial.specular = materialNode.GetSpecular(0, false).Scale(materialNode.GetShinStr(0, false));
            babylonMaterial.specularPower = materialNode.GetShininess(0, false) * 256;

            babylonMaterial.emissive = materialNode.GetSelfIllumColorOn(0, false) ? materialNode.GetSelfIllumColor(0, false).ToArray() : materialNode.GetDiffuse(0, false).Scale(materialNode.GetSelfIllum(0, false));
            babylonMaterial.alpha = 1.0f - materialNode.GetXParency(0, false);

            var stdMat = materialNode.GetParamBlock(0).Owner as IStdMat2;

            if (stdMat != null)
            {
                babylonMaterial.backFaceCulling = !stdMat.TwoSided;
                babylonMaterial.wireframe = stdMat.Wire;

                // Textures
                babylonMaterial.ambientTexture = ExportTexture(stdMat, 0, babylonScene);                // Ambient
                babylonMaterial.diffuseTexture = ExportTexture(stdMat, 1, babylonScene);                // Diffuse
                babylonMaterial.specularTexture = ExportTexture(stdMat, 2, babylonScene);               // Specular
                babylonMaterial.emissiveTexture = ExportTexture(stdMat, 5, babylonScene);               // Emissive
                babylonMaterial.opacityTexture = ExportTexture(stdMat, 6, babylonScene, false, true);   // Opacity
                babylonMaterial.bumpTexture = ExportTexture(stdMat, 8, babylonScene);                   // Bump
                babylonMaterial.reflectionTexture = ExportTexture(stdMat, 9, babylonScene, true);       // Reflection

                // Constraints
                if (babylonMaterial.diffuseTexture != null)
                {
                    babylonMaterial.diffuse = new [] { 1.0f, 1.0f, 1.0f };
                }

                if (babylonMaterial.emissiveTexture != null)
                {
                    babylonMaterial.emissive = new float[]{0, 0, 0};
                }

                if (babylonMaterial.opacityTexture != null && babylonMaterial.diffuseTexture != null &&
                    babylonMaterial.diffuseTexture.name == babylonMaterial.opacityTexture.name &&
                    babylonMaterial.diffuseTexture.hasAlpha && !babylonMaterial.opacityTexture.getAlphaFromRGB)
                {
                    // This is a alpha testing purpose
                    babylonMaterial.opacityTexture = null;
                    babylonMaterial.diffuseTexture.hasAlpha = true;
                    RaiseWarning("Opacity texture was removed because alpha from diffuse texture can be use instead", 2);
                    RaiseWarning("If you do not want this behavior, just set Alpha Source = None on your diffuse texture", 2);
                }
            }

            babylonScene.MaterialsList.Add(babylonMaterial);
        }
    }
}
