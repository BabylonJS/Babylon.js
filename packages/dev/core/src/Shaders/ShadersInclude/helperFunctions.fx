const float PI = 3.1415926535897932384626433832795;
const float TWO_PI = 6.283185307179586;
const float HALF_PI = 1.5707963267948966;
const float RECIPROCAL_PI = 0.3183098861837907;
const float RECIPROCAL_PI2 = 0.15915494309189535;
const float RECIPROCAL_PI4 = 0.07957747154594767;
const float HALF_MIN = 5.96046448e-08; // Smallest positive half.

const float LinearEncodePowerApprox = 2.2;
const float GammaEncodePowerApprox = 1.0 / LinearEncodePowerApprox;

// The luminance weights used below are for a linear encoded color, not a gamma-corrected color.
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

// The linear and gamma space conversions below are used to transform linear colors to and from the sRGB colorspace.
// The conversions are described in more detail here: https://en.wikipedia.org/wiki/SRGB#Transformation

#if USE_EXACT_SRGB_CONVERSIONS
vec3 toLinearSpaceExact(vec3 color)
{
    vec3 nearZeroSection = 0.0773993808 * color;
    vec3 remainingSection = pow(0.947867299 * (color + vec3(0.055)), vec3(2.4));
    #if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
        return mix(remainingSection, nearZeroSection, lessThanEqual(color, vec3(0.04045)));
    #else
        return
            vec3(
                color.r <= 0.04045 ? nearZeroSection.r : remainingSection.r,
                color.g <= 0.04045 ? nearZeroSection.g : remainingSection.g,
                color.b <= 0.04045 ? nearZeroSection.b : remainingSection.b);
    #endif
}

vec3 toGammaSpaceExact(vec3 color)
{
    vec3 nearZeroSection = 12.92 * color;
    vec3 remainingSection = 1.055 * pow(color, vec3(0.41666)) - vec3(0.055);
    #if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
        return mix(remainingSection, nearZeroSection, lessThanEqual(color, vec3(0.0031308)));
    #else
        return
            vec3(
                color.r <= 0.0031308 ? nearZeroSection.r : remainingSection.r,
                color.g <= 0.0031308 ? nearZeroSection.g : remainingSection.g,
                color.b <= 0.0031308 ? nearZeroSection.b : remainingSection.b);
    #endif
}
#endif

float toLinearSpace(float color)
{
    #if USE_EXACT_SRGB_CONVERSIONS
        float nearZeroSection = 0.0773993808 * color;
        float remainingSection = pow(0.947867299 * (color + 0.055), 2.4);
        return color <= 0.04045 ? nearZeroSection : remainingSection;
    #else
        return pow(color, LinearEncodePowerApprox);
    #endif
}

vec3 toLinearSpace(vec3 color)
{
    #if USE_EXACT_SRGB_CONVERSIONS
        return toLinearSpaceExact(color);
    #else
        return pow(color, vec3(LinearEncodePowerApprox));
    #endif
}

vec4 toLinearSpace(vec4 color)
{
    #if USE_EXACT_SRGB_CONVERSIONS
        return vec4(toLinearSpaceExact(color.rgb), color.a);
    #else
        return vec4(pow(color.rgb, vec3(LinearEncodePowerApprox)), color.a);
    #endif
}

float toGammaSpace(float color)
{
    #if USE_EXACT_SRGB_CONVERSIONS
        float nearZeroSection = 12.92 * color;
        float remainingSection = 1.055 * pow(color, 0.41666) - 0.055;
        return color <= 0.0031308 ? nearZeroSection : remainingSection;
    #else
        return pow(color, GammaEncodePowerApprox);
    #endif
}

vec3 toGammaSpace(vec3 color)
{
    #if USE_EXACT_SRGB_CONVERSIONS
        return toGammaSpaceExact(color);
    #else
        return pow(color, vec3(GammaEncodePowerApprox));
    #endif
}

vec4 toGammaSpace(vec4 color)
{
    #if USE_EXACT_SRGB_CONVERSIONS
        return vec4(toGammaSpaceExact(color.rgb), color.a);
    #else
        return vec4(pow(color.rgb, vec3(GammaEncodePowerApprox)), color.a);
    #endif
}

float square(float value)
{
    return value * value;
}

vec3 square(vec3 value)
{
    return value * value;
}

float pow5(float value) {
    float sq = value * value;
    return sq * sq * value;
}

