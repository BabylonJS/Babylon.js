// This code reads uniforms and samples textures to fill up the base and specular
// layer properties for OpenPBR

// Base Layer Properties
// We don't include base_weight in our initial variables because it is multiplied
// into the base_color in this code snippet.
vec3 base_color = vec3(0.8);
float base_metalness = 0.0;
float base_diffuse_roughness = 0.0;

// Specular Layer Properties
float specular_weight = 1.0;
float specular_roughness = 0.3;
vec3 specular_color = vec3(1.0);
float specular_roughness_anisotropy = 0.0;
float specular_ior = 1.5;
float alpha = 1.0;
vec2 geometry_tangent = vec2(1.0, 0.0);

// Sample Base Layer properties from textures
#ifdef BASE_WEIGHT
    vec4 baseWeightFromTexture = texture2D(baseWeightSampler, vBaseWeightUV + uvOffset);
#endif

#ifdef BASE_COLOR
    vec4 baseColorFromTexture = texture2D(baseColorSampler, vBaseColorUV + uvOffset);
#endif

#ifdef BASE_METALNESS
    vec4 metallicFromTexture = texture2D(baseMetalnessSampler, vBaseMetalnessUV + uvOffset);
#endif

#if defined(ROUGHNESSSTOREINMETALMAPGREEN) && defined(BASE_METALNESS)
    float roughnessFromTexture = metallicFromTexture.g;
#elif defined(SPECULAR_ROUGHNESS)
    float roughnessFromTexture = texture2D(specularRoughnessSampler, vSpecularRoughnessUV + uvOffset).r;
#endif

#ifdef GEOMETRY_TANGENT
    vec3 geometryTangentFromTexture = texture2D(geometryTangentSampler, vGeometryTangentUV + uvOffset).rgb;
#endif

#ifdef SPECULAR_ROUGHNESS_ANISOTROPY
    float anisotropyFromTexture = texture2D(specularRoughnessAnisotropySampler, vSpecularRoughnessAnisotropyUV + uvOffset).r * vSpecularRoughnessAnisotropyInfos.y;
#endif

#ifdef BASE_DIFFUSE_ROUGHNESS
    float baseDiffuseRoughnessFromTexture = texture2D(baseDiffuseRoughnessSampler, vBaseDiffuseRoughnessUV + uvOffset).r;
#endif

#ifdef GEOMETRY_OPACITY
    vec4 opacityFromTexture = texture2D(opacitySampler, vOpacityUV + uvOffset);
#endif

#ifdef DECAL
    vec4 decalFromTexture = texture2D(decalSampler, vDecalUV + uvOffset);
#endif

#ifdef SPECULAR_COLOR
    vec4 specularColorFromTexture = texture2D(specularColorSampler, vSpecularColorUV + uvOffset);
#endif
// If the specular weight is coming from the specular color texture's alpha channel, don't sample the
// weight sampler to avoid redundant texture fetches.
#ifdef SPECULAR_WEIGHT
    #ifdef SPECULAR_WEIGHT_IN_ALPHA
        // If loaded from a glTF, the specular_weight is stored in the alpha channel.
        // Otherwise, it's expected to just be a greyscale texture.
        float specularWeightFromTexture = texture2D(specularWeightSampler, vSpecularWeightUV + uvOffset).a;
    #else
        float specularWeightFromTexture = texture2D(specularWeightSampler, vSpecularWeightUV + uvOffset).r;
    #endif
#endif

// Initalize base layer properties from uniforms
base_color = vBaseColor.rgb;
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
    base_color *= vColor.rgb;
#endif
#if defined(VERTEXALPHA) || defined(INSTANCESCOLOR) && defined(INSTANCES)
    alpha *= vColor.a;
#endif
base_color *= vec3(vBaseWeight);
alpha = vBaseColor.a;
base_metalness = vReflectanceInfo.x;
base_diffuse_roughness = vBaseDiffuseRoughness;
specular_roughness = vReflectanceInfo.y;
specular_color = vSpecularColor.rgb;
specular_weight = vReflectanceInfo.a;
specular_ior = vReflectanceInfo.z;
specular_roughness_anisotropy = vSpecularAnisotropy.b;
geometry_tangent = vSpecularAnisotropy.rg;

