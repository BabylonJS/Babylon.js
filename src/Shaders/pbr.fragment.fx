#if defined(BUMP) || !defined(NORMAL) || defined(FORCENORMALFORWARD) || defined(SPECULARAA) || defined(CLEARCOAT_BUMP) || defined(ANISOTROPIC)
#extension GL_OES_standard_derivatives : enable
#endif

#ifdef LODBASEDMICROSFURACE
#extension GL_EXT_shader_texture_lod : enable
#endif

#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif

precision highp float;

#include<__decl__pbrFragment>

uniform vec4 vEyePosition;
uniform vec3 vAmbientColor;
uniform vec4 vCameraInfos;

// Input
varying vec3 vPositionW;

#if DEBUGMODE > 0
    uniform vec2 vDebugMode;
    varying vec4 vClipSpacePosition;
#endif

#ifdef MAINUV1
    varying vec2 vMainUV1;
#endif 

#ifdef MAINUV2 
    varying vec2 vMainUV2;
#endif 

#ifdef NORMAL
    varying vec3 vNormalW;
    #if defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX)
        varying vec3 vEnvironmentIrradiance;
    #endif
#endif

#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif

// Lights
#include<__decl__lightFragment>[0..maxSimultaneousLights]

// Samplers
#ifdef ALBEDO
    #if ALBEDODIRECTUV == 1
        #define vAlbedoUV vMainUV1
    #elif ALBEDODIRECTUV == 2
        #define vAlbedoUV vMainUV2
    #else
        varying vec2 vAlbedoUV;
    #endif
    uniform sampler2D albedoSampler;
#endif

#ifdef AMBIENT
    #if AMBIENTDIRECTUV == 1
        #define vAmbientUV vMainUV1
    #elif AMBIENTDIRECTUV == 2
        #define vAmbientUV vMainUV2
    #else
        varying vec2 vAmbientUV;
    #endif
    uniform sampler2D ambientSampler;
#endif

#ifdef OPACITY
    #if OPACITYDIRECTUV == 1
        #define vOpacityUV vMainUV1
    #elif OPACITYDIRECTUV == 2
        #define vOpacityUV vMainUV2
    #else
        varying vec2 vOpacityUV;
    #endif
    uniform sampler2D opacitySampler;
#endif

#ifdef EMISSIVE
    #if EMISSIVEDIRECTUV == 1
        #define vEmissiveUV vMainUV1
    #elif EMISSIVEDIRECTUV == 2
        #define vEmissiveUV vMainUV2
    #else
        varying vec2 vEmissiveUV;
    #endif
    uniform sampler2D emissiveSampler;
#endif

#ifdef LIGHTMAP
    #if LIGHTMAPDIRECTUV == 1
        #define vLightmapUV vMainUV1
    #elif LIGHTMAPDIRECTUV == 2
        #define vLightmapUV vMainUV2
    #else
        varying vec2 vLightmapUV;
    #endif
    uniform sampler2D lightmapSampler;
#endif

#ifdef REFLECTIVITY
    #if REFLECTIVITYDIRECTUV == 1
        #define vReflectivityUV vMainUV1
    #elif REFLECTIVITYDIRECTUV == 2
        #define vReflectivityUV vMainUV2
    #else
        varying vec2 vReflectivityUV;
    #endif
    uniform sampler2D reflectivitySampler;
#endif

#ifdef MICROSURFACEMAP
    #if MICROSURFACEMAPDIRECTUV == 1
        #define vMicroSurfaceSamplerUV vMainUV1
    #elif MICROSURFACEMAPDIRECTUV == 2
        #define vMicroSurfaceSamplerUV vMainUV2
    #else
        varying vec2 vMicroSurfaceSamplerUV;
    #endif
    uniform sampler2D microSurfaceSampler;
#endif

#ifdef CLEARCOAT
    #ifdef CLEARCOAT_TEXTURE
        #if CLEARCOAT_TEXTUREDIRECTUV == 1
            #define vClearCoatUV vMainUV1
        #elif CLEARCOAT_TEXTUREDIRECTUV == 2
            #define vClearCoatUV vMainUV2
        #else
            varying vec2 vClearCoatUV;
        #endif
        uniform sampler2D clearCoatSampler;
    #endif

    #ifdef CLEARCOAT_BUMP
        #if CLEARCOAT_BUMPDIRECTUV == 1
            #define vClearCoatBumpUV vMainUV1
        #elif CLEARCOAT_BUMPDIRECTUV == 2
            #define vClearCoatBumpUV vMainUV2
        #else
            varying vec2 vClearCoatBumpUV;
        #endif
        uniform sampler2D clearCoatBumpSampler;
    #endif

    #ifdef CLEARCOAT_TINT_TEXTURE
        #if CLEARCOAT_TINT_TEXTUREDIRECTUV == 1
            #define vClearCoatTintUV vMainUV1
        #elif CLEARCOAT_TINT_TEXTUREDIRECTUV == 2
            #define vClearCoatTintUV vMainUV2
        #else
            varying vec2 vClearCoatTintUV;
        #endif
        uniform sampler2D clearCoatTintSampler;
    #endif
#endif

#ifdef SHEEN
    #ifdef SHEEN_TEXTURE
        #if SHEEN_TEXTUREDIRECTUV == 1
            #define vSheenUV vMainUV1
        #elif SHEEN_TEXTUREDIRECTUV == 2
            #define vSheenUV vMainUV2
        #else
            varying vec2 vSheenUV;
        #endif
        uniform sampler2D sheenSampler;
    #endif
#endif

#ifdef ANISOTROPIC
    #ifdef ANISOTROPIC_TEXTURE
        #if ANISOTROPIC_TEXTUREDIRECTUV == 1
            #define vAnisotropyUV vMainUV1
        #elif ANISOTROPIC_TEXTUREDIRECTUV == 2
            #define vAnisotropyUV vMainUV2
        #else
            varying vec2 vAnisotropyUV;
        #endif
        uniform sampler2D anisotropySampler;
    #endif
#endif

// Refraction
#ifdef REFRACTION
    #ifdef REFRACTIONMAP_3D
        #define sampleRefraction(s, c) textureCube(s, c)
        
        uniform samplerCube refractionSampler;

        #ifdef LODBASEDMICROSFURACE
            #define sampleRefractionLod(s, c, l) textureCubeLodEXT(s, c, l)
        #else
            uniform samplerCube refractionSamplerLow;
            uniform samplerCube refractionSamplerHigh;
        #endif
    #else
        #define sampleRefraction(s, c) texture2D(s, c)
        
        uniform sampler2D refractionSampler;

        #ifdef LODBASEDMICROSFURACE
            #define sampleRefractionLod(s, c, l) texture2DLodEXT(s, c, l)
        #else
            uniform samplerCube refractionSamplerLow;
            uniform samplerCube refractionSamplerHigh;
        #endif
    #endif
#endif