// refract assuming entry and exit of a unit sphere with IOR eta.
// This is an approximation of true refraction (which would require true ray casting)
// I and N should be unit length, normalized vectors
vec3 double_refract(vec3 I, vec3 N, float eta) {
  vec3 Tfront = refract(I, N, 1.0/eta);
  vec3 Nback = normalize(reflect(N, Tfront));
  return refract(Tfront, -Nback, eta);
}

// Returns the saturated luminance. Assumes input color is linear encoded, not gamma-corrected.
float getLuminance(vec3 color)
{
    return saturate(dot(color, LuminanceEncodeApprox));
}

// https://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl
float getRand(vec2 seed) {
    return fract(sin(dot(seed.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float dither(vec2 seed, float varianceAmount) {
    float rand = getRand(seed);
    float normVariance = varianceAmount / 255.0;
    float dither = mix(-normVariance, normVariance, rand);
    return dither;
}

// Check if configurable value is needed.
const float rgbdMaxRange = 255.;

vec4 toRGBD(vec3 color) {
    float maxRGB = maxEps(max(color.r, max(color.g, color.b)));
    float D      = max(rgbdMaxRange / maxRGB, 1.);
    D            = saturate(floor(D) / 255.);
    // vec3 rgb = color.rgb * (D * (255. / rgbdMaxRange));
    vec3 rgb = color.rgb * D;

    // Helps with png quantization.
    rgb = toGammaSpace(rgb);

    return vec4(saturate(rgb), D);
}

vec3 fromRGBD(vec4 rgbd) {
    // Helps with png quantization.
    rgbd.rgb = toLinearSpace(rgbd.rgb);

    // return rgbd.rgb * ((rgbdMaxRange / 255.0) / rgbd.a);

    return rgbd.rgb / rgbd.a;
}

vec3 parallaxCorrectNormal( vec3 vertexPos, vec3 origVec, vec3 cubeSize, vec3 cubePos ) {
	// Find the ray intersection with box plane
	vec3 invOrigVec = vec3(1.) / origVec;
	vec3 halfSize = cubeSize * 0.5;
	vec3 intersecAtMaxPlane = (cubePos + halfSize - vertexPos) * invOrigVec;
	vec3 intersecAtMinPlane = (cubePos - halfSize - vertexPos) * invOrigVec;
	// Get the largest intersection values (we are not intersted in negative values)
	vec3 largestIntersec = max(intersecAtMaxPlane, intersecAtMinPlane);
	// Get the closest of all solutions
	float distance = min(min(largestIntersec.x, largestIntersec.y), largestIntersec.z);
	// Get the intersection position
	vec3 intersectPositionWS = vertexPos + origVec * distance;
	// Get corrected vector
	return intersectPositionWS - cubePos;
}

vec3 equirectangularToCubemapDirection(vec2 uv) {
    float longitude = uv.x * TWO_PI - PI;
    float latitude = HALF_PI - uv.y * PI;
    vec3 direction;
    direction.x = cos(latitude) * sin(longitude);
    direction.y = sin(latitude);
    direction.z = cos(latitude) * cos(longitude);
    return direction;
}

// Since a sqrt of a negative value is undefined in GLSL, this function clamps the input value to 0.0.
float sqrtClamped(float value) {
    return sqrt(max(value, 0.));
}

float avg(vec3 value) {
    return dot(value, vec3(0.333333333));
}

#if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE) 
uint extractBits(uint value, int offset, int width) {
    return (value >> offset) & ((1u << width) - 1u);
}

// Returns the position of the only set bit in the value, only works if theres exactly 1 bit set
int onlyBitPosition(uint value) {
    // https://graphics.stanford.edu/~seander/bithacks.html#ZerosOnRightFloatCast
    return (floatBitsToInt(float(value)) >> 23) - 0x7f;
}

vec3 singleScatterToMultiScatterAlbedo(vec3 rho_ss) {
  vec3 s = sqrt(max(vec3(1.0) - rho_ss, vec3(0.0)));
  return (vec3(1.0) - s) * (vec3(1.0) - vec3(0.139) * s) / (vec3(1.0) + vec3(1.17) * s);
}

float min3(vec3 v) {
    return min(v.x, min(v.y, v.z));
}

float max3(vec3 v) {
    return max(v.x, max(v.y, v.z));
}

#endif
