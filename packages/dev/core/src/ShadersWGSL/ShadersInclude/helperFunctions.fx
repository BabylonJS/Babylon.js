const PI: f32 = 3.1415926535897932384626433832795;
const RECIPROCAL_PI: f32 = 0.3183098861837907;
const RECIPROCAL_PI2: f32 = 0.15915494309189535;
const HALF_MIN: f32 = 5.96046448e-08; // Smallest positive half.

const LinearEncodePowerApprox: f32 = 2.2;
const GammaEncodePowerApprox: f32 = 1.0 / LinearEncodePowerApprox;

// The luminance weights used below are for a linear encoded color, not a gamma-corrected color.
const LuminanceEncodeApprox: vec3<f32> = vec3<f32> (0.2126, 0.7152, 0.0722);

const Epsilon:f32 = 0.0000001;

fn square(x: f32) -> f32 {
    return x * x;
}

fn saturate(x: f32) -> f32 {
    return clamp(x, 0.0, 1.0);
}

fn saturateVec3(x: vec3f) -> vec3f {
    return clamp(x, vec3f(0.0), vec3f(1.0));
}

fn saturateEps(x: f32) -> f32 {
    return clamp(x, Epsilon, 1.0);
}      

fn maxEps(x: f32) -> f32 {
    return max(x, Epsilon);
}

fn maxEpsVec3(x: vec3f) -> vec3f {
    return max(x, vec3f(Epsilon));
}

fn absEps(x: f32) -> f32 {
    return abs(x) + Epsilon;
}

fn transposeMat3(inMatrix: mat3x3f) -> mat3x3f {
    let i0: vec3<f32> = inMatrix[0];
    let i1: vec3<f32> = inMatrix[1];
    let i2: vec3<f32> = inMatrix[2];

    let outMatrix:mat3x3f = mat3x3f(
        vec3(i0.x, i1.x, i2.x),
        vec3(i0.y, i1.y, i2.y),
        vec3(i0.z, i1.z, i2.z)
        );

    return outMatrix;
}

// https://github.com/glslify/glsl-inverse/blob/master/index.glsl
fn inverseMat3(inMatrix: mat3x3f) -> mat3x3f {
    let a00: f32 = inMatrix[0][0];
    let a01: f32 = inMatrix[0][1];
    let a02: f32 = inMatrix[0][2];
    let a10: f32 = inMatrix[1][0];
    let a11: f32 = inMatrix[1][1];
    let a12: f32 = inMatrix[1][2];
    let a20: f32 = inMatrix[2][0];
    let a21: f32 = inMatrix[2][1];
    let a22: f32 = inMatrix[2][2];

    let b01: f32 = a22 * a11 - a12 * a21;
    let b11: f32 = -a22 * a10 + a12 * a20;
    let b21: f32 = a21 * a10 - a11 * a20;

    let det: f32 = a00 * b01 + a01 * b11 + a02 * b21;

    return mat3x3f(b01 / det, (-a22 * a01 + a02 * a21) / det, (a12 * a01 - a02 * a11) / det,
            b11 / det, (a22 * a00 - a02 * a20) / det, (-a12 * a00 + a02 * a10) / det,
            b21 / det, (-a21 * a00 + a01 * a20) / det, (a11 * a00 - a01 * a10) / det);
}

// The linear and gamma space conversions below are used to transform linear colors to and from the sRGB colorspace.
// The conversions are described in more detail here: https://en.wikipedia.org/wiki/SRGB#Transformation

#if USE_EXACT_SRGB_CONVERSIONS
fn toLinearSpaceExact(color: vec3<f32>) -> vec3<f32>
{
    let nearZeroSection: vec3<f32> = 0.0773993808 * color;
    let remainingSection: vec3<f32> = pow(0.947867299 * (color + vec3<f32>(0.055)), vec3<f32>(2.4));
    return mix(remainingSection, nearZeroSection, lessThanEqual(color, vec3<f32>(0.04045)));
}

fn toGammaSpaceExact(color: vec3<f32>) -> vec3<f32>
{
    let nearZeroSection: vec3<f32> = 12.92 * color;
    let remainingSection: vec3<f32> = 1.055 * pow(color, vec3<f32>(0.41666)) - vec3<f32>(0.055);
    return mix(remainingSection, nearZeroSection, lessThanEqual(color, vec3<f32>(0.0031308)));
}
#endif

fn toLinearSpace(color: f32) -> f32
{
    #if USE_EXACT_SRGB_CONVERSIONS
        var nearZeroSection = 0.0773993808 * color;
        var remainingSection = pow(0.947867299 * (color + 0.055), 2.4);
        return select(remainingSection, nearZeroSection, color <= 0.04045);
    #else
        return pow(color, LinearEncodePowerApprox);
    #endif
}

