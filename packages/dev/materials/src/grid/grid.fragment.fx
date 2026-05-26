#extension GL_OES_standard_derivatives : enable

#define SQRT2 1.41421356
#define PI 3.14159
#define MAX_OCTAVES 8

precision highp float;

uniform float visibility;

uniform vec3 mainColor;
uniform vec3 lineColor;
uniform vec4 gridControl;
uniform vec3 gridOffset;
uniform float gridThicknessModifier;

#ifdef MULTI_SCALE
uniform float minGridSpacing;
uniform int gridOctaves;
#endif

#if defined(HORIZON_FADE) || defined(BELOW_LINE_COLOR) || defined(ORIGIN_MARKER)
uniform vec3 cameraPosition;
uniform vec2 viewportSize;
#endif

#ifdef HORIZON_FADE
uniform vec3 cameraDirection;
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

    #ifdef ANTIALIAS_COSINE
    fractionPartOfPosition = clamp(fractionPartOfPosition, -1., 1.);
    float result = 0.5 + 0.5 * cos(fractionPartOfPosition * PI); // Convert to 0-1 for antialiasing.
    return result;
    #else
    return abs(fractionPartOfPosition) < SQRT2 / 4. ? 1. : 0.;
    #endif
}

#if defined(ANTIALIAS_BOX) || defined(ORIGIN_MARKER)
float filteredGrid(vec2 p, vec2 dpdx, vec2 dpdy, float normLineWidth, bool noRepeat) {
    float N = 1.0 / normLineWidth;
    vec2 w = max(abs(dpdx), abs(dpdy)) + normLineWidth * 0.001;
    vec2 a = p + 0.5 * w;
    vec2 b = p - 0.5 * w;
    if (noRepeat) {
        a = clamp(a, vec2(0.0), vec2(1.0));
        b = clamp(b, vec2(0.0), vec2(1.0));
    }
    vec2 NW = N * w;
    if (NW.x == 0.0 || NW.y == 0.0) return 1.0;
    vec2 i = (floor(a) + min(fract(a) * N, 1.0) - floor(b) - min(fract(b) * N, 1.0)) / NW;
    return 1.0 - (1.0 - i.x) * (1.0 - i.y);
}

float gridWithUnitSpacing(vec2 p, float normLineWidth, float gridUnitSpacing, bool noRepeat) {
    vec2 uv = p / gridUnitSpacing + vec2(normLineWidth * 0.5);
    vec2 ddx_uv = dFdx(uv);
    vec2 ddy_uv = dFdy(uv);
    return filteredGrid(uv, ddx_uv, ddy_uv, normLineWidth, noRepeat);
}
#endif

float contributionOnAxis(float position, float tcLineWidthCap, float thicknessModifier) {
    float ddx = dFdx(position);
    float ddy = dFdy(position);
    float differentialLength = length(vec2(ddx, ddy)) * SQRT2;

    if (tcLineWidthCap > 0.0) {
        differentialLength = max(differentialLength, tcLineWidthCap);
    }

    float lineWidth = differentialLength * thicknessModifier;
    float result;

#ifdef ANTIALIAS_BOX
    float normLineWidth = lineWidth;
    float N = 1.0 / normLineWidth;
    float p = position + normLineWidth * 0.5;
    float w = max(abs(ddx), abs(ddy)) + normLineWidth * 0.001;
    float a = p + 0.5 * w;
    float b = p - 0.5 * w;
    float NW = N * w;
    result = NW > 0.0
        ? clamp((floor(a) + min(fract(a) * N, 1.0) - floor(b) - min(fract(b) * N, 1.0)) / NW, 0.0, 1.0)
        : 0.0;
#else
    result = isPointOnLine(position, lineWidth);
#endif

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
    tcLineWidthCap = 0.004 * tc / viewportSize.y;
    vec3 rd = normalize(vWorldPos - cameraPosition);
    if (abs(rd.y) > 0.99) {
        horizonFade = 1.0;
    } else {
        vec3 flatRayDir = normalize(vec3(rd.x, 0.0, rd.z));
        horizonFade = -pow(abs(dot(rd, flatRayDir)), 400.0) + 1.0;
    }
#endif

    // --- Grid value ---
    float grid = 0.0;

#ifdef MULTI_SCALE
    for (int i = 0; i < MAX_OCTAVES; i++) {
        if (i >= gridOctaves) break;
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

    // --- Origin marker (world-origin crosshair, box-filter only) ---
#ifdef ORIGIN_MARKER
    float tcOrigin = 0.00000015 * tc / viewportSize.y;
    float ox = contributionOnAxis(vWorldPos.x / 10000000.0, tcOrigin, gridThicknessModifier);
    float oz = contributionOnAxis(vWorldPos.z / 10000000.0, tcOrigin, gridThicknessModifier);
    float originMask = clamp(ox + oz, 0.0, 1.0) * horizonFade;
    if (originMask > 0.0001) grid = originMask;
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
#ifdef TRANSPARENT
    if (grid < 0.01) discard;
    opacity = clamp(grid, 0.08, gridControl.w * grid);
#endif

#ifdef OPACITY
	opacity *= texture2D(opacitySampler, vOpacityUV).a;
#endif

    // Apply the color.
    gl_FragColor = vec4(color.rgb, opacity * visibility);

#ifdef TRANSPARENT
    #ifdef PREMULTIPLYALPHA
        gl_FragColor.rgb *= opacity;
    #endif
#else
#endif

#include<logDepthFragment>

#include<imageProcessingCompatibility>

#define CUSTOM_FRAGMENT_MAIN_END
}
