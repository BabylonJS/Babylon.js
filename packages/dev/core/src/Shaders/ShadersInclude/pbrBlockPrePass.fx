#if SCENE_MRT_COUNT > 0

#ifdef ALPHATEST
    float writeGeometryInfo = 1.0;
#else
    float writeGeometryInfo = finalColor.a > ALPHATESTVALUE ? 1.0 : 0.0;
#endif

#ifdef PREPASS_POSITION
    WRITE_GEOMETRY_FRAGMENT_OUTPUT(PREPASS_POSITION_INDEX, vec4(vPositionW, writeGeometryInfo));
#endif

#ifdef PREPASS_OBJECT_ID
    WRITE_GEOMETRY_FRAGMENT_OUTPUT(PREPASS_OBJECT_ID_INDEX, encodeObjectId(objectId) * writeGeometryInfo);
#endif
#ifdef PREPASS_MESH_BLEND_TAG
    meshBlendTagOutput = writeGeometryInfo > 0.0 ? uvec4(uint(meshBlendTag), 0u, 0u, 0u) : uvec4(0u);
#endif

#ifdef PREPASS_LOCAL_POSITION
    WRITE_GEOMETRY_FRAGMENT_OUTPUT(PREPASS_LOCAL_POSITION_INDEX, vec4(vPosition, writeGeometryInfo));
#endif

#if defined(PREPASS_VELOCITY)
    vec2 a = (vCurrentPosition.xy / vCurrentPosition.w) * 0.5 + 0.5;
    vec2 b = (vPreviousPosition.xy / vPreviousPosition.w) * 0.5 + 0.5;

    vec2 velocity = abs(a - b);
    velocity = vec2(pow(velocity.x, 1.0 / 3.0), pow(velocity.y, 1.0 / 3.0)) * sign(a - b) * 0.5 + 0.5;

    WRITE_GEOMETRY_FRAGMENT_OUTPUT(PREPASS_VELOCITY_INDEX, vec4(velocity, 0.0, writeGeometryInfo));
#elif defined(PREPASS_VELOCITY_LINEAR)
    vec2 velocity = vec2(0.5) * ((vPreviousPosition.xy / vPreviousPosition.w) - (vCurrentPosition.xy / vCurrentPosition.w));

    WRITE_GEOMETRY_FRAGMENT_OUTPUT(PREPASS_VELOCITY_LINEAR_INDEX, vec4(velocity, 0.0, writeGeometryInfo));
#endif

#ifdef PREPASS_ALBEDO
    WRITE_GEOMETRY_FRAGMENT_OUTPUT(PREPASS_ALBEDO_INDEX, vec4(surfaceAlbedo, writeGeometryInfo));
#endif

#ifdef PREPASS_ALBEDO_SQRT
    vec3 sqAlbedo = sqrt(surfaceAlbedo); // for pre and post scatter
#endif

#ifdef PREPASS_IRRADIANCE_LEGACY
    vec3 irradiance = finalDiffuse;
    #ifndef UNLIT
        #ifdef REFLECTION
            irradiance += finalIrradiance;
        #endif
    #endif

    #ifdef SS_SCATTERING
        #ifdef PREPASS_COLOR
            WRITE_GEOMETRY_FRAGMENT_OUTPUT(PREPASS_COLOR_INDEX, vec4(finalColor.rgb - irradiance, finalColor.a)); // Split irradiance from final color
        #endif
        irradiance /= sqAlbedo;
    #else
        #ifdef PREPASS_COLOR
            WRITE_GEOMETRY_FRAGMENT_OUTPUT(PREPASS_COLOR_INDEX, finalColor); // No split lighting
        #endif
        float scatteringDiffusionProfile = 255.;
    #endif

    WRITE_GEOMETRY_FRAGMENT_OUTPUT(PREPASS_IRRADIANCE_LEGACY_INDEX, vec4(clamp(irradiance, vec3(0.), vec3(1.)), writeGeometryInfo * scatteringDiffusionProfile / 255.)); // Irradiance + SS diffusion profile
#else
    #ifdef PREPASS_IRRADIANCE
        vec3 irradiance = finalDiffuse;
        #ifndef UNLIT
            #ifdef REFLECTION
                irradiance += finalIrradiance;
            #endif
        #endif
        WRITE_GEOMETRY_FRAGMENT_OUTPUT(PREPASS_IRRADIANCE_INDEX, vec4(irradiance, writeGeometryInfo));
    #endif
    #if defined(PREPASS_COLOR)
        WRITE_GEOMETRY_FRAGMENT_OUTPUT(PREPASS_COLOR_INDEX, vec4(finalColor.rgb, finalColor.a));
    #endif
#endif

#ifdef PREPASS_DEPTH
    WRITE_GEOMETRY_FRAGMENT_OUTPUT(PREPASS_DEPTH_INDEX, vec4(vViewPos.z, 0.0, 0.0, writeGeometryInfo)); // Linear depth
#endif

#ifdef PREPASS_SCREENSPACE_DEPTH
    WRITE_GEOMETRY_FRAGMENT_OUTPUT(PREPASS_SCREENSPACE_DEPTH_INDEX, vec4(gl_FragCoord.z, 0.0, 0.0, writeGeometryInfo));
#endif

#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
    WRITE_GEOMETRY_FRAGMENT_OUTPUT(PREPASS_NORMALIZED_VIEW_DEPTH_INDEX, vec4(vNormViewDepth, 0.0, 0.0, writeGeometryInfo));
#endif

#ifdef PREPASS_NORMAL
    #ifdef PREPASS_NORMAL_WORLDSPACE
        WRITE_GEOMETRY_FRAGMENT_OUTPUT(PREPASS_NORMAL_INDEX, vec4(normalW, writeGeometryInfo));
    #else
        WRITE_GEOMETRY_FRAGMENT_OUTPUT(PREPASS_NORMAL_INDEX, vec4(normalize((view * vec4(normalW, 0.0)).rgb), writeGeometryInfo));
    #endif
#endif

#ifdef PREPASS_WORLD_NORMAL
    WRITE_GEOMETRY_FRAGMENT_OUTPUT(PREPASS_WORLD_NORMAL_INDEX, vec4(normalW * 0.5 + 0.5, writeGeometryInfo)); // Normal
#endif

#ifdef PREPASS_ALBEDO_SQRT
    WRITE_GEOMETRY_FRAGMENT_OUTPUT(PREPASS_ALBEDO_SQRT_INDEX, vec4(sqAlbedo, writeGeometryInfo)); // albedo, for pre and post scatter
#endif

#ifdef PREPASS_REFLECTIVITY
    #ifndef UNLIT
        WRITE_GEOMETRY_FRAGMENT_OUTPUT(PREPASS_REFLECTIVITY_INDEX, vec4(specularEnvironmentR0, microSurface) * writeGeometryInfo);
    #else
        WRITE_GEOMETRY_FRAGMENT_OUTPUT(PREPASS_REFLECTIVITY_INDEX, vec4( 0.0, 0.0, 0.0, 1.0 ) * writeGeometryInfo);
    #endif
#endif

#endif
