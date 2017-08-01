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
            SetCustomType("BABYLON.PBRMaterial");
            directIntensity = 1.0f;
            emissiveIntensity = 1.0f;
            environmentIntensity = 1.0f;
            specularIntensity = 1.0f;
            cameraExposure = 1.0f;
            cameraContrast = 1.0f;
            indexOfRefraction = 0.66f;
            twoSidedLighting = false;
            maxSimultaneousLights = 4;
            useRadianceOverAlpha = true;
            useSpecularOverAlpha = true;
            usePhysicalLightFalloff = true;
            useEmissiveAsIllumination = false;

            // Default Null Metallic Workflow
            metallic = null;
            roughness = null;
            useRoughnessFromMetallicTextureAlpha = true;
            useRoughnessFromMetallicTextureGreen = false;

            microSurface = 0.9f;
            useMicroSurfaceFromReflectivityMapAplha = false;

            ambient = new[] { 0f, 0f, 0f };
            albedo = new[] { 1f, 1f, 1f };
            reflectivity = new[] { 1f, 1f, 1f };
            reflection = new[] { 0.5f, 0.5f, 0.5f };
            emissive = new[] { 0f, 0f, 0f };
        }

        public void SetCustomType(string type)
        {
            customType = type;
        }
    }
}