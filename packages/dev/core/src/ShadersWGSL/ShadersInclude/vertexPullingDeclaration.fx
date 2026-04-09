// Vertex pulling declaration — storage buffers, uniforms, and helper functions.
// Only active when USE_VERTEX_PULLING is defined (WebGPU only).
#ifdef USE_VERTEX_PULLING

// === Index buffer as storage ===
#ifdef VERTEX_PULLING_USE_INDEX_BUFFER
var<storage, read> indices : array<u32>;
#endif

// === Vertex attribute storage buffers and metadata uniforms ===
var<storage, read> position : array<f32>;
uniform vp_position_info : vec4f;

#ifdef NORMAL
var<storage, read> normal : array<f32>;
uniform vp_normal_info : vec4f;
#endif

#ifdef TANGENT
var<storage, read> tangent : array<f32>;
uniform vp_tangent_info : vec4f;
#endif

#ifdef UV1
var<storage, read> uv : array<f32>;
uniform vp_uv_info : vec4f;
#define VP_UV1_SUPPORTED
#endif

#ifdef UV2
var<storage, read> uv2 : array<f32>;
uniform vp_uv2_info : vec4f;
#define VP_UV2_SUPPORTED
#endif

#ifdef UV3
var<storage, read> uv3 : array<f32>;
uniform vp_uv3_info : vec4f;
#define VP_UV3_SUPPORTED
#endif

#ifdef UV4
var<storage, read> uv4 : array<f32>;
uniform vp_uv4_info : vec4f;
#define VP_UV4_SUPPORTED
#endif

#ifdef UV5
var<storage, read> uv5 : array<f32>;
uniform vp_uv5_info : vec4f;
#define VP_UV5_SUPPORTED
#endif

#ifdef UV6
var<storage, read> uv6 : array<f32>;
uniform vp_uv6_info : vec4f;
#define VP_UV6_SUPPORTED
#endif

#ifdef VERTEXCOLOR
var<storage, read> color : array<f32>;
uniform vp_color_info : vec4f;
#endif

// === Bone attribute storage buffers ===
#if NUM_BONE_INFLUENCERS > 0
var<storage, read> matricesIndices : array<u32>;
var<storage, read> matricesWeights : array<f32>;
uniform vp_matricesIndices_info : vec4f;
uniform vp_matricesWeights_info : vec4f;
#if NUM_BONE_INFLUENCERS > 4
var<storage, read> matricesIndicesExtra : array<u32>;
var<storage, read> matricesWeightsExtra : array<f32>;
uniform vp_matricesIndicesExtra_info : vec4f;
uniform vp_matricesWeightsExtra_info : vec4f;
#endif
#endif

// === Shared helpers ===

// Convert a raw word to f32 based on data type
fn vp_convertToFloat(word : u32, byteInWord : u32, dataType : u32, normalized : bool) -> f32 {
    switch (dataType) {
    case 5120u: { // BYTE
        let shift = byteInWord * 8u;
        let value = (word >> shift) & 0xFFu;
        let signedValue = f32(i32(value << 24u) >> 24u);
        if (normalized) { return signedValue / 127.0; }
        return signedValue;
    }
    case 5121u: { // UNSIGNED_BYTE
        let shift = byteInWord * 8u;
        let value = (word >> shift) & 0xFFu;
        if (normalized) { return f32(value) / 255.0; }
        return f32(value);
    }
    case 5122u: { // SHORT
        let shift = (byteInWord & 0xFFFFFFFEu) * 8u;
        let value = (word >> shift) & 0xFFFFu;
        let signedValue = f32(i32(value << 16u) >> 16u);
        if (normalized) { return signedValue / 32767.0; }
        return signedValue;
    }
    case 5123u: { // UNSIGNED_SHORT
        let shift = (byteInWord & 0xFFFFFFFEu) * 8u;
        let value = (word >> shift) & 0xFFFFu;
        if (normalized) { return f32(value) / 65535.0; }
        return f32(value);
    }
    case 5126u: { // FLOAT
        return bitcast<f32>(word);
    }
    default: { return 0.0; }
    }
}

// Component byte size for a given data type
fn vp_componentSize(dataType : u32) -> u32 {
    return select(select(2u, 1u, dataType == 5120u || dataType == 5121u), 4u, dataType == 5126u);
}

