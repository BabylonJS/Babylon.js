flat varying vMask: u32;

// Declarations
#include<spotLightDeclaration>
#include<lightUboDeclaration>[0..1]

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    let tilePos = vec2u(fragmentInputs.position.xy);
    let stride = u32(light0.vLightData.z);
    atomicOr(&tileMaskBuffer0[tilePos.y * stride + tilePos.x], fragmentInputs.vMask);
}
