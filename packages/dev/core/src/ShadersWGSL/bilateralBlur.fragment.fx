var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;

var normalSamplerSampler: sampler;
var normalSampler: texture_2d<f32>;

var depthSamplerSampler: sampler;
var depthSampler: texture_2d<f32>;

uniform filterSize: i32;
uniform blurDir: vec2f;
uniform depthThreshold: f32;
uniform normalThreshold: f32;

varying vUV: vec2f;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    var color: vec3f = textureSampleLevel(textureSampler, textureSamplerSampler, input.vUV, 0.).rgb;
    var depth: f32 = textureSampleLevel(depthSampler, depthSamplerSampler, input.vUV, 0.).x;

    if (depth >= 1e6 || depth <= 0.) {
        fragmentOutputs.color =  vec4f(color, 1.);
        return fragmentOutputs;
    }

    var normal: vec3f = textureSampleLevel(normalSampler, normalSamplerSampler, input.vUV, 0.).rgb;
    #ifdef DECODE_NORMAL
        normal = normal * 2.0 - 1.0;
    #endif

    var sigma: f32 =  f32(uniforms.filterSize);
    var two_sigma2: f32 = 2.0 * sigma * sigma;

    var sigmaDepth: f32 = uniforms.depthThreshold;
    var two_sigmaDepth2: f32 = 2.0 * sigmaDepth * sigmaDepth;

    var sigmaNormal: f32 = uniforms.normalThreshold;
    var two_sigmaNormal2: f32 = 2.0 * sigmaNormal * sigmaNormal;

    var sum: vec3f =  vec3f(0.);
    var wsum: f32 = 0.;

    for (var x: i32 = -uniforms.filterSize; x <= uniforms.filterSize; x++) {
        var coords = vec2f(f32(x));
        var sampleColor: vec3f = textureSampleLevel(textureSampler, textureSamplerSampler, input.vUV + coords * uniforms.blurDir, 0.).rgb;
        var sampleDepth: f32 = textureSampleLevel(depthSampler, depthSamplerSampler, input.vUV + coords * uniforms.blurDir, 0.).r;
        var sampleNormal: vec3f = textureSampleLevel(normalSampler, normalSamplerSampler, input.vUV + coords * uniforms.blurDir, 0.).rgb;

        #ifdef DECODE_NORMAL
            sampleNormal = sampleNormal * 2.0 - 1.0;
        #endif

        var r: f32 = dot(coords, coords);
        var w: f32 = exp(-r / two_sigma2);

        var depthDelta: f32 = abs(sampleDepth - depth);
        var wd: f32 = step(depthDelta, uniforms.depthThreshold);

        var normalDelta: vec3f = abs(sampleNormal - normal);
        var wn: f32 = step(normalDelta.x + normalDelta.y + normalDelta.z, uniforms.normalThreshold);

        sum += sampleColor * w * wd * wn;
        wsum += w * wd * wn;
    }

    fragmentOutputs.color =  vec4f(sum / wsum, 1.);
}
