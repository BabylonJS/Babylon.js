using BabylonExport.Entities;
using GLTFExport.Entities;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
        private void ExportMaterial(BabylonMaterial babylonMaterial, GLTF gltf)
        {
            var name = babylonMaterial.name;
            var id = babylonMaterial.id;

            RaiseMessage("GLTFExporter.Material | Export material named: " + name, 1);

            if (babylonMaterial.GetType() == typeof(BabylonStandardMaterial))
            {
                var babylonStandardMaterial = babylonMaterial as BabylonStandardMaterial;


                // --- prints ---

                RaiseMessage("GLTFExporter.Material | babylonMaterial data", 2);
                RaiseMessage("GLTFExporter.Material | babylonMaterial.alpha=" + babylonMaterial.alpha, 3);
                RaiseMessage("GLTFExporter.Material | babylonMaterial.backFaceCulling=" + babylonMaterial.backFaceCulling, 3);
                RaiseMessage("GLTFExporter.Material | babylonMaterial.wireframe=" + babylonMaterial.wireframe, 3);

                // Ambient
                for (int i = 0; i < babylonStandardMaterial.ambient.Length; i++)
                {
                    RaiseMessage("GLTFExporter.Material | babylonStandardMaterial.ambient[" + i + "]=" + babylonStandardMaterial.ambient[i], 3);
                }

                // Diffuse
                RaiseMessage("GLTFExporter.Material | babylonStandardMaterial.diffuse.Length=" + babylonStandardMaterial.diffuse.Length, 3);
                for (int i = 0; i < babylonStandardMaterial.diffuse.Length; i++)
                {
                    RaiseMessage("GLTFExporter.Material | babylonStandardMaterial.diffuse[" + i + "]=" + babylonStandardMaterial.diffuse[i], 3);
                }
                if (babylonStandardMaterial.diffuseTexture == null)
                {
                    RaiseMessage("GLTFExporter.Material | babylonStandardMaterial.diffuseTexture=null", 3);
                }

                // Normal / bump
                if (babylonStandardMaterial.bumpTexture == null)
                {
                    RaiseMessage("GLTFExporter.Material | babylonStandardMaterial.bumpTexture=null", 3);
                }

                // Specular
                for (int i = 0; i < babylonStandardMaterial.specular.Length; i++)
                {
                    RaiseMessage("GLTFExporter.Material | babylonStandardMaterial.specular[" + i + "]=" + babylonStandardMaterial.specular[i], 3);
                }
                RaiseMessage("GLTFExporter.Material | babylonStandardMaterial.specularPower=" + babylonStandardMaterial.specularPower, 3);

                // Occlusion
                if (babylonStandardMaterial.ambientTexture == null)
                {
                    RaiseMessage("GLTFExporter.Material | babylonStandardMaterial.ambientTexture=null", 3);
                }

                // Emissive
                for (int i = 0; i < babylonStandardMaterial.emissive.Length; i++)
                {
                    RaiseMessage("GLTFExporter.Material | babylonStandardMaterial.emissive[" + i + "]=" + babylonStandardMaterial.emissive[i], 3);
                }
                if (babylonStandardMaterial.emissiveTexture == null)
                {
                    RaiseMessage("GLTFExporter.Material | babylonStandardMaterial.emissiveTexture=null", 3);
                }


                // --------------------------------
                // --------- gltfMaterial ---------
                // --------------------------------

                RaiseMessage("GLTFExporter.Material | create gltfMaterial", 2);
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

                RaiseMessage("GLTFExporter.Material | create gltfPbrMetallicRoughness", 2);
                var gltfPbrMetallicRoughness = new GLTFPBRMetallicRoughness();
                gltfMaterial.pbrMetallicRoughness = gltfPbrMetallicRoughness;

                // TODO - Retreive diffuse or albedo?
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
            if (babylonMaterial.diffuseTexture != null && babylonMaterial.diffuseTexture.hasAlpha)
            {
                // TODO - Babylon standard material is assumed to useAlphaFromDiffuseTexture. If not, the alpha mode is a mask.
                alphaMode = GLTFMaterial.AlphaMode.BLEND.ToString();
            }
            else
            {
                // glTF alpha mode default value is "OPAQUE"
                alphaMode = null; // GLTFMaterial.AlphaMode.OPAQUE.ToString();
            }
            alphaCutoff = null;
        }
    }
}
