using System.Collections.Generic;
using System.IO;
using BabylonExport;
using SharpDX;

namespace BabylonExport.Core.Exporters
{
    public partial class ObjExporter
    {
        readonly List<StandardMaterial> materials = new List<StandardMaterial>();

        void ImportMaterialLibraries(ObjLine materialLine, BabylonScene scene)
        {
            for (int i = 1; i < materialLine.Tokens.Length; i++)
            {
                string fileName = materialLine.Tokens[i];

                var mtlDocument = new Document<MtlLine>(File.ReadAllText(fileName));

                StandardMaterial currentMaterial = null;

                foreach (var lines in mtlDocument.Blocks)
                {
                    foreach (MtlLine line in lines)
                    {

                        switch (line.Header)
                        {
                            case MtlHeader.Material:
                                currentMaterial = new StandardMaterial(line.Tokens[1]);
                                currentMaterial.BackFaceCulling = false;
                                materials.Add(currentMaterial);
                                break;
                            case MtlHeader.DiffuseColor:
                                currentMaterial.Diffuse = line.ToColor();
                                break;
                            case MtlHeader.DiffuseTexture:
                                currentMaterial.Diffuse = new Color3(1, 1, 1);
                                currentMaterial.DiffuseTexture = line.Tokens[1].Replace("//", @"\");
                                break;
                            case MtlHeader.Alpha:
                                currentMaterial.Alpha = line.ToFloat();
                                break;
                            case MtlHeader.EmissiveColor:
                                currentMaterial.Emissive = line.ToColor();
                                break;
                            case MtlHeader.SpecularColor:
                                currentMaterial.Specular = line.ToColor();
                                break;
                            case MtlHeader.SpecularPower:
                                currentMaterial.SpecularPower = line.ToFloat();
                                break;
                        }
                    }
                }
            }

            foreach (var material in materials)
            {
                material.CreateBabylonMaterial(scene);
            }
        }
    }
}
