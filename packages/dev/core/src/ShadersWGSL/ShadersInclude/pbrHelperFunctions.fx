// AlphaG epsilon to avoid numerical issues
#define MINIMUMVARIANCE 0.0005

fn convertRoughnessToAverageSlope(roughness: f32) -> f32
{
    // Calculate AlphaG as square of roughness (add epsilon to avoid numerical issues)
    return roughness * roughness + MINIMUMVARIANCE;
}

fn fresnelGrazingReflectance(reflectance0: f32) -> f32 {
    // For typical incident reflectance range (between 4% to 100%) set the grazing reflectance to 100% for typical fresnel effect.
    // For very low reflectance range on highly diffuse objects (below 4%), incrementally reduce grazing reflecance to 0%.
    var reflectance90: f32 = saturate(reflectance0 * 25.0);
    return reflectance90;
}

fn getAARoughnessFactors(normalVector: vec3f) -> vec2f {
    #ifdef SPECULARAA
        var nDfdx: vec3f = dpdx(normalVector.xyz);
        var nDfdy: vec3f = dpdy(normalVector.xyz);
        var slopeSquare: f32 = max(dot(nDfdx, nDfdx), dot(nDfdy, nDfdy));

        // Vive analytical lights roughness factor.
        var geometricRoughnessFactor: f32 = pow(saturate(slopeSquare), 0.333);

        // Adapt linear roughness (alphaG) to geometric curvature of the current pixel.
        var geometricAlphaGFactor: f32 = sqrt(slopeSquare);
        // BJS factor.
        geometricAlphaGFactor *= 0.75;

        return  vec2f(geometricRoughnessFactor, geometricAlphaGFactor);
    #else
        return  vec2f(0.);
    #endif
}

#ifdef ANISOTROPIC
    #ifdef ANISOTROPIC_LEGACY
        // Aniso parameter remapping
        // https://blog.selfshadow.com/publications/s2017-shading-course/imageworks/s2017_pbs_imageworks_slides_v2.pdf page 24
        fn getAnisotropicRoughness(alphaG: f32, anisotropy: f32) -> vec2f {
            var alphaT: f32 = max(alphaG * (1.0 + anisotropy), MINIMUMVARIANCE);
            var alphaB: f32 = max(alphaG * (1.0 - anisotropy), MINIMUMVARIANCE);
            return  vec2f(alphaT, alphaB);
        }
        // Aniso Bent Normals
        // Mc Alley https://www.gdcvault.com/play/1022235/Rendering-the-World-of-Far 
        fn getAnisotropicBentNormals(T: vec3f, B: vec3f, N: vec3f, V: vec3f, anisotropy: f32, roughness: f32) -> vec3f {
            var anisotropicFrameDirection: vec3f = select(T, B, anisotropy >= 0.0);
            var anisotropicFrameTangent: vec3f = cross(normalize(anisotropicFrameDirection), V);
            var anisotropicFrameNormal: vec3f = cross(anisotropicFrameTangent, anisotropicFrameDirection);
            var anisotropicNormal: vec3f = normalize(mix(N, anisotropicFrameNormal, abs(anisotropy)));
            return anisotropicNormal;

            // should we also do http://advances.realtimerendering.com/s2018/Siggraph%202018%20HDRP%20talk_with%20notes.pdf page 80 ?
        }
    #elif ANISOTROPIC_OPENPBR
        // Aniso parameter remapping OpenPBR
        fn getAnisotropicRoughness(alphaG: f32, anisotropy: f32) -> vec2f {
            var alphaT: f32 = alphaG * sqrt(2.0 / (1.0 + (1.0 - anisotropy) * (1.0 - anisotropy)));
            var alphaB: f32 = max(alphaT * (1.0 - anisotropy), MINIMUMVARIANCE);
            return vec2f(alphaT, alphaB);
        }
    #else
        // Aniso parameter remapping GLTF
        // https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_anisotropy
        fn getAnisotropicRoughness(alphaG: f32, anisotropy: f32) -> vec2f {
            var alphaT: f32 = max(mix(alphaG, 1.0, anisotropy * anisotropy), MINIMUMVARIANCE);
            var alphaB: f32 = max(alphaG, MINIMUMVARIANCE);
            return  vec2f(alphaT, alphaB);
        }
        fn getAnisotropicBentNormals(T: vec3f, B: vec3f, N: vec3f, V: vec3f, anisotropy: f32, roughness: f32) -> vec3f {
            var bentNormal: vec3f = cross(B, V);
            bentNormal = normalize(cross(bentNormal, B));
            // This heuristic can probably be improved upon
            var sq = 1.0 - anisotropy * (1.0 - roughness);
            var a: f32 = sq * sq * sq * sq;
            bentNormal = normalize(mix(bentNormal, N, a));
            return bentNormal;
        }
    #endif
#endif

#if defined(CLEARCOAT) || defined(SS_REFRACTION)
    // From beer lambert law I1/I0 = e −α′lc
    // c is considered included in alpha
    // https://blog.selfshadow.com/publications/s2017-shading-course/drobot/s2017_pbs_multilayered.pdf page 47
    fn cocaLambertVec3(alpha: vec3f, distance: f32) -> vec3f {
        return exp(-alpha * distance);
    }

    // where L on a thin constant size layer can be (d * ((NdotLRefract + NdotVRefract) / (NdotLRefract * NdotVRefract))
    fn cocaLambert(NdotVRefract: f32, NdotLRefract: f32, alpha: vec3f, thickness: f32) -> vec3f {
        return cocaLambertVec3(alpha, (thickness * ((NdotLRefract + NdotVRefract) / (NdotLRefract * NdotVRefract))));
    }

    // From beerLambert Solves what alpha should be for a given result at a known distance.
    fn computeColorAtDistanceInMedia(color: vec3f, distance: f32) -> vec3f {
        return -log(color) / distance;
    }

    fn computeClearCoatAbsorption(NdotVRefract: f32, NdotLRefract: f32, clearCoatColor: vec3f, clearCoatThickness: f32, clearCoatIntensity: f32) -> vec3f {
        var clearCoatAbsorption: vec3f = mix( vec3f(1.0),
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
    fn computeDefaultMicroSurface(microSurface: f32, reflectivityColor: vec3f) -> f32
    {
        const kReflectivityNoAlphaWorkflow_SmoothnessMax: f32 = 0.95;

        var reflectivityLuminance: f32 = getLuminance(reflectivityColor);
        var reflectivityLuma: f32 = sqrt(reflectivityLuminance);
        var resultMicroSurface = reflectivityLuma * kReflectivityNoAlphaWorkflow_SmoothnessMax;

        return resultMicroSurface;
    }
#endif