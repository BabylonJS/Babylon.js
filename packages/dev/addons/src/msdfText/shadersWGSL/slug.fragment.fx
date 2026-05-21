// Slug GPU Font - Fragment Shader (WGSL)
//
// Based on Eric Lengyel's Slug algorithm.
// Evaluates quadratic Bezier curve coverage per pixel using band-organized data.
//
// Outline mode (slugOutline.x > 0): renders only fragments within W pixels of a glyph
// boundary by sampling Slug's exact coverage at 4 cardinal offsets W pixels away.
// A fragment is "rim" if at least one neighbour falls outside the glyph (coverage < 1).
// Result = covCenter * (1 - min(neighbours)) → hollow interior, uniform rim width.

// Textures (both RGBA32Float — band data stores integers as floats)
var curveData: texture_2d<f32>;
var curveDataSampler: sampler;
var bandData: texture_2d<f32>;
var bandDataSampler: sampler;

uniform slugColor: vec4f;
uniform slugOutline: vec4f;

// Varyings
varying vColor: vec4f;
varying vTexcoord: vec2f;
flat varying vBanding: vec4f;    // (bandScaleX, bandScaleY, bandOffsetX, bandOffsetY)
flat varying vGlyph: vec4f;      // (glyphLocX, glyphLocY, bandMaxX, bandMaxY)

fn CalcRootCode(y1: f32, y2: f32, y3: f32) -> i32 {
    let i1: i32 = select(0, 1, y1 < 0.0);
    let i2: i32 = select(0, 2, y2 < 0.0);
    let i3: i32 = select(0, 4, y3 < 0.0);
    let shift = u32(i1 + i2 + i3);
    return (0x2E74 >> shift) & 0x0101;
}

fn SolveHorizPoly(p12: vec4f, p3: vec2f) -> vec2f {
    let a = vec2f(p12.x - p12.z * 2.0 + p3.x, p12.y - p12.w * 2.0 + p3.y);
    let b = vec2f(p12.x - p12.z, p12.y - p12.w);
    let ra = 1.0 / a.y;
    let rb = 0.5 / b.y;

    let disc = sqrt(max(b.y * b.y - a.y * p12.y, 0.0));
    var t1 = (b.y - disc) * ra;
    var t2 = (b.y + disc) * ra;

    if (abs(a.y) <= max(abs(b.y), abs(p12.y)) * 1.0e-4) {
        t1 = p12.y * rb;
        t2 = p12.y * rb;
    }

    return vec2f((a.x * t1 - b.x * 2.0) * t1 + p12.x, (a.x * t2 - b.x * 2.0) * t2 + p12.x);
}

fn SolveVertPoly(p12: vec4f, p3: vec2f) -> vec2f {
    let a = vec2f(p12.x - p12.z * 2.0 + p3.x, p12.y - p12.w * 2.0 + p3.y);
    let b = vec2f(p12.x - p12.z, p12.y - p12.w);
    let ra = 1.0 / a.x;
    let rb = 0.5 / b.x;

    let disc = sqrt(max(b.x * b.x - a.x * p12.x, 0.0));
    var t1 = (b.x - disc) * ra;
    var t2 = (b.x + disc) * ra;

    if (abs(a.x) <= max(abs(b.x), abs(p12.x)) * 1.0e-4) {
        t1 = p12.x * rb;
        t2 = p12.x * rb;
    }

    return vec2f((a.y * t1 - b.y * 2.0) * t1 + p12.y, (a.y * t2 - b.y * 2.0) * t2 + p12.y);
}

fn CalcBandLoc(glyphLoc: vec2<i32>, offset: i32) -> vec2<i32> {
    var bandLoc = vec2<i32>(glyphLoc.x + offset, glyphLoc.y);
    bandLoc.y = bandLoc.y + (bandLoc.x >> 12u);
    bandLoc.x = bandLoc.x & 4095;
    return bandLoc;
}

