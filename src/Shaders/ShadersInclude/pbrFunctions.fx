// Constants
#define RECIPROCAL_PI2 0.15915494
#define RECIPROCAL_PI 0.31830988618
#define FRESNEL_MAXIMUM_ON_ROUGH 0.25

// AlphaG epsilon to avoid numerical issues
#define MINIMUMVARIANCE 0.0005

#define CLEARCOATREFLECTANCE90 1.0

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


#ifdef MS_BRDF_ENERGY_CONSERVATION
    // http://www.jcgt.org/published/0008/01/03/
    // http://advances.realtimerendering.com/s2018/Siggraph%202018%20HDRP%20talk_with%20notes.pdf
    vec3 getEnergyConservationFactor(const vec3 specularEnvironmentR0, vec2 environmentBrdf) {
        return 1.0 + specularEnvironmentR0 * (1.0 / environmentBrdf.y - 1.0);
    }
#endif

vec2 getBRDFLookup(float NdotV, float perceptualRoughness, sampler2D brdfSampler) {
    // Indexed on cos(theta) and roughness
    vec2 UV = vec2(NdotV, perceptualRoughness);
    
    // We can find the scale and offset to apply to the specular value.
    vec2 brdfLookup = texture2D(brdfSampler, UV).xy;

    return brdfLookup;
}

/**
 * Special thanks to @romainguy for all the support :-)
 * Analytical approximation of the pre-filtered DFG terms for the cloth shading
 * model. This approximation is based on the Estevez & Kulla distribution term
 * ("Charlie" sheen) and the Neubelt visibility term. See brdf.fs for more
 * details.
 */
vec2 getCharlieSheenAnalyticalBRDFLookup_RomainGuy(float NoV, float roughness) {
    const vec3 c0 = vec3(0.95, 1250.0, 0.0095);
    const vec4 c1 = vec4(0.04, 0.2, 0.3, 0.2);

    float a = 1.0 - NoV;
    float b = 1.0 - roughness;

    float n = pow(c1.x + a, 64.0);
    float e = b - c0.x;
    float g = exp2(-(e * e) * c0.y);
    float f = b + c1.y;
    float a2 = a * a;
    float a3 = a2 * a;
    float c = n * g + c1.z * (a + c1.w) * roughness + f * f * a3 * a3 * a2;
    float r = min(c, 18.0);

    return vec2(r, r * c0.z);
}

vec3 getReflectanceFromBRDFLookup(const vec3 specularEnvironmentR0, vec2 environmentBrdf) {
    #ifdef BRDF_V_HEIGHT_CORRELATED
        vec3 reflectance = mix(environmentBrdf.xxx, environmentBrdf.yyy, specularEnvironmentR0);
    #else
        vec3 reflectance = specularEnvironmentR0 * environmentBrdf.x + environmentBrdf.y;
    #endif
    return reflectance;
}

vec3 getReflectanceFromAnalyticalBRDFLookup_Jones(float VdotN, vec3 reflectance0, vec3 reflectance90, float smoothness)
{
    // Schlick fresnel approximation, extended with basic smoothness term so that rough surfaces do not approach reflectance90 at grazing angle
    float weight = mix(FRESNEL_MAXIMUM_ON_ROUGH, 1.0, smoothness);
    return reflectance0 + weight * (reflectance90 - reflectance0) * pow(clamp(1.0 - VdotN, 0., 1.), 5.0);
}

vec3 getSheenReflectanceFromBRDFLookup(const vec3 reflectance0, float NdotV, float sheenAlphaG) {
    vec2 environmentSheenBrdf = getCharlieSheenAnalyticalBRDFLookup_RomainGuy(NdotV, sheenAlphaG);
    vec3 reflectance = reflectance0 * environmentSheenBrdf.x + environmentSheenBrdf.y;

    return reflectance;
}

// Schlick's approximation for R0 (Fresnel Reflectance Values)
// Keep for references
// vec3 getR0fromAirToSurfaceIOR(vec3 ior1) {
//     return getR0fromIOR(ior1, vec3(1.0));
// }

