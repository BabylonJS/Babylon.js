// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

#define RENDER_MULTI_SCATTERING
#define COMPUTE_MULTI_SCATTERING

#include<atmosphereUboDeclaration>

var transmittanceLutSampler: sampler;
var transmittanceLut: texture_2d<f32>;

#include<core/helperFunctions>
#include<atmosphereFunctions>

varying vUV: vec2f;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    fragmentOutputs.color = renderMultiScattering(input.vUV, transmittanceLut);
}
