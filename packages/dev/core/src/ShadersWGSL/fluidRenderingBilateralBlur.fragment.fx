uniform sampler2D textureSampler;

uniform int maxFilterSize;
uniform vec2 blurDir;
uniform float projectedParticleConstant;
uniform float depthThreshold;

varying vec2 vUV;

void main(void) {
    float depth = textureLod(textureSampler, vUV, 0.).x;

    if (depth >= 1e6 || depth <= 0.) {
        glFragColor = vec4(vec3(depth), 1.);
        return;
    }

    int filterSize = min(maxFilterSize, int(ceil(projectedParticleConstant / depth)));
    float sigma = float(filterSize) / 3.0;
    float two_sigma2 = 2.0 * sigma * sigma;

    float sigmaDepth = depthThreshold / 3.0;
    float two_sigmaDepth2 = 2.0 * sigmaDepth * sigmaDepth;

    float sum = 0.;
    float wsum = 0.;
    float sumVel = 0.;

    for (int x = -filterSize; x <= filterSize; ++x) {
        vec2 coords = vec2(x);
        vec2 sampleDepthVel = textureLod(textureSampler, vUV + coords * blurDir, 0.).rg;

        float r = dot(coords, coords);
        float w = exp(-r / two_sigma2);

        float rDepth = sampleDepthVel.r - depth;
        float wd = exp(-rDepth * rDepth / two_sigmaDepth2);

        sum += sampleDepthVel.r * w * wd;
        sumVel += sampleDepthVel.g * w * wd;
        wsum += w * wd;
    }

    glFragColor = vec4(sum / wsum, sumVel / wsum, 0., 1.);
}
