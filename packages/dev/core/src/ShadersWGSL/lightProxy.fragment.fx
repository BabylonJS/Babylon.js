flat varying vOffset: u32;
flat varying vMask: u32;

// Uniforms
uniform tileMaskResolution: vec3f;
var<storage, read_write> tileMaskBuffer: array<atomic<u32>>;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    let uPosition = vec2u(fragmentInputs.position.xy);
    let tileIndex = fragmentInputs.vOffset + uPosition.y * u32(uniforms.tileMaskResolution.x) + uPosition.x;
    atomicOr(&tileMaskBuffer[tileIndex], fragmentInputs.vMask);
}
