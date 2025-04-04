#define CLEARCOATREFLECTANCE90 1.0

// Light Results
struct lightingInfo
{
    diffuse: vec3f,
    #ifdef SS_TRANSLUCENCY
        diffuseTransmission: vec3f,
    #endif
    #ifdef SPECULARTERM
        specular: vec3f,
    #endif
    #ifdef CLEARCOAT
        // xyz contains the clearcoat color.
        // w contains the 1 - clearcoat fresnel to ease the energy conservation computation.
        clearCoat: vec4f,
    #endif
    #ifdef SHEEN
        sheen: vec3f
    #endif
};

// Simulate area (small) lights by increasing roughness
fn adjustRoughnessFromLightProperties(roughness: f32, lightRadius: f32, lightDistance: f32) -> f32 {
    #if defined(USEPHYSICALLIGHTFALLOFF) || defined(USEGLTFLIGHTFALLOFF)
        // At small angle this approximation works. 
        var lightRoughness: f32 = lightRadius / lightDistance;
        // Distribution can sum.
        var totalRoughness: f32 = saturate(lightRoughness + roughness);
        return totalRoughness;
    #else
        return roughness;
    #endif
}

fn computeHemisphericDiffuseLighting(info: preLightingInfo, lightColor: vec3f, groundColor: vec3f) -> vec3f {
    return mix(groundColor, lightColor, info.NdotL);
}

#if defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
    fn computeAreaDiffuseLighting(info: preLightingInfo, lightColor: vec3f) -> vec3f {
        return info.areaLightDiffuse * lightColor;
    }
#endif

fn computeDiffuseLighting(info: preLightingInfo, lightColor: vec3f) -> vec3f {
    var diffuseTerm: f32 = diffuseBRDF_Burley(info.NdotL, info.NdotV, info.VdotH, info.roughness);
    return diffuseTerm * info.attenuation * info.NdotL * lightColor;
}

fn computeProjectionTextureDiffuseLighting(projectionLightTexture: texture_2d<f32>, projectionLightSampler: sampler, textureProjectionMatrix: mat4x4f, posW: vec3f) -> vec3f{
    var strq: vec4f = textureProjectionMatrix *  vec4f(posW, 1.0);
    strq /= strq.w;
    var textureColor: vec3f = textureSample(projectionLightTexture, projectionLightSampler, strq.xy).rgb;
    return toLinearSpaceVec3(textureColor);
}

#ifdef SS_TRANSLUCENCY
    fn computeDiffuseTransmittedLighting(info: preLightingInfo, lightColor: vec3f, transmittance: vec3f) -> vec3f {
        var transmittanceNdotL = vec3f(0.0);
        var NdotL: f32 = absEps(info.NdotLUnclamped);
    #ifndef SS_TRANSLUCENCY_LEGACY
        if (info.NdotLUnclamped < 0.0) {
    #endif
            // Use wrap lighting to simulate SSS.
            var wrapNdotL: f32 = computeWrappedDiffuseNdotL(NdotL, 0.02);

            // Remap transmittance from tr to 1. if ndotl is negative.
            var trAdapt: f32 = step(0., info.NdotLUnclamped);
            transmittanceNdotL = mix(transmittance * wrapNdotL,  vec3f(wrapNdotL), trAdapt);
    #ifndef SS_TRANSLUCENCY_LEGACY
        }

        return (transmittanceNdotL / PI) * info.attenuation * lightColor;
    #endif

        let diffuseTerm = diffuseBRDF_Burley(NdotL, info.NdotV, info.VdotH, info.roughness);
        return diffuseTerm * transmittanceNdotL * info.attenuation * lightColor;
    }
#endif

#ifdef SPECULARTERM
    fn computeSpecularLighting(info: preLightingInfo, N: vec3f, reflectance0: vec3f, reflectance90: vec3f, geometricRoughnessFactor: f32, lightColor: vec3f, ior: f32) -> vec3f {
        var NdotH: f32 = saturateEps(dot(N, info.H));
        var roughness: f32 = max(info.roughness, geometricRoughnessFactor);
        var alphaG: f32 = convertRoughnessToAverageSlope(roughness);

        #ifdef METALLICWORKFLOW
            // Scale the reflectance by the IOR for values less than 1.5
            var f90Mod = clamp(2.0 * (ior - 1.0), 0.0, 1.0);
        #else
            var f90Mod = 1.0;
        #endif
        var fresnel: vec3f = fresnelSchlickGGXVec3(info.VdotH, reflectance0, reflectance90 * f90Mod);

        #ifdef IRIDESCENCE
            fresnel = mix(fresnel, reflectance0, info.iridescenceIntensity);
        #endif

        var distribution: f32 = normalDistributionFunction_TrowbridgeReitzGGX(NdotH, alphaG);

        #ifdef BRDF_V_HEIGHT_CORRELATED
            var smithVisibility: f32 = smithVisibility_GGXCorrelated(info.NdotL, info.NdotV, alphaG);
        #else
            var smithVisibility: f32 = smithVisibility_TrowbridgeReitzGGXFast(info.NdotL, info.NdotV, alphaG);
        #endif

        var specTerm: vec3f = fresnel * distribution * smithVisibility;
        return specTerm * info.attenuation * info.NdotL * lightColor;
    }

    #if defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
        fn computeAreaSpecularLighting(info: preLightingInfo, specularColor: vec3f) -> vec3f {
            var fresnel:vec3f  = ( specularColor * info.areaLightFresnel.x + ( vec3f( 1.0 ) - specularColor ) * info.areaLightFresnel.y );
            return specularColor * fresnel * info.areaLightSpecular;
        }
    #endif