// Reflection
#ifdef REFLECTION
    #ifdef REFLECTIONMAP_3D
        #define sampleReflection(s, c) textureCube(s, c)

        uniform samplerCube reflectionSampler;
        
        #ifdef LODBASEDMICROSFURACE
            #define sampleReflectionLod(s, c, l) textureCubeLodEXT(s, c, l)
        #else
            uniform samplerCube reflectionSamplerLow;
            uniform samplerCube reflectionSamplerHigh;
        #endif
    #else
        #define sampleReflection(s, c) texture2D(s, c)

        uniform sampler2D reflectionSampler;

        #ifdef LODBASEDMICROSFURACE
            #define sampleReflectionLod(s, c, l) texture2DLodEXT(s, c, l)
        #else
            uniform samplerCube reflectionSamplerLow;
            uniform samplerCube reflectionSamplerHigh;
        #endif
    #endif

    #ifdef REFLECTIONMAP_SKYBOX
        varying vec3 vPositionUVW;
    #else
        #if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
            varying vec3 vDirectionW;
        #endif
    #endif

    #include<reflectionFunction>
#endif

#ifdef ENVIRONMENTBRDF
    uniform sampler2D environmentBrdfSampler;
#endif

// Forces linear space for image processing
#ifndef FROMLINEARSPACE
    #define FROMLINEARSPACE;
#endif

#include<imageProcessingDeclaration>

#include<helperFunctions>

#include<imageProcessingFunctions>

// PBR
#include<shadowsFragmentFunctions>
#include<pbrFunctions>
#include<harmonicsFunctions>
#include<pbrPreLightingFunctions>
#include<pbrFalloffLightingFunctions>
#include<pbrLightingFunctions>

#include<bumpFragmentFunctions>
#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>

// Fog
#include<fogFragmentDeclaration>

