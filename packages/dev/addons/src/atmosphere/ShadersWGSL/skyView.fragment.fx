// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

#define RENDER_SKY_VIEW

#include<atmosphereUboDeclaration>

var transmittanceLutSampler: sampler;
var transmittanceLut: texture_2d<f32>;

var multiScatteringLutSampler: sampler;
var multiScatteringLut: texture_2d<f32>;

#include<core/helperFunctions>
#include<atmosphereFunctions>

varying vUV: vec2f;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    fragmentOutputs.color = renderSkyView(input.vUV, transmittanceLut, multiScatteringLut);
}