// vec3 getR0fromIOR(vec3 ior1, vec3 ior2) {
//     vec3 t = (ior1 - ior2) / (ior1 + ior2);
//     return t * t;
// }

// vec3 getIORfromAirToSurfaceR0(vec3 f0) {
//     vec3 s = sqrt(f0);
//     return (1.0 + s) / (1.0 - s);
// }

// f0 Remapping due to layers
// vec3 getR0RemappedForClearCoat(vec3 f0, vec3 clearCoatF0) {
//     vec3 iorBase = getIORfromAirToSurfaceR0(f0);
//     vec3 clearCoatIor = getIORfromAirToSurfaceR0(clearCoatF0);
//     return getR0fromIOR(iorBase, clearCoatIor);
// }

#ifdef CLEARCOAT
    // Knowing ior clear coat is fix for the material
    // Solving iorbase = 1 + sqrt(fo) / (1 - sqrt(fo)) and f0base = square((iorbase - iorclearcoat) / (iorbase - iorclearcoat))
    // provide f0base = square(A + B * sqrt(fo)) / (B + A * sqrt(fo))
    // where A = 1 - iorclearcoat
    // and   B = 1 + iorclearcoat
    vec3 getR0RemappedForClearCoat(vec3 f0) {
        #ifdef CLEARCOAT_DEFAULTIOR
            #ifdef MOBILE
                return clamp(f0 * (f0 * 0.526868 + 0.529324) - 0.0482256, 0., 1.);
            #else
                return clamp(f0 * (f0 * (0.941892 - 0.263008 * f0) + 0.346479) - 0.0285998, 0., 1.);
            #endif
        #else
            vec3 s = sqrt(f0);
            vec3 t = (vClearCoatRefractionParams.z + vClearCoatRefractionParams.w * s) / (vClearCoatRefractionParams.w + vClearCoatRefractionParams.z * s);
            return t * t;
        #endif
    }
#endif

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
    #ifdef MOBILE
        // Appply simplification as all squared root terms are below 1 and squared
        return 1.0 / (dot + alphaG + (1.0 - alphaG) * dot ));
    #else
        float alphaSquared = alphaG * alphaG;
        return 1.0 / (dot + sqrt(alphaSquared + (1.0 - alphaSquared) * dot * dot));
    #endif
}

float smithVisibility_TrowbridgeReitzGGXFast(float NdotL, float NdotV, float alphaG)
{
    float visibility = smithVisibilityG1_TrowbridgeReitzGGXFast(NdotL, alphaG) * smithVisibilityG1_TrowbridgeReitzGGXFast(NdotV, alphaG);
    // No Cook Torance Denominator as it is canceled out in the previous form
    return visibility;
}

float visibility_Kelemen(float VdotH) {
    // Simplified form integration the cook torrance denminator.
    // Expanded is nl * nv / vh2 which factor with 1 / (4 * nl * nv)
    // giving 1 / (4 * vh2))
    return 0.25 / (VdotH * VdotH); 
}

// https://knarkowicz.wordpress.com/2018/01/04/cloth-shading/
// https://blog.selfshadow.com/publications/s2017-shading-course/imageworks/s2017_pbs_imageworks_sheen.pdf
// http://www.cs.utah.edu/~premoze/dbrdf/dBRDF.pdf
float visibility_Ashikhmin(float NdotL, float NdotV)
{
    return 1. / (4. * (NdotL + NdotV - NdotL * NdotV));
}

float normalDistributionFunction_CharlieSheen(float NdotH, float alphaG)
{
    float invR = 1. / alphaG;
    float cos2h = NdotH * NdotH;
    float sin2h = 1. - cos2h;
    return (2. + invR) * pow(sin2h, invR * .5) / (2. * PI);
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
    return vec2(alphaT, alphaB);
}