// Resolve vertex index through index buffer if present
fn vp_readVertexIndex(index : u32) -> u32 {
#ifndef VERTEX_PULLING_USE_INDEX_BUFFER
    return index;
#else
    #ifdef VERTEX_PULLING_INDEX_BUFFER_32BITS
    return indices[index];
    #else
    let u32_index = index / 2u;
    let bit_offset = (index & 1u) * 16u;
    return (indices[u32_index] >> bit_offset) & 0xFFFFu;
    #endif
#endif
}

// === Per-buffer value readers (float-backed) ===

fn vp_readPositionValue(byteOffset : u32, dataType : u32, normalized : bool) -> f32 {
    return vp_convertToFloat(bitcast<u32>(position[byteOffset / 4u]), byteOffset % 4u, dataType, normalized);
}

fn vp_readPosition(info : vec4f, vertexIndex : u32) -> vec3f {
    let baseOffset = u32(info.x);
    let stride = u32(info.y);
    let dataType = u32(info.z);
    let normalized = info.w != 0.0;
    let offset = baseOffset + vertexIndex * stride;
    let cs = vp_componentSize(dataType);
    return vec3f(
        vp_readPositionValue(offset, dataType, normalized),
        vp_readPositionValue(offset + cs, dataType, normalized),
        vp_readPositionValue(offset + cs * 2u, dataType, normalized)
    );
}

#ifdef NORMAL
fn vp_readNormalValue(byteOffset : u32, dataType : u32, normalized : bool) -> f32 {
    return vp_convertToFloat(bitcast<u32>(normal[byteOffset / 4u]), byteOffset % 4u, dataType, normalized);
}

fn vp_readNormal(info : vec4f, vertexIndex : u32) -> vec3f {
    let baseOffset = u32(info.x);
    let stride = u32(info.y);
    let dataType = u32(info.z);
    let normalized = info.w != 0.0;
    let offset = baseOffset + vertexIndex * stride;
    let cs = vp_componentSize(dataType);
    return vec3f(
        vp_readNormalValue(offset, dataType, normalized),
        vp_readNormalValue(offset + cs, dataType, normalized),
        vp_readNormalValue(offset + cs * 2u, dataType, normalized)
    );
}
#endif

#ifdef TANGENT
fn vp_readTangentValue(byteOffset : u32, dataType : u32, normalized : bool) -> f32 {
    return vp_convertToFloat(bitcast<u32>(tangent[byteOffset / 4u]), byteOffset % 4u, dataType, normalized);
}

fn vp_readTangent(info : vec4f, vertexIndex : u32) -> vec4f {
    let baseOffset = u32(info.x);
    let stride = u32(info.y);
    let dataType = u32(info.z);
    let normalized = info.w != 0.0;
    let offset = baseOffset + vertexIndex * stride;
    let cs = vp_componentSize(dataType);
    return vec4f(
        vp_readTangentValue(offset, dataType, normalized),
        vp_readTangentValue(offset + cs, dataType, normalized),
        vp_readTangentValue(offset + cs * 2u, dataType, normalized),
        vp_readTangentValue(offset + cs * 3u, dataType, normalized)
    );
}
#endif

#ifdef UV1
fn vp_readUVValue(byteOffset : u32, dataType : u32, normalized : bool) -> f32 {
    return vp_convertToFloat(bitcast<u32>(uv[byteOffset / 4u]), byteOffset % 4u, dataType, normalized);
}

fn vp_readUV(info : vec4f, vertexIndex : u32) -> vec2f {
    let baseOffset = u32(info.x);
    let stride = u32(info.y);
    let dataType = u32(info.z);
    let normalized = info.w != 0.0;
    let offset = baseOffset + vertexIndex * stride;
    let cs = vp_componentSize(dataType);
    return vec2f(
        vp_readUVValue(offset, dataType, normalized),
        vp_readUVValue(offset + cs, dataType, normalized)
    );
}
#endif

#ifdef UV2
fn vp_readUV2Value(byteOffset : u32, dataType : u32, normalized : bool) -> f32 {
    return vp_convertToFloat(bitcast<u32>(uv2[byteOffset / 4u]), byteOffset % 4u, dataType, normalized);
}

