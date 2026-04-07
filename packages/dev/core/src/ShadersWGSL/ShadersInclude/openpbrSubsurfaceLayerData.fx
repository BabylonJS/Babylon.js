// This code reads uniforms and samples textures to fill up the subsurface
// slab properties for OpenPBR

var subsurface_weight: f32 = uniforms.vSubsurfaceWeight;
var subsurface_color: vec3f = uniforms.vSubsurfaceColor.rgb;
var subsurface_radius: f32 = uniforms.vSubsurfaceRadius;
var subsurface_radius_scale: vec3f = uniforms.vSubsurfaceRadiusScale;
var subsurface_scatter_anisotropy: f32 = clamp(uniforms.vSubsurfaceScatterAnisotropy, -0.9999f, 0.9999f);
// Sample Subsurface Layer properties from textures
#ifdef SUBSURFACE_WEIGHT
    let subsurfaceWeightFromTexture: vec4f = textureSample(subsurfaceWeightSampler, subsurfaceWeightSamplerSampler, fragmentInputs.vSubsurfaceWeightUV + uvOffset);
#endif

#ifdef SUBSURFACE_COLOR
    let subsurfaceColorFromTexture: vec4f = textureSample(subsurfaceColorSampler, subsurfaceColorSamplerSampler, fragmentInputs.vSubsurfaceColorUV + uvOffset);
#endif

#ifdef SUBSURFACE_RADIUS_SCALE
    let subsurfaceRadiusScaleFromTexture: vec4f = textureSample(subsurfaceRadiusScaleSampler, subsurfaceRadiusScaleSamplerSampler, fragmentInputs.vSubsurfaceRadiusScaleUV + uvOffset);
#endif

// Apply texture values to subsurface layer properties
#ifdef SUBSURFACE_WEIGHT
    subsurface_weight *= subsurfaceWeightFromTexture.r;
#endif

#ifdef SUBSURFACE_COLOR
    #ifdef SUBSURFACE_COLOR_GAMMA
        subsurface_color *= toLinearSpaceVec3(subsurfaceColorFromTexture.rgb);
    #else
        subsurface_color *= subsurfaceColorFromTexture.rgb;
    #endif

    subsurface_color *= uniforms.vSubsurfaceColorInfos.y;
#endif

#ifdef SUBSURFACE_RADIUS_SCALE
    subsurface_radius_scale *= subsurfaceRadiusScaleFromTexture.rgb;
#endif

