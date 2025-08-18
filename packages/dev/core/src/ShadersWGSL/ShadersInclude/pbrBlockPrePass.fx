#if SCENE_MRT_COUNT > 0

var writeGeometryInfo: f32 = select(0.0, 1.0, finalColor.a > ALPHATESTVALUE);
var fragData: array<vec4<f32>, SCENE_MRT_COUNT>;

#ifdef PREPASS_POSITION
    fragData[PREPASS_POSITION_INDEX] =  vec4f(fragmentInputs.vPositionW, writeGeometryInfo);
#endif

#ifdef PREPASS_LOCAL_POSITION
    fragData[PREPASS_LOCAL_POSITION_INDEX] = vec4f(fragmentInputs.vPosition, writeGeometryInfo);
#endif

#ifdef PREPASS_VELOCITY
    var a: vec2f = (fragmentInputs.vCurrentPosition.xy / fragmentInputs.vCurrentPosition.w) * 0.5 + 0.5;
    var b: vec2f = (fragmentInputs.vPreviousPosition.xy / fragmentInputs.vPreviousPosition.w) * 0.5 + 0.5;

    var velocity: vec2f = abs(a - b);
    velocity =  vec2f(pow(velocity.x, 1.0 / 3.0), pow(velocity.y, 1.0 / 3.0)) * sign(a - b) * 0.5 + 0.5;

    fragData[PREPASS_VELOCITY_INDEX] =  vec4f(velocity, 0.0, writeGeometryInfo);
#elif defined(PREPASS_VELOCITY_LINEAR)
    var velocity : vec2f = vec2f(0.5) * ((fragmentInputs.vPreviousPosition.xy / fragmentInputs.vPreviousPosition.w) -
                                        (fragmentInputs.vCurrentPosition.xy / fragmentInputs.vCurrentPosition.w));
    fragData[PREPASS_VELOCITY_LINEAR_INDEX] = vec4f(velocity, 0.0, writeGeometryInfo);
#endif

#ifdef PREPASS_ALBEDO
    fragData[PREPASS_ALBEDO_INDEX] = vec4f(surfaceAlbedo, writeGeometryInfo);
#endif

#ifdef PREPASS_ALBEDO_SQRT
    var sqAlbedo : vec3f = sqrt(surfaceAlbedo); // for pre and post scatter
#endif

#ifdef PREPASS_IRRADIANCE
    var irradiance : vec3f = finalDiffuse;
    #ifndef UNLIT
        #ifdef REFLECTION
            irradiance += finalIrradiance;
        #endif
    #endif

    #ifdef SS_SCATTERING
        #ifdef PREPASS_COLOR
            fragData[PREPASS_COLOR_INDEX] = vec4f(finalColor.rgb - irradiance, finalColor.a); // Split irradiance from final color
        #endif
        irradiance /= sqAlbedo;
        fragData[PREPASS_IRRADIANCE_INDEX] = vec4f(clamp(irradiance, vec3f(0.), vec3f(1.)), writeGeometryInfo * uniforms.scatteringDiffusionProfile / 255.); // Irradiance + SS diffusion profile
    #else
        #ifdef PREPASS_COLOR
            fragData[PREPASS_COLOR_INDEX] = finalColor; // No split lighting
        #endif
        fragData[PREPASS_IRRADIANCE_INDEX] = vec4f(clamp(irradiance, vec3f(0.), vec3f(1.)), writeGeometryInfo); // Irradiance + SS diffusion profile
    #endif
#elif defined(PREPASS_COLOR)
    fragData[PREPASS_COLOR_INDEX] = vec4f(finalColor.rgb, finalColor.a);
#endif

#ifdef PREPASS_DEPTH
    fragData[PREPASS_DEPTH_INDEX] = vec4f(fragmentInputs.vViewPos.z, 0.0, 0.0, writeGeometryInfo); // Linear depth
#endif

#ifdef PREPASS_SCREENSPACE_DEPTH
    fragData[PREPASS_SCREENSPACE_DEPTH_INDEX] = vec4f(fragmentInputs.position.z, 0.0, 0.0, writeGeometryInfo);
#endif

#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
    fragData[PREPASS_NORMALIZED_VIEW_DEPTH_INDEX] = vec4f(fragmentInputs.vNormViewDepth, 0.0, 0.0, writeGeometryInfo);
#endif

#ifdef PREPASS_NORMAL
    #ifdef PREPASS_NORMAL_WORLDSPACE
        fragData[PREPASS_NORMAL_INDEX] = vec4f(normalW, writeGeometryInfo);
    #else
        fragData[PREPASS_NORMAL_INDEX] = vec4f(normalize((scene.view * vec4f(normalW, 0.0)).rgb), writeGeometryInfo);
    #endif
#endif

#ifdef PREPASS_WORLD_NORMAL
    fragData[PREPASS_WORLD_NORMAL_INDEX] = vec4f(normalW * 0.5 + 0.5, writeGeometryInfo);
#endif

#ifdef PREPASS_ALBEDO_SQRT
    fragData[PREPASS_ALBEDO_SQRT_INDEX] = vec4f(sqAlbedo, writeGeometryInfo);
#endif

#ifdef PREPASS_REFLECTIVITY
    #ifndef UNLIT
        fragData[PREPASS_REFLECTIVITY_INDEX] = vec4f(specularEnvironmentR0, microSurface) * writeGeometryInfo;
    #else
        fragData[PREPASS_REFLECTIVITY_INDEX] = vec4f(0.0, 0.0, 0.0, 1.0) * writeGeometryInfo;
    #endif
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

#endif
