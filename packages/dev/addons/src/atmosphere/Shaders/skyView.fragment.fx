// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

#define RENDER_SKY_VIEW

precision highp float;
precision highp sampler2D;

#include<__decl__atmosphereFragment>

uniform sampler2D transmittanceLut;
uniform sampler2D multiScatteringLut;

#include<core/helperFunctions>
#include<atmosphereFunctions>

varying vec2 uv;

void main() {

    gl_FragColor = renderSkyView(uv, transmittanceLut, multiScatteringLut);

}