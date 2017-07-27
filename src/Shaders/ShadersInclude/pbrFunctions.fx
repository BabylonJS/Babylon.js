// Constants
#define RECIPROCAL_PI2 0.15915494
#define FRESNEL_MAXIMUM_ON_ROUGH 0.25

// PBR CUSTOM CONSTANTS
const float kRougnhessToAlphaScale = 0.1;
const float kRougnhessToAlphaOffset = 0.29248125;

float convertRoughnessToAverageSlope(float roughness)
{
    // Calculate AlphaG as square of roughness; add epsilon to avoid numerical issues
    const float kMinimumVariance = 0.0005;
    float alphaG = square(roughness) + kMinimumVariance;
    return alphaG;
}

// From Microfacet Models for Refraction through Rough Surfaces, Walter et al. 2007
float smithVisibilityG1_TrowbridgeReitzGGX(float dot, float alphaG)
{
    float tanSquared = (1.0 - dot * dot) / (dot * dot);
    return 2.0 / (1.0 + sqrt(1.0 + alphaG * alphaG * tanSquared));
}

float smithVisibilityG_TrowbridgeReitzGGX_Walter(float NdotL, float NdotV, float alphaG)
{
    return smithVisibilityG1_TrowbridgeReitzGGX(NdotL, alphaG) * smithVisibilityG1_TrowbridgeReitzGGX(NdotV, alphaG);
}

// Trowbridge-Reitz (GGX)
// Generalised Trowbridge-Reitz with gamma power=2.0
float normalDistributionFunction_TrowbridgeReitzGGX(float NdotH, float alphaG)
{
    // Note: alphaG is average slope (gradient) of the normals in slope-space.
    // It is also the (trigonometric) tangent of the median distribution value, i.e. 50% of normals have
    // a tangent (gradient) closer to the macrosurface than this slope.
    float a2 = square(alphaG);
    float d = NdotH * NdotH * (a2 - 1.0) + 1.0;
    return a2 / (PI * d * d);
}

vec3 fresnelSchlickGGX(float VdotH, vec3 reflectance0, vec3 reflectance90)
{
    return reflectance0 + (reflectance90 - reflectance0) * pow(clamp(1.0 - VdotH, 0., 1.), 5.0);
}

vec3 fresnelSchlickEnvironmentGGX(float VdotN, vec3 reflectance0, vec3 reflectance90, float smoothness)
{
    // Schlick fresnel approximation, extended with basic smoothness term so that rough surfaces do not approach reflectance90 at grazing angle
    float weight = mix(FRESNEL_MAXIMUM_ON_ROUGH, 1.0, smoothness);
    return reflectance0 + weight * (reflectance90 - reflectance0) * pow(clamp(1.0 - VdotN, 0., 1.), 5.0);
}

// Cook Torance Specular computation.
vec3 computeSpecularTerm(float NdotH, float NdotL, float NdotV, float VdotH, float roughness, vec3 reflectance0, vec3 reflectance90)
{
    float alphaG = convertRoughnessToAverageSlope(roughness);
    float distribution = normalDistributionFunction_TrowbridgeReitzGGX(NdotH, alphaG);
    float visibility = smithVisibilityG_TrowbridgeReitzGGX_Walter(NdotL, NdotV, alphaG);
    visibility /= (4.0 * NdotL * NdotV); // Cook Torance Denominator  integated in viibility to avoid issues when visibility function changes.
    float specTerm = max(0., visibility * distribution) * NdotL;

    vec3 fresnel = fresnelSchlickGGX(VdotH, reflectance0, reflectance90);
    return fresnel * specTerm;
}

float computeDiffuseTerm(float NdotL, float NdotV, float VdotH, float roughness)
{
    // Diffuse fresnel falloff as per Disney principled BRDF, and in the spirit of
    // of general coupled diffuse/specular models e.g. Ashikhmin Shirley.
    float diffuseFresnelNV = pow(clamp(1.0 - NdotL, 0.000001, 1.), 5.0);
    float diffuseFresnelNL = pow(clamp(1.0 - NdotV, 0.000001, 1.), 5.0);
    float diffuseFresnel90 = 0.5 + 2.0 * VdotH * VdotH * roughness;
    float fresnel =
        (1.0 + (diffuseFresnel90 - 1.0) * diffuseFresnelNL) *
        (1.0 + (diffuseFresnel90 - 1.0) * diffuseFresnelNV);

    return fresnel * NdotL / PI;
}

float adjustRoughnessFromLightProperties(float roughness, float lightRadius, float lightDistance)
{
    #ifdef USEPHYSICALLIGHTFALLOFF
        // At small angle this approximation works. 
        float lightRoughness = lightRadius / lightDistance;
        // Distribution can sum.
        float totalRoughness = clamp(lightRoughness + roughness, 0., 1.);
        return totalRoughness;
    #else
        return roughness;
    #endif
}

float computeDefaultMicroSurface(float microSurface, vec3 reflectivityColor)
{
    const float kReflectivityNoAlphaWorkflow_SmoothnessMax = 0.95;

    float reflectivityLuminance = getLuminance(reflectivityColor);
    float reflectivityLuma = sqrt(reflectivityLuminance);
    microSurface = reflectivityLuma * kReflectivityNoAlphaWorkflow_SmoothnessMax;

    return microSurface;
}

// For typical incident reflectance range (between 4% to 100%) set the grazing reflectance to 100% for typical fresnel effect.
// For very low reflectance range on highly diffuse objects (below 4%), incrementally reduce grazing reflecance to 0%.
float fresnelGrazingReflectance(float reflectance0) {
	float reflectance90 = clamp(reflectance0 * 25.0, 0.0, 1.0);
	return reflectance90;
}

// To enable 8 bit textures to be used we need to pack and unpack the LOD
//inverse alpha is used to work around low-alpha bugs in Edge and Firefox
#define UNPACK_LOD(x) (1.0 - x) * 255.0

float getLodFromAlphaG(float cubeMapDimensionPixels, float alphaG, float NdotV) {
    float microsurfaceAverageSlope = alphaG;

    // Compensate for solid angle change between half-vector measure (Blinn-Phong) and reflected-vector measure (Phong):
    //  dWr = 4*cos(theta)*dWh,
    // where dWr = solid angle (delta omega) in environment incident radiance (reflection-vector) measure;
    // where dWh = solid angle (delta omega) in microfacet normal (half-vector) measure;
    // so the relationship is proportional to cosine theta = NdotV.
    // The constant factor of four is handled elsewhere as part of the scale/offset filter parameters.
    microsurfaceAverageSlope *= sqrt(abs(NdotV));

    float microsurfaceAverageSlopeTexels = microsurfaceAverageSlope * cubeMapDimensionPixels;
    float lod = log2(microsurfaceAverageSlopeTexels);
    return lod;
}

float environmentRadianceOcclusion(float ambientOcclusion, float NdotVUnclamped) {
    // Best balanced (implementation time vs result vs perf) analytical environment specular occlusion found.
    // http://research.tri-ace.com/Data/cedec2011_RealtimePBR_Implementation_e.pptx
    float temp = NdotVUnclamped + ambientOcclusion;
    return clamp(square(temp) - 1.0 + ambientOcclusion, 0.0, 1.0);
}

float environmentHorizonOcclusion(vec3 reflection, vec3 normal) {
	// http://marmosetco.tumblr.com/post/81245981087
#ifdef REFLECTIONMAP_OPPOSITEZ
    reflection.z *= -1.0;
#endif
    float temp = clamp( 1.0 + 1.1 * dot(reflection, normal), 0.0, 1.0);
    return square(temp);
}