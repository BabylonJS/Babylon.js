// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

#include<atmosphereUboDeclaration>

#if POSITION_VEC2
attribute position: vec2f;
#else
attribute position: vec3f;
#endif

uniform depth: f32;

varying vUV: vec2f;
#if COMPUTE_WORLD_RAY
varying positionOnNearPlane: vec3f;
#endif

#if COMPUTE_WORLD_RAY
const nearPlaneNDC: f32 = -1.0;
#endif

@vertex
fn main(input: VertexInputs) -> FragmentInputs {
    vertexOutputs.position = vec4f(input.position.xy, uniforms.depth, 1.0);
    vertexOutputs.vUV = input.position.xy * vec2f(0.5, 0.5) + vec2f(0.5, 0.5);

#if COMPUTE_WORLD_RAY
    vertexOutputs.positionOnNearPlane = (atmosphere.inverseViewProjectionWithoutTranslation * vec4f(input.position.xy, nearPlaneNDC, 1.0)).xyz;
#endif
}
