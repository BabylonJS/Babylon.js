const float PI = 3.1415926535897932384626433832795;

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

#ifdef WEBGL2
    // https://learnopengl.com/PBR/IBL/Specular-IBL
    // Hammersley
    float radicalInverse_VdC(uint bits) 
    {
        bits = (bits << 16u) | (bits >> 16u);
        bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
        bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
        bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
        bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
        return float(bits) * 2.3283064365386963e-10; // / 0x100000000
    }

    vec2 hammersley(uint i, uint N)
    {
        return vec2(float(i)/float(N), radicalInverse_VdC(i));
    }
#else
    float vanDerCorpus(int n, int base)
    {
        float invBase = 1.0 / float(base);
        float denom   = 1.0;
        float result  = 0.0;

        for(int i = 0; i < 32; ++i)
        {
            if(n > 0)
            {
                denom   = mod(float(n), 2.0);
                result += denom * invBase;
                invBase = invBase / 2.0;
                n       = int(float(n) / 2.0);
            }
        }

        return result;
    }

    vec2 hammersley(int i, int N)
    {
        return vec2(float(i)/float(N), vanDerCorpus(i, 2));
    }
#endif

float log4(float x) {
    return log2(x) / 2.;
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
