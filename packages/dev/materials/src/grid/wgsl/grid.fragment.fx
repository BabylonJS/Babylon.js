#define SQRT2 1.41421356
#define PI 3.14159
#define MAX_OCTAVES 8

// Fraction of viewport height used as minimum screen-space line width, scaled by camera distance.
// Prevents lines from collapsing to sub-pixel width at long range.
#define LINE_WIDTH_SCREEN_FRACTION 0.004

// High exponent keeps the horizon fade binary-like — grid stays fully visible until
// within ~1° of the horizon, then drops sharply to zero.
#define HORIZON_FADE_EXPONENT 400.0

// Scale factor mapping world units to origin-marker UV space (1 unit = 10M world units).
// The crosshair spans ±10,000,000 world units around the origin.
#define ORIGIN_MARKER_SPAN 10000000.0

// Screen-space width fraction for the origin marker line, tuned to stay ~1px at any distance.
#define ORIGIN_MARKER_WIDTH_SCALE 0.00000015

// Origin marker values below this threshold are ignored to avoid dim halos overriding the grid.
#define ORIGIN_MARKER_THRESHOLD 0.0001

// Minimum alpha for anti-aliased line edges in linesOnly mode, keeps soft transitions visible.
#define TRANSPARENT_MIN_OPACITY 0.08

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

    #ifdef ANTIALIAS
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


fn contributionOnAxis(position: f32, tcLineWidthCap: f32, thicknessModifier: f32) -> f32 {
    let ddx: f32 = dpdx(position);
    let ddy: f32 = dpdy(position);
    var differentialLength: f32 = length(vec2f(ddx, ddy)) * SQRT2;

    // tcLineWidthCap: minimum line width derived from camera distance, prevents
    // lines from disappearing to sub-pixel width at long range.
    if (tcLineWidthCap > 0.0) {
        differentialLength = max(differentialLength, tcLineWidthCap);
    }

    let lineWidth: f32 = differentialLength * thicknessModifier;
    var result: f32 = isPointOnLine(position, lineWidth);

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
    tcLineWidthCap = LINE_WIDTH_SCREEN_FRACTION * tc / uniforms.viewportSize.y;
    let rd: vec3f = normalize(fragmentInputs.vWorldPos - uniforms.cameraPosition);
    if (abs(rd.y) > 0.99) {
        horizonFade = 1.0;
    } else {
        let flatRayDir: vec3f = normalize(vec3f(rd.x, 0.0, rd.z));
        horizonFade = -pow(abs(dot(rd, flatRayDir)), HORIZON_FADE_EXPONENT) + 1.0;
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

    // --- Origin marker (world-origin crosshair) ---
#ifdef ORIGIN_MARKER
    let tcOrigin: f32 = ORIGIN_MARKER_WIDTH_SCALE * tc / uniforms.viewportSize.y;
    let ox: f32 = contributionOnAxis(fragmentInputs.vWorldPos.x / ORIGIN_MARKER_SPAN, tcOrigin, uniforms.gridThicknessModifier);
    let oz: f32 = contributionOnAxis(fragmentInputs.vWorldPos.z / ORIGIN_MARKER_SPAN, tcOrigin, uniforms.gridThicknessModifier);
    let originMask: f32 = clamp(ox + oz, 0.0, 1.0) * horizonFade;
    if (originMask > ORIGIN_MARKER_THRESHOLD) { grid = originMask; }
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
#ifdef LINES_ONLY
    if (grid < 0.01) { discard; }
    opacity = clamp(grid, TRANSPARENT_MIN_OPACITY, uniforms.gridControl.w * grid);
#endif

#ifdef OPACITY
	opacity = opacity * textureSample(opacitySampler, opacitySamplerSampler, fragmentInputs.vOpacityUV).a;
#endif

    fragmentOutputs.color = vec4f(color.rgb, opacity * uniforms.visibility);

#ifdef PREMULTIPLYALPHA
    fragmentOutputs.color = vec4f(fragmentOutputs.color.rgb * opacity, fragmentOutputs.color.a);
#endif

#include<logDepthFragment>

#include<imageProcessingCompatibility>

#define CUSTOM_FRAGMENT_MAIN_END
}
