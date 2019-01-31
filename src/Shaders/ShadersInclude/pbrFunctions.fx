// Constants
#define RECIPROCAL_PI2 0.15915494
#define FRESNEL_MAXIMUM_ON_ROUGH 0.25
// AlphaG epsilon to avoid numerical issues
#define MINIMUMVARIANCE 0.0005

float convertRoughnessToAverageSlope(float roughness)
{
    // Calculate AlphaG as square of roughness; add epsilon to avoid numerical issues
    return square(roughness) + MINIMUMVARIANCE;
}

vec2 getAARoughnessFactors(vec3 normalVector) {
    #ifdef SPECULARAA
        vec3 nDfdx = dFdx(normalVector.xyz);
        vec3 nDfdy = dFdy(normalVector.xyz);
        float slopeSquare = max(dot(nDfdx, nDfdx), dot(nDfdy, nDfdy));

        // Vive analytical lights roughness factor.
        float geometricRoughnessFactor = pow(clamp(slopeSquare , 0., 1.), 0.333);

        // Adapt linear roughness (alphaG) to geometric curvature of the current pixel.
        float geometricAlphaGFactor = sqrt(slopeSquare);
        // BJS factor.
        geometricAlphaGFactor *= 0.75;

        return vec2(geometricRoughnessFactor, geometricAlphaGFactor);
    #else
        return vec2(0.);
    #endif
}

// From Microfacet Models for Refraction through Rough Surfaces, Walter et al. 2007
// Keep for references
// float smithVisibilityG1_TrowbridgeReitzGGX(float dot, float alphaG)
// {
//     float tanSquared = (1.0 - dot * dot) / (dot * dot);
//     return 2.0 / (1.0 + sqrt(1.0 + alphaG * alphaG * tanSquared));
// }

// float smithVisibility_TrowbridgeReitzGGX_Walter(float NdotL, float NdotV, float alphaG)
// {
//     float visibility = smithVisibilityG1_TrowbridgeReitzGGX(NdotL, alphaG) * smithVisibilityG1_TrowbridgeReitzGGX(NdotV, alphaG);
//     visibility /= (4.0 * NdotL * NdotV); // Cook Torance Denominator  integrated in visibility to avoid issues when visibility function changes.
//     return visibility;
// }

// From smithVisibilityG1_TrowbridgeReitzGGX * dot / dot to cancel the cook
// torrance denominator :-)
float smithVisibilityG1_TrowbridgeReitzGGXFast(float dot, float alphaG)
{
    float alphaSquared = alphaG * alphaG;
    return 1.0 / (dot + sqrt(alphaSquared + (1.0 - alphaSquared) * dot * dot));
}

// From smithVisibilityG1_TrowbridgeReitzGGXFast
// Appply simplification as all squared root terms are below 1 and squared
// Ready to be used
// float smithVisibilityG1_TrowbridgeReitzGGXMobile(float dot, float alphaG)
// {
//     return 1.0 / (dot + alpha + (1.0 - alpha) * dot ));
// }

float smithVisibility_TrowbridgeReitzGGXFast(float NdotL, float NdotV, float alphaG)
{
    float visibility = smithVisibilityG1_TrowbridgeReitzGGXFast(NdotL, alphaG) * smithVisibilityG1_TrowbridgeReitzGGXFast(NdotV, alphaG);
    // No Cook Torance Denominator as it is canceled out in the previous form
    return visibility;
}

