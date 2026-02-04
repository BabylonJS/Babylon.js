// samplers
var maskSamplerSampler: sampler;
var maskSampler: texture_2d<f32>;
var depthSamplerSampler: sampler;
var depthSampler: texture_2d<f32>;

// varyings
varying vUV: vec2f;

// uniforms
uniform screenSize: vec2f;
uniform outlineColor: vec3f;
uniform outlineThickness: f32;
uniform occlusionStrength: f32;
uniform occlusionThreshold: f32;

#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    
#define CUSTOM_FRAGMENT_MAIN_BEGIN

    var texelSize: vec2f = 1.0 / uniforms.screenSize;
    var sampleOffset: vec2f = texelSize * uniforms.outlineThickness;

    // sample mask texture for edge detection and depth-based occlusion
    var centerMask: vec2f = textureSampleLevel(maskSampler, maskSamplerSampler, fragmentInputs.vUV, 0.0).rg;
    var maskX: vec2f = textureSampleLevel(maskSampler, maskSamplerSampler, fragmentInputs.vUV + vec2f(sampleOffset.x, 0.0), 0.0).rg;
    var maskY: vec2f = textureSampleLevel(maskSampler, maskSamplerSampler, fragmentInputs.vUV + vec2f(0.0, sampleOffset.y), 0.0).rg;
    var maskXY: vec2f = textureSampleLevel(maskSampler, maskSamplerSampler, fragmentInputs.vUV + sampleOffset, 0.0).rg;

    // gradient magnitude edge detection
    var gradient: vec3f = vec3f(
        centerMask.r - maskX.r,
        centerMask.r - maskY.r,
        centerMask.r - maskXY.r
    );
    var edgeStrength: f32 = length(gradient);
    var outlineMask: f32 = step(0.1, edgeStrength); // 0.1 is the outline threshold

    // sample depth texture for depth-based occlusion
    var depthCenter: f32 = textureSampleLevel(depthSampler, depthSamplerSampler, fragmentInputs.vUV, 0.0).r;
    var depthX: f32 = textureSampleLevel(depthSampler, depthSamplerSampler, fragmentInputs.vUV + vec2f(sampleOffset.x, 0.0), 0.0).r;
    var depthY: f32 = textureSampleLevel(depthSampler, depthSamplerSampler, fragmentInputs.vUV + vec2f(0.0, sampleOffset.y), 0.0).r;
    var depthXY: f32 = textureSampleLevel(depthSampler, depthSamplerSampler, fragmentInputs.vUV + sampleOffset, 0.0).r;

    var occlusionCenter: f32 = step(uniforms.occlusionThreshold, abs(centerMask.g - depthCenter));
    var occlusionX: f32 = step(uniforms.occlusionThreshold, abs(maskX.g - depthX));
    var occlusionY: f32 = step(uniforms.occlusionThreshold, abs(maskY.g - depthY));
    var occlusionXY: f32 = step(uniforms.occlusionThreshold, abs(maskXY.g - depthXY));
    var occlusionFactor: f32 = min(min(occlusionCenter, occlusionX), min(occlusionY, occlusionXY));

    var finalOutlineMask: f32 = outlineMask * (1.0 - uniforms.occlusionStrength * occlusionFactor);

    fragmentOutputs.color = vec4f(uniforms.outlineColor, finalOutlineMask);

#define CUSTOM_FRAGMENT_MAIN_END
}