// Slug coverage at an arbitrary em-space position. Pulled into a function so the outline
// mode can re-evaluate coverage at offset positions to detect proximity to the boundary.
fn ApproxCoverage(renderCoord: vec2f, pixelsPerEm: vec2f, glyphLoc: vec2<i32>, bandMax: vec2<i32>, bandTransform: vec4f) -> f32 {
    let bandIndex = clamp(
        vec2<i32>(renderCoord * bandTransform.xy + bandTransform.zw),
        vec2<i32>(0, 0),
        bandMax
    );

    var xcov: f32 = 0.0;
    var xwgt: f32 = 0.0;

    let hbandRaw = textureLoad(bandData, vec2<i32>(glyphLoc.x + bandIndex.y, glyphLoc.y), 0);
    let hbandCount = i32(hbandRaw.x + 0.5);
    let hbandOffset = i32(hbandRaw.y + 0.5);
    let hbandLoc = CalcBandLoc(glyphLoc, hbandOffset);

    for (var ci: i32 = 0; ci < hbandCount; ci = ci + 1) {
        let locRaw = textureLoad(bandData, vec2<i32>(hbandLoc.x + ci, hbandLoc.y), 0);
        let curveLoc = vec2<i32>(i32(locRaw.x + 0.5), i32(locRaw.y + 0.5));

        let p12 = textureLoad(curveData, curveLoc, 0) - vec4f(renderCoord, renderCoord);
        let p3 = textureLoad(curveData, vec2<i32>(curveLoc.x + 1, curveLoc.y), 0).xy - renderCoord;

        if (max(max(p12.x, p12.z), p3.x) * pixelsPerEm.x < -0.5) {
            break;
        }

        let code = CalcRootCode(p12.y, p12.w, p3.y);
        if (code != 0) {
            let r = SolveHorizPoly(p12, p3) * pixelsPerEm.x;

            if ((code & 1) != 0) {
                xcov = xcov + clamp(r.x + 0.5, 0.0, 1.0);
                xwgt = max(xwgt, clamp(1.0 - abs(r.x) * 2.0, 0.0, 1.0));
            }
            if (code > 1) {
                xcov = xcov - clamp(r.y + 0.5, 0.0, 1.0);
                xwgt = max(xwgt, clamp(1.0 - abs(r.y) * 2.0, 0.0, 1.0));
            }
        }
    }

    var ycov: f32 = 0.0;
    var ywgt: f32 = 0.0;

    let vbandRaw = textureLoad(bandData, vec2<i32>(glyphLoc.x + bandMax.y + 1 + bandIndex.x, glyphLoc.y), 0);
    let vbandCount = i32(vbandRaw.x + 0.5);
    let vbandOffset = i32(vbandRaw.y + 0.5);
    let vbandLoc = CalcBandLoc(glyphLoc, vbandOffset);

    for (var ci: i32 = 0; ci < vbandCount; ci = ci + 1) {
        let locRaw = textureLoad(bandData, vec2<i32>(vbandLoc.x + ci, vbandLoc.y), 0);
        let curveLoc = vec2<i32>(i32(locRaw.x + 0.5), i32(locRaw.y + 0.5));

        let p12 = textureLoad(curveData, curveLoc, 0) - vec4f(renderCoord, renderCoord);
        let p3 = textureLoad(curveData, vec2<i32>(curveLoc.x + 1, curveLoc.y), 0).xy - renderCoord;

        if (max(max(p12.y, p12.w), p3.y) * pixelsPerEm.y < -0.5) {
            break;
        }

        let code = CalcRootCode(p12.x, p12.z, p3.x);
        if (code != 0) {
            let r = SolveVertPoly(p12, p3) * pixelsPerEm.y;

            if ((code & 1) != 0) {
                ycov = ycov - clamp(r.x + 0.5, 0.0, 1.0);
                ywgt = max(ywgt, clamp(1.0 - abs(r.x) * 2.0, 0.0, 1.0));
            }
            if (code > 1) {
                ycov = ycov + clamp(r.y + 0.5, 0.0, 1.0);
                ywgt = max(ywgt, clamp(1.0 - abs(r.y) * 2.0, 0.0, 1.0));
            }
        }
    }

    let coverage = max(
        abs(xcov * xwgt + ycov * ywgt) / max(xwgt + ywgt, 1.0 / 65536.0),
        min(abs(xcov), abs(ycov))
    );
    return clamp(coverage, 0.0, 1.0);
}

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    let renderCoord = fragmentInputs.vTexcoord;
    let emsPerPixel = fwidth(renderCoord);
    let pixelsPerEm = 1.0 / emsPerPixel;

    let glyphLoc = vec2<i32>(i32(fragmentInputs.vGlyph.x + 0.5), i32(fragmentInputs.vGlyph.y + 0.5));
    let bandMax = vec2<i32>(i32(fragmentInputs.vGlyph.z + 0.5), i32(fragmentInputs.vGlyph.w + 0.5));
    let bandTransform = fragmentInputs.vBanding;

    let covCenter = ApproxCoverage(renderCoord, pixelsPerEm, glyphLoc, bandMax, bandTransform);
    var result = covCenter;

    let W = uniforms.slugOutline.x;
    if (W > 0.0) {
        // Sample coverage at 8 offsets W pixels away (4 cardinal + 4 diagonal). 8 samples
        // close gaps at sharp inside corners / T-junctions where the exterior sector is
        // narrower than 90° and would not be hit by any cardinal direction alone.
        let Wd = W * 0.70710678;
        let dx  = vec2f(emsPerPixel.x * W,  0.0);
        let dy  = vec2f(0.0, emsPerPixel.y * W);
        let dxd = vec2f(emsPerPixel.x * Wd, emsPerPixel.y * Wd);
        let dyd = vec2f(emsPerPixel.x * Wd, -emsPerPixel.y * Wd);
        let cE  = ApproxCoverage(renderCoord + dx,  pixelsPerEm, glyphLoc, bandMax, bandTransform);
        let cW  = ApproxCoverage(renderCoord - dx,  pixelsPerEm, glyphLoc, bandMax, bandTransform);
        let cN  = ApproxCoverage(renderCoord + dy,  pixelsPerEm, glyphLoc, bandMax, bandTransform);
        let cS  = ApproxCoverage(renderCoord - dy,  pixelsPerEm, glyphLoc, bandMax, bandTransform);
        let cNE = ApproxCoverage(renderCoord + dxd, pixelsPerEm, glyphLoc, bandMax, bandTransform);
        let cSW = ApproxCoverage(renderCoord - dxd, pixelsPerEm, glyphLoc, bandMax, bandTransform);
        let cSE = ApproxCoverage(renderCoord + dyd, pixelsPerEm, glyphLoc, bandMax, bandTransform);
        let cNW = ApproxCoverage(renderCoord - dyd, pixelsPerEm, glyphLoc, bandMax, bandTransform);
        let innerMin = min(min(min(cE, cW), min(cN, cS)), min(min(cNE, cSW), min(cSE, cNW)));
        result = covCenter * (1.0 - innerMin);

        // Screen-space dashed outline: pick the dominant tangent axis and use that single
        // screen coordinate as arc-length proxy. Avoids amplifying tangent noise by the
        // distance-to-origin (which happens when projecting onto the full tangent vector).
        if (uniforms.slugOutline.y > 0.5) {
            let grad = vec2f(cE - cW, cN - cS);
            let tangent = vec2f(-grad.y, grad.x);
            let arcLength = select(fragmentInputs.position.y, fragmentInputs.position.x, abs(tangent.x) >= abs(tangent.y));
            let dashPeriod = max(W * 4.0, 12.0);
            let dashOn = step(0.5, fract(arcLength / dashPeriod));
            result = result * dashOn;
        }
    }

    fragmentOutputs.color = fragmentInputs.vColor * uniforms.slugColor * result;
}
