#include <bakedVertexAnimationDeclaration>
#include <bonesDeclaration>(attribute matricesIndices : vec4f;,,attribute matricesWeights : vec4f;,,attribute matricesIndicesExtra : vec4f;,,attribute matricesWeightsExtra : vec4f;,)
#include <helperFunctions>
#include <instancesDeclaration>

#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]

// This shader uses vertex pulling to determine the
// provoked vertex and calculate the normal. Then, based on
// the direction of the normal, it swizzles the position to
// maximize the rasterized area.
#ifdef VERTEX_PULLING_USE_INDEX_BUFFER
var<storage, read> indices : array<u32>;
#endif
var<storage, read> position : array<f32>;
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

    // uniform world : mat4x4f;
    uniform invWorldScale : mat4x4f;

    varying vNormalizedPosition : vec3f;
    flat varying f_swizzle : i32;

    uniform vp_position_info : vec4f; // (offset, stride, type, normalized)

    fn convertToFloat(word : u32, byteInWord : u32, dataType : u32,
                      normalized : bool) -> f32 {
      switch (dataType) {
      case 5120u: { // BYTE
        let shift = byteInWord * 8u;
        let value = (word >> shift) & 0xFFu;
        let signedValue = f32(i32(value << 24u) >> 24u);
        if (normalized) {
          return signedValue / 127.0;
        }
        return signedValue;
      }
      case 5121u: { // UNSIGNED_BYTE
        let shift = byteInWord * 8u;
        let value = (word >> shift) & 0xFFu;
        if (normalized) {
          return f32(value) / 255.0;
        }
        return f32(value);
      }
      case 5122u: {                                  // SHORT
        let shift = (byteInWord & 0xFFFFFFFEu) * 8u; // Align to 2-byte boundary
        let value = (word >> shift) & 0xFFFFu;
        let signedValue = f32(i32(value << 16u) >> 16u);
        if (normalized) {
          return signedValue / 32767.0;
        }
        return signedValue;
      }
      case 5123u: {                                  // UNSIGNED_SHORT
        let shift = (byteInWord & 0xFFFFFFFEu) * 8u; // Align to 2-byte boundary
        let value = (word >> shift) & 0xFFFFu;
        if (normalized) {
          return f32(value) / 65535.0;
        }
        return f32(value);
      }
      case 5126u: { // FLOAT
        return bitcast<f32>(word);
      }
      default: {
        return 0.0;
      }
      }
    }

fn readPositionValue(byteOffset : u32, dataType : u32, normalized : bool)
    -> f32 {
  let wordOffset = byteOffset / 4u;
  let byteInWord = byteOffset % 4u;
  let word : u32 = bitcast<u32>(position[wordOffset]);

    return convertToFloat(word, byteInWord, dataType, normalized);
}

// Helper function to read a vec3 attribute
fn readVertexPosition(info : vec4f, vertexIndex : u32) -> vec3f {
  let baseOffset = u32(info.x);
  let stride = u32(info.y);
  let dataType = u32(info.z);
    let normalized = info.w != 0.0;

    let offset = baseOffset + vertexIndex * stride;
    
    // Determine component size based on type
    let componentSize = select(select(2u, 1u, dataType == 5120u || dataType == 5121u), 4u, dataType == 5126u);

    return vec3f(
        readPositionValue(offset, dataType, normalized),
        readPositionValue(offset + componentSize, dataType, normalized),
        readPositionValue(offset + componentSize * 2u, dataType, normalized));
}

#if NUM_BONE_INFLUENCERS > 0

fn readMatrixIndexValue(byteOffset : u32, dataType : u32, normalized : bool)
    -> f32 {
  let wordOffset = byteOffset / 4u;
  let byteInWord = byteOffset % 4u;
  let word : u32 = matricesIndices[wordOffset];

  return convertToFloat(word, byteInWord, dataType, normalized);
}

