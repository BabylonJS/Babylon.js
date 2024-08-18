// References:
// * https://github.com/kode80/kode80SSR
var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;

varying vUV: vec2f;

uniform texelOffsetScale: vec2f;

const weights: array<f32, 8> = array<f32, 8>(0.071303, 0.131514, 0.189879, 0.321392, 0.452906,  0.584419, 0.715932, 0.847445);

fn processSample(uv: vec2f, i: f32, stepSize: vec2f, accumulator: ptr<function, vec4f>, denominator: ptr<function, f32>)
{
    var offsetUV: vec2f = stepSize * i + uv;
    var coefficient: f32 = weights[ i32(2.0 - abs(i))];
    *accumulator += textureSampleLevel(textureSampler, textureSamplerSampler, offsetUV, 0.0) * coefficient;
    *denominator += coefficient;
}

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    var colorFull: vec4f = textureSampleLevel(textureSampler, textureSamplerSampler, input.vUV, 0.0);

    if (dot(colorFull,  vec4f(1.0)) == 0.0) {
        fragmentOutputs.color = colorFull;
        return fragmentOutputs;
    }

    var blurRadius: f32 = colorFull.a * 255.0; // *255 to unpack from alpha 8 normalized

    var stepSize: vec2f = uniforms.texelOffsetScale.xy * blurRadius;

    var accumulator: vec4f = textureSampleLevel(textureSampler, textureSamplerSampler, input.vUV, 0.0) * 0.214607;
    var denominator: f32 = 0.214607;

    processSample(input.vUV, 1.0, stepSize, &accumulator, &denominator);
    processSample(input.vUV, 1.0 * 0.2, stepSize, &accumulator, &denominator);
    processSample(input.vUV, 1.0 * 0.4, stepSize, &accumulator, &denominator);
    processSample(input.vUV, 1.0 * 0.6, stepSize, &accumulator, &denominator);
    processSample(input.vUV, 1.0 * 0.8, stepSize, &accumulator, &denominator);
    processSample(input.vUV, 1.0 * 1.2, stepSize, &accumulator, &denominator);
    processSample(input.vUV, 1.0 * 1.4, stepSize, &accumulator, &denominator);
    processSample(input.vUV, 1.0 * 1.6, stepSize, &accumulator, &denominator);
    processSample(input.vUV, 1.0 * 1.8, stepSize, &accumulator, &denominator);
    processSample(input.vUV, 1.0 * 2.0, stepSize, &accumulator, &denominator);

    processSample(input.vUV, -1.0, stepSize, &accumulator, &denominator);
    processSample(input.vUV, -1.0 * 0.2, stepSize, &accumulator, &denominator);
    processSample(input.vUV, -1.0 * 0.4, stepSize, &accumulator, &denominator);
    processSample(input.vUV, -1.0 * 0.6, stepSize, &accumulator, &denominator);
    processSample(input.vUV, -1.0 * 0.8, stepSize, &accumulator, &denominator);
    processSample(input.vUV, -1.0 * 1.2, stepSize, &accumulator, &denominator);
    processSample(input.vUV, -1.0 * 1.4, stepSize, &accumulator, &denominator);
    processSample(input.vUV, -1.0 * 1.6, stepSize, &accumulator, &denominator);
    processSample(input.vUV, -1.0 * 1.8, stepSize, &accumulator, &denominator);
    processSample(input.vUV, -1.0 * 2.0, stepSize, &accumulator, &denominator);

    fragmentOutputs.color =  vec4f(accumulator.rgb / denominator, colorFull.a);
}
