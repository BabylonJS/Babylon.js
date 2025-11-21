// This code reads uniforms and samples textures to fill up the transmission
// slab properties for OpenPBR

var transmission_weight: f32 = uniforms.vTransmissionWeight;
var transmission_color: vec3f = uniforms.vTransmissionColor.rgb;
var transmission_depth: f32 = uniforms.vTransmissionDepth;
var transmission_scatter: vec3f = uniforms.vTransmissionScatter.rgb;
var transmission_scatter_anisotropy: f32 = uniforms.vTransmissionScatterAnisotropy;
var transmission_dispersion_scale: f32 = uniforms.vTransmissionDispersionScale;
var transmission_dispersion_abbe_number: f32 = uniforms.vTransmissionDispersionAbbeNumber;

// Sample Coat Layer properties from textures
#ifdef TRANSMISSION_WEIGHT
    let transmissionWeightFromTexture: vec4f = textureSample(transmissionWeightSampler, transmissionWeightSamplerSampler, fragmentInputs.vTransmissionWeightUV + uvOffset);
#endif

#ifdef TRANSMISSION_COLOR
    let transmissionColorFromTexture: vec4f = textureSample(transmissionColorSampler, transmissionColorSamplerSampler, fragmentInputs.vTransmissionColorUV + uvOffset);
#endif

#ifdef TRANSMISSION_DEPTH
    let transmissionDepthFromTexture: vec4f = textureSample(transmissionDepthSampler, transmissionDepthSamplerSampler, fragmentInputs.vTransmissionDepthUV + uvOffset);
#endif

#ifdef TRANSMISSION_SCATTER
    let transmissionScatterFromTexture: vec4f = textureSample(transmissionScatterSampler, transmissionScatterSamplerSampler, fragmentInputs.vTransmissionScatterUV + uvOffset);
#endif

#ifdef TRANSMISSION_DISPERSION_SCALE
    let transmissionDispersionScaleFromTexture: vec4f = textureSample(transmissionDispersionScaleSampler, transmissionDispersionScaleSamplerSampler, fragmentInputs.vTransmissionDispersionScaleUV + uvOffset);
#endif

// Apply texture values to coat layer properties
#ifdef TRANSMISSION_WEIGHT
    transmission_weight *= transmissionWeightFromTexture.r;
#endif

#ifdef TRANSMISSION_COLOR
    #ifdef TRANSMISSION_COLOR_GAMMA
        transmission_color *= toLinearSpace(transmissionColorFromTexture.rgb);
    #else
        transmission_color *= transmissionColorFromTexture.rgb;
    #endif

    transmission_color *= uniforms.vTransmissionColorInfos.y;
#endif

#ifdef TRANSMISSION_DEPTH
    transmission_depth *= transmissionDepthFromTexture.r;
#endif

#ifdef TRANSMISSION_SCATTER
    transmission_scatter *= transmissionScatterFromTexture.rgb;
#endif

#ifdef TRANSMISSION_DISPERSION_SCALE
    transmission_dispersion_scale *= transmissionDispersionScaleFromTexture.r;
#endif
