using System;
using System.IO;
using BabylonExport.Core.Exporters;
using SharpDX;

namespace BabylonExport.Core
{
    public class StandardMaterial
    {
        public string Name { get; set; }

        public Color3 Diffuse { get; set; }
        public Color3 Emissive { get; set; }
        public Color3 Specular { get; set; }

        public float Alpha { get; set; }
        public float SpecularPower { get; set; }

        public string DiffuseTexture { get; set; }

        public bool BackFaceCulling { get; set; }

        public Guid ID
        {
            get;
            private set;
        }

        public StandardMaterial(string name)
        {
            ID = Guid.NewGuid();
            Name = name;
            DiffuseTexture = "";

            Diffuse = new Color3(1, 1, 1);
            Specular = new Color3(1, 1, 1);

            SpecularPower = 32;

            Alpha = 1.0f;

            BackFaceCulling = true;
        }

        public void CreateBabylonMaterial(BabylonScene scene)
        {
            var babylonMaterial = new BabylonMaterial();
            scene.MaterialsList.Add(babylonMaterial);

            // Guid
            babylonMaterial.id = ID.ToString();

            // Name
            babylonMaterial.name = Name;

            // Data
            babylonMaterial.backFaceCulling = BackFaceCulling;
            babylonMaterial.diffuse = Diffuse.ToArray();
            babylonMaterial.emissive = Emissive.ToArray();
            babylonMaterial.specular = Specular.ToArray();
            babylonMaterial.specularPower = SpecularPower;
            babylonMaterial.alpha = Alpha;

            if (string.IsNullOrEmpty(DiffuseTexture))
            {
                babylonMaterial.diffuseTexture = null;
                return;
            }

            babylonMaterial.diffuseTexture = new BabylonTexture();
            babylonMaterial.diffuseTexture.name = Path.GetFileName(DiffuseTexture);

            if (babylonMaterial.diffuseTexture.name.ToLower().EndsWith(".png"))
            {
                babylonMaterial.diffuseTexture.hasAlpha = true;
            }

            scene.AddTexture(DiffuseTexture);
        }
    }
}
