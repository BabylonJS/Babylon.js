// References:
// * https://github.com/kode80/kode80SSR

uniform sampler2D textureSampler;

varying vec2 vUV;

uniform float blurQuality;
uniform vec2 texelOffsetScale;

const float weights[8] = float[8] (0.071303, 0.131514, 0.189879, 0.321392, 0.452906,  0.584419, 0.715932, 0.847445);

void processSample(vec2 uv, float i, vec2 stepSize, out vec4 accumulator, out float denominator)
{
    vec2 offsetUV = stepSize * i + uv;
    float coefficient = weights[int(blurQuality - abs(i))];
    accumulator += texture2D(textureSampler, offsetUV) * coefficient;
    denominator += coefficient;
}

void main()
{
    vec4 colorFull = texture2D(textureSampler, vUV);

    if (dot(colorFull, vec4(1.0)) == 0.0) {
        gl_FragColor = colorFull;
        return;
    }

    float blurRadius = colorFull.a * 255.0; // *255 to unpack from alpha 8 normalized

    vec2 stepSize = texelOffsetScale.xy * blurRadius;

    vec4 accumulator = texture2D(textureSampler, vUV) * 0.214607;
    float denominator = 0.214607;

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

    gl_FragColor = vec4(accumulator.rgb / denominator, colorFull.a);
}
