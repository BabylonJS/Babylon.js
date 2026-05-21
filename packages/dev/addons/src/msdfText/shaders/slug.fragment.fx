// Slug GPU Font - Fragment Shader (GLSL)
//
// Based on Eric Lengyel's Slug algorithm.
// Computes glyph coverage from Bezier curve data and outputs anti-aliased pixels.
//
// Outline mode (slugOutline.x > 0): renders only fragments within W pixels of a glyph
// boundary by sampling Slug's exact coverage at 4 cardinal offsets W pixels away.
// A fragment is "in the rim" if at least one of its neighbours falls outside the glyph,
// i.e. min(neighbours) < 1. Result = covCenter * (1 - min(neighbours)), so the deep
// interior becomes hollow while the rim around every part of the glyph stays solid and
// uniformly W pixels wide regardless of stroke direction.

precision highp float;
#define TEX_WIDTH 4096
#define LOG_TEX_WIDTH 12

uniform highp sampler2D curveData;
uniform highp sampler2D bandData;
uniform vec4 slugColor;
uniform vec4 slugOutline;

varying vec4 vColor;
varying vec2 vTexcoord;
flat varying vec4 vBanding;
flat varying vec4 vGlyph;

int CalcRootCode(float y1, float y2, float y3) {
    int i1 = (y1 < 0.0) ? 1 : 0;
    int i2 = (y2 < 0.0) ? 2 : 0;
    int i3 = (y3 < 0.0) ? 4 : 0;
    int shift = i1 + i2 + i3;
    return (0x2E74 >> shift) & 0x0101;
}

vec2 SolveHorizPoly(vec4 p12, vec2 p3) {
    vec2 a = vec2(p12.x - p12.z * 2.0 + p3.x, p12.y - p12.w * 2.0 + p3.y);
    vec2 b = vec2(p12.x - p12.z, p12.y - p12.w);
    float ra = 1.0 / a.y;
    float rb = 0.5 / b.y;
    float disc = sqrt(max(b.y * b.y - a.y * p12.y, 0.0));
    float t1 = (b.y - disc) * ra;
    float t2 = (b.y + disc) * ra;
    if (abs(a.y) <= max(abs(b.y), abs(p12.y)) * 1.0e-4) {
        t1 = p12.y * rb;
        t2 = p12.y * rb;
    }
    return vec2((a.x * t1 - b.x * 2.0) * t1 + p12.x, (a.x * t2 - b.x * 2.0) * t2 + p12.x);
}

vec2 SolveVertPoly(vec4 p12, vec2 p3) {
    vec2 a = vec2(p12.x - p12.z * 2.0 + p3.x, p12.y - p12.w * 2.0 + p3.y);
    vec2 b = vec2(p12.x - p12.z, p12.y - p12.w);
    float ra = 1.0 / a.x;
    float rb = 0.5 / b.x;
    float disc = sqrt(max(b.x * b.x - a.x * p12.x, 0.0));
    float t1 = (b.x - disc) * ra;
    float t2 = (b.x + disc) * ra;
    if (abs(a.x) <= max(abs(b.x), abs(p12.x)) * 1.0e-4) {
        t1 = p12.x * rb;
        t2 = p12.x * rb;
    }
    return vec2((a.y * t1 - b.y * 2.0) * t1 + p12.y, (a.y * t2 - b.y * 2.0) * t2 + p12.y);
}

ivec2 CalcBandLoc(ivec2 glyphLoc, int offset) {
    ivec2 bandLoc = ivec2(glyphLoc.x + offset, glyphLoc.y);
    bandLoc.y += bandLoc.x >> LOG_TEX_WIDTH;
    bandLoc.x &= (1 << LOG_TEX_WIDTH) - 1;
    return bandLoc;
}

