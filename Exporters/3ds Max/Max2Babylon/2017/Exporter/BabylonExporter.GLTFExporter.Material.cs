using BabylonExport.Entities;
using GLTFExport.Entities;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
        //readonly List<IIGameMaterial> referencedMaterials = new List<IIGameMaterial>();

        private void ExportMaterial(BabylonMaterial babylonMaterial, GLTF gltf)
        {
            var name = babylonMaterial.name;
            var id = babylonMaterial.id;

            RaiseMessage("GLTFExporter.Material | ExportMaterial name=" + name, 1);

            if (babylonMaterial.GetType() == typeof(BabylonStandardMaterial))
            {
                RaiseMessage("GLTFExporter.Material | babylonStandardMaterial != null", 1);

                var babylonStandardMaterial = babylonMaterial as BabylonStandardMaterial;


                // --- prints ---

                RaiseMessage("GLTFExporter.Material | babylonMaterial data", 1);
                RaiseMessage("GLTFExporter.Material | babylonMaterial.alpha=" + babylonMaterial.alpha, 2);
                RaiseMessage("GLTFExporter.Material | babylonMaterial.backFaceCulling=" + babylonMaterial.backFaceCulling, 2);
                RaiseMessage("GLTFExporter.Material | babylonMaterial.wireframe=" + babylonMaterial.wireframe, 2);

                // Ambient
                for (int i = 0; i < babylonStandardMaterial.ambient.Length; i++)
                {
                    RaiseMessage("GLTFExporter.Material | babylonStandardMaterial.ambient[" + i + "]=" + babylonStandardMaterial.ambient[i], 2);
                }

                // Diffuse
                RaiseMessage("GLTFExporter.Material | babylonStandardMaterial.diffuse.Length=" + babylonStandardMaterial.diffuse.Length, 2);
                for (int i = 0; i < babylonStandardMaterial.diffuse.Length; i++)
                {
                    RaiseMessage("GLTFExporter.Material | babylonStandardMaterial.diffuse[" + i + "]=" + babylonStandardMaterial.diffuse[i], 2);
                }
                if (babylonStandardMaterial.diffuseTexture == null)
                {
                    RaiseMessage("GLTFExporter.Material | babylonStandardMaterial.diffuseTexture=null", 2);
                }

                // Normal / bump
                if (babylonStandardMaterial.bumpTexture == null)
                {
                    RaiseMessage("GLTFExporter.Material | babylonStandardMaterial.bumpTexture=null", 2);
                }

                // Specular
                for (int i = 0; i < babylonStandardMaterial.specular.Length; i++)
                {
                    RaiseMessage("GLTFExporter.Material | babylonStandardMaterial.specular[" + i + "]=" + babylonStandardMaterial.specular[i], 2);
                }
                RaiseMessage("GLTFExporter.Material | babylonStandardMaterial.specularPower=" + babylonStandardMaterial.specularPower, 2);

                // Occlusion
                if (babylonStandardMaterial.ambientTexture == null)
                {
                    RaiseMessage("GLTFExporter.Material | babylonStandardMaterial.ambientTexture=null", 2);
                }

                // Emissive
                for (int i = 0; i < babylonStandardMaterial.emissive.Length; i++)
                {
                    RaiseMessage("GLTFExporter.Material | babylonStandardMaterial.emissive[" + i + "]=" + babylonStandardMaterial.emissive[i], 2);
                }
                if (babylonStandardMaterial.emissiveTexture == null)
                {
                    RaiseMessage("GLTFExporter.Material | babylonStandardMaterial.emissiveTexture=null", 2);
                }


                // --------------------------------
                // --------- gltfMaterial ---------
                // --------------------------------

                RaiseMessage("GLTFExporter.Material | create gltfMaterial", 1);
                var gltfMaterial = new GLTFMaterial
                {
                    name = name
                };
                gltfMaterial.id = babylonMaterial.id;
                gltfMaterial.index = gltf.MaterialsList.Count;
                gltf.MaterialsList.Add(gltfMaterial);

                // Alpha
                string alphaMode;
                float? alphaCutoff;
                getAlphaMode(babylonStandardMaterial, out alphaMode, out alphaCutoff);
                gltfMaterial.alphaMode = alphaMode;
                gltfMaterial.alphaCutoff = alphaCutoff;

                // DoubleSided
                gltfMaterial.doubleSided = !babylonMaterial.backFaceCulling;

                // Normal
                gltfMaterial.normalTexture = ExportTexture(babylonStandardMaterial.bumpTexture, gltf);

                // Occulison
                gltfMaterial.occlusionTexture = ExportTexture(babylonStandardMaterial.ambientTexture, gltf);

                // Emissive
                gltfMaterial.emissiveFactor = babylonStandardMaterial.emissive;
                gltfMaterial.emissiveTexture = ExportTexture(babylonStandardMaterial.emissiveTexture, gltf);


                // --------------------------------
                // --- gltfPbrMetallicRoughness ---
                // --------------------------------

                RaiseMessage("GLTFExporter.Material | create gltfPbrMetallicRoughness", 1);
                var gltfPbrMetallicRoughness = new GLTFPBRMetallicRoughness();
                gltfMaterial.pbrMetallicRoughness = gltfPbrMetallicRoughness;

                // Base color
                var babylonDiffuseColor = babylonStandardMaterial.diffuse;
                gltfPbrMetallicRoughness.baseColorFactor = new float[4]
                {
                    babylonDiffuseColor[0],
                    babylonDiffuseColor[1],
                    babylonDiffuseColor[2],
                    babylonMaterial.alpha
                };
                gltfPbrMetallicRoughness.baseColorTexture = ExportTexture(babylonStandardMaterial.diffuseTexture, gltf);

                // TODO - Metallic roughness
                gltfPbrMetallicRoughness.metallicFactor = 0; // Non metal
                // TODO - roughnessFactor
                // TODO - metallicRoughnessTexture
            }
        }

        private void getAlphaMode(BabylonStandardMaterial babylonMaterial, out string alphaMode, out float? alphaCutoff)
        {
            if (babylonMaterial.diffuseTexture.hasAlpha)
            {
                alphaMode = GLTFMaterial.AlphaMode.BLEND.ToString();
            }
            else
            {
                alphaMode = GLTFMaterial.AlphaMode.OPAQUE.ToString();
            }
            alphaCutoff = null;
        }
    }
}