void main(void) {
#include<clipPlaneFragment>

// _______________________________________________________________________________
// _____________________________ Geometry Information ____________________________
    vec3 viewDirectionW = normalize(vEyePosition.xyz - vPositionW);

#ifdef NORMAL
    vec3 normalW = normalize(vNormalW);
#else
    vec3 normalW = normalize(cross(dFdx(vPositionW), dFdy(vPositionW))) * vEyePosition.w;
#endif

#ifdef CLEARCOAT
    // Needs to use the geometric normal before bump for this.
    vec3 clearCoatNormalW = normalW;
#endif

#include<bumpFragment>

#if defined(FORCENORMALFORWARD) && defined(NORMAL)
    vec3 faceNormal = normalize(cross(dFdx(vPositionW), dFdy(vPositionW))) * vEyePosition.w;
    #if defined(TWOSIDEDLIGHTING)
        faceNormal = gl_FrontFacing ? faceNormal : -faceNormal;
    #endif

    normalW *= sign(dot(normalW, faceNormal));
#endif

#if defined(TWOSIDEDLIGHTING) && defined(NORMAL)
    normalW = gl_FrontFacing ? normalW : -normalW;
#endif

// _____________________________ Albedo Information ______________________________
    // Albedo
    vec3 surfaceAlbedo = vAlbedoColor.rgb;

    // Alpha
    float alpha = vAlbedoColor.a;

#ifdef ALBEDO
    vec4 albedoTexture = texture2D(albedoSampler, vAlbedoUV + uvOffset);
    #if defined(ALPHAFROMALBEDO) || defined(ALPHATEST)
        alpha *= albedoTexture.a;
    #endif

    surfaceAlbedo *= toLinearSpace(albedoTexture.rgb);
    surfaceAlbedo *= vAlbedoInfos.y;
#endif

#ifdef VERTEXCOLOR
    surfaceAlbedo *= vColor.rgb;
#endif

// _____________________________ Alpha Information _______________________________
#ifdef OPACITY
    vec4 opacityMap = texture2D(opacitySampler, vOpacityUV + uvOffset);

    #ifdef OPACITYRGB
        alpha = getLuminance(opacityMap.rgb);
    #else
        alpha *= opacityMap.a;
    #endif

    alpha *= vOpacityInfos.y;
#endif

#ifdef VERTEXALPHA
    alpha *= vColor.a;
#endif

#if !defined(LINKREFRACTIONTOTRANSPARENCY) && !defined(ALPHAFRESNEL)
    #ifdef ALPHATEST
        if (alpha < ALPHATESTVALUE)
            discard;

        #ifndef ALPHABLEND
            // Prevent to blend with the canvas.
            alpha = 1.0;
        #endif
    #endif
#endif

#include<depthPrePass>

// _____________________________ AO    Information _______________________________
    vec3 ambientOcclusionColor = vec3(1., 1., 1.);

#ifdef AMBIENT
    vec3 ambientOcclusionColorMap = texture2D(ambientSampler, vAmbientUV + uvOffset).rgb * vAmbientInfos.y;
    #ifdef AMBIENTINGRAYSCALE
        ambientOcclusionColorMap = vec3(ambientOcclusionColorMap.r, ambientOcclusionColorMap.r, ambientOcclusionColorMap.r);
    #endif
    ambientOcclusionColor = mix(ambientOcclusionColor, ambientOcclusionColorMap, vAmbientInfos.z);
#endif

#ifdef UNLIT
    vec3 diffuseBase = vec3(1., 1., 1.);
#else
    // _____________________________ Reflectivity Info _______________________________
    float microSurface = vReflectivityColor.a;
    vec3 surfaceReflectivityColor = vReflectivityColor.rgb;

    #ifdef METALLICWORKFLOW
        vec2 metallicRoughness = surfaceReflectivityColor.rg;

        #ifdef REFLECTIVITY
            vec4 surfaceMetallicColorMap = texture2D(reflectivitySampler, vReflectivityUV + uvOffset);

            #ifdef AOSTOREINMETALMAPRED
                vec3 aoStoreInMetalMap = vec3(surfaceMetallicColorMap.r, surfaceMetallicColorMap.r, surfaceMetallicColorMap.r);
                ambientOcclusionColor = mix(ambientOcclusionColor, aoStoreInMetalMap, vReflectivityInfos.z);
            #endif

            #ifdef METALLNESSSTOREINMETALMAPBLUE
                metallicRoughness.r *= surfaceMetallicColorMap.b;
            #else
                metallicRoughness.r *= surfaceMetallicColorMap.r;
            #endif

            #ifdef ROUGHNESSSTOREINMETALMAPALPHA
                metallicRoughness.g *= surfaceMetallicColorMap.a;
            #else
                #ifdef ROUGHNESSSTOREINMETALMAPGREEN
                    metallicRoughness.g *= surfaceMetallicColorMap.g;
                #endif
            #endif
        #endif

        #ifdef MICROSURFACEMAP
            vec4 microSurfaceTexel = texture2D(microSurfaceSampler, vMicroSurfaceSamplerUV + uvOffset) * vMicroSurfaceSamplerInfos.y;
            metallicRoughness.g *= microSurfaceTexel.r;
        #endif

        // Compute microsurface form roughness.
        microSurface = 1.0 - metallicRoughness.g;

        // Diffuse is used as the base of the reflectivity.
        vec3 baseColor = surfaceAlbedo;

        #ifdef REFLECTANCE
            // Following Frostbite Remapping,
            // https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf page 115
            // vec3 f0 = 0.16 * reflectance * reflectance * (1.0 - metallic) + baseColor * metallic;
            // where 0.16 * reflectance * reflectance remaps the reflectance to allow storage in 8 bit texture

            // Compute the converted diffuse.
            surfaceAlbedo = baseColor.rgb * (1.0 - metallicRoughness.r);

            // Compute the converted reflectivity.
            surfaceReflectivityColor = mix(0.16 * reflectance * reflectance, baseColor, metallicRoughness.r);
        #else
            // we are here fixing our default reflectance to a common value for none metallic surface.

            // Default specular reflectance at normal incidence.
            // 4% corresponds to index of refraction (IOR) of 1.50, approximately equal to glass.
            const vec3 DefaultSpecularReflectanceDielectric = vec3(0.04, 0.04, 0.04);

            // Compute the converted diffuse.
            surfaceAlbedo = mix(baseColor.rgb * (1.0 - DefaultSpecularReflectanceDielectric.r), vec3(0., 0., 0.), metallicRoughness.r);

            // Compute the converted reflectivity.
            surfaceReflectivityColor = mix(DefaultSpecularReflectanceDielectric, baseColor, metallicRoughness.r);
        #endif
    #else
        #ifdef REFLECTIVITY
            vec4 surfaceReflectivityColorMap = texture2D(reflectivitySampler, vReflectivityUV + uvOffset);
            surfaceReflectivityColor *= toLinearSpace(surfaceReflectivityColorMap.rgb);
            surfaceReflectivityColor *= vReflectivityInfos.y;

            #ifdef MICROSURFACEFROMREFLECTIVITYMAP
                microSurface *= surfaceReflectivityColorMap.a;
                microSurface *= vReflectivityInfos.z;
            #else
                #ifdef MICROSURFACEAUTOMATIC
                    microSurface *= computeDefaultMicroSurface(microSurface, surfaceReflectivityColor);
                #endif

                #ifdef MICROSURFACEMAP
                    vec4 microSurfaceTexel = texture2D(microSurfaceSampler, vMicroSurfaceSamplerUV + uvOffset) * vMicroSurfaceSamplerInfos.y;
                    microSurface *= microSurfaceTexel.r;
                #endif
            #endif
        #endif
    #endif

    // Adapt microSurface.
    microSurface = saturate(microSurface);
    // Compute roughness.
    float roughness = 1. - microSurface;

    // _____________________________ Alpha Fresnel ___________________________________
    #ifdef ALPHAFRESNEL
        #if defined(ALPHATEST) || defined(ALPHABLEND)
            // Convert approximate perceptual opacity (gamma-encoded opacity) to linear opacity (absorptance, or inverse transmission)
            // for use with the linear HDR render target. The final composition will be converted back to gamma encoded values for eventual display.
            // Uses power 2.0 rather than 2.2 for simplicity/efficiency, and because the mapping does not need to map the gamma applied to RGB.
            float opacityPerceptual = alpha;

            #ifdef LINEARALPHAFRESNEL
                float opacity0 = opacityPerceptual;
            #else
                float opacity0 = opacityPerceptual * opacityPerceptual;
            #endif
            float opacity90 = fresnelGrazingReflectance(opacity0);

            vec3 normalForward = faceforward(normalW, -viewDirectionW, normalW);

            // Calculate the appropriate linear opacity for the current viewing angle (formally, this quantity is the "directional absorptance").
            alpha = getReflectanceFromAnalyticalBRDFLookup_Jones(saturate(dot(viewDirectionW, normalForward)), vec3(opacity0), vec3(opacity90), sqrt(microSurface)).x;

            #ifdef ALPHATEST
                if (alpha < ALPHATESTVALUE)
                    discard;

                #ifndef ALPHABLEND
                    // Prevent to blend with the canvas.
                    alpha = 1.0;
                #endif
            #endif
        #endif
    #endif

    // _____________________________ Compute Geometry info _________________________________
    float NdotVUnclamped = dot(normalW, viewDirectionW);
    float NdotV = absEps(NdotVUnclamped);
    float alphaG = convertRoughnessToAverageSlope(roughness);
    vec2 AARoughnessFactors = getAARoughnessFactors(normalW.xyz);

    #ifdef SPECULARAA
        // Adapt linear roughness (alphaG) to geometric curvature of the current pixel.
        alphaG += AARoughnessFactors.y;
    #endif

    #ifdef ANISOTROPIC
        float anisotropy = vAnisotropy.b;
        vec3 anisotropyDirection = vec3(vAnisotropy.xy, 0.);

        #ifdef ANISOTROPIC_TEXTURE
            vec3 anisotropyMapData = texture2D(anisotropySampler, vAnisotropyUV + uvOffset).rgb * vAnisotropyInfos.y;
            anisotropy *= anisotropyMapData.b;
            anisotropyDirection.rg *= anisotropyMapData.rg * 2.0 - 1.0;
        #endif

        mat3 anisoTBN = mat3(normalize(TBN[0]), normalize(TBN[1]), normalize(TBN[2]));
        vec3 anisotropicTangent = normalize(anisoTBN * anisotropyDirection);
        vec3 anisotropicBitangent = normalize(cross(anisoTBN[2], anisotropicTangent));
        
        vec3 anisotropicNormal = getAnisotropicBentNormals(anisotropicTangent, anisotropicBitangent, normalW, viewDirectionW, anisotropy);
    #endif

    // _____________________________ Refraction Info _______________________________________
    #ifdef REFRACTION
        vec4 environmentRefraction = vec4(0., 0., 0., 0.);

        #ifdef ANISOTROPIC
            vec3 refractionVector = refract(-viewDirectionW, anisotropicNormal, vRefractionInfos.y);
        #else
            vec3 refractionVector = refract(-viewDirectionW, normalW, vRefractionInfos.y);
        #endif

        #ifdef REFRACTIONMAP_OPPOSITEZ
            refractionVector.z *= -1.0;
        #endif

        // _____________________________ 2D vs 3D Maps ________________________________
        #ifdef REFRACTIONMAP_3D
            refractionVector.y = refractionVector.y * vRefractionInfos.w;
            vec3 refractionCoords = refractionVector;
            refractionCoords = vec3(refractionMatrix * vec4(refractionCoords, 0));
        #else
            vec3 vRefractionUVW = vec3(refractionMatrix * (view * vec4(vPositionW + refractionVector * vRefractionInfos.z, 1.0)));
            vec2 refractionCoords = vRefractionUVW.xy / vRefractionUVW.z;
            refractionCoords.y = 1.0 - refractionCoords.y;
        #endif

        #ifdef LODINREFRACTIONALPHA
            float refractionLOD = getLodFromAlphaG(vRefractionMicrosurfaceInfos.x, alphaG, NdotVUnclamped);
        #else
            float refractionLOD = getLodFromAlphaG(vRefractionMicrosurfaceInfos.x, alphaG);
        #endif

        #ifdef LODBASEDMICROSFURACE
            // Apply environment convolution scale/offset filter tuning parameters to the mipmap LOD selection
            refractionLOD = refractionLOD * vRefractionMicrosurfaceInfos.y + vRefractionMicrosurfaceInfos.z;

            #ifdef LODINREFRACTIONALPHA
                // Automatic LOD adjustment to ensure that the smoothness-based environment LOD selection
                // is constrained to appropriate LOD levels in order to prevent aliasing.
                // The environment map is first sampled without custom LOD selection to determine
                // the hardware-selected LOD, and this is then used to constrain the final LOD selection
                // so that excessive surface smoothness does not cause aliasing (e.g. on curved geometry
                // where the normal is varying rapidly).

                // Note: Shader Model 4.1 or higher can provide this directly via CalculateLevelOfDetail(), and
                // manual calculation via derivatives is also possible, but for simplicity we use the 
                // hardware LOD calculation with the alpha channel containing the LOD for each mipmap.
                float automaticRefractionLOD = UNPACK_LOD(sampleRefraction(refractionSampler, refractionCoords).a);
                float requestedRefractionLOD = max(automaticRefractionLOD, refractionLOD);
            #else
                float requestedRefractionLOD = refractionLOD;
            #endif

            environmentRefraction = sampleRefractionLod(refractionSampler, refractionCoords, requestedRefractionLOD);
        #else
            float lodRefractionNormalized = saturate(refractionLOD / log2(vRefractionMicrosurfaceInfos.x));
            float lodRefractionNormalizedDoubled = lodRefractionNormalized * 2.0;

            vec4 environmentRefractionMid = sampleRefraction(refractionSampler, refractionCoords);
            if(lodRefractionNormalizedDoubled < 1.0){
                environmentRefraction = mix(
                    sampleRefraction(refractionSamplerHigh, refractionCoords),
                    environmentRefractionMid,
                    lodRefractionNormalizedDoubled
                );
            }else{
                environmentRefraction = mix(
                    environmentRefractionMid,
                    sampleRefraction(refractionSamplerLow, refractionCoords),
                    lodRefractionNormalizedDoubled - 1.0
                );
            }
        #endif

        #ifdef RGBDREFRACTION
            environmentRefraction.rgb = fromRGBD(environmentRefraction);
        #endif

        #ifdef GAMMAREFRACTION
            environmentRefraction.rgb = toLinearSpace(environmentRefraction.rgb);
        #endif

        // _____________________________ Levels _____________________________________
        environmentRefraction.rgb *= vRefractionInfos.x;
    #endif

    // _____________________________ Reflection Info _______________________________________
    #ifdef REFLECTION
        vec4 environmentRadiance = vec4(0., 0., 0., 0.);
        vec3 environmentIrradiance = vec3(0., 0., 0.);

        #ifdef ANISOTROPIC
            vec3 reflectionVector = computeReflectionCoords(vec4(vPositionW, 1.0), anisotropicNormal);
        #else
            vec3 reflectionVector = computeReflectionCoords(vec4(vPositionW, 1.0), normalW);
        #endif

        #ifdef REFLECTIONMAP_OPPOSITEZ
            reflectionVector.z *= -1.0;
        #endif

        // _____________________________ 2D vs 3D Maps ________________________________
        #ifdef REFLECTIONMAP_3D
            vec3 reflectionCoords = reflectionVector;
        #else
            vec2 reflectionCoords = reflectionVector.xy;
            #ifdef REFLECTIONMAP_PROJECTION
                reflectionCoords /= reflectionVector.z;
            #endif
            reflectionCoords.y = 1.0 - reflectionCoords.y;
        #endif

        #if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
            float reflectionLOD = getLodFromAlphaG(vReflectionMicrosurfaceInfos.x, alphaG, NdotVUnclamped);
        #else
            float reflectionLOD = getLodFromAlphaG(vReflectionMicrosurfaceInfos.x, alphaG);
        #endif

        #ifdef LODBASEDMICROSFURACE
            // Apply environment convolution scale/offset filter tuning parameters to the mipmap LOD selection
            reflectionLOD = reflectionLOD * vReflectionMicrosurfaceInfos.y + vReflectionMicrosurfaceInfos.z;

            #ifdef LODINREFLECTIONALPHA
                // Automatic LOD adjustment to ensure that the smoothness-based environment LOD selection
                // is constrained to appropriate LOD levels in order to prevent aliasing.
                // The environment map is first sampled without custom LOD selection to determine
                // the hardware-selected LOD, and this is then used to constrain the final LOD selection
                // so that excessive surface smoothness does not cause aliasing (e.g. on curved geometry
                // where the normal is varying rapidly).

                // Note: Shader Model 4.1 or higher can provide this directly via CalculateLevelOfDetail(), and
                // manual calculation via derivatives is also possible, but for simplicity we use the
                // hardware LOD calculation with the alpha channel containing the LOD for each mipmap.
                float automaticReflectionLOD = UNPACK_LOD(sampleReflection(reflectionSampler, reflectionCoords).a);
                float requestedReflectionLOD = max(automaticReflectionLOD, reflectionLOD);
            #else
                float requestedReflectionLOD = reflectionLOD;
            #endif

            environmentRadiance = sampleReflectionLod(reflectionSampler, reflectionCoords, requestedReflectionLOD);
        #else
            float lodReflectionNormalized = saturate(reflectionLOD / log2(vReflectionMicrosurfaceInfos.x));
            float lodReflectionNormalizedDoubled = lodReflectionNormalized * 2.0;

            vec4 environmentSpecularMid = sampleReflection(reflectionSampler, reflectionCoords);
            if(lodReflectionNormalizedDoubled < 1.0){
                environmentRadiance = mix(
                    sampleReflection(reflectionSamplerHigh, reflectionCoords),
                    environmentSpecularMid,
                    lodReflectionNormalizedDoubled
                );
            }else{
                environmentRadiance = mix(
                    environmentSpecularMid,
                    sampleReflection(reflectionSamplerLow, reflectionCoords),
                    lodReflectionNormalizedDoubled - 1.0
                );
            }
        #endif

        #ifdef RGBDREFLECTION
            environmentRadiance.rgb = fromRGBD(environmentRadiance);
        #endif

        #ifdef GAMMAREFLECTION
            environmentRadiance.rgb = toLinearSpace(environmentRadiance.rgb);
        #endif

        // _____________________________ Irradiance ________________________________
        #ifdef USESPHERICALFROMREFLECTIONMAP
            #if defined(NORMAL) && defined(USESPHERICALINVERTEX)
                environmentIrradiance = vEnvironmentIrradiance;
            #else
                #ifdef ANISOTROPIC
                    vec3 irradianceVector = vec3(reflectionMatrix * vec4(anisotropicNormal, 0)).xyz;
                #else
                    vec3 irradianceVector = vec3(reflectionMatrix * vec4(normalW, 0)).xyz;
                #endif

                #ifdef REFLECTIONMAP_OPPOSITEZ
                    irradianceVector.z *= -1.0;
                #endif

                environmentIrradiance = environmentIrradianceJones(irradianceVector);
            #endif
        #endif

        // _____________________________ Levels _____________________________________
        environmentRadiance.rgb *= vReflectionInfos.x;
        environmentRadiance.rgb *= vReflectionColor.rgb;
        environmentIrradiance *= vReflectionColor.rgb;
    #endif

    // ___________________ Compute Reflectance aka R0 F0 info _________________________
    float reflectance = max(max(surfaceReflectivityColor.r, surfaceReflectivityColor.g), surfaceReflectivityColor.b);
    float reflectance90 = fresnelGrazingReflectance(reflectance);
    vec3 specularEnvironmentR0 = surfaceReflectivityColor.rgb;
    vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0) * reflectance90;

    // ________________________________ Sheen Information ______________________________
    #ifdef SHEEN
        float sheenIntensity = vSheenColor.a;

        #ifdef SHEEN_TEXTURE
            vec4 sheenMapData = texture2D(sheenSampler, vSheenUV + uvOffset) * vSheenInfos.y;
            sheenIntensity *= sheenMapData.a;
        #endif

        #ifdef SHEEN_LINKWITHALBEDO
            float sheenFactor = pow(1.0-sheenIntensity, 5.0);
            vec3 sheenColor = baseColor.rgb*(1.0-sheenFactor);
            float sheenRoughness = sheenIntensity;
            // remap albedo.
            surfaceAlbedo.rgb *= sheenFactor;
        #else
            vec3 sheenColor = vSheenColor.rgb;
            #ifdef SHEEN_TEXTURE
                sheenColor.rgb *= toLinearSpace(sheenMapData.rgb);
            #endif
            float sheenRoughness = roughness;
            // Remap F0 and sheen.
            sheenColor *= sheenIntensity;
            specularEnvironmentR0 *= (1.0-sheenIntensity);
        #endif

        // Sheen Reflection
        #if defined(REFLECTION)
            float sheenAlphaG = convertRoughnessToAverageSlope(sheenRoughness);

            #ifdef SPECULARAA
                // Adapt linear roughness (alphaG) to geometric curvature of the current pixel.
                sheenAlphaG += AARoughnessFactors.y;
            #endif

            vec4 environmentSheenRadiance = vec4(0., 0., 0., 0.);

            // _____________________________ 2D vs 3D Maps ________________________________
            #if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
                float sheenReflectionLOD = getLodFromAlphaG(vReflectionMicrosurfaceInfos.x, sheenAlphaG, NdotVUnclamped);
            #else
                float sheenReflectionLOD = getLodFromAlphaG(vReflectionMicrosurfaceInfos.x, sheenAlphaG);
            #endif

            #ifdef LODBASEDMICROSFURACE
                // Apply environment convolution scale/offset filter tuning parameters to the mipmap LOD selection
                sheenReflectionLOD = sheenReflectionLOD * vReflectionMicrosurfaceInfos.y + vReflectionMicrosurfaceInfos.z;
                environmentSheenRadiance = sampleReflectionLod(reflectionSampler, reflectionCoords, sheenReflectionLOD);
            #else
                float lodSheenReflectionNormalized = saturate(sheenReflectionLOD / log2(vReflectionMicrosurfaceInfos.x));
                float lodSheenReflectionNormalizedDoubled = lodSheenReflectionNormalized * 2.0;

                vec4 environmentSheenMid = sampleReflection(reflectionSampler, reflectionCoords);
                if(lodSheenReflectionNormalizedDoubled < 1.0){
                    environmentSheenRadiance = mix(
                        sampleReflection(reflectionSamplerHigh, reflectionCoords),
                        environmentSheenMid,
                        lodSheenReflectionNormalizedDoubled
                    );
                }else{
                    environmentSheenRadiance = mix(
                        environmentSheenMid,
                        sampleReflection(reflectionSamplerLow, reflectionCoords),
                        lodSheenReflectionNormalizedDoubled - 1.0
                    );
                }
            #endif

            #ifdef RGBDREFLECTION
                environmentSheenRadiance.rgb = fromRGBD(environmentSheenRadiance);
            #endif

            #ifdef GAMMAREFLECTION
                environmentSheenRadiance.rgb = toLinearSpace(environmentSheenRadiance.rgb);
            #endif

            // _____________________________ Levels _____________________________________
            environmentSheenRadiance.rgb *= vReflectionInfos.x;
            environmentSheenRadiance.rgb *= vReflectionColor.rgb;
        #endif
    #endif

    // _____________________________ Clear Coat Information ____________________________
    #ifdef CLEARCOAT
        // Clear COAT parameters.
        float clearCoatIntensity = vClearCoatParams.x;
        float clearCoatRoughness = vClearCoatParams.y;

        #ifdef CLEARCOAT_TEXTURE
            vec2 clearCoatMapData = texture2D(clearCoatSampler, vClearCoatUV + uvOffset).rg * vClearCoatInfos.y;
            clearCoatIntensity *= clearCoatMapData.x;
            clearCoatRoughness *= clearCoatMapData.y;
        #endif

        #ifdef CLEARCOAT_TINT
            vec3 clearCoatColor = vClearCoatTintParams.rgb;
            float clearCoatThickness = vClearCoatTintParams.a;

            #ifdef CLEARCOAT_TINT_TEXTURE
                vec4 clearCoatTintMapData = texture2D(clearCoatTintSampler, vClearCoatTintUV + uvOffset);
                clearCoatColor *= toLinearSpace(clearCoatTintMapData.rgb);
                clearCoatThickness *= clearCoatTintMapData.a;
            #endif

            clearCoatColor = computeColorAtDistanceInMedia(clearCoatColor, clearCoatColorAtDistance);
        #endif

        // remapping and linearization of clear coat roughness
        // Let s see how it ends up in gltf
        // clearCoatRoughness = mix(0.089, 0.6, clearCoatRoughness);

        // Remap F0 to account for the change of interface within the material.
        vec3 specularEnvironmentR0Updated = getR0RemappedForClearCoat(specularEnvironmentR0);
        specularEnvironmentR0 = mix(specularEnvironmentR0, specularEnvironmentR0Updated, clearCoatIntensity);

        #ifdef CLEARCOAT_BUMP
            #ifdef NORMALXYSCALE
                float clearCoatNormalScale = 1.0;
            #else
                float clearCoatNormalScale = vClearCoatBumpInfos.y;
            #endif

            #if defined(TANGENT) && defined(NORMAL)
                mat3 TBNClearCoat = vTBN;
            #else
                mat3 TBNClearCoat = cotangent_frame(clearCoatNormalW * clearCoatNormalScale, vPositionW, vClearCoatBumpUV, vClearCoatTangentSpaceParams);
            #endif

            #ifdef OBJECTSPACE_NORMALMAP
                clearCoatNormalW = normalize(texture2D(clearCoatBumpSampler, vClearCoatBumpUV + uvOffset).xyz  * 2.0 - 1.0);
                clearCoatNormalW = normalize(mat3(normalMatrix) * clearCoatNormalW);
            #else
                clearCoatNormalW = perturbNormal(TBN, vClearCoatBumpUV + uvOffset, clearCoatBumpSampler, vClearCoatBumpInfos.y);
            #endif
        #endif

        #if defined(FORCENORMALFORWARD) && defined(NORMAL)
            clearCoatNormalW *= sign(dot(clearCoatNormalW, faceNormal));
        #endif

        #if defined(TWOSIDEDLIGHTING) && defined(NORMAL)
            clearCoatNormalW = gl_FrontFacing ? clearCoatNormalW : -clearCoatNormalW;
        #endif

        // Clear Coat AA
        vec2 clearCoatAARoughnessFactors = getAARoughnessFactors(clearCoatNormalW.xyz);

        // Compute N dot V.
        float clearCoatNdotVUnclamped = dot(clearCoatNormalW, viewDirectionW);
        float clearCoatNdotV = absEps(clearCoatNdotVUnclamped);

        // Clear Coat Reflection
        #if defined(REFLECTION)
            float clearCoatAlphaG = convertRoughnessToAverageSlope(clearCoatRoughness);

            #ifdef SPECULARAA
                // Adapt linear roughness (alphaG) to geometric curvature of the current pixel.
                clearCoatAlphaG += clearCoatAARoughnessFactors.y;
            #endif

            vec4 environmentClearCoatRadiance = vec4(0., 0., 0., 0.);

            vec3 clearCoatReflectionVector = computeReflectionCoords(vec4(vPositionW, 1.0), clearCoatNormalW);
            #ifdef REFLECTIONMAP_OPPOSITEZ
                clearCoatReflectionVector.z *= -1.0;
            #endif

            // _____________________________ 2D vs 3D Maps ________________________________
            #ifdef REFLECTIONMAP_3D
                vec3 clearCoatReflectionCoords = clearCoatReflectionVector;
            #else
                vec2 clearCoatReflectionCoords = clearCoatReflectionVector.xy;
                #ifdef REFLECTIONMAP_PROJECTION
                    clearCoatReflectionCoords /= clearCoatReflectionVector.z;
                #endif
                clearCoatReflectionCoords.y = 1.0 - clearCoatReflectionCoords.y;
            #endif

            #if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
                float clearCoatReflectionLOD = getLodFromAlphaG(vReflectionMicrosurfaceInfos.x, clearCoatAlphaG, clearCoatNdotVUnclamped);
            #else
                float clearCoatReflectionLOD = getLodFromAlphaG(vReflectionMicrosurfaceInfos.x, clearCoatAlphaG);
            #endif

            #ifdef LODBASEDMICROSFURACE
                // Apply environment convolution scale/offset filter tuning parameters to the mipmap LOD selection
                clearCoatReflectionLOD = clearCoatReflectionLOD * vReflectionMicrosurfaceInfos.y + vReflectionMicrosurfaceInfos.z;
                float requestedClearCoatReflectionLOD = clearCoatReflectionLOD;

                environmentClearCoatRadiance = sampleReflectionLod(reflectionSampler, clearCoatReflectionCoords, requestedClearCoatReflectionLOD);
            #else
                float lodClearCoatReflectionNormalized = saturate(clearCoatReflectionLOD / log2(vReflectionMicrosurfaceInfos.x));
                float lodClearCoatReflectionNormalizedDoubled = lodClearCoatReflectionNormalized * 2.0;

                vec4 environmentClearCoatMid = sampleReflection(reflectionSampler, reflectionCoords);
                if(lodClearCoatReflectionNormalizedDoubled < 1.0){
                    environmentClearCoatRadiance = mix(
                        sampleReflection(reflectionSamplerHigh, clearCoatReflectionCoords),
                        environmentClearCoatMid,
                        lodClearCoatReflectionNormalizedDoubled
                    );
                }else{
                    environmentClearCoatRadiance = mix(
                        environmentClearCoatMid,
                        sampleReflection(reflectionSamplerLow, clearCoatReflectionCoords),
                        lodClearCoatReflectionNormalizedDoubled - 1.0
                    );
                }
            #endif

            #ifdef RGBDREFLECTION
                environmentClearCoatRadiance.rgb = fromRGBD(environmentClearCoatRadiance);
            #endif

            #ifdef GAMMAREFLECTION
                environmentClearCoatRadiance.rgb = toLinearSpace(environmentClearCoatRadiance.rgb);
            #endif

            #ifdef CLEARCOAT_TINT
                // Used later on in the light fragment and ibl.
                vec3 clearCoatVRefract = -refract(vPositionW, clearCoatNormalW, vClearCoatRefractionParams.y);
                float clearCoatNdotVRefract = absEps(dot(clearCoatNormalW, clearCoatVRefract));
                vec3 absorption = vec3(0.);
            #endif

            // _____________________________ Levels _____________________________________
            environmentClearCoatRadiance.rgb *= vReflectionInfos.x;
            environmentClearCoatRadiance.rgb *= vReflectionColor.rgb;
        #endif
    #endif

    // _____________________________ IBL BRDF + Energy Cons _________________________________
    #if defined(ENVIRONMENTBRDF)
        // BRDF Lookup
        vec2 environmentBrdf = getBRDFLookup(NdotV, roughness, environmentBrdfSampler);

        #ifdef MS_BRDF_ENERGY_CONSERVATION
            vec3 energyConservationFactor = getEnergyConservationFactor(specularEnvironmentR0, environmentBrdf);
        #endif
    #endif

    // ____________________________________________________________________________________
    // _____________________________ Direct Lighting Info __________________________________
    vec3 diffuseBase = vec3(0., 0., 0.);
    #ifdef SPECULARTERM
        vec3 specularBase = vec3(0., 0., 0.);
    #endif
    #ifdef CLEARCOAT
        vec3 clearCoatBase = vec3(0., 0., 0.);
    #endif
    #ifdef SHEEN
        vec3 sheenBase = vec3(0., 0., 0.);
    #endif

    #ifdef LIGHTMAP
        vec3 lightmapColor = texture2D(lightmapSampler, vLightmapUV + uvOffset).rgb;
        #ifdef GAMMALIGHTMAP
            lightmapColor = toLinearSpace(lightmapColor);
        #endif
        lightmapColor *= vLightmapInfos.y;
    #endif

    // Direct Lighting Variables
    preLightingInfo preInfo;
    lightingInfo info;
    float shadow = 1.; // 1 - shadowLevel

    #include<lightFragment>[0..maxSimultaneousLights]

    // _________________________ Specular Environment Oclusion __________________________
    #if defined(ENVIRONMENTBRDF) && !defined(REFLECTIONMAP_SKYBOX)
        vec3 specularEnvironmentReflectance = getReflectanceFromBRDFLookup(specularEnvironmentR0, environmentBrdf);

        #ifdef RADIANCEOCCLUSION
            #ifdef AMBIENTINGRAYSCALE
                float ambientMonochrome = ambientOcclusionColor.r;
            #else
                float ambientMonochrome = getLuminance(ambientOcclusionColor);
            #endif

            float seo = environmentRadianceOcclusion(ambientMonochrome, NdotVUnclamped);
            specularEnvironmentReflectance *= seo;
        #endif

        #ifdef HORIZONOCCLUSION
            #ifdef BUMP
                #ifdef REFLECTIONMAP_3D
                    float eho = environmentHorizonOcclusion(-viewDirectionW, normalW);
                    specularEnvironmentReflectance *= eho;
                #endif
            #endif
        #endif
    #else
        // Jones implementation of a well balanced fast analytical solution.
        vec3 specularEnvironmentReflectance = getReflectanceFromAnalyticalBRDFLookup_Jones(NdotV, specularEnvironmentR0, specularEnvironmentR90, sqrt(microSurface));
    #endif

    // _____________________________ Sheen Environment Oclusion __________________________
    #if defined(SHEEN) && defined(REFLECTION)
        vec3 sheenEnvironmentReflectance = getSheenReflectanceFromBRDFLookup(sheenColor, NdotV, sheenAlphaG);

        #ifdef RADIANCEOCCLUSION
            sheenEnvironmentReflectance *= seo;
        #endif

        #ifdef HORIZONOCCLUSION
            #ifdef BUMP
                #ifdef REFLECTIONMAP_3D
                    sheenEnvironmentReflectance *= eho;
                #endif
            #endif
        #endif
    #endif

    // _________________________ Clear Coat Environment Oclusion __________________________
    #ifdef CLEARCOAT
        #if defined(ENVIRONMENTBRDF) && !defined(REFLECTIONMAP_SKYBOX)
            // BRDF Lookup
            vec2 environmentClearCoatBrdf = getBRDFLookup(clearCoatNdotV, clearCoatRoughness, environmentBrdfSampler);
            vec3 clearCoatEnvironmentReflectance = getReflectanceFromBRDFLookup(vec3(vClearCoatRefractionParams.x), environmentClearCoatBrdf);

            #ifdef RADIANCEOCCLUSION
                float clearCoatSeo = environmentRadianceOcclusion(ambientMonochrome, clearCoatNdotVUnclamped);
                clearCoatEnvironmentReflectance *= clearCoatSeo;
            #endif

            #ifdef HORIZONOCCLUSION
                #ifdef BUMP
                    #ifdef REFLECTIONMAP_3D
                        float clearCoatEho = environmentHorizonOcclusion(-viewDirectionW, clearCoatNormalW);
                        clearCoatEnvironmentReflectance *= clearCoatEho;
                    #endif
                #endif
            #endif
        #else
            // Jones implementation of a well balanced fast analytical solution.
            vec3 clearCoatEnvironmentReflectance = getReflectanceFromAnalyticalBRDFLookup_Jones(clearCoatNdotV, vec3(1.), vec3(1.), sqrt(1. - clearCoatRoughness));
        #endif

        clearCoatEnvironmentReflectance *= clearCoatIntensity;

        #ifdef CLEARCOAT_TINT
            // NdotL = NdotV in IBL
            absorption = computeClearCoatAbsorption(clearCoatNdotVRefract, clearCoatNdotVRefract, clearCoatColor, clearCoatThickness, clearCoatIntensity);

            #ifdef REFLECTION
                environmentIrradiance *= absorption;
            #endif

            #ifdef SHEEN
                sheenEnvironmentReflectance *= absorption;
            #endif

            specularEnvironmentReflectance *= absorption;
        #endif

        // clear coat energy conservation
        float fresnelIBLClearCoat = fresnelSchlickGGX(clearCoatNdotV, vClearCoatRefractionParams.x, CLEARCOATREFLECTANCE90);
        fresnelIBLClearCoat *= clearCoatIntensity;

        float conservationFactor = (1. - fresnelIBLClearCoat);

        #ifdef REFLECTION
            environmentIrradiance *= conservationFactor;
        #endif

        #ifdef SHEEN
            sheenEnvironmentReflectance *= (conservationFactor * conservationFactor);
        #endif

        specularEnvironmentReflectance *= (conservationFactor * conservationFactor);
    #endif

    // _____________________________ Refractance+Tint ________________________________
    #ifdef REFRACTION
        vec3 refractance = vec3(0.0, 0.0, 0.0);
        vec3 transmission = vec3(1.0, 1.0, 1.0);
        #ifdef LINKREFRACTIONTOTRANSPARENCY
            // Transmission based on alpha.
            transmission *= (1.0 - alpha);

            // Tint the material with albedo.
            // TODO. PBR Tinting.
            vec3 mixedAlbedo = surfaceAlbedo;
            float maxChannel = max(max(mixedAlbedo.r, mixedAlbedo.g), mixedAlbedo.b);
            vec3 tint = saturate(maxChannel * mixedAlbedo);

            // Decrease Albedo Contribution
            surfaceAlbedo *= alpha;

            // Decrease irradiance Contribution
            environmentIrradiance *= alpha;

            // Tint reflectance
            environmentRefraction.rgb *= tint;

            // Put alpha back to 1;
            alpha = 1.0;
        #endif

        // Add Multiple internal bounces.
        vec3 bounceSpecularEnvironmentReflectance = (2.0 * specularEnvironmentReflectance) / (1.0 + specularEnvironmentReflectance);
        specularEnvironmentReflectance = mix(bounceSpecularEnvironmentReflectance, specularEnvironmentReflectance, alpha);

        // In theory T = 1 - R.
        transmission *= 1.0 - specularEnvironmentReflectance;

        // Should baked in diffuse.
        refractance = transmission;
    #endif

    // ______________________________________________________________________________
    // _____________________________ Energy Conservation  ___________________________
    // Apply Energy Conservation.
    #ifndef METALLICWORKFLOW
        surfaceAlbedo.rgb = (1. - reflectance) * surfaceAlbedo.rgb;
    #endif

    // _____________________________ Irradiance ______________________________________
    #ifdef REFLECTION
        vec3 finalIrradiance = environmentIrradiance;
        finalIrradiance *= surfaceAlbedo.rgb;
    #endif

    // _____________________________ Specular ________________________________________
    #ifdef SPECULARTERM
        vec3 finalSpecular = specularBase;
        finalSpecular = max(finalSpecular, 0.0);

        // Full value needed for alpha.
        vec3 finalSpecularScaled = finalSpecular * vLightingIntensity.x * vLightingIntensity.w;
        #if defined(ENVIRONMENTBRDF) && defined(MS_BRDF_ENERGY_CONSERVATION)
            finalSpecularScaled *= energyConservationFactor;
        #endif
    #endif

    // _____________________________ Radiance ________________________________________
    #ifdef REFLECTION
        vec3 finalRadiance = environmentRadiance.rgb;
        finalRadiance *= specularEnvironmentReflectance;

        // Full value needed for alpha. 
        vec3 finalRadianceScaled = finalRadiance * vLightingIntensity.z;
        #if defined(ENVIRONMENTBRDF) && defined(MS_BRDF_ENERGY_CONSERVATION)
            finalRadianceScaled *= energyConservationFactor;
        #endif
    #endif

    // _____________________________ Refraction ______________________________________
    #ifdef REFRACTION
        vec3 finalRefraction = environmentRefraction.rgb;
        finalRefraction *= refractance;
    #endif

    // _____________________________ Clear Coat _______________________________________
    #ifdef CLEARCOAT
        vec3 finalClearCoat = clearCoatBase;
        finalClearCoat = max(finalClearCoat, 0.0);

        // Full value needed for alpha.
        vec3 finalClearCoatScaled = finalClearCoat * vLightingIntensity.x * vLightingIntensity.w;
        #if defined(ENVIRONMENTBRDF) && defined(MS_BRDF_ENERGY_CONSERVATION)
            finalClearCoatScaled *= energyConservationFactor;
        #endif

    // ____________________________ Clear Coat Radiance _______________________________
        #ifdef REFLECTION
            vec3 finalClearCoatRadiance = environmentClearCoatRadiance.rgb;
            finalClearCoatRadiance *= clearCoatEnvironmentReflectance;

            // Full value needed for alpha. 
            vec3 finalClearCoatRadianceScaled = finalClearCoatRadiance * vLightingIntensity.z;
        #endif

        #ifdef REFRACTION
            finalRefraction *= (conservationFactor * conservationFactor);
            #ifdef CLEARCOAT_TINT
                finalRefraction *= absorption;
            #endif
        #endif
    #endif

    // ________________________________ Sheen ________________________________________
    #ifdef SHEEN
        vec3 finalSheen = sheenBase * sheenColor;
        finalSheen = max(finalSheen, 0.0);

        vec3 finalSheenScaled = finalSheen * vLightingIntensity.x * vLightingIntensity.w;
        #if defined(ENVIRONMENTBRDF) && defined(MS_BRDF_ENERGY_CONSERVATION)
            // The sheen does not use the same BRDF so not energy conservation is possible
            // Should be less a problem as it is usually not metallic
            // finalSheenScaled *= energyConservationFactor;
        #endif
        
        #ifdef REFLECTION
            vec3 finalSheenRadiance = environmentSheenRadiance.rgb;
            finalSheenRadiance *= sheenEnvironmentReflectance;

            // Full value needed for alpha. 
            vec3 finalSheenRadianceScaled = finalSheenRadiance * vLightingIntensity.z;
        #endif
    #endif

    // _____________________________ Highlights on Alpha _____________________________
    #ifdef ALPHABLEND
        float luminanceOverAlpha = 0.0;
        #if	defined(REFLECTION) && defined(RADIANCEOVERALPHA)
            luminanceOverAlpha += getLuminance(finalRadianceScaled);
            #if defined(CLEARCOAT)
                luminanceOverAlpha += getLuminance(finalClearCoatRadianceScaled);
            #endif
        #endif

        #if defined(SPECULARTERM) && defined(SPECULAROVERALPHA)
            luminanceOverAlpha += getLuminance(finalSpecularScaled);
        #endif

        #if defined(CLEARCOAT) && defined(CLEARCOATOVERALPHA)
            luminanceOverAlpha += getLuminance(finalClearCoatScaled);
        #endif

        #if defined(RADIANCEOVERALPHA) || defined(SPECULAROVERALPHA)
            alpha = saturate(alpha + luminanceOverAlpha * luminanceOverAlpha);
        #endif
    #endif
