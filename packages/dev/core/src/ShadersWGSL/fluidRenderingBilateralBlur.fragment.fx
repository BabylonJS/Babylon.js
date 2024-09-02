var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;

uniform maxFilterSize: i32;
uniform blurDir: vec2f;
uniform projectedParticleConstant: f32;
uniform depthThreshold: f32;

varying vUV: vec2f;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    var depth: f32 = textureSampleLevel(textureSampler, textureSamplerSampler, input.vUV, 0.).x;

    if (depth >= 1e6 || depth <= 0.) {
        fragmentOutputs.color = vec4f(vec3f(depth), 1.);
        return fragmentOutputs;
    }

    var filterSize: i32 = min(uniforms.maxFilterSize, i32(ceil(uniforms.projectedParticleConstant / depth)));
    var sigma: f32 = f32(filterSize) / 3.0;
    var two_sigma2: f32 = 2.0 * sigma * sigma;

    var sigmaDepth: f32 = uniforms.depthThreshold / 3.0;
    var two_sigmaDepth2: f32 = 2.0 * sigmaDepth * sigmaDepth;

    var sum: f32 = 0.;
    var wsum: f32 = 0.;
    var sumVel: f32 = 0.;

    for (var x: i32 = -filterSize; x <= filterSize; x++) {
        var coords: vec2f = vec2f(f32(x));
        var sampleDepthVel: vec2f = textureSampleLevel(textureSampler, textureSamplerSampler, input.vUV + coords * uniforms.blurDir, 0.).rg;

        var r: f32 = dot(coords, coords);
        var w: f32 = exp(-r / two_sigma2);

        var rDepth: f32 = sampleDepthVel.r - depth;
        var wd: f32 = exp(-rDepth * rDepth / two_sigmaDepth2);

        sum += sampleDepthVel.r * w * wd;
        sumVel += sampleDepthVel.g * w * wd;
        wsum += w * wd;
    }

    fragmentOutputs.color = vec4f(sum / wsum, sumVel / wsum, 0., 1.);
}
