// This code reads uniforms and samples textures to fill up the coat
// layer properties for OpenPBR

var coat_weight: f32 = 0.0f;
var coat_color: vec3f = vec3f(1.0f);
var coat_roughness: f32 = 0.0f;
var coat_roughness_anisotropy: f32 = 0.0f;
var coat_ior: f32 = 1.6f;
var coat_darkening: f32 = 1.0f;
var geometry_coat_tangent: vec2f = vec2f(1.0f, 0.0f);

// Sample Coat Layer properties from textures
#ifdef COAT_WEIGHT
    var coatWeightFromTexture: vec4f = textureSample(coatWeightSampler, coatWeightSamplerSampler, fragmentInputs.vCoatWeightUV + uvOffset);
#endif

#ifdef COAT_COLOR
    var coatColorFromTexture: vec4f = textureSample(coatColorSampler, coatColorSamplerSampler, fragmentInputs.vCoatColorUV + uvOffset);
#endif

#ifdef COAT_ROUGHNESS
    var coatRoughnessFromTexture: vec4f = textureSample(coatRoughnessSampler, coatRoughnessSamplerSampler, fragmentInputs.vCoatRoughnessUV + uvOffset);
#endif

#ifdef COAT_ROUGHNESS_ANISOTROPY
    var coatRoughnessAnisotropyFromTexture: f32 = textureSample(coatRoughnessAnisotropySampler, coatRoughnessAnisotropySamplerSampler, fragmentInputs.vCoatRoughnessAnisotropyUV + uvOffset).r;
#endif

#ifdef COAT_DARKENING
    var coatDarkeningFromTexture: vec4f = textureSample(coatDarkeningSampler, coatDarkeningSamplerSampler, fragmentInputs.vCoatDarkeningUV + uvOffset);
#endif

#ifdef GEOMETRY_COAT_TANGENT
    var geometryCoatTangentFromTexture: vec3f = textureSample(geometryCoatTangentSampler, geometryCoatTangentSamplerSampler, fragmentInputs.vGeometryCoatTangentUV + uvOffset).rgb;
#endif

// Initalize coat layer properties from uniforms
coat_color = uniforms.vCoatColor.rgb;
coat_weight = uniforms.vCoatWeight;
coat_roughness = uniforms.vCoatRoughness;
coat_roughness_anisotropy = uniforms.vCoatRoughnessAnisotropy;
coat_ior = uniforms.vCoatIor;
coat_darkening = uniforms.vCoatDarkening;
geometry_coat_tangent = uniforms.vGeometryCoatTangent.rg;

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
    let tangentFromTexture: vec2f = normalize(geometryCoatTangentFromTexture.xy * vec2f(2.0f) - vec2f(1.0f));
    let tangent_angle_texture: f32 = atan2(tangentFromTexture.y, tangentFromTexture.x);
    let tangent_angle_uniform: f32 = atan2(geometry_coat_tangent.y, geometry_coat_tangent.x);
    let tangent_angle: f32 = tangent_angle_texture + tangent_angle_uniform;
    geometry_coat_tangent = vec2f(cos(tangent_angle), sin(tangent_angle));
}
#endif

#ifdef USE_GLTF_STYLE_ANISOTROPY
    let coatAlpha: f32 = coat_roughness * coat_roughness;

    // From glTF to OpenPBR
    let coatRoughnessT: f32 = mix(coatAlpha, 1.0f, coat_roughness_anisotropy * coat_roughness_anisotropy);
    let coatRoughnessB: f32 = coatAlpha;
    coat_roughness_anisotropy = 1.0f - coatRoughnessB / max(coatRoughnessT, 0.00001f);
    coat_roughness = sqrt(coatRoughnessT / sqrt(2.0f / (1.0f + (1.0f - coat_roughness_anisotropy) * (1.0f - coat_roughness_anisotropy))));
#endif