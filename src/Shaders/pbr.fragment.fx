#if defined(BUMP) || !defined(NORMAL) || defined(FORCENORMALFORWARD) || defined(SPECULARAA) || defined(CLEARCOAT_BUMP) || defined(ANISOTROPIC)
#extension GL_OES_standard_derivatives : enable
#endif

#ifdef LODBASEDMICROSFURACE
#extension GL_EXT_shader_texture_lod : enable
#endif

#define CUSTOM_FRAGMENT_BEGIN

#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif

precision highp float;

// Forces linear space for image processing
#ifndef FROMLINEARSPACE
    #define FROMLINEARSPACE
#endif

// Declaration
#include<__decl__pbrFragment>
#include<pbrFragmentExtraDeclaration>
#include<__decl__lightFragment>[0..maxSimultaneousLights]
#include<pbrFragmentSamplersDeclaration>
#include<imageProcessingDeclaration>
#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#include<fogFragmentDeclaration>

// Helper Functions
#include<helperFunctions>
#include<pbrHelperFunctions>
#include<imageProcessingFunctions>
#include<shadowsFragmentFunctions>
#include<harmonicsFunctions>
#include<pbrDirectLightingSetupFunctions>
#include<pbrDirectLightingFalloffFunctions>
#include<pbrBRDFFunctions>
#include<pbrDirectLightingFunctions>
#include<pbrIBLFunctions>
#include<bumpFragmentFunctions>

#ifdef REFLECTION
    #include<reflectionFunction>
#endif

#define CUSTOM_FRAGMENT_DEFINITIONS

