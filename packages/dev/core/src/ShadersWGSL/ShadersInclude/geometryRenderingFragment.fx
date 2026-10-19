#ifdef PREPASS
#if SCENE_MRT_COUNT > 0
    let geometryCoverage = select(0.0, 1.0, geometryColor.a > 0.4);
    var fragData: array<vec4f, SCENE_MRT_COUNT>;
    #ifdef PREPASS_COLOR
        fragData[PREPASS_COLOR_INDEX] = geometryColor;
    #endif
    #ifdef PREPASS_POSITION
        fragData[PREPASS_POSITION_INDEX] = vec4f(geometryPositionW, geometryCoverage);
    #endif
    #ifdef PREPASS_LOCAL_POSITION
        fragData[PREPASS_LOCAL_POSITION_INDEX] = vec4f(geometryPositionL, geometryCoverage);
    #endif
    #ifdef PREPASS_DEPTH
        fragData[PREPASS_DEPTH_INDEX] = vec4f(geometryViewDepth, 0.0, 0.0, geometryCoverage);
    #endif
    #ifdef PREPASS_NORMALIZED_VIEW_DEPTH
        fragData[PREPASS_NORMALIZED_VIEW_DEPTH_INDEX] = vec4f(geometryNormalizedViewDepth, 0.0, 0.0, geometryCoverage);
    #endif
    #ifdef PREPASS_SCREENSPACE_DEPTH
        fragData[PREPASS_SCREENSPACE_DEPTH_INDEX] = vec4f(fragmentInputs.position.z, 0.0, 0.0, geometryCoverage);
    #endif
    #ifdef PREPASS_NORMAL
        fragData[PREPASS_NORMAL_INDEX] = vec4f(geometryNormalV, geometryCoverage);
    #endif
    #ifdef PREPASS_WORLD_NORMAL
        fragData[PREPASS_WORLD_NORMAL_INDEX] = vec4f(geometryNormalW * 0.5 + 0.5, geometryCoverage);
    #endif
    #ifdef PREPASS_ALBEDO
        fragData[PREPASS_ALBEDO_INDEX] = vec4f(geometryAlbedo, geometryCoverage);
    #endif
    #ifdef PREPASS_ALBEDO_SQRT
        fragData[PREPASS_ALBEDO_SQRT_INDEX] = vec4f(sqrt(max(geometryAlbedo, vec3f(0.0))), geometryCoverage);
    #endif
    #ifdef PREPASS_REFLECTIVITY
        fragData[PREPASS_REFLECTIVITY_INDEX] = vec4f(0.0, 0.0, 0.0, geometryCoverage);
    #endif
    #ifdef PREPASS_IRRADIANCE
        fragData[PREPASS_IRRADIANCE_INDEX] = vec4f(0.0, 0.0, 0.0, geometryCoverage);
    #endif
    #ifdef PREPASS_IRRADIANCE_LEGACY
        fragData[PREPASS_IRRADIANCE_LEGACY_INDEX] = vec4f(0.0);
    #endif
    #if defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)
        #ifdef PREPASS_VELOCITY_ZERO
        let geometryMotion = vec2f(0.0);
        #else
        let geometryMotion = 0.5 * (geometryCurrentPosition.xy / geometryCurrentPosition.w - geometryPreviousPosition.xy / geometryPreviousPosition.w);
        #endif
        #ifdef PREPASS_VELOCITY
            fragData[PREPASS_VELOCITY_INDEX] = vec4f(pow(abs(geometryMotion), vec2f(1.0 / 3.0)) * sign(geometryMotion) * 0.5 + 0.5, 0.0, geometryCoverage);
        #endif
        #ifdef PREPASS_VELOCITY_LINEAR
            fragData[PREPASS_VELOCITY_LINEAR_INDEX] = vec4f(-geometryMotion, 0.0, geometryCoverage);
        #endif
    #endif
    #ifdef PREPASS_OBJECT_ID
        fragData[PREPASS_OBJECT_ID_INDEX] = encodeObjectId(uniforms.objectId) * geometryCoverage;
    #endif
    #ifdef PREPASS_MESH_BLEND_TAG
        var meshBlendTagOutput: vec4<u32> = vec4u(0u);
        if (geometryCoverage > 0.0) {
            meshBlendTagOutput = vec4u(u32(uniforms.meshBlendTag), 0u, 0u, 0u);
        }
    #endif
    #include<meshBlendTagFragmentOutput>[0..8]
#endif
#endif
