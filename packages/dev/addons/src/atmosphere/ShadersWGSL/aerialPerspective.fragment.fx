// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

#define RENDER_CAMERA_VOLUME

#include<atmosphereUboDeclaration>

var transmittanceLutSampler: sampler;
var transmittanceLut: texture_2d<f32>;

var multiScatteringLutSampler: sampler;
var multiScatteringLut: texture_2d<f32>;

#include<core/helperFunctions>
#include<atmosphereFunctions>

varying positionOnNearPlane: vec3f;

uniform layerIdx: f32;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    fragmentOutputs.color = renderCameraVolume(
        input.positionOnNearPlane,
        uniforms.layerIdx,
        transmittanceLut,
        multiScatteringLut
    );
}
