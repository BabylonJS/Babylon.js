#if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
	#define TEXTUREFUNC(s, c, lod) texture2DLodEXT(s, c, lod)
#else
	#define TEXTUREFUNC(s, c, bias) texture2D(s, c, bias)
#endif

// References:
// * https://github.com/kode80/kode80SSR

var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;

varying vUV: vec2f;

uniform texelOffsetScale: vec2f;

const weights: f32[8] = float[8] (0.071303, 0.131514, 0.189879, 0.321392, 0.452906,  0.584419, 0.715932, 0.847445);

fn processSample(uv: vec2f, i: f32, stepSize: vec2f, inaccumulator: ptr<function, vec4f>, indenominator: ptr<function, f32>)
{
    var offsetUV: vec2f = stepSize * i + uv;
    var coefficient: f32 = weights[ i32(2.0 - abs(i))];
    accumulator += TEXTUREFUNC(textureSampler, offsetUV, 0.0) * coefficient;
    denominator += coefficient;
}

fn main()
{
    var colorFull: vec4f = TEXTUREFUNC(textureSampler, vUV, 0.0);

    if (dot(colorFull,  vec4f(1.0)) == 0.0) {
        fragmentOutputs.color = colorFull;
        return;
    }

    var blurRadius: f32 = colorFull.a * 255.0; // *255 to unpack from alpha 8 normalized

    var stepSize: vec2f = texelOffsetScale.xy * blurRadius;

    var accumulator: vec4f = TEXTUREFUNC(textureSampler, vUV, 0.0) * 0.214607;
    var denominator: f32 = 0.214607;

    processSample(vUV, 1.0, stepSize, accumulator, denominator);
    processSample(vUV, 1.0 * 0.2, stepSize, accumulator, denominator);
    processSample(vUV, 1.0 * 0.4, stepSize, accumulator, denominator);
    processSample(vUV, 1.0 * 0.6, stepSize, accumulator, denominator);
    processSample(vUV, 1.0 * 0.8, stepSize, accumulator, denominator);
    processSample(vUV, 1.0 * 1.2, stepSize, accumulator, denominator);
    processSample(vUV, 1.0 * 1.4, stepSize, accumulator, denominator);
    processSample(vUV, 1.0 * 1.6, stepSize, accumulator, denominator);
    processSample(vUV, 1.0 * 1.8, stepSize, accumulator, denominator);
    processSample(vUV, 1.0 * 2.0, stepSize, accumulator, denominator);

    processSample(vUV, -1.0, stepSize, accumulator, denominator);
    processSample(vUV, -1.0 * 0.2, stepSize, accumulator, denominator);
    processSample(vUV, -1.0 * 0.4, stepSize, accumulator, denominator);
    processSample(vUV, -1.0 * 0.6, stepSize, accumulator, denominator);
    processSample(vUV, -1.0 * 0.8, stepSize, accumulator, denominator);
    processSample(vUV, -1.0 * 1.2, stepSize, accumulator, denominator);
    processSample(vUV, -1.0 * 1.4, stepSize, accumulator, denominator);
    processSample(vUV, -1.0 * 1.6, stepSize, accumulator, denominator);
    processSample(vUV, -1.0 * 1.8, stepSize, accumulator, denominator);
    processSample(vUV, -1.0 * 2.0, stepSize, accumulator, denominator);

    fragmentOutputs.color =  vec4f(accumulator.rgb / denominator, colorFull.a);
}
