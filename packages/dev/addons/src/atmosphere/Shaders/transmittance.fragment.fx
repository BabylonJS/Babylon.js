// Copyright (c) Microsoft Corporation.
// MIT License

#define RENDER_TRANSMITTANCE 1

precision highp float;

#include<__decl__atmosphereFragment>

#include<core/helperFunctions>
#include<atmosphereFunctions>

varying vec2 uv;

void main() {

    gl_FragColor = renderTransmittance(uv);

}