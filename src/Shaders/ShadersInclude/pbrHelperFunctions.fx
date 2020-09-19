// Constants
#define RECIPROCAL_PI2 0.15915494
#define RECIPROCAL_PI 0.31830988618

// AlphaG epsilon to avoid numerical issues
#define MINIMUMVARIANCE 0.0005

float convertRoughnessToAverageSlope(float roughness)
{
    // Calculate AlphaG as square of roughness (add epsilon to avoid numerical issues)
    return square(roughness) + MINIMUMVARIANCE;
}

float fresnelGrazingReflectance(float reflectance0) {
    // For typical incident reflectance range (between 4% to 100%) set the grazing reflectance to 100% for typical fresnel effect.
    // For very low reflectance range on highly diffuse objects (below 4%), incrementally reduce grazing reflecance to 0%.
    float reflectance90 = saturate(reflectance0 * 25.0);
    return reflectance90;
}

vec2 getAARoughnessFactors(vec3 normalVector) {
    #ifdef SPECULARAA
        vec3 nDfdx = dFdx(normalVector.xyz);
        vec3 nDfdy = dFdy(normalVector.xyz);
        float slopeSquare = max(dot(nDfdx, nDfdx), dot(nDfdy, nDfdy));

        // Vive analytical lights roughness factor.
        float geometricRoughnessFactor = pow(saturate(slopeSquare), 0.333);

        // Adapt linear roughness (alphaG) to geometric curvature of the current pixel.
        float geometricAlphaGFactor = sqrt(slopeSquare);
        // BJS factor.
        geometricAlphaGFactor *= 0.75;

        return vec2(geometricRoughnessFactor, geometricAlphaGFactor);
    #else
        return vec2(0.);
    #endif
}

#ifdef ANISOTROPIC
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
#endif

#if defined(CLEARCOAT) || defined(SS_REFRACTION)
    // From beer lambert law I1/I0 = e −α′lc
    // c is considered included in alpha
    // https://blog.selfshadow.com/publications/s2017-shading-course/drobot/s2017_pbs_multilayered.pdf page 47
    vec3 cocaLambert(vec3 alpha, float distance) {
        return exp(-alpha * distance);
    }

    // where L on a thin constant size layer can be (d * ((NdotLRefract + NdotVRefract) / (NdotLRefract * NdotVRefract))
    vec3 cocaLambert(float NdotVRefract, float NdotLRefract, vec3 alpha, float thickness) {
        return cocaLambert(alpha, (thickness * ((NdotLRefract + NdotVRefract) / (NdotLRefract * NdotVRefract))));
    }

    // From beerLambert Solves what alpha should be for a given result at a known distance.
    vec3 computeColorAtDistanceInMedia(vec3 color, float distance) {
        return -log(color) / distance;
    }

    vec3 computeClearCoatAbsorption(float NdotVRefract, float NdotLRefract, vec3 clearCoatColor, float clearCoatThickness, float clearCoatIntensity) {
        vec3 clearCoatAbsorption = mix(vec3(1.0),
            cocaLambert(NdotVRefract, NdotLRefract, clearCoatColor, clearCoatThickness),
            clearCoatIntensity);
        return clearCoatAbsorption;
    }
#endif

// ___________________________________________________________________________________
//
// LEGACY
// ___________________________________________________________________________________

#ifdef MICROSURFACEAUTOMATIC
    float computeDefaultMicroSurface(float microSurface, vec3 reflectivityColor)
    {
        const float kReflectivityNoAlphaWorkflow_SmoothnessMax = 0.95;

        float reflectivityLuminance = getLuminance(reflectivityColor);
        float reflectivityLuma = sqrt(reflectivityLuminance);
        microSurface = reflectivityLuma * kReflectivityNoAlphaWorkflow_SmoothnessMax;

        return microSurface;
    }
#endif