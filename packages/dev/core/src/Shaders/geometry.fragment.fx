#extension GL_EXT_draw_buffers : require

#if defined(BUMP) || !defined(NORMAL)
#extension GL_OES_standard_derivatives : enable
#endif

precision highp float;

#ifdef BUMP
varying mat4 vWorldView;
varying vec3 vNormalW;
#else
varying vec3 vNormalV;
#endif

varying vec4 vViewPos;

#if defined(POSITION) || defined(BUMP) || defined(IRRADIANCE)
varying vec3 vPositionW;
#endif

#if defined(VELOCITY) || defined(VELOCITY_LINEAR)
varying vec4 vCurrentPosition;
varying vec4 vPreviousPosition;
#endif

#ifdef NEED_UV
varying vec2 vUV;
#endif

#ifdef BUMP
uniform vec3 vBumpInfos;
uniform vec2 vTangentSpaceParams;
#endif

#if defined(REFLECTIVITY)
    #if defined(ORMTEXTURE) || defined(SPECULARGLOSSINESSTEXTURE) || defined(REFLECTIVITYTEXTURE)
        uniform sampler2D reflectivitySampler;
        varying vec2 vReflectivityUV;
    #else
        #ifdef METALLIC_TEXTURE
            uniform sampler2D metallicSampler;
            varying vec2 vMetallicUV;
        #endif
        #ifdef ROUGHNESS_TEXTURE
            uniform sampler2D roughnessSampler;
            varying vec2 vRoughnessUV;
        #endif
    #endif
    #ifdef ALBEDOTEXTURE
        varying vec2 vAlbedoUV;
        uniform sampler2D albedoSampler;
    #endif
    #ifdef REFLECTIVITYCOLOR
        uniform vec3 reflectivityColor;
    #endif
    #ifdef ALBEDOCOLOR
        uniform vec3 albedoColor;
    #endif
    #ifdef METALLIC
        uniform float metallic;
    #endif
    #if defined(ROUGHNESS) || defined(GLOSSINESS)
        uniform float glossiness;
    #endif
#endif

#if defined(ALPHATEST) && defined(NEED_UV)
uniform sampler2D diffuseSampler;
#endif

#include<clipPlaneFragmentDeclaration>

#include<mrtFragmentDeclaration>[SCENE_MRT_COUNT]
#include<bumpFragmentMainFunctions>
#include<bumpFragmentFunctions>
#include<helperFunctions>

// IBL includes for irradiance calculation
#ifdef IRRADIANCE
    #include<pbrFragmentReflectionDeclaration>
    #ifdef REFLECTION
        #ifdef USEIRRADIANCEMAP
            #include<__decl__sceneFragment>
            uniform mat4 reflectionMatrix;
            uniform vec2 vReflectionInfos;
            uniform vec3 vReflectionDominantDirection;
            #include<pbrBRDFFunctions>
            #include<openpbrDielectricReflectance>
            #include<pbrIBLFunctions>
            #include<reflectionFunction>
            #include<openpbrGeometryInfo>
            #include<openpbrIblFunctions>
        #elif defined(USESPHERICALFROMREFLECTIONMAP)
            varying vec3 vEnvironmentIrradiance;
        #endif

        #ifdef IBL_SHADOW_TEXTURE
            uniform sampler2D iblShadowSampler;
            uniform vec2 shadowTextureSize;
        #endif

        #ifdef IRRADIANCE_SCATTER_MASK
            uniform float vSubsurfaceWeight;
            #include<samplerFragmentDeclaration>(_DEFINENAME_,SUBSURFACE_WEIGHT,_VARYINGNAME_,SubsurfaceWeight,_SAMPLERNAME_,subsurfaceWeight)
            uniform float vSubsurfaceScatterAnisotropy;
            uniform float vTransmissionWeight;
            #include<samplerFragmentDeclaration>(_DEFINENAME_,TRANSMISSION_WEIGHT,_VARYINGNAME_,TransmissionWeight,_SAMPLERNAME_,transmissionWeight)
            uniform float vTransmissionScatterAnisotropy;
        #endif
    #endif
#endif

