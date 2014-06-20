using System;
using System.Collections.Generic;
using Autodesk.Max;
using BabylonExport.Entities;
using MaxSharp;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
        readonly List<Material> referencedMaterials = new List<Material>();

        private void ExportMaterial(Material materialNode, BabylonScene babylonScene)
        {
            var name = materialNode._Mtl.Name;
            var id = materialNode.GetGuid().ToString();

            RaiseMessage(name, true);

            if (materialNode.NumSubMaterials > 0)
            {
                var babylonMultimaterial = new BabylonMultiMaterial();
                babylonMultimaterial.name = name;
                babylonMultimaterial.id = id;

                var guids = new List<string>();

                for (var index = 0; index < materialNode.NumSubMaterials; index++)
                {
                    var subMat = materialNode.GetSubMaterial(index) as Material;

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

            babylonMaterial.ambient = materialNode.GetAmbient(0).ToArray();
            babylonMaterial.diffuse = materialNode.GetDiffuse(0).ToArray();
            babylonMaterial.specular = materialNode.GetSpecular(0).Scale(materialNode.GetShinyStrength(0));
            babylonMaterial.specularPower = materialNode.GetShininess(0) * 256;

            babylonMaterial.emissive = materialNode.SelfIlluminationColorOn ? materialNode.GetSelfIllumColor(0).ToArray() : materialNode.GetDiffuse(0).Scale(materialNode.GetSelfIllumination(0));
            babylonMaterial.alpha = 1.0f - materialNode.GetTransparency(0);

            var stdMat = materialNode._Mtl.GetParamBlock(0).Owner as IStdMat2;

            if (stdMat != null)
            {
                // Textures
                babylonMaterial.ambientTexture = ExportTexture(stdMat, 0, babylonScene);    // Ambient
                babylonMaterial.diffuseTexture = ExportTexture(stdMat, 1, babylonScene);    // Diffuse
                babylonMaterial.specularTexture = ExportTexture(stdMat, 2, babylonScene);   // Specular
                babylonMaterial.emissiveTexture = ExportTexture(stdMat, 5, babylonScene);   // Emissive
                babylonMaterial.opacityTexture = ExportTexture(stdMat, 6, babylonScene);    // Opacity
                babylonMaterial.bumpTexture = ExportTexture(stdMat, 8, babylonScene);       // Bump
                babylonMaterial.reflectionTexture = ExportTexture(stdMat, 9, babylonScene, true); // Reflection

                // Constraints
                if (babylonMaterial.diffuseTexture != null)
                {
                    babylonMaterial.emissive = new [] { 1.0f, 1.0f, 1.0f };
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
                    RaiseWarning("Opacity texture was removed because alpha from diffuse texture can be use instead", true);
                    RaiseWarning("If you do not want this behavior, just set Alpha Source = None on your diffuse texture", true);
                }
            }

            babylonScene.MaterialsList.Add(babylonMaterial);
        }
    }
}
