// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

#define RENDER_CAMERA_VOLUME

precision highp float;

#include<__decl__atmosphereFragment>

uniform sampler2D transmittanceLut;
uniform sampler2D multiScatteringLut;

#include<core/helperFunctions>
#include<atmosphereFunctions>

varying vec3 positionOnNearPlane;

uniform float layerIdx;

void main() {

    gl_FragColor = renderCameraVolume(
        positionOnNearPlane,
        layerIdx,
        transmittanceLut,
        multiScatteringLut
    );

}