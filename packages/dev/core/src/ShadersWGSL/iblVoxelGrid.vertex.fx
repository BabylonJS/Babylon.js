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
var<storage, read> position : array<vec3f>;
#if NUM_BONE_INFLUENCERS > 0
  var<storage, read> matricesIndices : array<vec4f>;
  var<storage, read> matricesWeights : array<vec4f>;
  #if NUM_BONE_INFLUENCERS > 4
    var<storage, read> matricesIndicesExtra : array<vec4f>;
    var<storage, read> matricesWeightsExtra : array<vec4f>;
  #endif
#endif

uniform world : mat4x4f;
uniform invWorldScale: mat4x4f;

varying vNormalizedPosition : vec3f;
flat varying f_swizzle: i32;

// Vertex buffer metadata (set via defines or defaults)
#ifndef POSITION_STRIDE_IN_FLOATS
#define POSITION_STRIDE_IN_FLOATS 3
#endif

#ifndef POSITION_OFFSET_IN_FLOATS
#define POSITION_OFFSET_IN_FLOATS 0
#endif

#ifndef POSITION_COMPONENT_COUNT
#define POSITION_COMPONENT_COUNT 3
#endif

fn readVertexPosition(index : u32)->vec3f {
  var pos : vec3f;
  let baseOffset = POSITION_OFFSET_IN_FLOATS + index * POSITION_STRIDE_IN_FLOATS;
  pos.x = position[baseOffset];
  pos.y = position[baseOffset + 1u];
  pos.z = position[baseOffset + 2u];
  return pos;
}

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
#include <morphTargetsVertex>(vertexInputs.position\\),inputPosition))[0..maxSimultaneousMorphTargets]

#include <instancesVertex>

#include <bakedVertexAnimation>

#if NUM_BONE_INFLUENCERS > 0
  let matrixIndex = matricesIndices[vertIdx];
  let matrixWeight = matricesWeights[vertIdx];
  #if NUM_BONE_INFLUENCERS > 4
    let matrixIndexExtra = matricesIndicesExtra[vertIdx];
    let matrixWeightExtra = matricesWeightsExtra[vertIdx];
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
