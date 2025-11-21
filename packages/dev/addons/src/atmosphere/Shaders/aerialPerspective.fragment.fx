// Copyright (c) Microsoft Corporation.
// MIT License

#define RENDER_CAMERA_VOLUME 1

precision highp float;

#include<__decl__atmosphereFragment>

#include<core/helperFunctions>
#include<atmosphereFunctions>

varying vec3 positionOnNearPlane;

uniform float layerIdx;

uniform sampler2D transmittanceLut;
uniform sampler2D multiScatteringLut;

void main() {

    gl_FragColor = renderCameraVolume(
        positionOnNearPlane,
        layerIdx,
        transmittanceLut,
        multiScatteringLut
    );

}