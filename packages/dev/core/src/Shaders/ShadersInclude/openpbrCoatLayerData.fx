// This code reads uniforms and samples textures to fill up the coat
// layer properties for OpenPBR

float coat_weight = 0.0;
vec3 coat_color = vec3(1.0);
float coat_roughness = 0.0;
float coat_roughness_anisotropy = 0.0;
float coat_ior = 1.6;
float coat_darkening = 1.0;

// Sample Coat Layer properties from textures
#ifdef COAT_WEIGHT
    vec4 coatWeightFromTexture = texture2D(coatWeightSampler, vCoatWeightUV + uvOffset);
#endif

#ifdef COAT_COLOR
    vec4 coatColorFromTexture = texture2D(coatColorSampler, vCoatColorUV + uvOffset);
#endif

#ifdef COAT_ROUGHNESS
    vec4 coatRoughnessFromTexture = texture2D(coatRoughnessSampler, vCoatRoughnessUV + uvOffset);
#endif

#ifdef COAT_ROUGHNESS_ANISOTROPY
    float coatRoughnessAnisotropyFromTexture = texture2D(coatRoughnessAnisotropySampler, vCoatRoughnessAnisotropyUV + uvOffset).r;
#endif

#ifdef COAT_DARKENING
    vec4 coatDarkeningFromTexture = texture2D(coatDarkeningSampler, vCoatDarkeningUV + uvOffset);
#endif

// Initalize coat layer properties from uniforms
coat_color = vCoatColor.rgb;
coat_weight = vCoatWeight;
coat_roughness = vCoatRoughness;
// coat_roughness_anisotropy = vCoatRoughnessAnisotropy;
coat_ior = vCoatIor;
coat_darkening = vCoatDarkening;

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

    coat_color *= vCoatColorInfos.y;
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