fn vp_readUV2(info : vec4f, vertexIndex : u32) -> vec2f {
    let baseOffset = u32(info.x);
    let stride = u32(info.y);
    let dataType = u32(info.z);
    let normalized = info.w != 0.0;
    let offset = baseOffset + vertexIndex * stride;
    let cs = vp_componentSize(dataType);
    return vec2f(
        vp_readUV2Value(offset, dataType, normalized),
        vp_readUV2Value(offset + cs, dataType, normalized)
    );
}
#endif

#ifdef UV3
fn vp_readUV3Value(byteOffset : u32, dataType : u32, normalized : bool) -> f32 {
    return vp_convertToFloat(bitcast<u32>(uv3[byteOffset / 4u]), byteOffset % 4u, dataType, normalized);
}

fn vp_readUV3(info : vec4f, vertexIndex : u32) -> vec2f {
    let baseOffset = u32(info.x);
    let stride = u32(info.y);
    let dataType = u32(info.z);
    let normalized = info.w != 0.0;
    let offset = baseOffset + vertexIndex * stride;
    let cs = vp_componentSize(dataType);
    return vec2f(
        vp_readUV3Value(offset, dataType, normalized),
        vp_readUV3Value(offset + cs, dataType, normalized)
    );
}
#endif

#ifdef UV4
fn vp_readUV4Value(byteOffset : u32, dataType : u32, normalized : bool) -> f32 {
    return vp_convertToFloat(bitcast<u32>(uv4[byteOffset / 4u]), byteOffset % 4u, dataType, normalized);
}

fn vp_readUV4(info : vec4f, vertexIndex : u32) -> vec2f {
    let baseOffset = u32(info.x);
    let stride = u32(info.y);
    let dataType = u32(info.z);
    let normalized = info.w != 0.0;
    let offset = baseOffset + vertexIndex * stride;
    let cs = vp_componentSize(dataType);
    return vec2f(
        vp_readUV4Value(offset, dataType, normalized),
        vp_readUV4Value(offset + cs, dataType, normalized)
    );
}
#endif

#ifdef UV5
fn vp_readUV5Value(byteOffset : u32, dataType : u32, normalized : bool) -> f32 {
    return vp_convertToFloat(bitcast<u32>(uv5[byteOffset / 4u]), byteOffset % 4u, dataType, normalized);
}

fn vp_readUV5(info : vec4f, vertexIndex : u32) -> vec2f {
    let baseOffset = u32(info.x);
    let stride = u32(info.y);
    let dataType = u32(info.z);
    let normalized = info.w != 0.0;
    let offset = baseOffset + vertexIndex * stride;
    let cs = vp_componentSize(dataType);
    return vec2f(
        vp_readUV5Value(offset, dataType, normalized),
        vp_readUV5Value(offset + cs, dataType, normalized)
    );
}
#endif

#ifdef UV6
fn vp_readUV6Value(byteOffset : u32, dataType : u32, normalized : bool) -> f32 {
    return vp_convertToFloat(bitcast<u32>(uv6[byteOffset / 4u]), byteOffset % 4u, dataType, normalized);
}

fn vp_readUV6(info : vec4f, vertexIndex : u32) -> vec2f {
    let baseOffset = u32(info.x);
    let stride = u32(info.y);
    let dataType = u32(info.z);
    let normalized = info.w != 0.0;
    let offset = baseOffset + vertexIndex * stride;
    let cs = vp_componentSize(dataType);
    return vec2f(
        vp_readUV6Value(offset, dataType, normalized),
        vp_readUV6Value(offset + cs, dataType, normalized)
    );
}
#endif

#ifdef VERTEXCOLOR
fn vp_readColorValue(byteOffset : u32, dataType : u32, normalized : bool) -> f32 {
    return vp_convertToFloat(bitcast<u32>(color[byteOffset / 4u]), byteOffset % 4u, dataType, normalized);
}

fn vp_readColor(info : vec4f, vertexIndex : u32) -> vec4f {
    let baseOffset = u32(info.x);
    let stride = u32(info.y);
    let dataType = u32(info.z);
    let normalized = info.w != 0.0;
    let offset = baseOffset + vertexIndex * stride;
    let cs = vp_componentSize(dataType);
    return vec4f(
        vp_readColorValue(offset, dataType, normalized),
        vp_readColorValue(offset + cs, dataType, normalized),
        vp_readColorValue(offset + cs * 2u, dataType, normalized),
        vp_readColorValue(offset + cs * 3u, dataType, normalized)
    );
}
#endif

