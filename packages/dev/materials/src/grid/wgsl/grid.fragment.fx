#define SQRT2 1.41421356
#define PI 3.14159
#define MAX_OCTAVES 8

uniform visibility: f32;

uniform mainColor: vec3f;
uniform lineColor: vec3f;
uniform gridControl: vec4f;
uniform gridOffset: vec3f;
uniform gridThicknessModifier: f32;

#ifdef MULTI_SCALE
uniform minGridSpacing: f32;
uniform gridOctaves: i32;
#endif

#if defined(HORIZON_FADE) || defined(BELOW_LINE_COLOR) || defined(ORIGIN_MARKER)
uniform cameraPosition: vec3f;
uniform viewportSize: vec2f;
#endif

#ifdef HORIZON_FADE
uniform cameraDirection: vec3f;
#endif

#ifdef BELOW_LINE_COLOR
uniform belowLineColor: vec3f;
#endif

// Varying
varying vPosition: vec3f;
varying vNormal: vec3f;
#if defined(HORIZON_FADE) || defined(BELOW_LINE_COLOR) || defined(ORIGIN_MARKER)
varying vWorldPos: vec3f;
#endif

#include<clipPlaneFragmentDeclaration>

#include<logDepthDeclaration>

#include<fogFragmentDeclaration>

// Samplers
#ifdef OPACITY
varying vOpacityUV: vec2f;
var opacitySamplerSampler: sampler;
var opacitySampler: texture_2d<f32>;
uniform vOpacityInfos: vec2f;
#endif

fn getDynamicVisibility(position: f32) -> f32 {
    // Major grid line every Frequency defined in material.
    var majorGridFrequency: f32 = uniforms.gridControl.y;
    if (floor(position + 0.5) == floor(position / majorGridFrequency + 0.5) * majorGridFrequency)
    {
        return 1.0;
    }

    return uniforms.gridControl.z;
}

fn getAnisotropicAttenuation(differentialLength: f32) -> f32 {
    let maxNumberOfLines: f32 = 10.0;
    return clamp(1.0 / (differentialLength + 1.0) - 1.0 / maxNumberOfLines, 0.0, 1.0);
}

fn isPointOnLine(position: f32, differentialLength: f32) -> f32 {
    var fractionPartOfPosition: f32 = position - floor(position + 0.5);
    fractionPartOfPosition = fractionPartOfPosition / differentialLength;

    #ifdef ANTIALIAS_COSINE
    fractionPartOfPosition = clamp(fractionPartOfPosition, -1., 1.);
    var result: f32 = 0.5 + 0.5 * cos(fractionPartOfPosition * PI);
    return result;
    #else
    if (abs(fractionPartOfPosition) < SQRT2 / 4.) {
        return 1.;
    }
    return 0.;
    #endif
}

#if defined(ANTIALIAS_BOX) || defined(ORIGIN_MARKER)
fn filteredGrid(p: vec2f, gradX: vec2f, gradY: vec2f, normLineWidth: f32, noRepeat: bool) -> f32 {
    let N: f32 = 1.0 / normLineWidth;
    var w: vec2f = max(abs(gradX), abs(gradY)) + normLineWidth * 0.001;
    var a: vec2f = p + 0.5 * w;
    var b: vec2f = p - 0.5 * w;
    if (noRepeat) {
        a = clamp(a, vec2f(0.0), vec2f(1.0));
        b = clamp(b, vec2f(0.0), vec2f(1.0));
    }
    let NW: vec2f = N * w;
    if (NW.x == 0.0 || NW.y == 0.0) { return 1.0; }
    let i: vec2f = (floor(a) + min(fract(a) * N, vec2f(1.0)) - floor(b) - min(fract(b) * N, vec2f(1.0))) / NW;
    return 1.0 - (1.0 - i.x) * (1.0 - i.y);
}

fn gridWithUnitSpacing(p: vec2f, normLineWidth: f32, gridUnitSpacing: f32, noRepeat: bool) -> f32 {
    let uv: vec2f = p / gridUnitSpacing + vec2f(normLineWidth * 0.5);
    return filteredGrid(uv, dpdx(uv), dpdy(uv), normLineWidth, noRepeat);
}
#endif

fn contributionOnAxis(position: f32, tcLineWidthCap: f32, thicknessModifier: f32) -> f32 {
    let ddx: f32 = dpdx(position);
    let ddy: f32 = dpdy(position);
    var differentialLength: f32 = length(vec2f(ddx, ddy)) * SQRT2;

    if (tcLineWidthCap > 0.0) {
        differentialLength = max(differentialLength, tcLineWidthCap);
    }

    let lineWidth: f32 = differentialLength * thicknessModifier;
    var result: f32;

#ifdef ANTIALIAS_BOX
    let normLineWidth: f32 = lineWidth;
    let N: f32 = 1.0 / normLineWidth;
    let p: f32 = position + normLineWidth * 0.5;
    let w: f32 = max(abs(ddx), abs(ddy)) + normLineWidth * 0.001;
    let a: f32 = p + 0.5 * w;
    let b: f32 = p - 0.5 * w;
    let NW: f32 = N * w;
    if (NW > 0.0) {
        result = clamp((floor(a) + min(fract(a) * N, 1.0) - floor(b) - min(fract(b) * N, 1.0)) / NW, 0.0, 1.0);
    } else {
        result = 0.0;
    }
#else
    result = isPointOnLine(position, lineWidth);
#endif

    result = result * getDynamicVisibility(position);
    result = result * getAnisotropicAttenuation(differentialLength);
    return result;
}

