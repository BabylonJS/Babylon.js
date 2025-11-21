// This code reads uniforms and samples textures to fill up the coat
// layer properties for OpenPBR

float coat_weight = 0.0;
vec3 coat_color = vec3(1.0);
float coat_roughness = 0.0;
float coat_roughness_anisotropy = 0.0;
float coat_ior = 1.6;
float coat_darkening = 1.0;
vec2 geometry_coat_tangent = vec2(1.0, 0.0);

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

#ifdef GEOMETRY_COAT_TANGENT
    vec3 geometryCoatTangentFromTexture = texture2D(geometryCoatTangentSampler, vGeometryCoatTangentUV + uvOffset).rgb;
#endif

// Initalize coat layer properties from uniforms
coat_color = vCoatColor.rgb;
coat_weight = vCoatWeight;
coat_roughness = vCoatRoughness;
coat_roughness_anisotropy = vCoatRoughnessAnisotropy;
coat_ior = vCoatIor;
coat_darkening = vCoatDarkening;
geometry_coat_tangent = vGeometryCoatTangent.rg;

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
    #ifdef COAT_ROUGHNESS_FROM_GREEN_CHANNEL
        coat_roughness *= coatRoughnessFromTexture.g;
    #else
        coat_roughness *= coatRoughnessFromTexture.r;
    #endif
#endif

#if defined(GEOMETRY_COAT_TANGENT) && defined(COAT_ROUGHNESS_ANISOTROPY_FROM_TANGENT_TEXTURE)
    coat_roughness_anisotropy *= geometryCoatTangentFromTexture.b;
#elif defined(COAT_ROUGHNESS_ANISOTROPY)
    coat_roughness_anisotropy *= coatRoughnessAnisotropyFromTexture;
#endif

#ifdef COAT_DARKENING
    coat_darkening *= coatDarkeningFromTexture.r;
#endif

#ifdef GEOMETRY_COAT_TANGENT
{
    vec2 tangentFromTexture = normalize(geometryCoatTangentFromTexture.xy * 2.0 - 1.0);
    float tangent_angle_texture = atan(tangentFromTexture.y, tangentFromTexture.x);
    float tangent_angle_uniform = atan(geometry_coat_tangent.y, geometry_coat_tangent.x);
    float tangent_angle = tangent_angle_texture + tangent_angle_uniform;
    geometry_coat_tangent = vec2(cos(tangent_angle), sin(tangent_angle));
}
#endif

#ifdef USE_GLTF_STYLE_ANISOTROPY
    float coatAlpha = coat_roughness * coat_roughness;

    // From glTF to OpenPBR
    float coatRoughnessT = mix(coatAlpha, 1.0, coat_roughness_anisotropy * coat_roughness_anisotropy);
    float coatRoughnessB = coatAlpha;
    coat_roughness_anisotropy = 1.0 - coatRoughnessB / max(coatRoughnessT, 0.00001);
    coat_roughness = sqrt(coatRoughnessT / sqrt(2.0 / (1.0 + (1.0 - coat_roughness_anisotropy) * (1.0 - coat_roughness_anisotropy))));
#endif