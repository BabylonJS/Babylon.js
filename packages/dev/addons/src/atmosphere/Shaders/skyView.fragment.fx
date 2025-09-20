// Copyright (c) Microsoft Corporation.
// MIT License

#define RENDER_SKY_VIEW 1

precision highp float;
precision highp sampler2D;

#include<__decl__atmosphereFragment>

#include<core/helperFunctions>
#include<atmosphereFunctions>

varying vec2 uv;

uniform sampler2D transmittanceLut;
uniform sampler2D multiScatteringLut;

void main() {

    gl_FragColor = renderSkyView(uv, transmittanceLut, multiScatteringLut);

}