void main() {
    #include<clipPlaneFragment>

    #ifdef ALPHATEST
        if (texture2D(diffuseSampler, vUV).a < 0.4)
            discard;
    #endif

    vec3 normalOutput;
    #ifdef BUMP
        vec3 normalW = normalize(vNormalW);
        #include<bumpFragment>
        #ifdef NORMAL_WORLDSPACE
            normalOutput = normalW;
        #else
            normalOutput = normalize(vec3(vWorldView * vec4(normalW, 0.0)));
        #endif
    #elif defined(HAS_NORMAL_ATTRIBUTE)
        normalOutput = normalize(vNormalV);
    #elif defined(POSITION)
        // Derive normal from position
	    normalOutput = normalize(-cross(dFdx(vPositionW), dFdy(vPositionW)));
    #endif

    #ifdef ENCODE_NORMAL
        normalOutput = normalOutput * 0.5 + 0.5;
    #endif

    #ifdef DEPTH
        gl_FragData[DEPTH_INDEX] = vec4(vViewPos.z / vViewPos.w, 0.0, 0.0, 1.0);
    #endif
    #ifdef NORMAL
        gl_FragData[NORMAL_INDEX] = vec4(normalOutput, 1.0);
    #endif
    #ifdef SCREENSPACE_DEPTH
        gl_FragData[SCREENSPACE_DEPTH_INDEX] = vec4(gl_FragCoord.z, 0.0, 0.0, 1.0);
    #endif

    #ifdef POSITION
        gl_FragData[POSITION_INDEX] = vec4(vPositionW, 1.0);
    #endif

    #ifdef VELOCITY
        vec2 a = (vCurrentPosition.xy / vCurrentPosition.w) * 0.5 + 0.5;
        vec2 b = (vPreviousPosition.xy / vPreviousPosition.w) * 0.5 + 0.5;

        vec2 velocity = abs(a - b);
        velocity = vec2(pow(velocity.x, 1.0 / 3.0), pow(velocity.y, 1.0 / 3.0)) * sign(a - b) * 0.5 + 0.5;

        gl_FragData[VELOCITY_INDEX] = vec4(velocity, 0.0, 1.0);
    #endif

    #ifdef VELOCITY_LINEAR
        vec2 velocity = vec2(0.5) * ((vPreviousPosition.xy / vPreviousPosition.w) -
                                    (vCurrentPosition.xy / vCurrentPosition.w));
        gl_FragData[VELOCITY_LINEAR_INDEX] = vec4(velocity, 0.0, 1.0);
    #endif

    #ifdef REFLECTIVITY
        vec4 reflectivity = vec4(0.0, 0.0, 0.0, 1.0);

        #ifdef METALLICWORKFLOW
            // Reflectivity calculus for metallic-roughness model based on:
            // https://marmoset.co/posts/pbr-texture-conversion/
            // https://substance3d.adobe.com/tutorials/courses/the-pbr-guide-part-2
            // https://learnopengl.com/PBR/Theory

            float metal = 1.0;
            float roughness = 1.0;

            #ifdef ORMTEXTURE
                // Used as if :
                // pbr.useRoughnessFromMetallicTextureAlpha = false;
                // pbr.useRoughnessFromMetallicTextureGreen = true;
                // pbr.useMetallnessFromMetallicTextureBlue = true;
                metal *= texture2D(reflectivitySampler, vReflectivityUV).b;
                roughness *= texture2D(reflectivitySampler, vReflectivityUV).g;
            #else
                #ifdef METALLIC_TEXTURE
                    metal *= texture2D(metallicSampler, vMetallicUV).r;
                #endif
                #ifdef ROUGHNESS_TEXTURE
                    roughness *= texture2D(roughnessSampler, vRoughnessUV).r;
                #endif
            #endif

            #ifdef METALLIC
                metal *= metallic;
            #endif

            #ifdef ROUGHNESS
                roughness *= (1.0 - glossiness); // roughness = 1.0 - glossiness
            #endif

            reflectivity.a -= roughness;

            vec3 color = vec3(1.0);
            #ifdef ALBEDOTEXTURE
                color = texture2D(albedoSampler, vAlbedoUV).rgb;
                #ifdef GAMMAALBEDO
                    color = toLinearSpace(color);
                #endif
            #endif
            #ifdef ALBEDOCOLOR
                color *= albedoColor.xyz;
            //#else // albedo color suposed to be white
            #endif
        
            reflectivity.rgb = mix(vec3(0.04), color, metal);
        #else
            // SpecularGlossiness Model + standard material
            #if defined(SPECULARGLOSSINESSTEXTURE) || defined(REFLECTIVITYTEXTURE)
                reflectivity = texture2D(reflectivitySampler, vReflectivityUV);
                #ifdef GAMMAREFLECTIVITYTEXTURE
                    reflectivity.rgb = toLinearSpace(reflectivity.rgb);
                #endif
            #else 
                #ifdef REFLECTIVITYCOLOR
                    reflectivity.rgb = toLinearSpace(reflectivityColor.xyz);
                    reflectivity.a = 1.0;
                #endif
            #endif
            #ifdef GLOSSINESSS
                reflectivity.a *= glossiness; 
            #endif
        #endif
        gl_FragData[REFLECTIVITY_INDEX] = reflectivity;
    #endif

    #ifdef IRRADIANCE
        // Calculate environment irradiance for geometry buffer
        vec3 irradiance = vec3(0.0);
        float irradiance_alpha = 1.0;
        #ifdef REFLECTION
            #ifdef IRRADIANCE_SCATTER_MASK
                vec3 vSubsurfaceColor = vec3(1.0);
                float vSubsurfaceRadius = 0.0;
                vec3 vSubsurfaceRadiusScale = vec3(1.0);
                #include<openpbrSubsurfaceLayerData>
                float vTransmissionDepth = 1.0;
                vec3 vTransmissionColor = vec3(1.0);
                vec3 vTransmissionScatter = vec3(0.0);
                float vTransmissionDispersionScale = 0.0;
                float vTransmissionDispersionAbbeNumber = 0.0;
                #include<openpbrTransmissionLayerData>
            #endif
            #ifdef IBL_SHADOW_TEXTURE
                #ifdef COLORED_IBL_SHADOWS
                    vec3 iblShadowValue = texture(iblShadowSampler, gl_FragCoord.xy / shadowTextureSize).rgb;
                #else
                    vec3 iblShadowValue = vec3(texture(iblShadowSampler, gl_FragCoord.xy / shadowTextureSize).r);
                #endif
            #endif
            #if defined(USEIRRADIANCEMAP)
                #ifdef IRRADIANCE_SCATTER_MASK
                    // Bend the normal towards the view direction based on the anisotropy. This is mainly to mimick
                    // backscattering when the anisotropy is negative.
                    float bendAmount = subsurface_weight * -min(subsurface_scatter_anisotropy, 0.0);
                    bendAmount = mix(bendAmount, -min(transmission_scatter_anisotropy, 0.0), transmission_weight);
                    vec3 viewVector = normalize(vEyePosition.xyz - vPositionW.xyz);
                    vec3 bentNormal = mix(normalOutput, viewVector, bendAmount * dot(normalOutput, viewVector));
                #else
                    vec3 bentNormal = normalOutput;
                #endif
                
                irradiance = sampleIrradiance(
                    bentNormal
                    #if defined(NORMAL) && defined(USESPHERICALINVERTEX)
                        , vEnvironmentIrradiance
                    #endif
                    #if (defined(USESPHERICALFROMREFLECTIONMAP) && (!defined(NORMAL) || !defined(USESPHERICALINVERTEX))) || (defined(USEIRRADIANCEMAP) && defined(REFLECTIONMAP_3D))
                        , reflectionMatrix
                    #endif
                    #ifdef USEIRRADIANCEMAP
                        , irradianceSampler
                        #ifdef USE_IRRADIANCE_DOMINANT_DIRECTION
                            , vReflectionDominantDirection
                        #endif
                    #endif
                    #ifdef REALTIME_FILTERING
                        , vReflectionFilteringInfo
                        #ifdef IBL_CDF_FILTERING
                            , icdfSampler
                        #endif
                    #endif
                    , vReflectionInfos
                    , vViewPos.xyz
                    , 1.0
                    , vec3(1.0)
                );
            #elif defined(USESPHERICALFROMREFLECTIONMAP)
                // Use pre-computed spherical harmonics irradiance from vertex shader
                irradiance = vEnvironmentIrradiance;
            #endif
            #ifdef IBL_SHADOW_TEXTURE
                irradiance *= iblShadowValue;
            #endif
            #ifndef BUMP
                vec2 uvOffset = vec2(0.0);
            #endif
            #ifdef IRRADIANCE_SCATTER_MASK
                irradiance_alpha = min(subsurface_weight + transmission_weight, 1.0);
            #endif
        #endif
        gl_FragData[IRRADIANCE_INDEX] = vec4(irradiance, irradiance_alpha);
    #endif
}
