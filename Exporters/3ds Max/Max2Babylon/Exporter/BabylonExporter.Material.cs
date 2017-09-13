using System;
using System.Collections.Generic;
using Autodesk.Max;
using BabylonExport.Entities;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
        readonly List<IIGameMaterial> referencedMaterials = new List<IIGameMaterial>();

        private void ExportMaterial(IIGameMaterial materialNode, BabylonScene babylonScene)
        {
            var name = materialNode.MaterialName;
            var id = materialNode.MaxMaterial.GetGuid().ToString();

            RaiseMessage(name, 1);

            // --- prints ---
            {
                RaiseMessage("materialNode.MaterialClass=" + materialNode.MaterialClass, 2);
                RaiseMessage("materialNode.NumberOfTextureMaps=" + materialNode.NumberOfTextureMaps, 2);

                var propertyContainer = materialNode.IPropertyContainer;
                RaiseMessage("propertyContainer=" + propertyContainer, 2);
                if (propertyContainer != null)
                {
                    RaiseMessage("propertyContainer.NumberOfProperties=" + propertyContainer.NumberOfProperties, 3);
                    for (int i = 0; i < propertyContainer.NumberOfProperties; i++)
                    {
                        var prop = propertyContainer.GetProperty(i);
                        if (prop != null)
                        {
                            RaiseMessage("propertyContainer.GetProperty(" + i + ")=" + prop.Name, 3);
                            switch (prop.GetType_)
                            {
                                case PropType.StringProp:
                                    string propertyString = "";
                                    RaiseMessage("prop.GetPropertyValue(ref propertyString, 0)=" + prop.GetPropertyValue(ref propertyString, 0), 4);
                                    RaiseMessage("propertyString=" + propertyString, 4);
                                    break;
                                case PropType.IntProp:
                                    int propertyInt = 0;
                                    RaiseMessage("prop.GetPropertyValue(ref propertyInt, 0)=" + prop.GetPropertyValue(ref propertyInt, 0), 4);
                                    RaiseMessage("propertyInt=" + propertyInt, 4);
                                    break;
                                case PropType.FloatProp:
                                    float propertyFloat = 0;
                                    RaiseMessage("prop.GetPropertyValue(ref propertyFloat, 0)=" + prop.GetPropertyValue(ref propertyFloat, 0, true), 4);
                                    RaiseMessage("propertyFloat=" + propertyFloat, 4);
                                    RaiseMessage("prop.GetPropertyValue(ref propertyFloat, 0)=" + prop.GetPropertyValue(ref propertyFloat, 0, false), 4);
                                    RaiseMessage("propertyFloat=" + propertyFloat, 4);
                                    break;
                                case PropType.Point3Prop:
                                    IPoint3 propertyPoint3 = Loader.Global.Point3.Create(0, 0, 0); 
                                    RaiseMessage("prop.GetPropertyValue(ref propertyPoint3, 0)=" + prop.GetPropertyValue(propertyPoint3, 0), 4);
                                    RaiseMessage("propertyPoint3=" + Point3ToString(propertyPoint3), 4);
                                    break;
                                case PropType.Point4Prop:
                                    IPoint4 propertyPoint4 = Loader.Global.Point4.Create(0,0,0,0);
                                    RaiseMessage("prop.GetPropertyValue(ref propertyPoint4, 0)=" + prop.GetPropertyValue(propertyPoint4, 0), 4);
                                    RaiseMessage("propertyPoint4=" + Point4ToString(propertyPoint4), 4);
                                    break;
                                case PropType.UnknownProp:
                                default:
                                    RaiseMessage("Unknown property type", 4);
                                    break;
                            }
                        }
                        else
                        {
                            RaiseMessage("propertyContainer.GetProperty(" + i + ") IS NULL", 3);
                        }
                    }
                }
            }

            if (materialNode.SubMaterialCount > 0)
            {
                var babylonMultimaterial = new BabylonMultiMaterial { name = name, id = id };

                var guids = new List<string>();

                for (var index = 0; index < materialNode.SubMaterialCount; index++)
                {
                    var subMat = materialNode.GetSubMaterial(index);

                    if (subMat != null)
                    {
                        guids.Add(subMat.MaxMaterial.GetGuid().ToString());

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
            
            var stdMat = materialNode.MaxMaterial.GetParamBlock(0).Owner as IStdMat2;

            if (stdMat != null)
            {
                var babylonMaterial = new BabylonStandardMaterial
                {
                    name = name,
                    id = id,
                    ambient = materialNode.MaxMaterial.GetAmbient(0, false).ToArray(),
                    diffuse = materialNode.MaxMaterial.GetDiffuse(0, false).ToArray(),
                    specular = materialNode.MaxMaterial.GetSpecular(0, false).Scale(materialNode.MaxMaterial.GetShinStr(0, false)),
                    specularPower = materialNode.MaxMaterial.GetShininess(0, false) * 256,
                    emissive =
                        materialNode.MaxMaterial.GetSelfIllumColorOn(0, false)
                            ? materialNode.MaxMaterial.GetSelfIllumColor(0, false).ToArray()
                            : materialNode.MaxMaterial.GetDiffuse(0, false).Scale(materialNode.MaxMaterial.GetSelfIllum(0, false)),
                    alpha = 1.0f - materialNode.MaxMaterial.GetXParency(0, false)
                };

                babylonMaterial.backFaceCulling = !stdMat.TwoSided;
                babylonMaterial.wireframe = stdMat.Wire;

                // Textures
                BabylonFresnelParameters fresnelParameters;

                babylonMaterial.ambientTexture = ExportTexture(stdMat, 0, out fresnelParameters, babylonScene);                // Ambient
                babylonMaterial.diffuseTexture = ExportTexture(stdMat, 1, out fresnelParameters, babylonScene);                // Diffuse
                if (fresnelParameters != null)
                {
                    babylonMaterial.diffuseFresnelParameters = fresnelParameters;
                }

                babylonMaterial.specularTexture = ExportTexture(stdMat, 2, out fresnelParameters, babylonScene);               // Specular
                babylonMaterial.emissiveTexture = ExportTexture(stdMat, 5, out fresnelParameters, babylonScene);               // Emissive
                if (fresnelParameters != null)
                {
                    babylonMaterial.emissiveFresnelParameters = fresnelParameters;
                    if (babylonMaterial.emissive[0] == 0 &&
                        babylonMaterial.emissive[1] == 0 &&
                        babylonMaterial.emissive[2] == 0 &&
                        babylonMaterial.emissiveTexture == null)
                    {
                        babylonMaterial.emissive = new float[] { 1, 1, 1 };
                    }
                }

                babylonMaterial.opacityTexture = ExportTexture(stdMat, 6, out fresnelParameters, babylonScene, false, true);   // Opacity
                if (fresnelParameters != null)
                {
                    babylonMaterial.opacityFresnelParameters = fresnelParameters;
                    if (babylonMaterial.alpha == 1 &&
                         babylonMaterial.opacityTexture == null)
                    {
                        babylonMaterial.alpha = 0;
                    }
                }

                babylonMaterial.bumpTexture = ExportTexture(stdMat, 8, out fresnelParameters, babylonScene);                   // Bump
                babylonMaterial.reflectionTexture = ExportTexture(stdMat, 9, out fresnelParameters, babylonScene, true);       // Reflection
                if (fresnelParameters != null)
                {
                    if (babylonMaterial.reflectionTexture == null)
                    {
                        RaiseWarning("Fallout cannot be used with reflection channel without a texture", 2);
                    }
                    else
                    {
                        babylonMaterial.reflectionFresnelParameters = fresnelParameters;
                    }
                }

                // Constraints
                if (babylonMaterial.diffuseTexture != null)
                {
                    babylonMaterial.diffuse = new[] { 1.0f, 1.0f, 1.0f };
                }

                if (babylonMaterial.emissiveTexture != null)
                {
                    babylonMaterial.emissive = new float[] { 0, 0, 0 };
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

                babylonScene.MaterialsList.Add(babylonMaterial);
            }
            else if (materialNode.MaterialClass == "Physical Material")
            {
                var propertyContainer = materialNode.IPropertyContainer;

                var babylonMaterial = new BabylonPBRMetallicRoughnessMaterial
                {
                    name = name,
                    id = id
                };

                // --- Global ---

                babylonMaterial.alpha = 1.0f - materialNode.MaxMaterial.GetXParency(0, false);

                // TODO - Add alpha
                babylonMaterial.baseColor = materialNode.MaxMaterial.GetDiffuse(0, false).ToArray();

                babylonMaterial.metallic = propertyContainer.GetFloatProperty(6);

                babylonMaterial.roughness = propertyContainer.GetFloatProperty(4);
                if (propertyContainer.GetIntProperty(5) == 1)
                {
                    // Inverse roughness
                    babylonMaterial.roughness = 1 - babylonMaterial.roughness;
                }

                // Self illumination is computed from emission color, luminance, temperature and weight
                babylonMaterial.emissiveColor = materialNode.MaxMaterial.GetSelfIllumColorOn(0, false)
                                                ? materialNode.MaxMaterial.GetSelfIllumColor(0, false).ToArray()
                                                : materialNode.MaxMaterial.GetDiffuse(0, false).Scale(materialNode.MaxMaterial.GetSelfIllum(0, false));

                // TODO - occlusionStrength - use default? ignored?

                // TODO - alphaCutOff - use default?

                // TODO - transparencyMode - private or public ?

                // TODO - doubleSided - use default?

                // --- Textures ---

                // TODO - Add alpha
                babylonMaterial.baseTexture = ExportPBRTexture(materialNode, 1, babylonScene);

                babylonMaterial.metallicRoughnessTexture = ExportMetallicRoughnessTexture(materialNode, babylonMaterial.metallic, babylonMaterial.roughness, babylonScene, name);

                // TODO - environmentTexture - as simple as that?
                babylonMaterial.environmentTexture = ExportPBRTexture(materialNode, 3, babylonScene);

                var normalMapAmount = propertyContainer.GetFloatProperty(91);
                babylonMaterial.normalTexture = ExportPBRTexture(materialNode, 30, babylonScene, normalMapAmount);
                
                babylonMaterial.emissiveTexture = ExportPBRTexture(materialNode, 17, babylonScene);
                
                // TODO - occlusionTexture - ignored?


                babylonScene.MaterialsList.Add(babylonMaterial);
            }
            else
            {
                RaiseWarning("Unsupported material type: " + materialNode.MaterialClass, 2);
            }
        }

        // -------------------------
        // --------- Utils ---------
        // -------------------------

        private string ColorToString(IColor color)
        {
            if (color == null)
            {
                return "";
            }

            return "{ r=" + color.R + ", g=" + color.G + ", b=" + color.B + " }";
        }

        private string Point3ToString(IPoint3 point)
        {
            if (point == null)
            {
                return "";
            }

            return "{ x=" + point.X + ", y=" + point.Y + ", z=" + point.Z + " }";
        }

        private string Point4ToString(IPoint4 point)
        {
            if (point == null)
            {
                return "";
            }

            return "{ x=" + point.X + ", y=" + point.Y + ", z=" + point.Z + ", w=" + point.W + " }";
        }
    }
}
