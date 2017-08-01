using System.Runtime.Serialization;
namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonPBRMaterial : BabylonMaterial
    {
        [DataMember]
        public string customType { get; private set; }

        [DataMember]
        public float directIntensity { get; set; }

        [DataMember]
        public float emissiveIntensity { get; set; }

        [DataMember]
        public float environmentIntensity { get; set; }

        [DataMember]
        public float specularIntensity { get; set; }

        [DataMember]
        public float cameraExposure { get; set; }

        [DataMember]
        public float cameraContrast { get; set; }

        [DataMember]
        public float microSurface { get; set; }

        [DataMember]
        public BabylonTexture albedoTexture { get; set; }

        [DataMember]
        public BabylonTexture ambientTexture { get; set; }

        [DataMember]
        public BabylonTexture opacityTexture { get; set; }

        [DataMember]
        public BabylonTexture reflectionTexture { get; set; }

        [DataMember]
        public BabylonTexture emissiveTexture { get; set; }

        [DataMember]
        public BabylonTexture reflectivityTexture { get; set; }

        [DataMember]
        public BabylonTexture bumpTexture { get; set; }

        [DataMember]
        public BabylonTexture lightmapTexture { get; set; }

        [DataMember]
        public BabylonTexture metallicTexture { get; set; }

        [DataMember]
        public bool useLightmapAsShadowmap { get; set; }

        [DataMember]
        public BabylonTexture refractionTexture { get; set; }

        [DataMember]
        public float[] ambient { get; set; }

        [DataMember]
        public float[] albedo { get; set; }

        [DataMember]
        public float[] reflectivity { get; set; }

        [DataMember]
        public float[] reflection { get; set; }

        [DataMember]
        public float[] emissive { get; set; }

        [DataMember]
        public float? roughness { get; set; }

        [DataMember]
        public float? metallic { get; set; }

        [DataMember]
        public bool useMicroSurfaceFromReflectivityMapAplha { get; set; }

        [DataMember]
        public bool linkRefractionWithTransparency { get; set; }

        [DataMember]
        public bool useRoughnessFromMetallicTextureAlpha { get; set; }

        [DataMember]
        public bool useRoughnessFromMetallicTextureGreen { get; set; }

        [DataMember]
        public bool useAlphaFromAlbedoTexture { get; set; }

        [DataMember]
        public bool useEmissiveAsIllumination { get; set; }

        [DataMember]
        public bool useMicroSurfaceFromReflectivityMapAlpha { get; set; }

        [DataMember]
        public bool useSpecularOverAlpha { get; set; }

        [DataMember]
        public bool useRadianceOverAlpha { get; set; }

        [DataMember]
        public bool usePhysicalLightFalloff { get; set; }

        [DataMember]
        public float indexOfRefraction { get; set; }

        [DataMember]
        public bool invertRefractionY { get; set; }

        [DataMember]
        public BabylonFresnelParameters emissiveFresnelParameters { get; set; }

        [DataMember]
        public BabylonFresnelParameters opacityFresnelParameters { get; set; }

        [DataMember]
        public bool disableLighting { get; set; }

        [DataMember]
        public bool twoSidedLighting { get; set; }

        [DataMember]
        public int maxSimultaneousLights { get; set; }

        public BabylonPBRMaterial() : base()
        {
            this.SetCustomType("BABYLON.PBRMaterial");
            this.directIntensity = 1.0f;
            this.emissiveIntensity = 1.0f;
            this.environmentIntensity = 1.0f;
            this.specularIntensity = 1.0f;
            this.cameraExposure = 1.0f;
            this.cameraContrast = 1.0f;
            this.indexOfRefraction = 0.66f;
            this.twoSidedLighting = false;
            this.maxSimultaneousLights = 4;
            this.useRadianceOverAlpha = true;
            this.useSpecularOverAlpha = true;
            this.usePhysicalLightFalloff = true;
            this.useEmissiveAsIllumination = false;

            // Default Null Metallic Workflow
            this.metallic = null;
            this.roughness = null;
            this.useRoughnessFromMetallicTextureAlpha = true;
            this.useRoughnessFromMetallicTextureGreen = false;

            this.microSurface = 0.9f;
            this.useMicroSurfaceFromReflectivityMapAplha = false;

            this.ambient = new[] { 0f, 0f, 0f };
            this.albedo = new[] { 1f, 1f, 1f };
            this.reflectivity = new[] { 1f, 1f, 1f };
            this.reflection = new[] { 0.5f, 0.5f, 0.5f };
            this.emissive = new[] { 0f, 0f, 0f };
        }

        public void SetCustomType(string type)
        {
            this.customType = type;
        }
    }
}