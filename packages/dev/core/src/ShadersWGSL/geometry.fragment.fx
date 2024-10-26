#ifdef BUMP
varying vWorldView0: vec4f;
varying vWorldView1: vec4f;
varying vWorldView2: vec4f;
varying vWorldView3: vec4f;
varying vNormalW: vec3f;
#else
varying vNormalV: vec3f;
#endif

varying vViewPos: vec4f;

#if defined(POSITION) || defined(BUMP)
varying vPositionW: vec3f;
#endif

#ifdef VELOCITY
varying vCurrentPosition: vec4f;
varying vPreviousPosition: vec4f;
#endif

#ifdef NEED_UV
varying vUV: vec2f;
#endif

#ifdef BUMP
uniform vBumpInfos: vec3f;
uniform vTangentSpaceParams: vec2f;
#endif

#if defined(REFLECTIVITY)
    #if defined(ORMTEXTURE) || defined(SPECULARGLOSSINESSTEXTURE) || defined(REFLECTIVITYTEXTURE)
        var reflectivitySamplerSampler: sampler;
        var reflectivitySampler: texture_2d<f32>;
        varying vReflectivityUV: vec2f;
    #endif
    #ifdef ALBEDOTEXTURE
        varying vAlbedoUV: vec2f;
        var albedoSamplerSampler: sampler;
        var albedoSampler: texture_2d<f32>;
    #endif
    #ifdef REFLECTIVITYCOLOR
        uniform reflectivityColor: vec3f;
    #endif
    #ifdef ALBEDOCOLOR
        uniform albedoColor: vec3f;
    #endif
    #ifdef METALLIC
        uniform metallic: f32;
    #endif
    #if defined(ROUGHNESS) || defined(GLOSSINESS)
        uniform glossiness: f32;
    #endif
#endif

#if defined(ALPHATEST) && defined(NEED_UV)
var diffuseSamplerSampler: sampler;
var diffuseSampler: texture_2d<f32>;
#endif

#include<clipPlaneFragmentDeclaration>

#include<bumpFragmentMainFunctions>
#include<bumpFragmentFunctions>
#include<helperFunctions>