// Slug coverage at an arbitrary em-space position. Reads the same curve and band data
// as the original single-sample version; pulled into a function so the outline mode can
// re-evaluate coverage at offset positions to detect proximity to the glyph boundary.
float ApproxCoverage(vec2 renderCoord, vec2 pixelsPerEm, ivec2 glyphLoc, ivec2 bandMax, vec4 bandTransform) {
    ivec2 bandIndex = clamp(
        ivec2(renderCoord * bandTransform.xy + bandTransform.zw),
        ivec2(0, 0),
        bandMax
    );

    float xcov = 0.0;
    float xwgt = 0.0;
    vec4 hbandRaw = texelFetch(bandData, ivec2(glyphLoc.x + bandIndex.y, glyphLoc.y), 0);
    int hbandCount = int(hbandRaw.x + 0.5);
    int hbandOffset = int(hbandRaw.y + 0.5);
    ivec2 hbandLoc = CalcBandLoc(glyphLoc, hbandOffset);
    for (int ci = 0; ci < hbandCount; ci++) {
        vec4 locRaw = texelFetch(bandData, ivec2(hbandLoc.x + ci, hbandLoc.y), 0);
        ivec2 curveLoc = ivec2(int(locRaw.x + 0.5), int(locRaw.y + 0.5));
        vec4 p12 = texelFetch(curveData, curveLoc, 0) - vec4(renderCoord, renderCoord);
        vec2 p3 = texelFetch(curveData, ivec2(curveLoc.x + 1, curveLoc.y), 0).xy - renderCoord;
        if (max(max(p12.x, p12.z), p3.x) * pixelsPerEm.x < -0.5) {
            break;
        }
        int code = CalcRootCode(p12.y, p12.w, p3.y);
        if (code != 0) {
            vec2 r = SolveHorizPoly(p12, p3) * pixelsPerEm.x;
            if ((code & 1) != 0) {
                xcov += clamp(r.x + 0.5, 0.0, 1.0);
                xwgt = max(xwgt, clamp(1.0 - abs(r.x) * 2.0, 0.0, 1.0));
            }
            if (code > 1) {
                xcov -= clamp(r.y + 0.5, 0.0, 1.0);
                xwgt = max(xwgt, clamp(1.0 - abs(r.y) * 2.0, 0.0, 1.0));
            }
        }
    }

    float ycov = 0.0;
    float ywgt = 0.0;
    vec4 vbandRaw = texelFetch(bandData, ivec2(glyphLoc.x + bandMax.y + 1 + bandIndex.x, glyphLoc.y), 0);
    int vbandCount = int(vbandRaw.x + 0.5);
    int vbandOffset = int(vbandRaw.y + 0.5);
    ivec2 vbandLoc = CalcBandLoc(glyphLoc, vbandOffset);
    for (int ci = 0; ci < vbandCount; ci++) {
        vec4 locRaw = texelFetch(bandData, ivec2(vbandLoc.x + ci, vbandLoc.y), 0);
        ivec2 curveLoc = ivec2(int(locRaw.x + 0.5), int(locRaw.y + 0.5));
        vec4 p12 = texelFetch(curveData, curveLoc, 0) - vec4(renderCoord, renderCoord);
        vec2 p3 = texelFetch(curveData, ivec2(curveLoc.x + 1, curveLoc.y), 0).xy - renderCoord;
        if (max(max(p12.y, p12.w), p3.y) * pixelsPerEm.y < -0.5) {
            break;
        }
        int code = CalcRootCode(p12.x, p12.z, p3.x);
        if (code != 0) {
            vec2 r = SolveVertPoly(p12, p3) * pixelsPerEm.y;
            if ((code & 1) != 0) {
                ycov -= clamp(r.x + 0.5, 0.0, 1.0);
                ywgt = max(ywgt, clamp(1.0 - abs(r.x) * 2.0, 0.0, 1.0));
            }
            if (code > 1) {
                ycov += clamp(r.y + 0.5, 0.0, 1.0);
                ywgt = max(ywgt, clamp(1.0 - abs(r.y) * 2.0, 0.0, 1.0));
            }
        }
    }

    float coverage = max(
        abs(xcov * xwgt + ycov * ywgt) / max(xwgt + ywgt, 1.0 / 65536.0),
        min(abs(xcov), abs(ycov))
    );
    return clamp(coverage, 0.0, 1.0);
}