// === Per-buffer value readers (bones — uint/float backed) ===

#if NUM_BONE_INFLUENCERS > 0
fn vp_readMatrixIndexValue(byteOffset : u32, dataType : u32, normalized : bool) -> f32 {
    return vp_convertToFloat(matricesIndices[byteOffset / 4u], byteOffset % 4u, dataType, normalized);
}

fn vp_readBoneIndices(info : vec4f, vertexIndex : u32) -> vec4f {
    let baseOffset = u32(info.x);
    let stride = u32(info.y);
    let dataType = u32(info.z);
    let normalized = info.w != 0.0;
    let offset = baseOffset + vertexIndex * stride;
    let cs = vp_componentSize(dataType);
    return vec4f(
        vp_readMatrixIndexValue(offset, dataType, normalized),
        vp_readMatrixIndexValue(offset + cs, dataType, normalized),
        vp_readMatrixIndexValue(offset + cs * 2u, dataType, normalized),
        vp_readMatrixIndexValue(offset + cs * 3u, dataType, normalized)
    );
}

fn vp_readMatrixWeightValue(byteOffset : u32, dataType : u32, normalized : bool) -> f32 {
    return vp_convertToFloat(bitcast<u32>(matricesWeights[byteOffset / 4u]), byteOffset % 4u, dataType, normalized);
}

fn vp_readBoneWeights(info : vec4f, vertexIndex : u32) -> vec4f {
    let baseOffset = u32(info.x);
    let stride = u32(info.y);
    let dataType = u32(info.z);
    let normalized = info.w != 0.0;
    let offset = baseOffset + vertexIndex * stride;
    let cs = vp_componentSize(dataType);
    return vec4f(
        vp_readMatrixWeightValue(offset, dataType, normalized),
        vp_readMatrixWeightValue(offset + cs, dataType, normalized),
        vp_readMatrixWeightValue(offset + cs * 2u, dataType, normalized),
        vp_readMatrixWeightValue(offset + cs * 3u, dataType, normalized)
    );
}

#if NUM_BONE_INFLUENCERS > 4
fn vp_readMatrixIndexExtraValue(byteOffset : u32, dataType : u32, normalized : bool) -> f32 {
    return vp_convertToFloat(matricesIndicesExtra[byteOffset / 4u], byteOffset % 4u, dataType, normalized);
}

fn vp_readBoneIndicesExtra(info : vec4f, vertexIndex : u32) -> vec4f {
    let baseOffset = u32(info.x);
    let stride = u32(info.y);
    let dataType = u32(info.z);
    let normalized = info.w != 0.0;
    let offset = baseOffset + vertexIndex * stride;
    let cs = vp_componentSize(dataType);
    return vec4f(
        vp_readMatrixIndexExtraValue(offset, dataType, normalized),
        vp_readMatrixIndexExtraValue(offset + cs, dataType, normalized),
        vp_readMatrixIndexExtraValue(offset + cs * 2u, dataType, normalized),
        vp_readMatrixIndexExtraValue(offset + cs * 3u, dataType, normalized)
    );
}

fn vp_readMatrixWeightExtraValue(byteOffset : u32, dataType : u32, normalized : bool) -> f32 {
    return vp_convertToFloat(bitcast<u32>(matricesWeightsExtra[byteOffset / 4u]), byteOffset % 4u, dataType, normalized);
}

fn vp_readBoneWeightsExtra(info : vec4f, vertexIndex : u32) -> vec4f {
    let baseOffset = u32(info.x);
    let stride = u32(info.y);
    let dataType = u32(info.z);
    let normalized = info.w != 0.0;
    let offset = baseOffset + vertexIndex * stride;
    let cs = vp_componentSize(dataType);
    return vec4f(
        vp_readMatrixWeightExtraValue(offset, dataType, normalized),
        vp_readMatrixWeightExtraValue(offset + cs, dataType, normalized),
        vp_readMatrixWeightExtraValue(offset + cs * 2u, dataType, normalized),
        vp_readMatrixWeightExtraValue(offset + cs * 3u, dataType, normalized)
    );
}
#endif
#endif

#endif