fn normalImpactOnAxis(x: f32) -> f32 {
    var normalImpact: f32 = clamp(1.0 - 3.0 * abs(x * x * x), 0.0, 1.0);
    return normalImpact;
}


#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

    #include<clipPlaneFragment>

    var normal: vec3f = normalize(fragmentInputs.vNormal);

    // --- Horizon fade & line-width cap setup ---
    var horizonFade: f32 = 1.0;
    var tcLineWidthCap: f32 = 0.0;
#if defined(HORIZON_FADE) || defined(ORIGIN_MARKER)
    var tc: f32 = length(fragmentInputs.vWorldPos - uniforms.cameraPosition);
    #ifdef HORIZON_FADE
    tcLineWidthCap = 0.004 * tc / uniforms.viewportSize.y;
    let rd: vec3f = normalize(fragmentInputs.vWorldPos - uniforms.cameraPosition);
    if (abs(rd.y) > 0.99) {
        horizonFade = 1.0;
    } else {
        let flatRayDir: vec3f = normalize(vec3f(rd.x, 0.0, rd.z));
        horizonFade = -pow(abs(dot(rd, flatRayDir)), 400.0) + 1.0;
    }
    #endif
#endif

    // --- Grid value ---
    var grid: f32 = 0.0;

#ifdef MULTI_SCALE
    for (var i: i32 = 0; i < MAX_OCTAVES; i++) {
        if (i >= uniforms.gridOctaves) { break; }
        let scale: f32 = uniforms.minGridSpacing * pow(10.0, f32(i));
        let gridPos: vec3f = (fragmentInputs.vPosition + uniforms.gridOffset.xyz) / scale;
        let gx: f32 = contributionOnAxis(gridPos.x, tcLineWidthCap, uniforms.gridThicknessModifier) * normalImpactOnAxis(normal.x);
        let gy: f32 = contributionOnAxis(gridPos.y, tcLineWidthCap, uniforms.gridThicknessModifier) * normalImpactOnAxis(normal.y);
        let gz: f32 = contributionOnAxis(gridPos.z, tcLineWidthCap, uniforms.gridThicknessModifier) * normalImpactOnAxis(normal.z);
        #ifdef MAX_LINE
        grid = max(grid, clamp(max(max(gx, gy), gz), 0., 1.));
        #else
        grid = max(grid, clamp(gx + gy + gz, 0., 1.));
        #endif
    }
#else
    // Single-ratio path (original behavior).
    let gridRatio: f32 = uniforms.gridControl.x;
    let gridPos: vec3f = (fragmentInputs.vPosition + uniforms.gridOffset.xyz) / gridRatio;
    let x: f32 = contributionOnAxis(gridPos.x, tcLineWidthCap, uniforms.gridThicknessModifier) * normalImpactOnAxis(normal.x);
    let y: f32 = contributionOnAxis(gridPos.y, tcLineWidthCap, uniforms.gridThicknessModifier) * normalImpactOnAxis(normal.y);
    let z: f32 = contributionOnAxis(gridPos.z, tcLineWidthCap, uniforms.gridThicknessModifier) * normalImpactOnAxis(normal.z);
    #ifdef MAX_LINE
    grid = clamp(max(max(x, y), z), 0., 1.);
    #else
    grid = clamp(x + y + z, 0., 1.);
    #endif
#endif

    grid = grid * horizonFade;

    // --- Origin marker ---
#ifdef ORIGIN_MARKER
    let tcOrigin: f32 = 0.00000015 * tc / uniforms.viewportSize.y;
    let ox: f32 = contributionOnAxis(fragmentInputs.vWorldPos.x / 10000000.0, tcOrigin, uniforms.gridThicknessModifier);
    let oz: f32 = contributionOnAxis(fragmentInputs.vWorldPos.z / 10000000.0, tcOrigin, uniforms.gridThicknessModifier);
    let originMask: f32 = clamp(ox + oz, 0.0, 1.0) * horizonFade;
    if (originMask > 0.0001) { grid = originMask; }
#endif

    // --- Line color (above/below camera) ---
#ifdef BELOW_LINE_COLOR
    let belowSurface: bool = uniforms.cameraPosition.y < fragmentInputs.vWorldPos.y;
    let effectiveLineColor: vec3f = select(uniforms.lineColor, uniforms.belowLineColor, belowSurface);
#else
    let effectiveLineColor: vec3f = uniforms.lineColor;
#endif

    var color: vec4f = vec4f(mix(uniforms.mainColor, effectiveLineColor, vec3f(grid)), 1.0);

#ifdef FOG
    #include<fogFragment>
#endif

    var opacity: f32 = uniforms.gridControl.w;
#ifdef TRANSPARENT
    if (grid < 0.01) { discard; }
    opacity = clamp(grid, 0.08, uniforms.gridControl.w * grid);
#endif

#ifdef OPACITY
	opacity = opacity * textureSample(opacitySampler, opacitySamplerSampler, fragmentInputs.vOpacityUV).a;
#endif

    fragmentOutputs.color = vec4f(color.rgb, opacity * uniforms.visibility);

#ifdef TRANSPARENT
    #ifdef PREMULTIPLYALPHA
        fragmentOutputs.color = vec4f(fragmentOutputs.color.rgb * opacity, fragmentOutputs.color.a);
    #endif
#else
#endif

#include<logDepthFragment>

#include<imageProcessingCompatibility>

#define CUSTOM_FRAGMENT_MAIN_END
}
