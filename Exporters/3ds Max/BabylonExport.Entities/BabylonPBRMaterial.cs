﻿using System.Runtime.Serialization;
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
        public float overloadedShadowIntensity { get; set; }

        [DataMember]
        public float overloadedShadeIntensity { get; set; }

        [DataMember]
        public float overloadedAmbientIntensity { get; set; }

        [DataMember]
        public float overloadedAlbedoIntensity { get; set; }

        [DataMember]
        public float overloadedReflectivityIntensity { get; set; }

        [DataMember]
        public float overloadedEmissiveIntensity { get; set; }

        [DataMember]
        public float[] overloadedAmbient { get; set; }

        [DataMember]
        public float[] overloadedAlbedo { get; set; }

        [DataMember]
        public float[] overloadedReflectivity { get; set; }

        [DataMember]
        public float[] overloadedEmissive { get; set; }

        [DataMember]
        public float[] overloadedReflection { get; set; }

        [DataMember]
        public float overloadedMicroSurface { get; set; }

        [DataMember]
        public float overloadedMicroSurfaceIntensity { get; set; }

        [DataMember]
        public float overloadedReflectionIntensity { get; set; }

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
        public float indexOfRefraction { get; set; }

        [DataMember]
        public bool invertRefractionY { get; set; }

        [DataMember]
        public BabylonFresnelParameters emissiveFresnelParameters { get; set; }

        [DataMember]
        public BabylonFresnelParameters opacityFresnelParameters { get; set; }

		[DataMember]
		public bool disableLighting { get; set; }

        public BabylonPBRMaterial() : base()
        {
            customType = "BABYLON.PBRMaterial";

            directIntensity = 1.0f;
            emissiveIntensity = 1.0f;
            environmentIntensity = 1.0f;
            specularIntensity = 1.0f;
            cameraExposure = 1.0f;
            cameraContrast = 1.0f;

            overloadedShadowIntensity = 1.0f;
            overloadedShadeIntensity = 1.0f;

            ambient = new[] { 0f, 0f, 0f };
            albedo = new[] { 0f, 0f, 0f };
            reflectivity = new[] { 0f, 0f, 0f };
            reflection = new[] { 0f, 0f, 0f };
            emissive = new[] { 0f, 0f, 0f };

            overloadedAmbient = new[] { 0f, 0f, 0f };
            overloadedAlbedo = new[] { 0f, 0f, 0f };
            overloadedReflectivity = new[] { 0f, 0f, 0f };
            overloadedEmissive = new[] { 0f, 0f, 0f };
            overloadedReflection = new[] { 0f, 0f, 0f };
        }
    }
}