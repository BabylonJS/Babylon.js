var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;

uniform filterSize: i32;
uniform blurDir: vec2f;

varying vUV: vec2f;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    var s: vec4f = textureSampleLevel(textureSampler, textureSamplerSampler, input.vUV, 0.);
    if (s.r == 0.) {
        fragmentOutputs.color = vec4f(0., 0., 0., 1.);
        return fragmentOutputs;
    }

    var sigma: f32 = f32(uniforms.filterSize) / 3.0;
    var twoSigma2: f32 = 2.0 * sigma * sigma;

    var sum: vec4f = vec4f(0.);
    var wsum: f32 = 0.;

    for (var x: i32 = -uniforms.filterSize; x <= uniforms.filterSize; x++) {
        var coords: vec2f = vec2f(f32(x));
        var sampl: vec4f = textureSampleLevel(textureSampler, textureSamplerSampler, input.vUV + coords * uniforms.blurDir, 0.);

        var w: f32 = exp(-coords.x * coords.x / twoSigma2);

        sum += sampl * w;
        wsum += w;
    }

    sum /= wsum;

    fragmentOutputs.color = vec4f(sum.rgb, 1.);
}
