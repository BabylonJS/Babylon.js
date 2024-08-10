varying vUV: vec2f;
var depthSamplerSampler: sampler;
var depthSampler: texture_2d<f32>;

// precomputed uniforms (not effect parameters)
// cameraMinMaxZ.y => "maxZ - minZ" i.e., the near-to-far distance.
uniform cameraMinMaxZ: vec2f;

// uniforms
uniform focusDistance: f32;
uniform cocPrecalculation: f32;

#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    var depth: f32 = textureSample(depthSampler, depthSamplerSampler, input.vUV).r;

    #define CUSTOM_COC_DEPTH

    var pixelDistance: f32 = (uniforms.cameraMinMaxZ.x + uniforms.cameraMinMaxZ.y * depth) * 1000.0; // actual distance from the lens in scene units/1000 (eg. millimeter)

    #define CUSTOM_COC_PIXELDISTANCE

    var coc: f32 = abs(uniforms.cocPrecalculation * ((uniforms.focusDistance - pixelDistance) / pixelDistance));
    coc = clamp(coc, 0.0, 1.0);
    fragmentOutputs.color =  vec4f(coc, coc, coc, 1.0);
}
