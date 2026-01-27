// This code reads uniforms and samples textures to fill up the transmission
// slab properties for OpenPBR

float transmission_weight = vTransmissionWeight;
vec3 transmission_color = vTransmissionColor.rgb;
float transmission_depth = vTransmissionDepth;
vec3 transmission_scatter = vTransmissionScatter.rgb;
float transmission_scatter_anisotropy = vTransmissionScatterAnisotropy;
float transmission_dispersion_scale = vTransmissionDispersionScale;
float transmission_dispersion_abbe_number = vTransmissionDispersionAbbeNumber;

// Sample Coat Layer properties from textures
#ifdef TRANSMISSION_WEIGHT
    vec4 transmissionWeightFromTexture = texture2D(transmissionWeightSampler, vTransmissionWeightUV + uvOffset);
#endif

#ifdef TRANSMISSION_COLOR
    vec4 transmissionColorFromTexture = texture2D(transmissionColorSampler, vTransmissionColorUV + uvOffset);
#endif

#ifdef TRANSMISSION_DEPTH
    vec4 transmissionDepthFromTexture = texture2D(transmissionDepthSampler, vTransmissionDepthUV + uvOffset);
#endif

#ifdef TRANSMISSION_SCATTER
    vec4 transmissionScatterFromTexture = texture2D(transmissionScatterSampler, vTransmissionScatterUV + uvOffset);
#endif

#ifdef TRANSMISSION_DISPERSION_SCALE
    vec4 transmissionDispersionScaleFromTexture = texture2D(transmissionDispersionScaleSampler, vTransmissionDispersionScaleUV + uvOffset);
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

    transmission_color *= vTransmissionColorInfos.y;
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
