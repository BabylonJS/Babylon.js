// This code reads uniforms and samples textures to fill up the base and specular
// layer properties for OpenPBR

// Base Layer Properties
// We don't include base_weight in our initial variables because it is multiplied
// into the base_color in this code snippet.
var base_color = vec3f(0.8);
var base_metalness: f32 = 0.0;
var base_diffuse_roughness: f32 = 0.0;

// Specular Layer Properties
var specular_weight: f32 = 1.0;
var specular_roughness: f32 = 0.3;
var specular_color: vec3f = vec3f(1.0);
var specular_roughness_anisotropy: f32 = 0.0;
var specular_ior: f32 = 1.5;
var alpha: f32 = 1.0;

// Sample Base Layer properties from textures
#ifdef BASE_WEIGHT
    var baseWeightFromTexture: vec4f = textureSample(baseWeightSampler, baseWeightSamplerSampler, fragmentInputs.vBaseWeightUV + uvOffset);
#endif

#ifdef BASE_COLOR
    var baseColorFromTexture: vec4f = textureSample(baseColorSampler, baseColorSamplerSampler, fragmentInputs.vBaseColorUV + uvOffset);
#endif

#ifdef METALLIC_ROUGHNESS
    var metallicRoughnessFromTexture: vec4f = textureSample(baseMetalRoughSampler, baseMetalRoughSamplerSampler, fragmentInputs.vBaseMetalRoughUV + uvOffset);
#endif

#ifdef BASE_DIFFUSE_ROUGHNESS
    var baseDiffuseRoughnessFromTexture: f32 = textureSample(baseDiffuseRoughnessSampler, baseDiffuseRoughnessSamplerSampler, fragmentInputs.vBaseDiffuseRoughnessUV + uvOffset).r;
#endif

#ifdef GEOMETRY_OPACITY
    var opacityFromTexture: vec4f = textureSample(opacitySampler, opacitySamplerSampler, fragmentInputs.vOpacityUV + uvOffset);
#endif

#ifdef DECAL
    var decalFromTexture: vec4f = textureSample(decalSampler, decalSamplerSampler, fragmentInputs.vDecalUV + uvOffset);
#endif

#ifdef SPECULAR_COLOR
    var specularColorFromTexture: vec4f = textureSample(specularColorSampler, specularColorSamplerSampler, fragmentInputs.vSpecularColorUV + uvOffset);
    #ifdef SPECULAR_COLOR_GAMMA
        specularColorFromTexture = toLinearSpace(specularColorFromTexture.rgb);
    #endif
#endif

#ifdef SPECULAR_WEIGHT
    var specularWeightFromTexture: vec4f = textureSample(specularWeightSampler, specularWeightSamplerSampler, fragmentInputs.vSpecularWeightUV + uvOffset);
#endif

// Initalize base layer properties from uniforms
base_color = uniforms.vBaseColor.rgb;
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
    base_color *= uniforms.vColor.rgb;
#endif
#if defined(VERTEXALPHA) || defined(INSTANCESCOLOR) && defined(INSTANCES)
    alpha *= uniforms.vColor.a;
#endif
base_color *= vec3(uniforms.vBaseWeight);
alpha = uniforms.vBaseColor.a;
base_metalness = uniforms.vReflectanceInfo.x;
base_diffuse_roughness = uniforms.vBaseDiffuseRoughness;
specular_roughness = uniforms.vReflectanceInfo.y;
specular_color = uniforms.vSpecularColor.rgb;
specular_weight = uniforms.vReflectanceInfo.a;
specular_ior = uniforms.vReflectanceInfo.z;

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

    base_color *= uniforms.vBaseColorInfos.y;
#endif

#ifdef BASE_WEIGHT
    base_color *= baseWeightFromTexture.r;
#endif

// _____________________________ Alpha Information _______________________________
#ifdef GEOMETRY_OPACITY
    alpha *= opacityFromTexture.a;
    alpha *= uniforms.vGeometryOpacityInfos.y;
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

#ifdef METALLIC_ROUGHNESS
    base_metalness *= metallicRoughnessFromTexture.b;
    specular_roughness *= metallicRoughnessFromTexture.g;
#endif

#ifdef BASE_DIFFUSE_ROUGHNESS
    base_diffuse_roughness *= baseDiffuseRoughnessFromTexture * uniforms.vBaseDiffuseRoughnessInfos.y;
#endif

#ifdef SPECULAR_COLOR
    specular_color *= specularColorFromTexture.rgb;
#endif

#ifdef SPECULAR_WEIGHT
    // If loaded from a glTF, the specular_weight is stored in the alpha channel.
    // Otherwise, it's expected to just be a greyscale texture.
    #ifdef SPECULAR_WEIGHT_USE_ALPHA_ONLY
        specular_weight *= specularWeightFromTexture.a;
    #else
        specular_weight *= specularWeightFromTexture.r;
    #endif
#endif

#ifdef DETAIL
    let detailRoughness: f32 = mix(0.5f, detailColor.b, vDetailInfos.w);
    let loLerp: f32 = mix(0.f, specular_roughness, detailRoughness * 2.f);
    let hiLerp: f32 = mix(specular_roughness, 1.f, (detailRoughness - 0.5f) * 2.f);
    specular_roughness = mix(loLerp, hiLerp, step(detailRoughness, 0.5f));
#endif