// This code reads uniforms and samples textures to fill up the fuzz
// layer properties for OpenPBR
float fuzz_weight = 0.0;
vec3 fuzz_color = vec3(1.0);
float fuzz_roughness = 0.0;

#ifdef FUZZ

// Sample Fuzz Layer properties from textures
#ifdef FUZZ_WEIGHT
    vec4 fuzzWeightFromTexture = TEXRD(fuzzWeightSampler, vFuzzWeightUV + uvOffset);
#endif

#ifdef FUZZ_COLOR
    vec4 fuzzColorFromTexture = TEXRD(fuzzColorSampler, vFuzzColorUV + uvOffset);
#endif

#ifdef FUZZ_ROUGHNESS
    vec4 fuzzRoughnessFromTexture = TEXRD(fuzzRoughnessSampler, vFuzzRoughnessUV + uvOffset);
#endif

// Initalize fuzz layer properties from uniforms
fuzz_color = vFuzzColor.rgb;
fuzz_weight = vFuzzWeight;
fuzz_roughness = vFuzzRoughness;

// Apply texture values to fuzz layer properties
#ifdef FUZZ_WEIGHT
    fuzz_weight *= fuzzWeightFromTexture.r;
#endif

#ifdef FUZZ_COLOR
    #ifdef FUZZ_COLOR_GAMMA
        fuzz_color *= toLinearSpace(fuzzColorFromTexture.rgb);
    #else
        fuzz_color *= fuzzColorFromTexture.rgb;
    #endif

    fuzz_color *= vFuzzColorInfos.y;
#endif

#if defined(FUZZ_ROUGHNESS) && defined(FUZZ_ROUGHNESS_FROM_TEXTURE_ALPHA)
    fuzz_roughness *= fuzzRoughnessFromTexture.a;
#elif defined(FUZZ_ROUGHNESS)
    fuzz_roughness *= fuzzRoughnessFromTexture.r;
#endif

#endif