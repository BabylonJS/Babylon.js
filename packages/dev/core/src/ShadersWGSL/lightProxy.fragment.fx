flat varying vOffset: u32;
flat varying vMask: u32;

// Uniforms
uniform tileMaskResolution: vec3f;
var<storage, read_write> tileMaskBuffer: array<atomic<u32>>;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    let maskResolution = vec2u(uniforms.tileMaskResolution.yz);
    let tilePosition = vec2u(fragmentInputs.position.xy);
    // We store the tiles in column-major so we don't need to know the width of the tilemask, allowing for one less uniform needed for clustered lights.
    // Height is already needed for the WebGL implementation since it stores clusters vertically to reduce texture size in an assumed horizontal desktop resolution.
    let tileIndex = (tilePosition.x * maskResolution.x + tilePosition.y) * maskResolution.y + fragmentInputs.vOffset;
    atomicOr(&tileMaskBuffer[tileIndex], fragmentInputs.vMask);
}