#endif

#ifdef ANISOTROPIC
    fn computeAnisotropicSpecularLighting(info: preLightingInfo, V: vec3f, N: vec3f, T: vec3f, B: vec3f, anisotropy: f32, reflectance0: vec3f, reflectance90: vec3f, geometricRoughnessFactor: f32, lightColor: vec3f) -> vec3f {
        var NdotH: f32 = saturateEps(dot(N, info.H));
        var TdotH: f32 = dot(T, info.H);
        var BdotH: f32 = dot(B, info.H);
        var TdotV: f32 = dot(T, V);
        var BdotV: f32 = dot(B, V);
        var TdotL: f32 = dot(T, info.L);
        var BdotL: f32 = dot(B, info.L);
        var alphaG: f32 = convertRoughnessToAverageSlope(info.roughness);
        var alphaTB: vec2f = getAnisotropicRoughness(alphaG, anisotropy);
        alphaTB = max(alphaTB, vec2f(geometricRoughnessFactor * geometricRoughnessFactor));

        var fresnel: vec3f = fresnelSchlickGGXVec3(info.VdotH, reflectance0, reflectance90);

        #ifdef IRIDESCENCE
            fresnel = mix(fresnel, reflectance0, info.iridescenceIntensity);
        #endif

        var distribution: f32 = normalDistributionFunction_BurleyGGX_Anisotropic(NdotH, TdotH, BdotH, alphaTB);
        var smithVisibility: f32 = smithVisibility_GGXCorrelated_Anisotropic(info.NdotL, info.NdotV, TdotV, BdotV, TdotL, BdotL, alphaTB);

        var specTerm: vec3f = fresnel * distribution * smithVisibility;
        return specTerm * info.attenuation * info.NdotL * lightColor;
    }
#endif

#ifdef CLEARCOAT
    fn computeClearCoatLighting(info: preLightingInfo, Ncc: vec3f, geometricRoughnessFactor: f32, clearCoatIntensity: f32, lightColor: vec3f) -> vec4f {
        var NccdotL: f32 = saturateEps(dot(Ncc, info.L));
        var NccdotH: f32 = saturateEps(dot(Ncc, info.H));
        var clearCoatRoughness: f32 = max(info.roughness, geometricRoughnessFactor);
        var alphaG: f32 = convertRoughnessToAverageSlope(clearCoatRoughness);

        var fresnel: f32 = fresnelSchlickGGX(info.VdotH, uniforms.vClearCoatRefractionParams.x, CLEARCOATREFLECTANCE90);
        fresnel *= clearCoatIntensity;
        var distribution: f32 = normalDistributionFunction_TrowbridgeReitzGGX(NccdotH, alphaG);
        var kelemenVisibility: f32 = visibility_Kelemen(info.VdotH);

        var clearCoatTerm: f32 = fresnel * distribution * kelemenVisibility;

        return  vec4f(
            clearCoatTerm * info.attenuation * NccdotL * lightColor,
            1.0 - fresnel
        );
    }

    fn computeClearCoatLightingAbsorption(NdotVRefract: f32, L: vec3f, Ncc: vec3f, clearCoatColor: vec3f, clearCoatThickness: f32, clearCoatIntensity: f32) -> vec3f {
        var LRefract: vec3f = -refract(L, Ncc, uniforms.vClearCoatRefractionParams.y);
        var NdotLRefract: f32 = saturateEps(dot(Ncc, LRefract));

        var absorption: vec3f = computeClearCoatAbsorption(NdotVRefract, NdotLRefract, clearCoatColor, clearCoatThickness, clearCoatIntensity);
        return absorption;
    }
#endif

#ifdef SHEEN
    fn computeSheenLighting(info: preLightingInfo, N: vec3f, reflectance0: vec3f, reflectance90: vec3f, geometricRoughnessFactor: f32, lightColor: vec3f) -> vec3f {
        var NdotH: f32 = saturateEps(dot(N, info.H));
        var roughness: f32 = max(info.roughness, geometricRoughnessFactor);
        var alphaG: f32 = convertRoughnessToAverageSlope(roughness);

        // No Fresnel Effect with sheen
        // var fresnel: vec3f = fresnelSchlickGGX(info.VdotH, reflectance0, reflectance90);
        var fresnel: f32 = 1.;
        var distribution: f32 = normalDistributionFunction_CharlieSheen(NdotH, alphaG);
        /*#ifdef SHEEN_SOFTER
            var visibility: f32 = visibility_CharlieSheen(info.NdotL, info.NdotV, alphaG);
        #else */
            var visibility: f32 = visibility_Ashikhmin(info.NdotL, info.NdotV);
        /* #endif */

        var sheenTerm: f32 = fresnel * distribution * visibility;
        return sheenTerm * info.attenuation * info.NdotL * lightColor;
    }
#endif
