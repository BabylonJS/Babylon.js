const float PI = 3.1415926535897932384626433832795;
const float HALF_MIN = 5.96046448e-08; // Smallest positive half.

const float LinearEncodePowerApprox = 2.2;
const float GammaEncodePowerApprox = 1.0 / LinearEncodePowerApprox;
const vec3 LuminanceEncodeApprox = vec3(0.2126, 0.7152, 0.0722);

const float Epsilon = 0.0000001;
#define saturate(x)         clamp(x, 0.0, 1.0)

#define absEps(x)           abs(x) + Epsilon
#define maxEps(x)           max(x, Epsilon)
#define saturateEps(x)      clamp(x, Epsilon, 1.0)

mat3 transposeMat3(mat3 inMatrix) {
    vec3 i0 = inMatrix[0];
    vec3 i1 = inMatrix[1];
    vec3 i2 = inMatrix[2];

    mat3 outMatrix = mat3(
        vec3(i0.x, i1.x, i2.x),
        vec3(i0.y, i1.y, i2.y),
        vec3(i0.z, i1.z, i2.z)
        );

    return outMatrix;
}

// https://github.com/glslify/glsl-inverse/blob/master/index.glsl
mat3 inverseMat3(mat3 inMatrix) {
    float a00 = inMatrix[0][0], a01 = inMatrix[0][1], a02 = inMatrix[0][2];
      float a10 = inMatrix[1][0], a11 = inMatrix[1][1], a12 = inMatrix[1][2];
      float a20 = inMatrix[2][0], a21 = inMatrix[2][1], a22 = inMatrix[2][2];

      float b01 = a22 * a11 - a12 * a21;
      float b11 = -a22 * a10 + a12 * a20;
      float b21 = a21 * a10 - a11 * a20;

      float det = a00 * b01 + a01 * b11 + a02 * b21;

      return mat3(b01, (-a22 * a01 + a02 * a21), (a12 * a01 - a02 * a11),
              b11, (a22 * a00 - a02 * a20), (-a12 * a00 + a02 * a10),
              b21, (-a21 * a00 + a01 * a20), (a11 * a00 - a01 * a10)) / det;
}

float toLinearSpace(float color)
{
    return pow(color, LinearEncodePowerApprox);
}

vec3 toLinearSpace(vec3 color)
{
    return pow(color, vec3(LinearEncodePowerApprox));
}

vec4 toLinearSpace(vec4 color)
{
    return vec4(pow(color.rgb, vec3(LinearEncodePowerApprox)), color.a);
}

vec3 toGammaSpace(vec3 color)
{
    return pow(color, vec3(GammaEncodePowerApprox));
}

vec4 toGammaSpace(vec4 color)
{
    return vec4(pow(color.rgb, vec3(GammaEncodePowerApprox)), color.a);
}

float toGammaSpace(float color)
{
    return pow(color, GammaEncodePowerApprox);
}

float square(float value)
{
    return value * value;
}

float pow5(float value) {
    float sq = value * value;
    return sq * sq * value;
}

float getLuminance(vec3 color)
{
    return clamp(dot(color, LuminanceEncodeApprox), 0., 1.);
}

// https://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl
float getRand(vec2 seed) {
    return fract(sin(dot(seed.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float dither(vec2 seed, float varianceAmount) {
    float rand = getRand(seed);
    float dither = mix(-varianceAmount/255.0, varianceAmount/255.0, rand);
    
    return dither;
}

// Check if configurable value is needed.
const float rgbdMaxRange = 255.0;

vec4 toRGBD(vec3 color) {
    float maxRGB = maxEps(max(color.r, max(color.g, color.b)));
    float D      = max(rgbdMaxRange / maxRGB, 1.);
    D            = clamp(floor(D) / 255.0, 0., 1.);
    // vec3 rgb = color.rgb * (D * (255.0 / rgbdMaxRange));
    vec3 rgb = color.rgb * D;
    
    // Helps with png quantization.
    rgb = toGammaSpace(rgb);

    return vec4(rgb, D); 
}

vec3 fromRGBD(vec4 rgbd) {
    // Helps with png quantization.
    rgbd.rgb = toLinearSpace(rgbd.rgb);

    // return rgbd.rgb * ((rgbdMaxRange / 255.0) / rgbd.a);

    return rgbd.rgb / rgbd.a;
}
