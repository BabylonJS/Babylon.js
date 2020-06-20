// Constants
#define FRESNEL_MAXIMUM_ON_ROUGH 0.25

// ______________________________________________________________________
//
//                              BRDF LOOKUP
// ______________________________________________________________________

#ifdef MS_BRDF_ENERGY_CONSERVATION
    // http://www.jcgt.org/published/0008/01/03/
    // http://advances.realtimerendering.com/s2018/Siggraph%202018%20HDRP%20talk_with%20notes.pdf
    vec3 getEnergyConservationFactor(const vec3 specularEnvironmentR0, const vec3 environmentBrdf) {
        return 1.0 + specularEnvironmentR0 * (1.0 / environmentBrdf.y - 1.0);
    }
#endif

#ifdef ENVIRONMENTBRDF
    vec3 getBRDFLookup(float NdotV, float perceptualRoughness) {
        // Indexed on cos(theta) and roughness
        vec2 UV = vec2(NdotV, perceptualRoughness);
        
        // We can find the scale and offset to apply to the specular value.
        vec4 brdfLookup = texture2D(environmentBrdfSampler, UV);

        #ifdef ENVIRONMENTBRDF_RGBD
            brdfLookup.rgb = fromRGBD(brdfLookup.rgba);
        #endif

        return brdfLookup.rgb;
    }

    vec3 getReflectanceFromBRDFLookup(const vec3 specularEnvironmentR0, const vec3 specularEnvironmentR90, const vec3 environmentBrdf) {
        #ifdef BRDF_V_HEIGHT_CORRELATED
            vec3 reflectance = (specularEnvironmentR90 - specularEnvironmentR0) * environmentBrdf.x + specularEnvironmentR0 * environmentBrdf.y;
            // Simplification if F90 = 1 vec3 reflectance = (specularEnvironmentR90 - specularEnvironmentR0) * environmentBrdf.xxx + specularEnvironmentR0 * environmentBrdf.yyy;
        #else
            vec3 reflectance = specularEnvironmentR0 * environmentBrdf.x + specularEnvironmentR90 * environmentBrdf.y;
        #endif
        return reflectance;
    }

    vec3 getReflectanceFromBRDFLookup(const vec3 specularEnvironmentR0, const vec3 environmentBrdf) {
        #ifdef BRDF_V_HEIGHT_CORRELATED
            vec3 reflectance = mix(environmentBrdf.xxx, environmentBrdf.yyy, specularEnvironmentR0);
        #else
            vec3 reflectance = specularEnvironmentR0 * environmentBrdf.x + environmentBrdf.y;
        #endif
        return reflectance;
    }
#endif

/* NOT USED
#if defined(SHEEN) && defined(SHEEN_SOFTER)
// Approximation of (integral on hemisphere)[f_sheen*cos(theta)*dtheta*dphi]
float getBRDFLookupCharlieSheen(float NdotV, float perceptualRoughness)
{
    float c = 1.0 - NdotV;
    float c3 = c*c*c;
    return 0.65584461 * c3 + 1.0 / (4.16526551 + exp(-7.97291361*perceptualRoughness+6.33516894));
}
#endif
*/

#if !defined(ENVIRONMENTBRDF) || defined(REFLECTIONMAP_SKYBOX) || defined(ALPHAFRESNEL)
    vec3 getReflectanceFromAnalyticalBRDFLookup_Jones(float VdotN, vec3 reflectance0, vec3 reflectance90, float smoothness)
    {
        // Schlick fresnel approximation, extended with basic smoothness term so that rough surfaces do not approach reflectance90 at grazing angle
        float weight = mix(FRESNEL_MAXIMUM_ON_ROUGH, 1.0, smoothness);
        return reflectance0 + weight * (reflectance90 - reflectance0) * pow5(saturate(1.0 - VdotN));
    }
#endif

#if defined(SHEEN) && defined(ENVIRONMENTBRDF)
    /**
     * The sheen BRDF not containing F can be easily stored in the blue channel of the BRDF texture.
     * The blue channel contains DCharlie * VAshikhmin * NdotL as a lokkup table
     */
    vec3 getSheenReflectanceFromBRDFLookup(const vec3 reflectance0, const vec3 environmentBrdf) {
        vec3 sheenEnvironmentReflectance = reflectance0 * environmentBrdf.b;
        return sheenEnvironmentReflectance;
    }
#endif

// ______________________________________________________________________
//
//                              Schlick/Fresnel
// ______________________________________________________________________

// iorI incident iorT transmitted

// Schlick's approximation for R0 (Fresnel Reflectance Values)
// Keep for references

// vec3 getR0fromIORs(vec3 iorT, vec3 iorI) { 
//     vec3 t = (iorT - iorI) / (iorT + iorI);
//     return t * t;
// }