void main(void) {
    vec2 renderCoord = vTexcoord;
    vec2 emsPerPixel = fwidth(renderCoord);
    vec2 pixelsPerEm = 1.0 / emsPerPixel;

    ivec2 glyphLoc = ivec2(int(vGlyph.x + 0.5), int(vGlyph.y + 0.5));
    ivec2 bandMax = ivec2(int(vGlyph.z + 0.5), int(vGlyph.w + 0.5));
    vec4 bandTransform = vBanding;

    float covCenter = ApproxCoverage(renderCoord, pixelsPerEm, glyphLoc, bandMax, bandTransform);
    float result = covCenter;

    float W = slugOutline.x;
    if (W > 0.0) {
        // Sample coverage at 8 offsets W pixels away (4 cardinal + 4 diagonal). A
        // fragment is "rim" if at least one neighbour falls outside the glyph
        // (coverage < 1). 8 samples (vs 4) close gaps at sharp inside corners /
        // T-junctions where the exterior sector is narrower than 90° and would not
        // be hit by any cardinal direction.
        float Wd = W * 0.70710678;  // 1/sqrt(2)
        vec2 dx  = vec2(emsPerPixel.x * W,  0.0);
        vec2 dy  = vec2(0.0, emsPerPixel.y * W);
        vec2 dxd = vec2(emsPerPixel.x * Wd, emsPerPixel.y * Wd);
        vec2 dyd = vec2(emsPerPixel.x * Wd, -emsPerPixel.y * Wd);
        float cE  = ApproxCoverage(renderCoord + dx,  pixelsPerEm, glyphLoc, bandMax, bandTransform);
        float cW  = ApproxCoverage(renderCoord - dx,  pixelsPerEm, glyphLoc, bandMax, bandTransform);
        float cN  = ApproxCoverage(renderCoord + dy,  pixelsPerEm, glyphLoc, bandMax, bandTransform);
        float cS  = ApproxCoverage(renderCoord - dy,  pixelsPerEm, glyphLoc, bandMax, bandTransform);
        float cNE = ApproxCoverage(renderCoord + dxd, pixelsPerEm, glyphLoc, bandMax, bandTransform);
        float cSW = ApproxCoverage(renderCoord - dxd, pixelsPerEm, glyphLoc, bandMax, bandTransform);
        float cSE = ApproxCoverage(renderCoord + dyd, pixelsPerEm, glyphLoc, bandMax, bandTransform);
        float cNW = ApproxCoverage(renderCoord - dyd, pixelsPerEm, glyphLoc, bandMax, bandTransform);
        float innerMin = min(min(min(cE, cW), min(cN, cS)), min(min(cNE, cSW), min(cSE, cNW)));
        result = covCenter * (1.0 - innerMin);

        // Screen-space dashed outline: pick the dominant tangent axis (from the existing
        // ±W coverage samples) and use that single screen coordinate as the arc-length
        // proxy. Projecting onto the full tangent vector amplifies tangent noise by the
        // distance-to-origin; using one axis avoids that and yields clean dashes for
        // axis-aligned and near-axis-aligned rim segments.
        if (slugOutline.y > 0.5) {
            vec2 grad = vec2(cE - cW, cN - cS);
            vec2 tangent = vec2(-grad.y, grad.x);
            float arcLength = (abs(tangent.x) >= abs(tangent.y)) ? gl_FragCoord.x : gl_FragCoord.y;
            float dashPeriod = max(W * 4.0, 12.0);
            float dashOn = step(0.5, fract(arcLength / dashPeriod));
            result *= dashOn;
        }
    }

    gl_FragColor = vColor * slugColor * result;
}