// Aniso Bent Normals
// Mc Alley https://www.gdcvault.com/play/1022235/Rendering-the-World-of-Far 
vec3 getAnisotropicBentNormals(const vec3 T, const vec3 B, const vec3 N, const vec3 V, float anisotropy) {
    vec3 anisotropicFrameDirection = anisotropy >= 0.0 ? B : T;
    vec3 anisotropicFrameTangent = cross(normalize(anisotropicFrameDirection), V);
    vec3 anisotropicFrameNormal = cross(anisotropicFrameTangent, anisotropicFrameDirection);
    vec3 anisotropicNormal = normalize(mix(N, anisotropicFrameNormal, abs(anisotropy)));
    return anisotropicNormal;

    // should we also do http://advances.realtimerendering.com/s2018/Siggraph%202018%20HDRP%20talk_with%20notes.pdf page 80 ?
}

// GGX Distribution Anisotropic
// https://blog.selfshadow.com/publications/s2012-shading-course/burley/s2012_pbs_disney_brdf_notes_v3.pdf Addenda
float normalDistributionFunction_BurleyGGX_Anisotropic(float NdotH, float TdotH, float BdotH, const vec2 alphaTB) {
    float a2 = alphaTB.x * alphaTB.y;
    vec3 v = vec3(alphaTB.y * TdotH, alphaTB.x  * BdotH, a2 * NdotH);
    float v2 = dot(v, v);
    float w2 = a2 / v2;
    return a2 * w2 * w2 * RECIPROCAL_PI;
}

// GGX Mask/Shadowing Isotropic 
// Heitz http://jcgt.org/published/0003/02/03/paper.pdf
// https://twvideo01.ubm-us.net/o1/vault/gdc2017/Presentations/Hammon_Earl_PBR_Diffuse_Lighting.pdf
float smithVisibility_GGXCorrelated(float NdotV, float NdotL, float alphaG) {
    #ifdef MOBILE
        // Appply simplification as all squared root terms are below 1 and squared
        float GGXV = NdotL * (NdotV * (1.0 - alphaG) + alphaG);
        float GGXL = NdotV * (NdotL * (1.0 - alphaG) + alphaG);
        return 0.5 / (GGXV + GGXL);
    #else
        float a2 = alphaG * alphaG;
        float GGXV = NdotL * sqrt(NdotV * NdotV * (1.0 - a2) + a2);
        float GGXL = NdotV * sqrt(NdotL * NdotL * (1.0 - a2) + a2);
        return 0.5 / (GGXV + GGXL);
    #endif
}

// GGX Mask/Shadowing Anisotropic 
// Heitz http://jcgt.org/published/0003/02/03/paper.pdf
float smithVisibility_GGXCorrelated_Anisotropic(float NdotV, float NdotL, float TdotV, float BdotV, float TdotL, float BdotL, const vec2 alphaTB) {
    float lambdaV = NdotL * length(vec3(alphaTB.x * TdotV, alphaTB.y * BdotV, NdotV));
    float lambdaL = NdotV * length(vec3(alphaTB.x * TdotL, alphaTB.y * BdotL, NdotL));
    float v = 0.5 / (lambdaV + lambdaL);
    return v;
}

vec3 fresnelSchlickGGX(float VdotH, vec3 reflectance0, vec3 reflectance90)
{
    return reflectance0 + (reflectance90 - reflectance0) * pow(1.0 - VdotH, 5.0);
}

float fresnelSchlickGGX(float VdotH, float reflectance0, float reflectance90)
{
    return reflectance0 + (reflectance90 - reflectance0) * pow(1.0 - VdotH, 5.0);
}

// From beer lambert law I1/I0 = e −α′lc
// c is considered included in alpha
// https://blog.selfshadow.com/publications/s2017-shading-course/drobot/s2017_pbs_multilayered.pdf page 47
// where L on a thin constant size layer can be (d * ((NdotLRefract + NdotVRefract) / (NdotLRefract * NdotVRefract))
vec3 cocaLambert(float NdotVRefract, float NdotLRefract, vec3 alpha, float thickness) {
    return exp(alpha * -(thickness * ((NdotLRefract + NdotVRefract) / (NdotLRefract * NdotVRefract))));
}
// From beerLambert Solves what alpha should be for a given resutlt at a known distance.
vec3 computeColorAtDistanceInMedia(vec3 color, float distance) {
    return -log(color) / distance;
}

