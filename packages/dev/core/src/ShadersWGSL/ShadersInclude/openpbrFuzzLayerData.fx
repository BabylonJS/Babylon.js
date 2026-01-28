// This code reads uniforms and samples textures to fill up the fuzz
// layer properties for OpenPBR
var fuzz_weight: f32 = 0.0f;
var fuzz_color: vec3f = vec3f(1.0f);
var fuzz_roughness: f32 = 0.0f;

#ifdef FUZZ

// Sample Fuzz Layer properties from textures
#ifdef FUZZ_WEIGHT
    let fuzzWeightFromTexture: vec4f = textureSample(fuzzWeightSampler, fuzzWeightSamplerSampler, fragmentInputs.vFuzzWeightUV + uvOffset);
#endif

#ifdef FUZZ_COLOR
    var fuzzColorFromTexture: vec4f = textureSample(fuzzColorSampler, fuzzColorSamplerSampler, fragmentInputs.vFuzzColorUV + uvOffset);
#endif

#ifdef FUZZ_ROUGHNESS
    let fuzzRoughnessFromTexture: vec4f = textureSample(fuzzRoughnessSampler, fuzzRoughnessSamplerSampler, fragmentInputs.vFuzzRoughnessUV + uvOffset);
#endif

// Initalize fuzz layer properties from uniforms
fuzz_color = uniforms.vFuzzColor.rgb;
fuzz_weight = uniforms.vFuzzWeight;
fuzz_roughness = uniforms.vFuzzRoughness;

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

    fuzz_color *= uniforms.vFuzzColorInfos.y;
#endif

#if defined(FUZZ_ROUGHNESS) && defined(FUZZ_ROUGHNESS_FROM_TEXTURE_ALPHA)
    fuzz_roughness *= fuzzRoughnessFromTexture.a;
#elif defined(FUZZ_ROUGHNESS)
    fuzz_roughness *= fuzzRoughnessFromTexture.r;
#endif

#endif