// vec3 getR0fromAirToSurfaceIORT(vec3 iorT) {
//     return getR0fromIOR(iorT, vec3(1.0));
// }

// vec3 getIORTfromAirToSurfaceR0(vec3 f0) {
//     vec3 s = sqrt(f0);
//     return (1.0 + s) / (1.0 - s);
// }

// f0 Remapping due to layers
// vec3 getR0RemappedForClearCoat(vec3 f0, vec3 clearCoatF0) {
//     vec3 iorBase = getIORfromAirToSurfaceR0(f0);
//     vec3 clearCoatIor = getIORfromAirToSurfaceR0(clearCoatF0);
//     return getR0fromIOR(iorBase, clearCoatIor);
// }

vec3 fresnelSchlickGGX(float VdotH, vec3 reflectance0, vec3 reflectance90)
{
    return reflectance0 + (reflectance90 - reflectance0) * pow5(1.0 - VdotH);
}

float fresnelSchlickGGX(float VdotH, float reflectance0, float reflectance90)
{
    return reflectance0 + (reflectance90 - reflectance0) * pow5(1.0 - VdotH);
}

#ifdef CLEARCOAT
    // Knowing ior clear coat is fix for the material
    // Solving iorbase = 1 + sqrt(fo) / (1 - sqrt(fo)) and f0base = square((iorbase - iorclearcoat) / (iorbase + iorclearcoat))
    // provide f0base = square(A + B * sqrt(fo)) / (B + A * sqrt(fo))
    // where A = 1 - iorclearcoat
    // and   B = 1 + iorclearcoat
    vec3 getR0RemappedForClearCoat(vec3 f0) {
        #ifdef CLEARCOAT_DEFAULTIOR
            #ifdef MOBILE
                return saturate(f0 * (f0 * 0.526868 + 0.529324) - 0.0482256);
            #else
                return saturate(f0 * (f0 * (0.941892 - 0.263008 * f0) + 0.346479) - 0.0285998);
            #endif
        #else
            vec3 s = sqrt(f0);
            vec3 t = (vClearCoatRefractionParams.z + vClearCoatRefractionParams.w * s) / (vClearCoatRefractionParams.w + vClearCoatRefractionParams.z * s);
            return t * t;
        #endif
    }
#endif

// ______________________________________________________________________
//
//                              Distribution
// ______________________________________________________________________

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

#ifdef SHEEN
    // http://www.aconty.com/pdf/s2017_pbs_imageworks_sheen.pdf
    // https://knarkowicz.wordpress.com/2018/01/04/cloth-shading/
    float normalDistributionFunction_CharlieSheen(float NdotH, float alphaG)
    {
        float invR = 1. / alphaG;
        float cos2h = NdotH * NdotH;
        float sin2h = 1. - cos2h;
        return (2. + invR) * pow(sin2h, invR * .5) / (2. * PI);
    }
#endif

#ifdef ANISOTROPIC
    // GGX Distribution Anisotropic
    // https://blog.selfshadow.com/publications/s2012-shading-course/burley/s2012_pbs_disney_brdf_notes_v3.pdf Addenda
    float normalDistributionFunction_BurleyGGX_Anisotropic(float NdotH, float TdotH, float BdotH, const vec2 alphaTB) {
        float a2 = alphaTB.x * alphaTB.y;
        vec3 v = vec3(alphaTB.y * TdotH, alphaTB.x  * BdotH, a2 * NdotH);
        float v2 = dot(v, v);
        float w2 = a2 / v2;
        return a2 * w2 * w2 * RECIPROCAL_PI;
    }
#endif

// ______________________________________________________________________
//
//                              Visibility/Geometry
// ______________________________________________________________________

#ifdef BRDF_V_HEIGHT_CORRELATED
    // GGX Mask/Shadowing Isotropic 
    // Heitz http://jcgt.org/published/0003/02/03/paper.pdf
    // https://twvideo01.ubm-us.net/o1/vault/gdc2017/Presentations/Hammon_Earl_PBR_Diffuse_Lighting.pdf
    float smithVisibility_GGXCorrelated(float NdotL, float NdotV, float alphaG) {
        #ifdef MOBILE
            // Appply simplification as all squared root terms are below 1 and squared
            float GGXV = NdotL * (NdotV * (1.0 - alphaG) + alphaG);
            float GGXL = NdotV * (NdotL * (1.0 - alphaG) + alphaG);
            return 0.5 / (GGXV + GGXL);
        #else
            float a2 = alphaG * alphaG;
            float GGXV = NdotL * sqrt(NdotV * (NdotV - a2 * NdotV) + a2);
            float GGXL = NdotV * sqrt(NdotL * (NdotL - a2 * NdotL) + a2);
            return 0.5 / (GGXV + GGXL);
        #endif
    }
#else
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
#endif

