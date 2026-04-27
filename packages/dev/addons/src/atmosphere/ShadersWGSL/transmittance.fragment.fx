// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

#define RENDER_TRANSMITTANCE
#define EXCLUDE_RAY_MARCHING_FUNCTIONS

#include<atmosphereUboDeclaration>

#include<core/helperFunctions>
#include<atmosphereFunctions>

varying vUV: vec2f;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    fragmentOutputs.color = renderTransmittance(input.vUV);
}
