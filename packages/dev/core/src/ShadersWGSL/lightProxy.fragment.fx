flat varying vMask: u32;

// Declarations
#include<clusteredLightFunctions>
#include<lightUboDeclaration>[0..1]

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    let index = tileMaskIndex(light0.vLightData, fragmentInputs.position);

    // To reduce atomic contention we elect one wavefront to set the index
    // However, as a fallback we also check for wavefronts that might have different indices
    let elected = subgroupElect();
    let electedIndex = subgroupBroadcastFirst(index);
    if elected || index != electedIndex {
        atomicOr(&tileMaskBuffer0[index], fragmentInputs.vMask);
    }

    // atomicOr(&tileMaskBuffer0[index], fragmentInputs.vMask);
}
