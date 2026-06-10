#extension GL_OES_standard_derivatives : enable

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

precision highp float;

uniform float visibility;

uniform vec3 mainColor;
uniform vec3 lineColor;
uniform vec4 gridControl;
uniform vec3 gridOffset;
uniform float gridThicknessModifier;

#ifdef MULTI_SCALE
uniform float minGridSpacing;
uniform float gridOctaves;
#endif

#if defined(HORIZON_FADE) || defined(BELOW_LINE_COLOR) || defined(ORIGIN_MARKER)
uniform vec3 cameraPosition;
uniform vec2 viewportSize;
#endif


#ifdef BELOW_LINE_COLOR
uniform vec3 belowLineColor;
#endif

// Varying
varying vec3 vPosition;
varying vec3 vNormal;
#if defined(HORIZON_FADE) || defined(BELOW_LINE_COLOR) || defined(ORIGIN_MARKER)
varying vec3 vWorldPos;
#endif

#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif

#include<clipPlaneFragmentDeclaration>

#include<logDepthDeclaration>

#include<fogFragmentDeclaration>

// Samplers
#ifdef OPACITY
varying vec2 vOpacityUV;
uniform sampler2D opacitySampler;
uniform vec2 vOpacityInfos;
#endif

float getDynamicVisibility(float position) {
    // Major grid line every Frequency defined in material.
    float majorGridFrequency = gridControl.y;
    if (floor(position + 0.5) == floor(position / majorGridFrequency + 0.5) * majorGridFrequency)
    {
        return 1.0;
    }

    return gridControl.z;
}

float getAnisotropicAttenuation(float differentialLength) {
    const float maxNumberOfLines = 10.0;
    return clamp(1.0 / (differentialLength + 1.0) - 1.0 / maxNumberOfLines, 0.0, 1.0);
}

float isPointOnLine(float position, float differentialLength) {
    float fractionPartOfPosition = position - floor(position + 0.5); // fract part around unit [-0.5; 0.5]
    fractionPartOfPosition /= differentialLength; // adapt to the screen space size it takes

    #ifdef ANTIALIAS
    fractionPartOfPosition = clamp(fractionPartOfPosition, -1., 1.);
    float result = 0.5 + 0.5 * cos(fractionPartOfPosition * PI); // Convert to 0-1 for antialiasing.
    return result;
    #else
    return abs(fractionPartOfPosition) < SQRT2 / 4. ? 1. : 0.;
    #endif
}


float contributionOnAxis(float position, float tcLineWidthCap, float thicknessModifier) {
    float dPosDx = dFdx(position);
    float dPosDy = dFdy(position);
    float differentialLength = length(vec2(dPosDx, dPosDy)) * SQRT2;

    // tcLineWidthCap: minimum line width derived from camera distance, prevents
    // lines from disappearing to sub-pixel width at long range.
    if (tcLineWidthCap > 0.0) {
        differentialLength = max(differentialLength, tcLineWidthCap);
    }

    float lineWidth = differentialLength * thicknessModifier;
    float result = isPointOnLine(position, lineWidth);

    result *= getDynamicVisibility(position);
    result *= getAnisotropicAttenuation(differentialLength);

    return result;
}

float normalImpactOnAxis(float x) {
    float normalImpact = clamp(1.0 - 3.0 * abs(x * x * x), 0.0, 1.0);
    return normalImpact;
}


#define CUSTOM_FRAGMENT_DEFINITIONS

