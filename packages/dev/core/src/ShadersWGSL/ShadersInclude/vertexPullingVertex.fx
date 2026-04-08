// Vertex pulling vertex — overrides positionUpdated, normalUpdated, etc.
// with values read from storage buffers. Also prepares bone data locals
// for parameterized bonesVertex/bakedVertexAnimation includes.
// Only active when USE_VERTEX_PULLING is defined (WebGPU only).
#ifdef USE_VERTEX_PULLING

let vpVertexIndex: u32 = vp_readVertexIndex(vertexInputs.vertexIndex);

positionUpdated = vp_readPosition(uniforms.vp_position_info, vpVertexIndex);

#ifdef NORMAL
normalUpdated = vp_readNormal(uniforms.vp_normal_info, vpVertexIndex);
#endif

#ifdef TANGENT
tangentUpdated = vp_readTangent(uniforms.vp_tangent_info, vpVertexIndex);
#endif

#ifdef UV1
uvUpdated = vp_readUV(uniforms.vp_uv_info, vpVertexIndex);
#endif

#ifdef UV2
uv2Updated = vp_readUV2(uniforms.vp_uv2_info, vpVertexIndex);
#endif

#ifdef UV3
var uv3Updated: vec2f = vp_readUV3(uniforms.vp_uv3_info, vpVertexIndex);
#endif

#ifdef UV4
var uv4Updated: vec2f = vp_readUV4(uniforms.vp_uv4_info, vpVertexIndex);
#endif

#ifdef UV5
var uv5Updated: vec2f = vp_readUV5(uniforms.vp_uv5_info, vpVertexIndex);
#endif

#ifdef UV6
var uv6Updated: vec2f = vp_readUV6(uniforms.vp_uv6_info, vpVertexIndex);
#endif

#ifdef VERTEXCOLOR
colorUpdated = vp_readColor(uniforms.vp_color_info, vpVertexIndex);
#endif

// Save base values before morph targets modify them
#ifdef MORPHTARGETS
let vp_basePosition: vec3f = positionUpdated;
#ifdef NORMAL
let vp_baseNormal: vec3f = normalUpdated;
#endif
#ifdef TANGENT
let vp_baseTangent: vec4f = tangentUpdated;
#endif
#ifdef UV1
let vp_baseUV: vec2f = uvUpdated;
#endif
#ifdef UV2
let vp_baseUV2: vec2f = uv2Updated;
#endif
#ifdef VERTEXCOLOR
let vp_baseColor: vec4f = colorUpdated;
#endif
#endif

// Bone data pulled from storage buffers, for use by bonesVertex/bakedVertexAnimation
#if NUM_BONE_INFLUENCERS > 0
var vp_matricesIndices: vec4f = vp_readBoneIndices(uniforms.vp_matricesIndices_info, vpVertexIndex);
var vp_matricesWeights: vec4f = vp_readBoneWeights(uniforms.vp_matricesWeights_info, vpVertexIndex);
#if NUM_BONE_INFLUENCERS > 4
var vp_matricesIndicesExtra: vec4f = vp_readBoneIndicesExtra(uniforms.vp_matricesIndicesExtra_info, vpVertexIndex);
var vp_matricesWeightsExtra: vec4f = vp_readBoneWeightsExtra(uniforms.vp_matricesWeightsExtra_info, vpVertexIndex);
#endif
#endif

#endif
