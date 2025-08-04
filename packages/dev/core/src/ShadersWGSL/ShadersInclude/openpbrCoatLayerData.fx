// This code reads uniforms and samples textures to fill up the coat
// layer properties for OpenPBR

var coat_weight: f32 = 0.0f;
var coat_color: vec3f = vec3f(1.0f);
var coat_roughness: f32 = 0.0f;
var coat_roughness_anisotropy: f32 = 0.0f;
var coat_ior: f32 = 1.6f;
var coat_darkening: f32 = 1.0f;

// Sample Coat Layer properties from textures
#ifdef COAT_WEIGHT
    var coatWeightFromTexture: vec4f = textureSample(coatWeightSampler, coatWeightSamplerSampler, uniforms.vCoatWeightUV + uvOffset);
#endif

#ifdef COAT_COLOR
    var coatColorFromTexture: vec4f = textureSample(coatColorSampler, coatColorSamplerSampler, uniforms.vCoatColorUV + uvOffset);
#endif

#ifdef COAT_ROUGHNESS
    var coatRoughnessFromTexture: vec4f = textureSample(coatRoughnessSampler, coatRoughnessSamplerSampler, uniforms.vCoatRoughnessUV + uvOffset);
#endif

#ifdef COAT_ROUGHNESS_ANISOTROPY
    var coatRoughnessAnisotropyFromTexture: f32 = textureSample(coatRoughnessAnisotropySampler, coatRoughnessAnisotropySamplerSampler, uniforms.vCoatRoughnessAnisotropyUV + uvOffset).r;
#endif

#ifdef COAT_DARKENING
    var coatDarkeningFromTexture: vec4f = textureSample(coatDarkeningSampler, coatDarkeningSamplerSampler, uniforms.vCoatDarkeningUV + uvOffset);
#endif

// Initalize coat layer properties from uniforms
coat_color = uniforms.vCoatColor.rgb;
coat_weight = uniforms.vCoatWeight;
coat_roughness = uniforms.vCoatRoughness;
// coat_roughness_anisotropy = uniforms.vCoatRoughnessAnisotropy;
coat_ior = uniforms.vCoatIor;
// coat_darkening = uniforms.vCoatDarkening;

// Apply texture values to coat layer properties
#ifdef COAT_WEIGHT
    coat_weight *= coatWeightFromTexture.r;
#endif

#ifdef COAT_COLOR
    #ifdef COAT_COLOR_GAMMA
        coat_color *= toLinearSpace(coatColorFromTexture.rgb);
    #else
        coat_color *= coatColorFromTexture.rgb;
    #endif

    coat_color *= uniforms.vCoatColorInfos.y;
#endif

#ifdef COAT_ROUGHNESS
    coat_roughness *= coatRoughnessFromTexture.r;
#endif

#ifdef COAT_ROUGHNESS_ANISOTROPY
    coat_roughness_anisotropy *= coatRoughnessAnisotropyFromTexture;
#endif

#ifdef COAT_DARKENING
    coat_darkening *= coatDarkeningFromTexture.r;
#endif