#ifdef ANISOTROPIC
    // GGX Mask/Shadowing Anisotropic 
    // Heitz http://jcgt.org/published/0003/02/03/paper.pdf
    float smithVisibility_GGXCorrelated_Anisotropic(float NdotL, float NdotV, float TdotV, float BdotV, float TdotL, float BdotL, const vec2 alphaTB) {
        float lambdaV = NdotL * length(vec3(alphaTB.x * TdotV, alphaTB.y * BdotV, NdotV));
        float lambdaL = NdotV * length(vec3(alphaTB.x * TdotL, alphaTB.y * BdotL, NdotL));
        float v = 0.5 / (lambdaV + lambdaL);
        return v;
    }
#endif

#ifdef CLEARCOAT
    float visibility_Kelemen(float VdotH) {
        // Simplified form integration the cook torrance denminator.
        // Expanded is nl * nv / vh2 which factor with 1 / (4 * nl * nv)
        // giving 1 / (4 * vh2))
        return 0.25 / (VdotH * VdotH); 
    }
#endif

#ifdef SHEEN
    // https://knarkowicz.wordpress.com/2018/01/04/cloth-shading/
    // https://blog.selfshadow.com/publications/s2017-shading-course/imageworks/s2017_pbs_imageworks_sheen.pdf
    // http://www.cs.utah.edu/~premoze/dbrdf/dBRDF.pdf
    float visibility_Ashikhmin(float NdotL, float NdotV)
    {
        return 1. / (4. * (NdotL + NdotV - NdotL * NdotV));
    }

    /* NOT USED
    #ifdef SHEEN_SOFTER
        // http://www.aconty.com/pdf/s2017_pbs_imageworks_sheen.pdf
        float l(float x, float alphaG)
        {
            float oneMinusAlphaSq = (1.0 - alphaG) * (1.0 - alphaG);
            float a = mix(21.5473, 25.3245, oneMinusAlphaSq);
            float b = mix(3.82987, 3.32435, oneMinusAlphaSq);
            float c = mix(0.19823, 0.16801, oneMinusAlphaSq);
            float d = mix(-1.97760, -1.27393, oneMinusAlphaSq);
            float e = mix(-4.32054, -4.85967, oneMinusAlphaSq);
            return a / (1.0 + b * pow(x, c)) + d * x + e;
        }

        float lambdaSheen(float cosTheta, float alphaG)
        {
            return abs(cosTheta) < 0.5 ? exp(l(cosTheta, alphaG)) : exp(2.0 * l(0.5, alphaG) - l(1.0 - cosTheta, alphaG));
        }

        float visibility_CharlieSheen(float NdotL, float NdotV, float alphaG)
        {
            float G = 1.0 / (1.0 + lambdaSheen(NdotV, alphaG) + lambdaSheen(NdotL, alphaG));
            return G / (4.0 * NdotV * NdotL);
        }
    #endif
    */
#endif

// ______________________________________________________________________
//
//                              DiffuseBRDF
// ______________________________________________________________________

// Disney diffuse term
// https://blog.selfshadow.com/publications/s2012-shading-course/burley/s2012_pbs_disney_brdf_notes_v3.pdf
// Page 14
float diffuseBRDF_Burley(float NdotL, float NdotV, float VdotH, float roughness) {
    // Diffuse fresnel falloff as per Disney principled BRDF, and in the spirit of
    // of general coupled diffuse/specular models e.g. Ashikhmin Shirley.
    float diffuseFresnelNV = pow5(saturateEps(1.0 - NdotL));
    float diffuseFresnelNL = pow5(saturateEps(1.0 - NdotV));
    float diffuseFresnel90 = 0.5 + 2.0 * VdotH * VdotH * roughness;
    float fresnel =
        (1.0 + (diffuseFresnel90 - 1.0) * diffuseFresnelNL) *
        (1.0 + (diffuseFresnel90 - 1.0) * diffuseFresnelNV);

    return fresnel / PI;
}

#ifdef SS_TRANSLUCENCY
    // Pixar diffusion profile
    // http://graphics.pixar.com/library/ApproxBSSRDF/paper.pdf
    vec3 transmittanceBRDF_Burley(const vec3 tintColor, const vec3 diffusionDistance, float thickness) {
        vec3 S = 1. / maxEps(diffusionDistance);
        vec3 temp = exp((-0.333333333 * thickness) * S);
        return tintColor.rgb * 0.25 * (temp * temp * temp + 3.0 * temp);
    }

    // Extends the dark area to prevent seams
    // Keep it energy conserving by using McCauley solution: https://blog.selfshadow.com/2011/12/31/righting-wrap-part-1/
    float computeWrappedDiffuseNdotL(float NdotL, float w) {
        float t = 1.0 + w;
        float invt2 = 1.0 / square(t);
        return saturate((NdotL + w) * invt2);
    }
#endif
