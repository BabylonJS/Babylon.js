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
  #if NUM_BONE_INFLUENCERS > 4
    var<storage, read> matricesIndicesExtra : array<u32>;
    var<storage, read> matricesWeightsExtra : array<f32>;
  #endif
#endif

uniform world : mat4x4f;
uniform invWorldScale: mat4x4f;

varying vNormalizedPosition : vec3f;
flat varying f_swizzle: i32;

// Vertex buffer metadata (set via defines or defaults)
#ifndef POSITION_STRIDE
#define POSITION_STRIDE 3
#endif

#ifndef POSITION_OFFSET
#define POSITION_OFFSET 0
#endif

#ifndef POSITION_COMPONENT_COUNT
#define POSITION_COMPONENT_COUNT 3
#endif

fn readVertexPosition(index : u32)->vec3f {
  var pos : vec3f;
  let baseOffset = POSITION_OFFSET + index * POSITION_STRIDE;
  pos.x = position[baseOffset];
  pos.y = position[baseOffset + 1u];
  pos.z = position[baseOffset + 2u];
  return pos;
}

#if NUM_BONE_INFLUENCERS > 0
// Matrix indices are stored as UNSIGNED_BYTE (4 bytes packed into u32)
#ifndef MATRICESINDICES_STRIDE
#define MATRICESINDICES_STRIDE 1
#endif
#ifndef MATRICESINDICES_OFFSET
#define MATRICESINDICES_OFFSET 0
#endif

fn readMatrixIndices(index : u32) -> vec4f {
  let baseOffset = MATRICESINDICES_OFFSET + index * MATRICESINDICES_STRIDE;
  #if MATRICESINDICES_COMPONENT_BYTES == 1
    let packed = matricesIndices[baseOffset];
    // Extract 4 bytes from u32 and convert to floats
    return vec4f(
      f32(packed & 0xFFu),
      f32((packed >> 8u) & 0xFFu),
      f32((packed >> 16u) & 0xFFu),
      f32((packed >> 24u) & 0xFFu)
    );
  #elif MATRICESINDICES_COMPONENT_BYTES == 2
    let packed1 = matricesIndices[baseOffset];
    let packed2 = matricesIndices[baseOffset + 1u];
    // Extract 4 bytes from two u32 and convert to floats
    return vec4f(
      f32(packed1 & 0xFFFFu),
      f32((packed1 >> 16u) & 0xFFFFu),
      f32(packed2 & 0xFFFFu),
      f32((packed2 >> 16u) & 0xFFFFu)
    );
  #endif
}

#ifndef MATRICESWEIGHTS_STRIDE
#define MATRICESWEIGHTS_STRIDE 4
#endif
#ifndef MATRICESWEIGHTS_OFFSET
#define MATRICESWEIGHTS_OFFSET 0
#endif

fn readMatrixWeights(index : u32) -> vec4f {
  let baseOffset = MATRICESWEIGHTS_OFFSET + index * MATRICESWEIGHTS_STRIDE;
  return vec4f(
    matricesWeights[baseOffset],
    matricesWeights[baseOffset + 1u],
    matricesWeights[baseOffset + 2u],
    matricesWeights[baseOffset + 3u]
  );
}

#if NUM_BONE_INFLUENCERS > 4
fn readMatrixIndicesExtra(index : u32) -> vec4f {
  let baseOffset = MATRICESINDICESEXTRA_OFFSET + index * MATRICESINDICESEXTRA_STRIDE;
  let packed = matricesIndicesExtra[baseOffset];
  return vec4f(
    f32(packed & 0xFFu),
    f32((packed >> 8u) & 0xFFu),
    f32((packed >> 16u) & 0xFFu),
    f32((packed >> 24u) & 0xFFu)
  );
}

fn readMatrixWeightsExtra(index : u32) -> vec4f {
  let baseOffset = MATRICESWEIGHTSEXTRA_OFFSET + index * MATRICESWEIGHTSEXTRA_STRIDE;
  return vec4f(
    matricesWeightsExtra[baseOffset],
    matricesWeightsExtra[baseOffset + 1u],
    matricesWeightsExtra[baseOffset + 2u],
    matricesWeightsExtra[baseOffset + 3u]
  );
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
  var vertIdx = readVertexIndex(input.vertexIndex);
  var positionUpdated = readVertexPosition(vertIdx);

#include <morphTargetsVertexGlobal>
let inputPosition: vec3f = positionUpdated;
#include <morphTargetsVertex>(vertexInputs.position\\),inputPosition),vertexInputs.vertexIndex,vertIdx)[0..maxSimultaneousMorphTargets]

#include <instancesVertex>

#include <bakedVertexAnimation>

#if NUM_BONE_INFLUENCERS > 0
  let matrixIndex = readMatrixIndices(vertIdx);
  let matrixWeight = readMatrixWeights(vertIdx);
  #if NUM_BONE_INFLUENCERS > 4
    let matrixIndexExtra = readMatrixIndicesExtra(vertIdx);
    let matrixWeightExtra = readMatrixWeightsExtra(vertIdx);
  #endif
#endif
#include <bonesVertex>(vertexInputs.matricesIndices,matrixIndex,vertexInputs.matricesWeights,matrixWeight)

  let worldPos = finalWorld * vec4f(positionUpdated, 1.0);

  // inverse scale this by world scale to put in 0-1 space.
  vertexOutputs.position = uniforms.invWorldScale * worldPos;

  var provokingVertNum : u32 = input.vertexIndex / 3 * 3;
  var pos0 = readVertexPosition(readVertexIndex(provokingVertNum));
  var pos1 = readVertexPosition(readVertexIndex(provokingVertNum + 1));
  var pos2 = readVertexPosition(readVertexIndex(provokingVertNum + 2));
  var N : vec3<f32> = calculateTriangleNormal(pos0, pos1, pos2);

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