float kelemenVisibility(float VdotH) {
    // Simplified form integration the cook torrance denminator.
    // Expanded is nl * nv / vh2 which factor with 1 / (4 * nl * nv)
    // giving 1 / (4 * vh2))
    return 0.25 / (VdotH * VdotH); 
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

// Aniso parameter remapping
// https://blog.selfshadow.com/publications/s2017-shading-course/imageworks/s2017_pbs_imageworks_slides_v2.pdf page 24
vec2 getAnisotropicRoughness(float alphaG, float anisotropy) {
    float alphaT = max(alphaG * (1.0 + anisotropy), MINIMUMVARIANCE);
    float alphaB = max(alphaG * (1.0 - anisotropy), MINIMUMVARIANCE);
    return vec2(at, ab);
}

// GGX Distribution Anisotropic
// https://blog.selfshadow.com/publications/s2012-shading-course/burley/s2012_pbs_disney_brdf_notes_v3.pdf Addenda
float normalDistributionFunction_BurleyGGX_Anisotropic(float NdotH, float TdotH, float BdotH, const vec2 alphaTB) {
    float a2 = alphaTB.x * alphaTB.y;
    vec3 v = vec3(alphaTB.y * TdotH, alphaTB.x  * BdotH, a2 * NdotH);
    float v2 = dot(v, v);
    float w2 = a2 / v2;
    return a2 * w2 * w2 * (1.0 / PI);
}

// GGX Mask/Shadowing Anisotropic 
// Heitz http://jcgt.org/published/0003/02/03/paper.pdf
float smithVisibility_GGXCorrelated_Anisotropic(float NdotV, float NdotL, float TdotV, float BdotV, float TdotL, float BdotL, const vec2 alphaTB) {
    float lambdaV = NdotL * length(vec3(alphaTB.x * TdotV, alphaTB.y * BdotV, NdotV));
    float lambdaL = NdotV * length(vec3(alphaTB.x * TdotL, alphaTB.y * BdotL, NdotL));
    float v = 0.5 / (lambdaV + lambdaL);
    return v;
}

vec3 fresnelSchlickGGXVec3(float VdotH, vec3 reflectance0, vec3 reflectance90)
{
    return reflectance0 + (reflectance90 - reflectance0) * pow(1.0 - VdotH, 5.0);
}

float fresnelSchlickGGXFloat(float VdotH, float reflectance0, float reflectance90)
{
    return reflectance0 + (reflectance90 - reflectance0) * pow(1.0 - VdotH, 5.0);
}

vec3 fresnelSchlickEnvironmentGGX(float VdotN, vec3 reflectance0, vec3 reflectance90, float smoothness)
{
    // Schlick fresnel approximation, extended with basic smoothness term so that rough surfaces do not approach reflectance90 at grazing angle
    float weight = mix(FRESNEL_MAXIMUM_ON_ROUGH, 1.0, smoothness);
    return reflectance0 + weight * (reflectance90 - reflectance0) * pow(clamp(1.0 - VdotN, 0., 1.), 5.0);
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

    return fresnel / PI;
}

// Cook Torance Specular computation.
vec3 computeSpecularTerm(float NdotH, float NdotL, float NdotV, float VdotH, float roughness, vec3 reflectance0, vec3 reflectance90, float geometricRoughnessFactor) {
    roughness = max(roughness, geometricRoughnessFactor);
    float alphaG = convertRoughnessToAverageSlope(roughness);

    float distribution = normalDistributionFunction_TrowbridgeReitzGGX(NdotH, alphaG);
    float visibility = smithVisibility_TrowbridgeReitzGGXFast(NdotL, NdotV, alphaG);
    float specTerm = max(0., visibility * distribution);

    vec3 fresnel = fresnelSchlickGGXVec3(VdotH, reflectance0, reflectance90);
    return fresnel * specTerm;
}

vec3 computeAnisotropicSpecularTerm(float NdotH, float NdotL, float NdotV, float VdotH, float TdotH, float BdotH, float TdotV, float BdotV, float TdotL, float BdotL, float roughness, float anisotropy, vec3 reflectance0, vec3 reflectance90, float geometricRoughnessFactor) {
    float alphaG = convertRoughnessToAverageSlope(roughness);
    vec2 alphaTB = getAnisotropicRoughness(alphaG, anisotropy)
    alphaTB = max(alphaTB, geometricRoughnessFactor * geometricRoughnessFactor);

    float distribution = normalDistributionFunction_BurleyGGX_Anisotropic(NdotH, TdotH, BdotH, alphaTB);
    float visibility = smithVisibility_GGXCorrelated_Anisotropic(NdotV, NdotL, TdotV, BdotV, TdotL, BdotL, alphaTB);
    float specTerm = max(0., visibility * distribution);

    vec3 fresnel = fresnelSchlickGGXVec3(VdotH, reflectance0, reflectance90);
    return fresnel * specTerm;
}

vec2 computeClearCoatTerm(float NdotH, float VdotH, float clearCoatRoughness, float geometricRoughnessFactor, float clearCoatIntensity) {
    clearCoatRoughness = max(clearCoatRoughness, geometricRoughnessFactor);
    float alphaG = convertRoughnessToAverageSlope(clearCoatRoughness);

    float distribution = normalDistributionFunction_TrowbridgeReitzGGX(NdotH, alphaG);
    float visibility = kelemenVisibility(VdotH);
    float clearCoatTerm = max(0., visibility * distribution);

    // fo = 4% based on the IOR of a air-polyurethane interface.
    // the max reflectance is relying on our special trick to prevent weird values on highly diffuse materials.
    // To let as a configuration if required
    const float reflectance0 = 0.04;
    const float reflectance90 = 1.;

    float fresnel = fresnelSchlickGGXFloat(VdotH, reflectance0, reflectance90);
    fresnel *= clearCoatIntensity;
    
    return vec2(fresnel * clearCoatTerm, 1.0 - fresnel);
}

float adjustRoughnessFromLightProperties(float roughness, float lightRadius, float lightDistance)
{
    #if defined(USEPHYSICALLIGHTFALLOFF) || defined(USEGLTFLIGHTFALLOFF)
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

float environmentHorizonOcclusion(vec3 view, vec3 normal) {
    // http://marmosetco.tumblr.com/post/81245981087
    vec3 reflection = reflect(view, normal);
    float temp = clamp( 1.0 + 1.1 * dot(reflection, normal), 0.0, 1.0);
    return square(temp);
}