// Apply texture values to base layer properties

#ifdef BASE_COLOR
    #if defined(ALPHAFROMALBEDO) || defined(ALPHATEST)
        alpha *= baseColorFromTexture.a;
    #endif

    #ifdef BASE_COLOR_GAMMA
        base_color *= toLinearSpace(baseColorFromTexture.rgb);
    #else
        base_color *= baseColorFromTexture.rgb;
    #endif

    base_color *= vBaseColorInfos.y;
#endif

#ifdef BASE_WEIGHT
    base_color *= baseWeightFromTexture.r;
#endif

// _____________________________ Alpha Information _______________________________
#ifdef GEOMETRY_OPACITY
    alpha *= opacityFromTexture.a;
    alpha *= vGeometryOpacityInfos.y;
#endif

#ifdef ALPHATEST
    #if DEBUGMODE != 88
        if (alpha < ALPHATESTVALUE)
            discard;
    #endif

    #ifndef ALPHABLEND
        // Prevent to blend with the canvas.
        alpha = 1.0;
    #endif
#endif

#ifdef BASE_METALNESS
    #ifdef METALLNESSSTOREINMETALMAPBLUE
        base_metalness *= metallicFromTexture.b;
    #else
        base_metalness *= metallicFromTexture.r;
    #endif
#endif

#ifdef BASE_DIFFUSE_ROUGHNESS
    base_diffuse_roughness *= baseDiffuseRoughnessFromTexture * vBaseDiffuseRoughnessInfos.y;
#endif

#ifdef SPECULAR_COLOR
    #ifdef SPECULAR_COLOR_GAMMA
        specular_color *= toLinearSpace(specularColorFromTexture.rgb);
    #else
        specular_color *= specularColorFromTexture.rgb;
    #endif
#endif

#ifdef SPECULAR_WEIGHT_FROM_SPECULAR_COLOR_TEXTURE
    specular_weight *= specularColorFromTexture.a;
#elif defined(SPECULAR_WEIGHT)
    specular_weight *= specularWeightFromTexture;
#endif

#if defined(SPECULAR_ROUGHNESS) || (defined(ROUGHNESSSTOREINMETALMAPGREEN) && defined(BASE_METALNESS))
    specular_roughness *= roughnessFromTexture;
#endif

#ifdef GEOMETRY_TANGENT
{
    // TODO - optimize this. Currently, we're computing the tangent angle from both the texture and the uniform,
    // then combining them. If we ignored the uniform when the texture was used, we wouldn't have to do any of this.
    // Or, at least, we could pass the uniform in as an angle to avoid one of the atan's.
    float tangent_angle_texture = atan(geometryTangentFromTexture.y, geometryTangentFromTexture.x);
    float tangent_angle_uniform = atan(geometry_tangent.y, geometry_tangent.x);
    float tangent_angle = tangent_angle_texture + tangent_angle_uniform;
    geometry_tangent = vec2(cos(tangent_angle), sin(tangent_angle));
}
#endif

#ifdef SPECULAR_ROUGHNESS_ANISOTROPY_FROM_TANGENT_TEXTURE
        specular_roughness_anisotropy *= geometryTangentFromTexture.b;
#elif defined(SPECULAR_ROUGHNESS_ANISOTROPY)
    specular_roughness_anisotropy *= anisotropyFromTexture;
#endif

#ifdef DETAIL
    float detailRoughness = mix(0.5, detailColor.b, vDetailInfos.w);
    float loLerp = mix(0., specular_roughness, detailRoughness * 2.);
    float hiLerp = mix(specular_roughness, 1., (detailRoughness - 0.5) * 2.);
    specular_roughness = mix(loLerp, hiLerp, step(detailRoughness, 0.5));
#endif