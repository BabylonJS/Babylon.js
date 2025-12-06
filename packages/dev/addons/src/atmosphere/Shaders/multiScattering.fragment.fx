// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

#define RENDER_MULTI_SCATTERING
#define COMPUTE_MULTI_SCATTERING

precision highp float;

#include<__decl__atmosphereFragment>

uniform sampler2D transmittanceLut;

#include<core/helperFunctions>
#include<atmosphereFunctions>

varying vec2 uv;

void main() {

    gl_FragColor = renderMultiScattering(uv, transmittanceLut);

}