@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    #include<clipPlaneFragment>

    #ifdef ALPHATEST
        if (textureSample(diffuseSampler, diffuseSamplerSampler, input.vUV).a < 0.4) {
            discard;
        }
    #endif

    var normalOutput: vec3f;
    #ifdef BUMP
        var normalW: vec3f = normalize(input.vNormalW);
        #include<bumpFragment>
        #ifdef NORMAL_WORLDSPACE
            normalOutput = normalW;
        #else
            normalOutput = normalize( vec3f(mat4x4f(input.vWorldView0, input.vWorldView0, input.vWorldView2, input.vWorldView3) *  vec4f(normalW, 0.0)));
        #endif
    #else
        normalOutput = normalize(input.vNormalV);
    #endif

    #ifdef ENCODE_NORMAL
        normalOutput = normalOutput * 0.5 + 0.5;
    #endif
    
    var fragData: array<vec4<f32>, SCENE_MRT_COUNT>;
    #ifdef DEPTH
        fragData[DEPTH_INDEX] = vec4f(input.vViewPos.z / input.vViewPos.w, 0.0, 0.0, 1.0);
    #endif
    #ifdef NORMAL
        fragData[NORMAL_INDEX] = vec4f(normalOutput, 1.0);
    #endif
    #ifdef SCREENSPACE_DEPTH
        fragData[SCREENSPACE_DEPTH_INDEX] = vec4f(fragmentInputs.position.z, 0.0, 0.0, 1.0);
    #endif

    #ifdef POSITION
        fragData[POSITION_INDEX] =  vec4f(input.vPositionW, 1.0);
    #endif

    #ifdef VELOCITY
        var a: vec2f = (input.vCurrentPosition.xy / input.vCurrentPosition.w) * 0.5 + 0.5;
        var b: vec2f = (input.vPreviousPosition.xy / input.vPreviousPosition.w) * 0.5 + 0.5;

        var velocity: vec2f = abs(a - b);
        velocity =  vec2f(pow(velocity.x, 1.0 / 3.0), pow(velocity.y, 1.0 / 3.0)) * sign(a - b) * 0.5 + 0.5;

        fragData[VELOCITY_INDEX] =  vec4f(velocity, 0.0, 1.0);
    #endif

    #ifdef REFLECTIVITY
        var reflectivity: vec4f =  vec4f(0.0, 0.0, 0.0, 1.0);

        #ifdef METALLICWORKFLOW
            // Reflectivity calculus for metallic-roughness model based on:
            // https://marmoset.co/posts/pbr-texture-conversion/
            // https://substance3d.adobe.com/tutorials/courses/the-pbr-guide-part-2
            // https://learnopengl.com/PBR/Theory

            var metal: f32 = 1.0;
            var roughness: f32 = 1.0;

            #ifdef ORMTEXTURE
                // Used as if :
                // pbr.useRoughnessFromMetallicTextureAlpha = false;
                // pbr.useRoughnessFromMetallicTextureGreen = true;
                // pbr.useMetallnessFromMetallicTextureBlue = true;
                metal *= textureSample(reflectivitySampler, reflectivitySamplerSampler, input.vReflectivityUV).b;
                roughness *= textureSample(reflectivitySampler, reflectivitySamplerSampler, input.vReflectivityUV).g;
            #endif

            #ifdef METALLIC
                metal *= uniforms.metallic;
            #endif

            #ifdef ROUGHNESS
                roughness *= (1.0 - uniforms.glossiness); // roughness = 1.0 - glossiness
            #endif

            reflectivity = vec4f(reflectivity.rgb, reflectivity.a - roughness);

            var color: vec3f =  vec3f(1.0);
            #ifdef ALBEDOTEXTURE
                color = textureSample(albedoSampler, albedoSamplerSampler, input.vAlbedoUV).rgb;
                #ifdef GAMMAALBEDO
                    color = toLinearSpaceVec4(color);
                #endif
            #endif
            #ifdef ALBEDOCOLOR
                color *= uniforms.albedoColor.xyz;
            //#else // albedo color suposed to be white
            #endif
        
            reflectivity = vec4f(mix( vec3f(0.04), color, metal), reflectivity.a);
        #else
            // SpecularGlossiness Model + standard material
            #if defined(SPECULARGLOSSINESSTEXTURE) || defined(REFLECTIVITYTEXTURE)
                reflectivity = textureSample(reflectivitySampler, reflectivitySamplerSampler, input.vReflectivityUV);
                #ifdef GAMMAREFLECTIVITYTEXTURE
                    reflectivity = vec4f(toLinearSpaceVec3(reflectivity.rgb), reflectivity.a);
                #endif
            #else 
                #ifdef REFLECTIVITYCOLOR
                    reflectivity = vec4f(toLinearSpaceVec3(uniforms.reflectivityColor.xyz), 1.0);
                #endif
            #endif
            #ifdef GLOSSINESSS
                reflectivity = vec4f(reflectivity.rgb, reflectivity.a * glossiness); 
            #endif
        #endif
        fragData[REFLECTIVITY_INDEX] = reflectivity;
    #endif

    #if SCENE_MRT_COUNT > 0
        fragmentOutputs.fragData0 = fragData[0];
    #endif
    #if SCENE_MRT_COUNT > 1
        fragmentOutputs.fragData1 = fragData[1];
    #endif
    #if SCENE_MRT_COUNT > 2
        fragmentOutputs.fragData2 = fragData[2];
    #endif
    #if SCENE_MRT_COUNT > 3
        fragmentOutputs.fragData3 = fragData[3];
    #endif
    #if SCENE_MRT_COUNT > 4
        fragmentOutputs.fragData4 = fragData[4];
    #endif
    #if SCENE_MRT_COUNT > 5
        fragmentOutputs.fragData5 = fragData[5];
    #endif
    #if SCENE_MRT_COUNT > 6
        fragmentOutputs.fragData6 = fragData[6];
    #endif
    #if SCENE_MRT_COUNT > 7
        fragmentOutputs.fragData7 = fragData[7];
    #endif
}