// Disney diffuse term
// https://blog.selfshadow.com/publications/s2012-shading-course/burley/s2012_pbs_disney_brdf_notes_v3.pdf
// Page 14
float computeDiffuseTerm(float NdotL, float NdotV, float VdotH, float roughness) {
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

    #ifdef BRDF_V_HEIGHT_CORRELATED
        float visibility = smithVisibility_GGXCorrelated(NdotL, NdotV, alphaG);
    #else
        float visibility = smithVisibility_TrowbridgeReitzGGXFast(NdotL, NdotV, alphaG);
    #endif

    float specTerm = max(0., visibility * distribution);

    vec3 fresnel = fresnelSchlickGGX(VdotH, reflectance0, reflectance90);
    return fresnel * specTerm;
}

#ifdef SHEEN
    vec3 computeSheenTerm(float NdotH, float NdotL, float NdotV, float VdotH, float roughness, vec3 reflectance0, vec3 reflectance90, float geometricRoughnessFactor) {
        roughness = max(roughness, geometricRoughnessFactor);
        float alphaG = convertRoughnessToAverageSlope(roughness);

        float distribution = normalDistributionFunction_CharlieSheen(NdotH, alphaG);
        float visibility = visibility_Ashikhmin(NdotL, NdotV);

        float specTerm = max(0., visibility * distribution);

        vec3 fresnel = fresnelSchlickGGX(VdotH, reflectance0, reflectance90);
        return vec3(specTerm);
    }
#endif

#ifdef ANISOTROPIC
    vec3 computeAnisotropicSpecularTerm(float NdotH, float NdotL, float NdotV, float VdotH, float TdotH, float BdotH, float TdotV, float BdotV, float TdotL, float BdotL, float roughness, float anisotropy, vec3 reflectance0, vec3 reflectance90, float geometricRoughnessFactor) {
        float alphaG = convertRoughnessToAverageSlope(roughness);
        vec2 alphaTB = getAnisotropicRoughness(alphaG, anisotropy);
        alphaTB = max(alphaTB, geometricRoughnessFactor * geometricRoughnessFactor);

        float distribution = normalDistributionFunction_BurleyGGX_Anisotropic(NdotH, TdotH, BdotH, alphaTB);
        float visibility = smithVisibility_GGXCorrelated_Anisotropic(NdotV, NdotL, TdotV, BdotV, TdotL, BdotL, alphaTB);
        float specTerm = max(0., visibility * distribution);

        vec3 fresnel = fresnelSchlickGGX(VdotH, reflectance0, reflectance90);
        return fresnel * specTerm;
    }
#endif

#ifdef CLEARCOAT
    vec2 computeClearCoatTerm(float NdotH, float VdotH, float clearCoatRoughness, float geometricRoughnessFactor, float clearCoatIntensity) {
        clearCoatRoughness = max(clearCoatRoughness, geometricRoughnessFactor);
        float alphaG = convertRoughnessToAverageSlope(clearCoatRoughness);

        float distribution = normalDistributionFunction_TrowbridgeReitzGGX(NdotH, alphaG);
        float visibility = visibility_Kelemen(VdotH);
        float clearCoatTerm = max(0., visibility * distribution);

        float fresnel = fresnelSchlickGGX(VdotH, vClearCoatRefractionParams.x, CLEARCOATREFLECTANCE90);
        fresnel *= clearCoatIntensity;
        
        return vec2(fresnel * clearCoatTerm, 1.0 - fresnel);
    }

    vec3 computeClearCoatAbsorption(float NdotVRefract, float NdotLRefract, vec3 clearCoatColor, float clearCoatThickness, float clearCoatIntensity) {
        vec3 clearCoatAbsorption = mix(vec3(1.0),
            cocaLambert(NdotVRefract, NdotLRefract, clearCoatColor, clearCoatThickness),
            clearCoatIntensity);
        return clearCoatAbsorption;
    }
#endif

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