fn toLinearSpaceVec3(color: vec3<f32>) -> vec3<f32>
{
    #if USE_EXACT_SRGB_CONVERSIONS
        return toLinearSpaceExact(color);
    #else
        return pow(color, vec3<f32>(LinearEncodePowerApprox));
    #endif
}

fn toLinearSpaceVec4(color: vec4<f32>) -> vec4<f32>
{
    #if USE_EXACT_SRGB_CONVERSIONS
        return vec4f(toLinearSpaceExact(color.rgb), color.a);
    #else
        return vec4f(pow(color.rgb, vec3f(LinearEncodePowerApprox)), color.a);
    #endif
}

fn toGammaSpace(color: vec4<f32>) -> vec4<f32>
{
    #if USE_EXACT_SRGB_CONVERSIONS
        return vec4<f32>(toGammaSpaceExact(color.rgb), color.a);
    #else
        return vec4<f32>(pow(color.rgb, vec3<f32>(GammaEncodePowerApprox)), color.a);
    #endif
}

fn toGammaSpaceVec3(color: vec3<f32>) -> vec3<f32>
{
    #if USE_EXACT_SRGB_CONVERSIONS
        return toGammaSpaceExact(color);
    #else
        return pow(color, vec3<f32>(GammaEncodePowerApprox));
    #endif
}

fn squareVec3(value: vec3<f32>) -> vec3<f32>
{
    return value * value;
}

fn pow5(value: f32) -> f32 {
    let sq: f32 = value * value;
    return sq * sq * value;
}

// Returns the saturated luminance. Assumes input color is linear encoded, not gamma-corrected.
fn getLuminance(color: vec3<f32>) -> f32
{
    return clamp(dot(color, LuminanceEncodeApprox), 0., 1.);
}

// https://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl
fn getRand(seed: vec2<f32>) -> f32 {
    return fract(sin(dot(seed.xy ,vec2<f32>(12.9898,78.233))) * 43758.5453);
}

fn dither(seed: vec2<f32>, varianceAmount: f32) -> f32 {
    let rand: f32 = getRand(seed);
    let normVariance: f32 = varianceAmount / 255.0;
    let dither: f32 = mix(-normVariance, normVariance, rand);
    return dither;
}

// Check if configurable value is needed.
const rgbdMaxRange: f32 = 255.0;

fn toRGBD(color: vec3<f32>) -> vec4<f32> {
    let maxRGB: f32 = max(max(color.r, max(color.g, color.b)), Epsilon);
    var D: f32      = max(rgbdMaxRange / maxRGB, 1.);
    D            = clamp(floor(D) / 255.0, 0., 1.);
    var rgb: vec3<f32>  = color.rgb * D;

    // Helps with png quantization.
    rgb = toGammaSpaceVec3(rgb);

    return vec4<f32>(clamp(rgb, vec3<f32>(0., 0., 0.), vec3<f32>(1., 1., 1.)), D); 
}

fn fromRGBD(rgbd: vec4<f32>) -> vec3<f32> {
    // Helps with png quantization.
    let rgb = toLinearSpaceVec3(rgbd.rgb);

    return rgb / rgbd.a;
}

fn parallaxCorrectNormal(vertexPos: vec3<f32>, origVec: vec3<f32>, cubeSize: vec3<f32>, cubePos: vec3<f32>) -> vec3<f32>  {
	// Find the ray intersection with box plane
	let invOrigVec: vec3<f32> = vec3<f32>(1.0,1.0,1.0) / origVec;
	let halfSize: vec3<f32> = cubeSize * 0.5;
	let intersecAtMaxPlane: vec3<f32> = (cubePos + halfSize - vertexPos) * invOrigVec;
	let intersecAtMinPlane: vec3<f32> = (cubePos - halfSize - vertexPos) * invOrigVec;
	// Get the largest intersection values (we are not intersted in negative values)
	let largestIntersec: vec3<f32> = max(intersecAtMaxPlane, intersecAtMinPlane);
	// Get the closest of all solutions
	let distance: f32 = min(min(largestIntersec.x, largestIntersec.y), largestIntersec.z);
	// Get the intersection position
	let intersectPositionWS: vec3<f32> = vertexPos + origVec * distance;
	// Get corrected vector
	return intersectPositionWS - cubePos;
}

fn equirectangularToCubemapDirection(uv : vec2f)->vec3f {
  var longitude : f32 = uv.x * 2.0 * PI - PI;
  var latitude : f32 = PI * 0.5 - uv.y * PI;
  var direction : vec3f;
  direction.x = cos(latitude) * sin(longitude);
  direction.y = sin(latitude);
  direction.z = cos(latitude) * cos(longitude);
  return direction;
}
