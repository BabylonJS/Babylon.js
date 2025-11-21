// Copyright (c) Microsoft Corporation.
// MIT License

#define RENDER_MULTI_SCATTERING 1

precision highp float;

#define COMPUTE_MULTI_SCATTERING 1

#include<__decl__atmosphereFragment>

#include<core/helperFunctions>
#include<atmosphereFunctions>

varying vec2 uv;

uniform sampler2D transmittanceLut;

void main() {

    gl_FragColor = renderMultiScattering(uv, transmittanceLut);

}