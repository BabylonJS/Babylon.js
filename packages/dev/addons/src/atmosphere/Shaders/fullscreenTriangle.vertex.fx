// Copyright (c) Microsoft Corporation.
// MIT License

precision highp float;

#include<__decl__atmosphereFragment>

#if POSITION_VEC2
attribute vec2 position;
#else
attribute vec3 position;
#endif

uniform float depth;

varying vec2 uv;
#if COMPUTE_WORLD_RAY
varying vec3 positionOnNearPlane;
#endif

#if COMPUTE_WORLD_RAY
const float nearPlaneNDC = -1.;
#endif

void main() {
    gl_Position = vec4(position.xy, depth, 1.);
    uv = 0.5 * position.xy + vec2(0.5);

    #if COMPUTE_WORLD_RAY
    positionOnNearPlane = (inverseViewProjectionWithoutTranslation * vec4(position.xy, nearPlaneNDC, 1.)).xyz;
    #endif
}