void main(void) {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

    #include<clipPlaneFragment>

    vec3 normal = normalize(vNormal);

    // --- Horizon fade & line-width cap setup ---
    float horizonFade = 1.0;
    float tcLineWidthCap = 0.0;
#if defined(HORIZON_FADE) || defined(ORIGIN_MARKER)
    float tc = length(vWorldPos - cameraPosition);
#endif
#ifdef HORIZON_FADE
    tcLineWidthCap = LINE_WIDTH_SCREEN_FRACTION * tc / viewportSize.y;
    vec3 rd = normalize(vWorldPos - cameraPosition);
    if (abs(rd.y) > 0.99) {
        horizonFade = 1.0;
    } else {
        vec3 flatRayDir = normalize(vec3(rd.x, 0.0, rd.z));
        horizonFade = -pow(abs(dot(rd, flatRayDir)), HORIZON_FADE_EXPONENT) + 1.0;
    }
#endif

    // --- Grid value ---
    float grid = 0.0;

#ifdef MULTI_SCALE
    for (int i = 0; i < MAX_OCTAVES; i++) {
        if (i >= int(gridOctaves)) break;
        float scale = minGridSpacing * pow(10.0, float(i));
        vec3 gridPos = (vPosition + gridOffset.xyz) / scale;
        float gx = contributionOnAxis(gridPos.x, tcLineWidthCap, gridThicknessModifier) * normalImpactOnAxis(normal.x);
        float gy = contributionOnAxis(gridPos.y, tcLineWidthCap, gridThicknessModifier) * normalImpactOnAxis(normal.y);
        float gz = contributionOnAxis(gridPos.z, tcLineWidthCap, gridThicknessModifier) * normalImpactOnAxis(normal.z);
        #ifdef MAX_LINE
        grid = max(grid, clamp(max(max(gx, gy), gz), 0., 1.));
        #else
        grid = max(grid, clamp(gx + gy + gz, 0., 1.));
        #endif
    }
#else
    // Single-ratio path (original behavior).
    float gridRatio = gridControl.x;
    vec3 gridPos = (vPosition + gridOffset.xyz) / gridRatio;
    float x = contributionOnAxis(gridPos.x, tcLineWidthCap, gridThicknessModifier) * normalImpactOnAxis(normal.x);
    float y = contributionOnAxis(gridPos.y, tcLineWidthCap, gridThicknessModifier) * normalImpactOnAxis(normal.y);
    float z = contributionOnAxis(gridPos.z, tcLineWidthCap, gridThicknessModifier) * normalImpactOnAxis(normal.z);
    #ifdef MAX_LINE
    grid = clamp(max(max(x, y), z), 0., 1.);
    #else
    grid = clamp(x + y + z, 0., 1.);
    #endif
#endif

    grid *= horizonFade;

    // --- Origin marker (world-origin crosshair) ---
#ifdef ORIGIN_MARKER
    float tcOrigin = ORIGIN_MARKER_WIDTH_SCALE * tc / viewportSize.y;
    float ox = contributionOnAxis(vWorldPos.x / ORIGIN_MARKER_SPAN, tcOrigin, gridThicknessModifier);
    float oz = contributionOnAxis(vWorldPos.z / ORIGIN_MARKER_SPAN, tcOrigin, gridThicknessModifier);
    float originMask = clamp(ox + oz, 0.0, 1.0) * horizonFade;
    if (originMask > ORIGIN_MARKER_THRESHOLD) grid = originMask;
#endif

    // --- Line color (above/below camera) ---
#ifdef BELOW_LINE_COLOR
    bool belowSurface = cameraPosition.y < vWorldPos.y;
    vec3 effectiveLineColor = belowSurface ? belowLineColor : lineColor;
#else
    vec3 effectiveLineColor = lineColor;
#endif

    // Create the color.
    vec3 color = mix(mainColor, effectiveLineColor, grid);

#ifdef FOG
    #include<fogFragment>
#endif

    float opacity = gridControl.w;
#ifdef LINES_ONLY
    if (grid < 0.01) discard;
    opacity = clamp(grid, TRANSPARENT_MIN_OPACITY, gridControl.w * grid);
#endif

#ifdef OPACITY
	opacity *= texture2D(opacitySampler, vOpacityUV).a;
#endif

    // Apply the color.
    gl_FragColor = vec4(color.rgb, opacity * visibility);

#ifdef PREMULTIPLYALPHA
    gl_FragColor.rgb *= opacity;
#endif

#include<logDepthFragment>

#include<imageProcessingCompatibility>

#define CUSTOM_FRAGMENT_MAIN_END
}
