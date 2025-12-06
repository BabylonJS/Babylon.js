// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

#define RENDER_TRANSMITTANCE
#define EXCLUDE_RAY_MARCHING_FUNCTIONS

precision highp float;

#include<__decl__atmosphereFragment>

#include<core/helperFunctions>
#include<atmosphereFunctions>

varying vec2 uv;

void main() {

    gl_FragColor = renderTransmittance(uv);

}