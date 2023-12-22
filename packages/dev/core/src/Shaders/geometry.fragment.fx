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

#if defined(POSITION) || defined(BUMP)
varying vec3 vPositionW;
#endif

#ifdef VELOCITY
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

#include<mrtFragmentDeclaration>[RENDER_TARGET_COUNT]
#include<bumpFragmentMainFunctions>
#include<bumpFragmentFunctions>
#include<helperFunctions>

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
    #else
        normalOutput = normalize(vNormalV);
    #endif

    #ifdef ENCODE_NORMAL
        normalOutput = normalOutput * 0.5 + 0.5;
    #endif

    #ifdef PREPASS
        #ifdef PREPASS_DEPTH
            gl_FragData[DEPTH_INDEX] = vec4(vViewPos.z / vViewPos.w, 0.0, 0.0, 1.0);
        #endif

        #ifdef PREPASS_NORMAL
            gl_FragData[NORMAL_INDEX] = vec4(normalOutput, 1.0);
        #endif
    #else
        gl_FragData[0] = vec4(vViewPos.z / vViewPos.w, 0.0, 0.0, 1.0);
        gl_FragData[1] = vec4(normalOutput, 1.0);
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
}