fn readMatrixIndices(info : vec4f, vertexIndex : u32) -> vec4f {
  let baseOffset = u32(info.x);
  let stride = u32(info.y);
  let dataType = u32(info.z);
  let normalized = info.w != 0.0;

  let offset = baseOffset + vertexIndex * stride;

  // Determine component size based on type
  let componentSize = select(select(2u, 1u, dataType == 5120u || dataType == 5121u), 4u, dataType == 5126u);

  return vec4f(
      readMatrixIndexValue(offset, dataType, normalized),
      readMatrixIndexValue(offset + componentSize, dataType, normalized),
      readMatrixIndexValue(offset + componentSize * 2u, dataType, normalized),
      readMatrixIndexValue(offset + componentSize * 3u, dataType, normalized));
}

fn readMatrixWeightValue(byteOffset : u32, dataType : u32, normalized : bool)
    -> f32 {
  let wordOffset = byteOffset / 4u;
  let byteInWord = byteOffset % 4u;
  let word : u32 = bitcast<u32>(matricesWeights[wordOffset]);

  return convertToFloat(word, byteInWord, dataType, normalized);
}

fn readMatrixWeights(info : vec4f, vertexIndex : u32) -> vec4f {
  let baseOffset = u32(info.x);
  let stride = u32(info.y);
  let dataType = u32(info.z);
  let normalized = info.w != 0.0;

  let offset = baseOffset + vertexIndex * stride;

  // Determine component size based on type
  let componentSize = select(select(2u, 1u, dataType == 5120u || dataType == 5121u), 4u, dataType == 5126u);

  return vec4f(
      readMatrixWeightValue(offset, dataType, normalized),
      readMatrixWeightValue(offset + componentSize, dataType, normalized),
      readMatrixWeightValue(offset + componentSize * 2u, dataType, normalized),
      readMatrixWeightValue(offset + componentSize * 3u, dataType, normalized));
}

#if NUM_BONE_INFLUENCERS > 4

fn readMatrixIndexExtraValue(byteOffset : u32, dataType : u32,
                             normalized : bool) -> f32 {
  let wordOffset = byteOffset / 4u;
  let byteInWord = byteOffset % 4u;
  let word : u32 = matricesIndicesExtra[wordOffset];

  return convertToFloat(word, byteInWord, dataType, normalized);
}

fn readMatrixIndicesExtra(info : vec4f, vertexIndex : u32) -> vec4f {
  let baseOffset = u32(info.x);
  let stride = u32(info.y);
  let dataType = u32(info.z);
  let normalized = info.w != 0.0;

  let offset = baseOffset + vertexIndex * stride;

  // Determine component size based on type
  let componentSize = select(select(2u, 1u, dataType == 5120u || dataType == 5121u), 4u, dataType == 5126u);

  return vec4f(
      readMatrixIndexExtraValue(offset, dataType, normalized),
      readMatrixIndexExtraValue(offset + componentSize, dataType, normalized),
      readMatrixIndexExtraValue(offset + componentSize * 2u, dataType,
                                normalized),
      readMatrixIndexExtraValue(offset + componentSize * 3u, dataType,
                                normalized));
}

fn readMatrixWeightExtraValue(byteOffset : u32, dataType : u32,
                              normalized : bool) -> f32 {
  let wordOffset = byteOffset / 4u;
  let byteInWord = byteOffset % 4u;
  let word : u32 = bitcast<u32>(matricesWeightsExtra[wordOffset]);

  return convertToFloat(word, byteInWord, dataType, normalized);
}

fn readMatrixWeightsExtra(info : vec4f, vertexIndex : u32) -> vec4f {
  let baseOffset = u32(info.x);
  let stride = u32(info.y);
  let dataType = u32(info.z);
  let normalized = info.w != 0.0;

  let offset = baseOffset + vertexIndex * stride;

  // Determine component size based on type
  let componentSize = select(select(2u, 1u, dataType == 5120u || dataType == 5121u), 4u, dataType == 5126u);

  return vec4f(
      readMatrixWeightExtraValue(offset, dataType, normalized),
      readMatrixWeightExtraValue(offset + componentSize, dataType, normalized),
      readMatrixWeightExtraValue(offset + componentSize * 2u, dataType,
                                 normalized),
      readMatrixWeightExtraValue(offset + componentSize * 3u, dataType,
                                 normalized));
}
#endif
#endif

