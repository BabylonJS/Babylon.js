// This code reads uniforms and samples textures to fill up the subsurface
// slab properties for OpenPBR

float subsurface_weight = vSubsurfaceWeight;
vec3 subsurface_color = vSubsurfaceColor.rgb;
float subsurface_radius = vSubsurfaceRadius;
vec3 subsurface_radius_scale = vSubsurfaceRadiusScale;
float subsurface_scatter_anisotropy = clamp(vSubsurfaceScatterAnisotropy, -0.9999, 0.9999);

// Sample Subsurface Layer properties from textures
#ifdef SUBSURFACE_WEIGHT
    vec4 subsurfaceWeightFromTexture = texture2D(subsurfaceWeightSampler, vSubsurfaceWeightUV + uvOffset);
#endif

#ifdef SUBSURFACE_COLOR
    vec4 subsurfaceColorFromTexture = texture2D(subsurfaceColorSampler, vSubsurfaceColorUV + uvOffset);
#endif

#ifdef SUBSURFACE_RADIUS_SCALE
    vec4 subsurfaceRadiusScaleFromTexture = texture2D(subsurfaceRadiusScaleSampler, vSubsurfaceRadiusScaleUV + uvOffset);
#endif

// Apply texture values to subsurface layer properties
#ifdef SUBSURFACE_WEIGHT
    subsurface_weight *= subsurfaceWeightFromTexture.r;
#endif

#ifdef SUBSURFACE_COLOR
    #ifdef SUBSURFACE_COLOR_GAMMA
        subsurface_color *= toLinearSpace(subsurfaceColorFromTexture.rgb);
    #else
        subsurface_color *= subsurfaceColorFromTexture.rgb;
    #endif

    subsurface_color *= vSubsurfaceColorInfos.y;
#endif

#ifdef SUBSURFACE_RADIUS_SCALE
    subsurface_radius_scale *= subsurfaceRadiusScaleFromTexture.rgb;
#endif