#endif

// _______________ Not done before as it is unlit only __________________________
// _____________________________ Diffuse ________________________________________
    vec3 finalDiffuse = diffuseBase;
    finalDiffuse *= surfaceAlbedo.rgb;
    finalDiffuse = max(finalDiffuse, 0.0);

// _____________________________ Emissive ________________________________________
    vec3 finalEmissive = vEmissiveColor;
#ifdef EMISSIVE
    vec3 emissiveColorTex = texture2D(emissiveSampler, vEmissiveUV + uvOffset).rgb;
    finalEmissive *= toLinearSpace(emissiveColorTex.rgb);
    finalEmissive *=  vEmissiveInfos.y;
#endif

// ______________________________ Ambient ________________________________________
#ifdef AMBIENT
    vec3 ambientOcclusionForDirectDiffuse = mix(vec3(1.), ambientOcclusionColor, vAmbientInfos.w);
#else
    vec3 ambientOcclusionForDirectDiffuse = ambientOcclusionColor;
#endif

// _______________________________________________________________________________
// _____________________________ Composition _____________________________________
    // Reflection already includes the environment intensity.
    vec4 finalColor = vec4(
        vAmbientColor			* ambientOcclusionColor +
        finalDiffuse			* ambientOcclusionForDirectDiffuse * vLightingIntensity.x +
#ifndef UNLIT
    #ifdef REFLECTION
        finalIrradiance			* ambientOcclusionColor * vLightingIntensity.z +
    #endif
    #ifdef SPECULARTERM
    // Computed in the previous step to help with alpha luminance.
    //	finalSpecular			* vLightingIntensity.x * vLightingIntensity.w +
        finalSpecularScaled +
    #endif
    #ifdef CLEARCOAT
    // Computed in the previous step to help with alpha luminance.
    //	finalClearCoat			* vLightingIntensity.x * vLightingIntensity.w +
        finalClearCoatScaled +
    #endif
    #ifdef SHEEN
    // Computed in the previous step to help with alpha luminance.
    //	finalSheen  			* vLightingIntensity.x * vLightingIntensity.w +
        finalSheenScaled +
    #endif
    #ifdef REFLECTION
    // Comupted in the previous step to help with alpha luminance.
    //	finalRadiance			* vLightingIntensity.z +
        finalRadianceScaled +
        #ifdef CLEARCOAT
        //  Comupted in the previous step to help with alpha luminance.
        //  finalClearCoatRadiance * vLightingIntensity.z 
            finalClearCoatRadianceScaled +
        #endif
        #ifdef SHEEN
        //  Comupted in the previous step to help with alpha luminance.
        //  finalSheenRadiance * vLightingIntensity.z 
            finalSheenRadianceScaled +
        #endif
    #endif
    #ifdef REFRACTION
        finalRefraction			* vLightingIntensity.z +
    #endif
#endif
        finalEmissive			* vLightingIntensity.y,
        alpha);

// _____________________________ LightMappping _____________________________________
#ifdef LIGHTMAP
    #ifndef LIGHTMAPEXCLUDED
        #ifdef USELIGHTMAPASSHADOWMAP
            finalColor.rgb *= lightmapColor;
        #else
            finalColor.rgb += lightmapColor;
        #endif
    #endif
#endif

// _____________________________ Finally ___________________________________________
    finalColor = max(finalColor, 0.0);

#include<logDepthFragment>
#include<fogFragment>(color, finalColor)

#ifdef IMAGEPROCESSINGPOSTPROCESS
    // Sanitize output incase invalid normals or tangents have caused div by 0 or undefined behavior
    // this also limits the brightness which helpfully reduces over-sparkling in bloom (native handles this in the bloom blur shader)
    finalColor.rgb = clamp(finalColor.rgb, 0., 30.0);
#else
    // Alway run to ensure we are going back to gamma space.
    finalColor = applyImageProcessing(finalColor);
#endif

#ifdef PREMULTIPLYALPHA
    // Convert to associative (premultiplied) format if needed.
    finalColor.rgb *= finalColor.a;
#endif

    gl_FragColor = finalColor;

#include<pbrDebug>
}