fn readVertexIndex(index : u32)->u32 {
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

fn calculateTriangleNormal(v0
                           : vec3<f32>, v1
                           : vec3<f32>, v2
                           : vec3<f32>)
    ->vec3<f32> {
  let edge1 = v1 - v0;
  let edge2 = v2 - v0;

  // Calculate the cross product to get the triangle normal
  let triangleNormal = cross(edge1, edge2);
  let normalizedTriangleNormal = normalize(triangleNormal);

  // Because we're rendering both front and back faces, we don't care
  // about winding order and the direction of the normal
  return normalizedTriangleNormal;
}

@vertex
fn main(input : VertexInputs) -> FragmentInputs {

  #include <morphTargetsVertexGlobal>
  
  var triPositions: array<vec3f, 3>;

  // We're going to calculate the updated position for each vertex of the triangle
  // so that we can compute the triangle normal.
  var thisTriIndex : u32 = vertexInputs.vertexIndex; // index in the triangle (0,1,2) of this invocation
  for (var i: u32 = 0u; i < 3u; i = i + 1u) {
    var provokingVertNum : u32 = vertexInputs.vertexIndex / 3 * 3;
    let vertIdx = readVertexIndex(provokingVertNum + i);

    // We need to know which vertex of the triangle corresponds to this invocation
    // so that we can output the correct position at the end.
    if (provokingVertNum + i == vertexInputs.vertexIndex) {
      thisTriIndex = i;
    }
    var positionUpdated = readVertexPosition(uniforms.vp_position_info, vertIdx);
#include <instancesVertex>
    let inputPosition: vec3f = positionUpdated;
    #include <morphTargetsVertex>(vertexInputs.position\\),inputPosition),vertexInputs.vertexIndex,vertIdx)[0..maxSimultaneousMorphTargets]

    #if NUM_BONE_INFLUENCERS > 0
      let matrixIndex = readMatrixIndices(uniforms.vp_matricesIndices_info, vertIdx);
      let matrixWeight = readMatrixWeights(uniforms.vp_matricesWeights_info, vertIdx);
      #if NUM_BONE_INFLUENCERS > 4
        let matrixIndexExtra = readMatrixIndicesExtra(uniforms.vp_matricesIndicesExtra_info, vertIdx);
        let matrixWeightExtra = readMatrixWeightsExtra(uniforms.vp_matricesWeightsExtra_info, vertIdx);
      #endif
    #endif
    #include<bonesVertex>(vertexInputs.matricesIndices,matrixIndex,vertexInputs.matricesWeights,matrixWeight,vertexInputs.matricesIndicesExtra,matrixIndexExtra,vertexInputs.matricesWeightsExtra,matrixWeightExtra)
    #include<bakedVertexAnimation>(vertexInputs.matricesIndices,matrixIndex,vertexInputs.matricesWeights,matrixWeight,vertexInputs.matricesIndicesExtra,matrixIndexExtra,vertexInputs.matricesWeightsExtra,matrixWeightExtra)
    triPositions[i] = (finalWorld * vec4(positionUpdated, 1.0)).xyz;
  }

  var N : vec3<f32> = calculateTriangleNormal(triPositions[0], triPositions[1], triPositions[2]);

  let worldPos = triPositions[thisTriIndex];

  // inverse scale this by world scale to put in 0-1 space.
  vertexOutputs.position = uniforms.invWorldScale * vec4(worldPos, 1.0);

  // Check the direction that maximizes the rasterized area and swizzle as
  // appropriate.
  N = abs(N);
  if (N.x > N.y && N.x > N.z) {
    vertexOutputs.f_swizzle = 0;
    vertexOutputs.position = vec4f(vertexOutputs.position.yzx, 1.0);
  } else if (N.y > N.z) {
    vertexOutputs.f_swizzle = 1;
    vertexOutputs.position = vec4f(vertexOutputs.position.zxy, 1.0);
  } else {
    vertexOutputs.f_swizzle = 2;
    vertexOutputs.position = vec4f(vertexOutputs.position.xyz, 1.0);
  }

  // Normalized position from -1,1 -> 0,1
  vertexOutputs.vNormalizedPosition = vertexOutputs.position.xyz * 0.5 + 0.5;
  vertexOutputs.position.z =
      vertexOutputs.vNormalizedPosition.z; // WebGPU uses a depth range of 0-1.
}
