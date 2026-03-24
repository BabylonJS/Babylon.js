// Slug GPU Font - Fragment Shader (GLSL)
//
// Based on Eric Lengyel's Slug algorithm.
// Evaluates quadratic Bezier curve coverage per pixel using band-organized data.

precision highp float;

// Texture width constant
#define TEX_WIDTH 4096
#define LOG_TEX_WIDTH 12

// Textures (both RGBA32Float — band data stores integers as floats)
uniform highp sampler2D curveData;
uniform highp sampler2D bandData;
uniform vec4 slugColor;

// Varyings
varying vec4 vColor;
varying vec2 vTexcoord;
flat varying vec4 vBanding;   // (bandScaleX, bandScaleY, bandOffsetX, bandOffsetY)
flat varying vec4 vGlyph;     // (glyphLocX, glyphLocY, bandMaxX, bandMaxY)

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

void main(void) {
    vec2 renderCoord = vTexcoord;
    vec2 emsPerPixel = fwidth(renderCoord);
    vec2 pixelsPerEm = 1.0 / emsPerPixel;

    ivec2 glyphLoc = ivec2(int(vGlyph.x + 0.5), int(vGlyph.y + 0.5));
    ivec2 bandMax = ivec2(int(vGlyph.z + 0.5), int(vGlyph.w + 0.5));
    vec4 bandTransform = vBanding;

    ivec2 bandIndex = clamp(
        ivec2(renderCoord * bandTransform.xy + bandTransform.zw),
        ivec2(0, 0),
        bandMax
    );

    // === Horizontal band processing ===
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

    // === Vertical band processing ===
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

    // Combine coverages
    float coverage = max(
        abs(xcov * xwgt + ycov * ywgt) / max(xwgt + ywgt, 1.0 / 65536.0),
        min(abs(xcov), abs(ycov))
    );
    coverage = clamp(coverage, 0.0, 1.0);

    gl_FragColor = vColor * slugColor * coverage;
}