// _____________________________ MAIN FUNCTION ____________________________
void main(void) {

    #define CUSTOM_FRAGMENT_MAIN_BEGIN

    #include<clipPlaneFragment>

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

    #ifdef GAMMAALBEDO
        surfaceAlbedo *= toLinearSpace(albedoTexture.rgb);
    #else
        surfaceAlbedo *= albedoTexture.rgb;
    #endif

    surfaceAlbedo *= vAlbedoInfos.y;
#endif

#ifdef VERTEXCOLOR
    surfaceAlbedo *= vColor.rgb;
#endif

#define CUSTOM_FRAGMENT_UPDATE_ALBEDO

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

#if !defined(SS_LINKREFRACTIONTOTRANSPARENCY) && !defined(ALPHAFRESNEL)
    #ifdef ALPHATEST
        if (alpha < ALPHATESTVALUE)
            discard;

        #ifndef ALPHABLEND
            // Prevent to blend with the canvas.
            alpha = 1.0;
        #endif
    #endif
#endif

#define CUSTOM_FRAGMENT_UPDATE_ALPHA

#include<depthPrePass>

#define CUSTOM_FRAGMENT_BEFORE_LIGHTS

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

        #define CUSTOM_FRAGMENT_UPDATE_METALLICROUGHNESS
		
        // Compute microsurface from roughness.
        microSurface = 1.0 - metallicRoughness.g;

        // Diffuse is used as the base of the reflectivity.
        vec3 baseColor = surfaceAlbedo;

        #ifdef REFLECTANCE
            // *** NOT USED ANYMORE ***
            // Following Frostbite Remapping,
            // https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf page 115
            // vec3 f0 = 0.16 * reflectance * reflectance * (1.0 - metallic) + baseColor * metallic;
            // where 0.16 * reflectance * reflectance remaps the reflectance to allow storage in 8 bit texture

            // Compute the converted diffuse.
            surfaceAlbedo = baseColor.rgb * (1.0 - metallicRoughness.r);

            // Compute the converted reflectivity.
            surfaceReflectivityColor = mix(0.16 * reflectance * reflectance, baseColor, metallicRoughness.r);
        #else
            vec3 metallicF0 = vec3(vReflectivityColor.a, vReflectivityColor.a, vReflectivityColor.a);
            #ifdef METALLICF0FACTORFROMMETALLICMAP
                #ifdef REFLECTIVITY
                    metallicF0 *= surfaceMetallicColorMap.a;
                #endif
            #endif

            // Compute the converted diffuse.
            surfaceAlbedo = mix(baseColor.rgb * (1.0 - metallicF0.r), vec3(0., 0., 0.), metallicRoughness.r);

            // Compute the converted reflectivity.
            surfaceReflectivityColor = mix(metallicF0, baseColor, metallicRoughness.r);
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
				
                #define CUSTOM_FRAGMENT_UPDATE_MICROSURFACE
				
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
    // The order 1886 page 3.
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
    #ifdef SS_REFRACTION
        vec4 environmentRefraction = vec4(0., 0., 0., 0.);

        #ifdef ANISOTROPIC
            vec3 refractionVector = refract(-viewDirectionW, anisotropicNormal, vRefractionInfos.y);
        #else
            vec3 refractionVector = refract(-viewDirectionW, normalW, vRefractionInfos.y);
        #endif

        #ifdef SS_REFRACTIONMAP_OPPOSITEZ
            refractionVector.z *= -1.0;
        #endif

        // _____________________________ 2D vs 3D Maps ________________________________
        #ifdef SS_REFRACTIONMAP_3D
            refractionVector.y = refractionVector.y * vRefractionInfos.w;
            vec3 refractionCoords = refractionVector;
            refractionCoords = vec3(refractionMatrix * vec4(refractionCoords, 0));
        #else
            vec3 vRefractionUVW = vec3(refractionMatrix * (view * vec4(vPositionW + refractionVector * vRefractionInfos.z, 1.0)));
            vec2 refractionCoords = vRefractionUVW.xy / vRefractionUVW.z;
            refractionCoords.y = 1.0 - refractionCoords.y;
        #endif

        #ifdef SS_LODINREFRACTIONALPHA
            float refractionLOD = getLodFromAlphaG(vRefractionMicrosurfaceInfos.x, alphaG, NdotVUnclamped);
        #elif defined(SS_LINEARSPECULARREFRACTION)
            float refractionLOD = getLinearLodFromRoughness(vRefractionMicrosurfaceInfos.x, roughness);
        #else
            float refractionLOD = getLodFromAlphaG(vRefractionMicrosurfaceInfos.x, alphaG);
        #endif

        #ifdef LODBASEDMICROSFURACE
            // Apply environment convolution scale/offset filter tuning parameters to the mipmap LOD selection
            refractionLOD = refractionLOD * vRefractionMicrosurfaceInfos.y + vRefractionMicrosurfaceInfos.z;

            #ifdef SS_LODINREFRACTIONALPHA
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

        #ifdef SS_RGBDREFRACTION
            environmentRefraction.rgb = fromRGBD(environmentRefraction);
        #endif

        #ifdef SS_GAMMAREFRACTION
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
        #elif defined(LINEARSPECULARREFLECTION)
            float reflectionLOD = getLinearLodFromRoughness(vReflectionMicrosurfaceInfos.x, roughness);
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

                environmentIrradiance = computeEnvironmentIrradiance(irradianceVector);
            #endif
        #elif defined(USEIRRADIANCEMAP)
            environmentIrradiance = sampleReflection(irradianceSampler, reflectionCoords).rgb;
            #ifdef RGBDREFLECTION
                environmentIrradiance.rgb = fromRGBD(environmentIrradiance);
            #endif

            #ifdef GAMMAREFLECTION
                environmentIrradiance.rgb = toLinearSpace(environmentIrradiance.rgb);
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
            float sheenFactor = pow5(1.0-sheenIntensity);
            vec3 sheenColor = baseColor.rgb*(1.0-sheenFactor);
            float sheenRoughness = sheenIntensity;
            // remap albedo.
            surfaceAlbedo.rgb *= sheenFactor;
        #else
            vec3 sheenColor = vSheenColor.rgb;
            #ifdef SHEEN_TEXTURE
                sheenColor.rgb *= toLinearSpace(sheenMapData.rgb);
            #endif
            
            #ifdef SHEEN_ROUGHNESS
                float sheenRoughness = vSheenRoughness;
            #else
                float sheenRoughness = roughness;
            #endif

            // Sheen Lobe Layering.
            #if !defined(SHEEN_ALBEDOSCALING)
                sheenIntensity *= (1. - reflectance);
            #endif

            // Remap F0 and sheen.
            sheenColor *= sheenIntensity;
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
            #elif defined(LINEARSPECULARREFLECTION)
                float sheenReflectionLOD = getLinearLodFromRoughness(vReflectionMicrosurfaceInfos.x, sheenRoughness);
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
                clearCoatNormalW = perturbNormal(TBNClearCoat, texture2D(clearCoatBumpSampler, vClearCoatBumpUV + uvOffset).xyz, vClearCoatBumpInfos.y);
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
        // The order 1886 page 3.
        float clearCoatNdotV = absEps(clearCoatNdotVUnclamped);

        #ifdef CLEARCOAT_TINT
            // Used later on in the light fragment and ibl.
            vec3 clearCoatVRefract = -refract(vPositionW, clearCoatNormalW, vClearCoatRefractionParams.y);
            // The order 1886 page 3.
            float clearCoatNdotVRefract = absEps(dot(clearCoatNormalW, clearCoatVRefract));
            vec3 absorption = vec3(0.);
        #endif

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
            #elif defined(LINEARSPECULARREFLECTION)
                float sheenReflectionLOD = getLinearLodFromRoughness(vReflectionMicrosurfaceInfos.x, clearCoatRoughness);
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

            // _____________________________ Levels _____________________________________
            environmentClearCoatRadiance.rgb *= vReflectionInfos.x;
            environmentClearCoatRadiance.rgb *= vReflectionColor.rgb;
        #endif
    #endif

    // _____________________________ IBL BRDF + Energy Cons ________________________________
    #if defined(ENVIRONMENTBRDF)
        // BRDF Lookup
        vec3 environmentBrdf = getBRDFLookup(NdotV, roughness);

        #ifdef MS_BRDF_ENERGY_CONSERVATION
            vec3 energyConservationFactor = getEnergyConservationFactor(specularEnvironmentR0, environmentBrdf);
        #endif
    #endif

    // ___________________________________ SubSurface ______________________________________
    #ifdef SUBSURFACE
        #ifdef SS_REFRACTION
            float refractionIntensity = vSubSurfaceIntensity.x;
            #ifdef SS_LINKREFRACTIONTOTRANSPARENCY
                refractionIntensity *= (1.0 - alpha);
                // Put alpha back to 1;
                alpha = 1.0;
            #endif
        #endif
        #ifdef SS_TRANSLUCENCY
            float translucencyIntensity = vSubSurfaceIntensity.y;
        #endif
        #ifdef SS_SCATTERING
            float scatteringIntensity = vSubSurfaceIntensity.z;
        #endif

        #ifdef SS_THICKNESSANDMASK_TEXTURE
            vec4 thicknessMap = texture2D(thicknessSampler, vThicknessUV + uvOffset);
            float thickness = thicknessMap.r * vThicknessParam.y + vThicknessParam.x;

            #ifdef SS_MASK_FROM_THICKNESS_TEXTURE
                #ifdef SS_REFRACTION
                    refractionIntensity *= thicknessMap.g;
                #endif
                #ifdef SS_TRANSLUCENCY
                    translucencyIntensity *= thicknessMap.b;
                #endif
                #ifdef SS_SCATTERING
                    scatteringIntensity *= thicknessMap.a;
                #endif
            #endif
        #else
            float thickness = vThicknessParam.y;
        #endif

        #ifdef SS_TRANSLUCENCY
            thickness = maxEps(thickness);
            vec3 transmittance = transmittanceBRDF_Burley(vTintColor.rgb, vDiffusionDistance, thickness);
            transmittance *= translucencyIntensity;
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
        vec4 lightmapColor = texture2D(lightmapSampler, vLightmapUV + uvOffset);

        #ifdef RGBDLIGHTMAP
            lightmapColor.rgb = fromRGBD(lightmapColor);
        #endif

        #ifdef GAMMALIGHTMAP
            lightmapColor.rgb = toLinearSpace(lightmapColor.rgb);
        #endif
        lightmapColor.rgb *= vLightmapInfos.y;
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
    #if defined(SHEEN) && defined(ENVIRONMENTBRDF)
        /*#ifdef SHEEN_SOFTER
            vec3 environmentSheenBrdf = vec3(0., 0., getBRDFLookupCharlieSheen(NdotV, sheenRoughness));
        #else*/
            #ifdef SHEEN_ROUGHNESS
                vec3 environmentSheenBrdf = getBRDFLookup(NdotV, sheenRoughness);
            #else
                vec3 environmentSheenBrdf = environmentBrdf;
            #endif
        /*#endif*/
        vec3 sheenEnvironmentReflectance = getSheenReflectanceFromBRDFLookup(sheenColor, environmentSheenBrdf);

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

        #if defined(SHEEN_ALBEDOSCALING)
            // Sheen Lobe Layering.
            // environmentSheenBrdf.b is (integral on hemisphere)[f_sheen*cos(theta)*dtheta*dphi], which happens to also be the directional albedo needed for albedo scaling.
            // See section 6.2.3 in https://dassaultsystemes-technology.github.io/EnterprisePBRShadingModel/spec-2021x.md.html#components/sheen
            float sheenAlbedoScaling = 1.0 - sheenIntensity * max(max(sheenColor.r, sheenColor.g), sheenColor.b) * environmentSheenBrdf.b;
        #endif
    #endif

    // _________________________ Clear Coat Environment Oclusion __________________________
    #ifdef CLEARCOAT
        #if defined(ENVIRONMENTBRDF) && !defined(REFLECTIONMAP_SKYBOX)
            // BRDF Lookup
            vec3 environmentClearCoatBrdf = getBRDFLookup(clearCoatNdotV, clearCoatRoughness);
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

        #if defined(CLEARCOAT_TINT)
            // NdotL = NdotV in IBL
            absorption = computeClearCoatAbsorption(clearCoatNdotVRefract, clearCoatNdotVRefract, clearCoatColor, clearCoatThickness, clearCoatIntensity);

            #ifdef REFLECTION
                environmentIrradiance *= absorption;
            #endif

            #if defined(SHEEN) && defined(ENVIRONMENTBRDF)
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

        #if defined(SHEEN) && defined(ENVIRONMENTBRDF)
            sheenEnvironmentReflectance *= conservationFactor;
        #endif

        specularEnvironmentReflectance *= conservationFactor;

        #if defined(ENVIRONMENTBRDF) && defined(MS_BRDF_ENERGY_CONSERVATION)
            vec3 energyConservationFactorClearCoat = getEnergyConservationFactor(specularEnvironmentR0, environmentClearCoatBrdf);
        #endif
    #endif

    // _____________________________ Transmittance + Tint ________________________________
    #ifdef SS_REFRACTION
        vec3 refractionTransmittance = vec3(refractionIntensity);
        #ifdef SS_THICKNESSANDMASK_TEXTURE
            vec3 volumeAlbedo = computeColorAtDistanceInMedia(vTintColor.rgb, vTintColor.w);

            // // Simulate Flat Surface
            // thickness /=  dot(refractionVector, -normalW);

            // // Simulate Curved Surface
            // float NdotRefract = dot(normalW, refractionVector);
            // thickness *= -NdotRefract;

            refractionTransmittance *= cocaLambert(volumeAlbedo, thickness);
        #elif defined(SS_LINKREFRACTIONTOTRANSPARENCY)
            // Tint the material with albedo.
            float maxChannel = max(max(surfaceAlbedo.r, surfaceAlbedo.g), surfaceAlbedo.b);
            vec3 volumeAlbedo = saturate(maxChannel * surfaceAlbedo);

            // Tint reflectance
            environmentRefraction.rgb *= volumeAlbedo;
        #else
            // Compute tint from min distance only.
            vec3 volumeAlbedo = computeColorAtDistanceInMedia(vTintColor.rgb, vTintColor.w);
            refractionTransmittance *= cocaLambert(volumeAlbedo, vThicknessParam.y);
        #endif

        // Decrease Albedo Contribution
        surfaceAlbedo *= (1. - refractionIntensity);

        #ifdef REFLECTION
            // Decrease irradiance Contribution
            environmentIrradiance *= (1. - refractionIntensity);
        #endif

        // Add Multiple internal bounces.
        vec3 bounceSpecularEnvironmentReflectance = (2.0 * specularEnvironmentReflectance) / (1.0 + specularEnvironmentReflectance);
        specularEnvironmentReflectance = mix(bounceSpecularEnvironmentReflectance, specularEnvironmentReflectance, refractionIntensity);

        // In theory T = 1 - R.
        refractionTransmittance *= 1.0 - specularEnvironmentReflectance;
    #endif

    // _______________________________  IBL Translucency ________________________________
    #if defined(REFLECTION) && defined(SS_TRANSLUCENCY)
        #if defined(USESPHERICALINVERTEX)
            vec3 irradianceVector = vec3(reflectionMatrix * vec4(normalW, 0)).xyz;
            #ifdef REFLECTIONMAP_OPPOSITEZ
                irradianceVector.z *= -1.0;
            #endif
        #endif

        #if defined(USESPHERICALFROMREFLECTIONMAP)
            vec3 refractionIrradiance = computeEnvironmentIrradiance(-irradianceVector);
        #elif defined(USEIRRADIANCEMAP)
            vec3 refractionIrradiance = sampleReflection(irradianceSampler, -irradianceVector).rgb;
            #ifdef RGBDREFLECTION
                refractionIrradiance.rgb = fromRGBD(refractionIrradiance);
            #endif

            #ifdef GAMMAREFLECTION
                refractionIrradiance.rgb = toLinearSpace(refractionIrradiance.rgb);
            #endif
        #else
            vec3 refractionIrradiance = vec3(0.);
        #endif

        refractionIrradiance *= transmittance;
    #endif

    // ______________________________________________________________________________
    // _____________________________ Energy Conservation  ___________________________
    // Apply Energy Conservation.
    #ifndef METALLICWORKFLOW
        #ifdef SPECULAR_GLOSSINESS_ENERGY_CONSERVATION
            surfaceAlbedo.rgb = (1. - reflectance) * surfaceAlbedo.rgb;
        #endif
    #endif

    #if defined(SHEEN) && defined(SHEEN_ALBEDOSCALING) && defined(ENVIRONMENTBRDF)
        surfaceAlbedo.rgb = sheenAlbedoScaling * surfaceAlbedo.rgb;
    #endif

    // _____________________________ Irradiance ______________________________________
    #ifdef REFLECTION
        vec3 finalIrradiance = environmentIrradiance;
        #if defined(SS_TRANSLUCENCY)
            finalIrradiance += refractionIrradiance;
        #endif
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

        #if defined(SHEEN) && defined(ENVIRONMENTBRDF) && defined(SHEEN_ALBEDOSCALING)
            finalSpecularScaled *= sheenAlbedoScaling;
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

        #if defined(SHEEN) && defined(ENVIRONMENTBRDF) && defined(SHEEN_ALBEDOSCALING)
            finalRadianceScaled *= sheenAlbedoScaling;
        #endif
    #endif

    // _____________________________ Refraction ______________________________________
    #ifdef SS_REFRACTION
        vec3 finalRefraction = environmentRefraction.rgb;
        finalRefraction *= refractionTransmittance;
    #endif

    // ________________________________ Sheen ________________________________________
    #ifdef SHEEN
        vec3 finalSheen = sheenBase * sheenColor;
        finalSheen = max(finalSheen, 0.0);

        vec3 finalSheenScaled = finalSheen * vLightingIntensity.x * vLightingIntensity.w;
        // #if defined(ENVIRONMENTBRDF) && defined(MS_BRDF_ENERGY_CONSERVATION)
            // The sheen does not use the same BRDF so not energy conservation is possible
            // Should be less a problem as it is usually not metallic
            // finalSheenScaled *= energyConservationFactor;
        // #endif
        
        #if defined(REFLECTION) && defined(ENVIRONMENTBRDF)
            vec3 finalSheenRadiance = environmentSheenRadiance.rgb;
            finalSheenRadiance *= sheenEnvironmentReflectance;

            // Full value needed for alpha. 
            vec3 finalSheenRadianceScaled = finalSheenRadiance * vLightingIntensity.z;
        #endif
    #endif

    // _____________________________ Clear Coat _______________________________________
    #ifdef CLEARCOAT
        vec3 finalClearCoat = clearCoatBase;
        finalClearCoat = max(finalClearCoat, 0.0);

        // Full value needed for alpha.
        vec3 finalClearCoatScaled = finalClearCoat * vLightingIntensity.x * vLightingIntensity.w;
        #if defined(ENVIRONMENTBRDF) && defined(MS_BRDF_ENERGY_CONSERVATION)
            finalClearCoatScaled *= energyConservationFactorClearCoat;
        #endif

    // ____________________________ Clear Coat Radiance _______________________________
        #ifdef REFLECTION
            vec3 finalClearCoatRadiance = environmentClearCoatRadiance.rgb;
            finalClearCoatRadiance *= clearCoatEnvironmentReflectance;

            // Full value needed for alpha. 
            vec3 finalClearCoatRadianceScaled = finalClearCoatRadiance * vLightingIntensity.z;
        #endif

        #ifdef SS_REFRACTION
            finalRefraction *= conservationFactor;
            #ifdef CLEARCOAT_TINT
                finalRefraction *= absorption;
            #endif
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

// _____________________________ Ambient ________________________________________
    vec3 finalAmbient = vAmbientColor;
    finalAmbient *= surfaceAlbedo.rgb;

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
        finalAmbient			* ambientOcclusionColor +
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
    #ifdef SHEEN
    // Computed in the previous step to help with alpha luminance.
    //	finalSheen  			* vLightingIntensity.x * vLightingIntensity.w +
        finalSheenScaled +
    #endif
    #ifdef CLEARCOAT
    // Computed in the previous step to help with alpha luminance.
    //	finalClearCoat			* vLightingIntensity.x * vLightingIntensity.w +
        finalClearCoatScaled +
    #endif
    #ifdef REFLECTION
    // Comupted in the previous step to help with alpha luminance.
    //	finalRadiance			* vLightingIntensity.z +
        finalRadianceScaled +
        #if defined(SHEEN) && defined(ENVIRONMENTBRDF)
        //  Comupted in the previous step to help with alpha luminance.
        //  finalSheenRadiance * vLightingIntensity.z 
            finalSheenRadianceScaled +
        #endif
        #ifdef CLEARCOAT
        //  Comupted in the previous step to help with alpha luminance.
        //  finalClearCoatRadiance * vLightingIntensity.z 
            finalClearCoatRadianceScaled +
        #endif
    #endif
    #ifdef SS_REFRACTION
        finalRefraction			* vLightingIntensity.z +
    #endif
#endif
        finalEmissive			* vLightingIntensity.y,
        alpha);

// _____________________________ LightMappping _____________________________________
#ifdef LIGHTMAP
    #ifndef LIGHTMAPEXCLUDED
        #ifdef USELIGHTMAPASSHADOWMAP
            finalColor.rgb *= lightmapColor.rgb;
        #else
            finalColor.rgb += lightmapColor.rgb;
        #endif
    #endif
#endif

#define CUSTOM_FRAGMENT_BEFORE_FOG

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

    finalColor.a *= visibility;

#ifdef PREMULTIPLYALPHA
    // Convert to associative (premultiplied) format if needed.
    finalColor.rgb *= finalColor.a;
#endif

#define CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR
    gl_FragColor = finalColor;

#include<pbrDebug>
}
