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
#include<vertexPullingDeclaration>

    // uniform world : mat4x4f;
    uniform invWorldScale : mat4x4f;

    varying vNormalizedPosition : vec3f;
    flat varying f_swizzle : i32;

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
    let vertIdx = vp_readVertexIndex(provokingVertNum + i);

    // We need to know which vertex of the triangle corresponds to this invocation
    // so that we can output the correct position at the end.
    if (provokingVertNum + i == vertexInputs.vertexIndex) {
      thisTriIndex = i;
    }
    var positionUpdated = vp_readPosition(uniforms.vp_position_info, vertIdx);
#include <instancesVertex>
    let inputPosition: vec3f = positionUpdated;
    #include <morphTargetsVertex>(vertexInputs.position\\),inputPosition),vertexInputs.vertexIndex,vertIdx)[0..maxSimultaneousMorphTargets]

    #if NUM_BONE_INFLUENCERS > 0
      let matrixIndex = vp_readBoneIndices(uniforms.vp_matricesIndices_info, vertIdx);
      let matrixWeight = vp_readBoneWeights(uniforms.vp_matricesWeights_info, vertIdx);
      #if NUM_BONE_INFLUENCERS > 4
        let matrixIndexExtra = vp_readBoneIndicesExtra(uniforms.vp_matricesIndicesExtra_info, vertIdx);
        let matrixWeightExtra = vp_readBoneWeightsExtra(uniforms.vp_matricesWeightsExtra_info, vertIdx);
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
