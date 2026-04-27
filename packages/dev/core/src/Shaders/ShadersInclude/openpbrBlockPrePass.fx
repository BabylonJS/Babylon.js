#if SCENE_MRT_COUNT > 0

float writeGeometryInfo = finalColor.a > ALPHATESTVALUE ? 1.0 : 0.0;

#ifdef PREPASS_POSITION
    gl_FragData[PREPASS_POSITION_INDEX] = vec4(vPositionW, writeGeometryInfo);
#endif

#ifdef PREPASS_LOCAL_POSITION
    gl_FragData[PREPASS_LOCAL_POSITION_INDEX] = vec4(vPosition, writeGeometryInfo);
#endif

#if defined(PREPASS_VELOCITY)
    vec2 a = (vCurrentPosition.xy / vCurrentPosition.w) * 0.5 + 0.5;
    vec2 b = (vPreviousPosition.xy / vPreviousPosition.w) * 0.5 + 0.5;

    vec2 velocity = abs(a - b);
    velocity = vec2(pow(velocity.x, 1.0 / 3.0), pow(velocity.y, 1.0 / 3.0)) * sign(a - b) * 0.5 + 0.5;

    gl_FragData[PREPASS_VELOCITY_INDEX] = vec4(velocity, 0.0, writeGeometryInfo);
#elif defined(PREPASS_VELOCITY_LINEAR)
    vec2 velocity = vec2(0.5) * ((vPreviousPosition.xy / vPreviousPosition.w) - (vCurrentPosition.xy / vCurrentPosition.w));

    gl_FragData[PREPASS_VELOCITY_LINEAR_INDEX] = vec4(velocity, 0.0, writeGeometryInfo);
#endif

#ifdef PREPASS_ALBEDO
    gl_FragData[PREPASS_ALBEDO_INDEX] = vec4(base_color, writeGeometryInfo);
#endif

#ifdef PREPASS_ALBEDO_SQRT
    vec3 sqAlbedo = sqrt(base_color);
#endif

#ifdef PREPASS_IRRADIANCE
    vec3 irradiance = total_direct_diffuse;
    #ifndef UNLIT
        #ifdef REFLECTION
            irradiance += slab_diffuse_ibl;
        #endif
    #endif

    #ifdef SCATTERING
        float scatter_mask = min(subsurface_weight + transmission_weight, 1.0);
    #else
        float scatter_mask = 0.0;
    #endif

    gl_FragData[PREPASS_IRRADIANCE_INDEX] = vec4(irradiance, writeGeometryInfo * scatter_mask);
#endif
#if defined(PREPASS_COLOR)
    gl_FragData[PREPASS_COLOR_INDEX] = vec4(finalColor.rgb, finalColor.a);
#endif

#ifdef PREPASS_DEPTH
    gl_FragData[PREPASS_DEPTH_INDEX] = vec4(vViewPos.z, 0.0, 0.0, writeGeometryInfo); // Linear depth
#endif

#ifdef PREPASS_SCREENSPACE_DEPTH
    gl_FragData[PREPASS_SCREENSPACE_DEPTH_INDEX] = vec4(gl_FragCoord.z, 0.0, 0.0, writeGeometryInfo);
#endif

#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
    gl_FragData[PREPASS_NORMALIZED_VIEW_DEPTH_INDEX] = vec4(vNormViewDepth, 0.0, 0.0, writeGeometryInfo);
#endif

#ifdef PREPASS_NORMAL
    #ifdef PREPASS_NORMAL_WORLDSPACE
        gl_FragData[PREPASS_NORMAL_INDEX] = vec4(normalW, writeGeometryInfo);
    #else
        gl_FragData[PREPASS_NORMAL_INDEX] = vec4(normalize((view * vec4(normalW, 0.0)).rgb), writeGeometryInfo);
    #endif
#endif

#ifdef PREPASS_WORLD_NORMAL
    gl_FragData[PREPASS_WORLD_NORMAL_INDEX] = vec4(normalW * 0.5 + 0.5, writeGeometryInfo); // Normal
#endif

#ifdef PREPASS_ALBEDO_SQRT
    gl_FragData[PREPASS_ALBEDO_SQRT_INDEX] = vec4(sqAlbedo, writeGeometryInfo); // albedo, for pre and post scatter
#endif

#ifdef PREPASS_REFLECTIVITY
    #ifndef UNLIT
        gl_FragData[PREPASS_REFLECTIVITY_INDEX] = vec4(specularEnvironmentR0, microSurface) * writeGeometryInfo;
    #else
        gl_FragData[PREPASS_REFLECTIVITY_INDEX] = vec4( 0.0, 0.0, 0.0, 1.0 ) * writeGeometryInfo;
    #endif
#endif

#endif
