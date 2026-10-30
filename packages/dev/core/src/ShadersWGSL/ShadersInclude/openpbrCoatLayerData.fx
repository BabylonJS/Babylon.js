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
    var coatWeightFromTexture: vec4f = TEXRD(coatWeightSampler, coatWeightSamplerSampler, fragmentInputs.vCoatWeightUV + uvOffset);
#endif

#ifdef COAT_COLOR
    var coatColorFromTexture: vec4f = TEXRD(coatColorSampler, coatColorSamplerSampler, fragmentInputs.vCoatColorUV + uvOffset);
#endif

#ifdef COAT_ROUGHNESS
    var coatRoughnessFromTexture: vec4f = TEXRD(coatRoughnessSampler, coatRoughnessSamplerSampler, fragmentInputs.vCoatRoughnessUV + uvOffset);
#endif

#ifdef COAT_ROUGHNESS_ANISOTROPY
    var coatRoughnessAnisotropyFromTexture: f32 = TEXRD(coatRoughnessAnisotropySampler, coatRoughnessAnisotropySamplerSampler, fragmentInputs.vCoatRoughnessAnisotropyUV + uvOffset).r;
#endif

#ifdef COAT_DARKENING
    var coatDarkeningFromTexture: vec4f = TEXRD(coatDarkeningSampler, coatDarkeningSamplerSampler, fragmentInputs.vCoatDarkeningUV + uvOffset);
#endif

#ifdef GEOMETRY_COAT_TANGENT
    var geometryCoatTangentFromTexture: vec3f = TEXRD(geometryCoatTangentSampler, geometryCoatTangentSamplerSampler, fragmentInputs.vGeometryCoatTangentUV + uvOffset).rgb;
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
        coat_color *= toLinearSpaceVec3(coatColorFromTexture.rgb);
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

#if defined(GLTF_TRANSMISSION_SURFACE_TO_COAT) || defined(GLTF_DIFFUSE_TRANSMISSION_SURFACE_TO_COAT)
    // Keep authored inputs separate: unrelated mesh UV sets cannot be combined in image space.
    coat_color = mix(vec3f(1.0), coat_color, coat_weight);
    coat_roughness = mix(specular_roughness, coat_roughness, coat_weight);
    coat_ior = mix(specular_ior, coat_ior, coat_weight);
    coat_darkening *= coat_weight;
    coatNormalW = normalize(mix(normalW, coatNormalW, coat_weight));
    coat_weight = 1.0;

    #ifdef GLTF_DIFFUSE_TRANSMISSION_SURFACE_TO_COAT
        var diffuseTransmissionColor: vec3f = uniforms.vGltfDiffuseTransmissionColor;
        #ifdef GLTF_DIFFUSE_TRANSMISSION_COLOR
            var diffuseTransmissionTextureColor: vec3f = TEXRD(gltfDiffuseTransmissionColorSampler, gltfDiffuseTransmissionColorSamplerSampler, fragmentInputs.vGltfDiffuseTransmissionColorUV + uvOffset).rgb;
            #ifdef GLTF_DIFFUSE_TRANSMISSION_COLOR_GAMMA
                diffuseTransmissionTextureColor = toLinearSpaceVec3(diffuseTransmissionTextureColor);
            #endif
            diffuseTransmissionColor *= diffuseTransmissionTextureColor * uniforms.vGltfDiffuseTransmissionColorInfos.y;
        #endif
        coat_color *= mix(vec3f(1.0), diffuseTransmissionColor, subsurface_weight);
        specular_roughness = mix(specular_roughness, 1.0, subsurface_weight);
    #endif

    #ifdef GLTF_TRANSMISSION_SURFACE_TO_COAT
        coat_color *= mix(vec3f(1.0), base_color, transmission_weight);
    #endif
#endif

#ifdef USE_GLTF_STYLE_ANISOTROPY
    let baseAlpha: f32 = specular_roughness * specular_roughness;
    let roughnessT: f32 = mix(baseAlpha, 1.0f, specular_roughness_anisotropy * specular_roughness_anisotropy);
    let roughnessB: f32 = baseAlpha;
    specular_roughness_anisotropy = 1.0f - roughnessB / max(roughnessT, 0.00001f);
    specular_roughness = sqrt(roughnessT / sqrt(2.0f / (1.0f + (1.0f - specular_roughness_anisotropy) * (1.0f - specular_roughness_anisotropy))));

    let coatAlpha: f32 = coat_roughness * coat_roughness;

    // From glTF to OpenPBR
    let coatRoughnessT: f32 = mix(coatAlpha, 1.0f, coat_roughness_anisotropy * coat_roughness_anisotropy);
    let coatRoughnessB: f32 = coatAlpha;
    coat_roughness_anisotropy = 1.0f - coatRoughnessB / max(coatRoughnessT, 0.00001f);
    coat_roughness = sqrt(coatRoughnessT / sqrt(2.0f / (1.0f + (1.0f - coat_roughness_anisotropy) * (1.0f - coat_roughness_anisotropy))));
#endif