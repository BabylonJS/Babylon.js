/**
 * Core Slug GPU font rendering algorithm.
 *
 * Extracts quadratic Bézier curves from font glyphs, organizes them into
 * spatial bands, and packs the data into GPU-ready textures for real-time
 * rendering. Based on Eric Lengyel's Slug algorithm.
 */

import type { Font } from "text-shaper";
import { getGlyphPath, UnicodeBuffer, shape } from "text-shaper";

const TEX_WIDTH = 4096;

/**
 * Axis-aligned bounding box.
 */
export interface SlugBounds {
    /** Minimum X coordinate */
    xMin: number;
    /** Minimum Y coordinate */
    yMin: number;
    /** Maximum X coordinate */
    xMax: number;
    /** Maximum Y coordinate */
    yMax: number;
}

/**
 * A quadratic Bézier curve with start (p0), control (p1), and end (p2) points.
 */
export interface QuadCurve {
    /** Start point X */
    p0x: number;
    /** Start point Y */
    p0y: number;
    /** Control point X */
    p1x: number;
    /** Control point Y */
    p1y: number;
    /** End point X */
    p2x: number;
    /** End point Y */
    p2y: number;
}

/**
 * A single band entry containing indices of curves that intersect this band.
 */
export interface BandEntry {
    /** Indices into the parent glyph's curve array */
    curveIndices: number[];
}

/**
 * Horizontal and vertical band data for a glyph.
 */
export interface GlyphBands {
    /** Horizontal bands (partitioned by Y) */
    hBands: BandEntry[];
    /** Vertical bands (partitioned by X) */
    vBands: BandEntry[];
    /** Number of horizontal bands */
    hBandCount: number;
    /** Number of vertical bands */
    vBandCount: number;
}

/**
 * Processed glyph data ready for GPU rendering.
 */
export interface SlugGlyph {
    /** Glyph index from the font */
    glyphId: number;
    /** Quadratic Bézier curves composing the glyph outline */
    curves: QuadCurve[];
    /** Spatial band organization */
    bands: GlyphBands;
    /** Bounding box in em-space */
    bounds: SlugBounds;
}

/**
 * Layout options for text rendering, matching the MSDF paragraph system.
 */
export interface SlugLayoutOptions {
    /** Maximum line width in pixels before wrapping. Default: Infinity (no wrap) */
    maxWidth?: number;
    /** Line height multiplier. Default: 1.2 */
    lineHeight?: number;
    /** Text alignment: "left", "center", or "right". Default: "left" */
    textAlign?: "left" | "center" | "right";
    /** Extra letter spacing in font units. Default: 0 */
    letterSpacing?: number;
    /** Tab size in spaces. Default: 4 */
    tabSize?: number;
}

/**
 * Result from prepareText containing all GPU-ready data.
 */
export interface SlugTextData {
    /** Processed glyph data */
    slugGlyphs: SlugGlyph[];
    /** Interleaved vertex data (5 × vec4 = 80 bytes per vertex) */
    vertices: Float32Array;
    /** Triangle indices (6 per glyph quad) */
    indices: Uint32Array;
    /** Curve texture data (RGBA32Float, width 4096) */
    curveTexData: Float32Array;
    /** Band texture data (RGBA32Float, width 4096) — integers stored as floats */
    bandTexData: Float32Array;
    /** Height of curve texture in texels */
    curveTexHeight: number;
    /** Height of band texture in texels */
    bandTexHeight: number;
    /** Total horizontal advance in font units */
    totalAdvance: number;
    /** Total width of the laid-out text in pixels */
    layoutWidth: number;
    /** Total height of the laid-out text in pixels */
    layoutHeight: number;
}

/**
 * Extract quadratic Bézier curves from a glyph's outline path.
 * Line segments become degenerate quadratics (control point at midpoint).
 * Cubic Bézier curves are subdivided into two quadratics.
 * @param font - The loaded Font instance
 * @param glyphId - The glyph index to extract
 * @returns Curves and bounds, or null if the glyph has no outline
 */
export function extractCurves(font: Font, glyphId: number): { curves: QuadCurve[]; bounds: SlugBounds } | null {
    const path = getGlyphPath(font, glyphId);
    if (!path || !path.bounds) {
        return null;
    }

    const curves: QuadCurve[] = [];
    let curX = 0,
        curY = 0;
    let startX = 0,
        startY = 0;

    for (const cmd of path.commands) {
        switch (cmd.type) {
            case "M":
                curX = cmd.x;
                curY = cmd.y;
                startX = cmd.x;
                startY = cmd.y;
                break;

            case "L": {
                const dx = cmd.x - curX;
                const dy = cmd.y - curY;
                if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
                    curX = cmd.x;
                    curY = cmd.y;
                    break;
                }
                const mx = (curX + cmd.x) / 2;
                const my = (curY + cmd.y) / 2;
                curves.push({ p0x: curX, p0y: curY, p1x: mx, p1y: my, p2x: cmd.x, p2y: cmd.y });
                curX = cmd.x;
                curY = cmd.y;
                break;
            }

            case "Q":
                curves.push({ p0x: curX, p0y: curY, p1x: cmd.x1, p1y: cmd.y1, p2x: cmd.x, p2y: cmd.y });
                curX = cmd.x;
                curY = cmd.y;
                break;

            case "C": {
                // Approximate cubic Bézier with two quadratics using the 3/4 ratio method.
                const cx1 = cmd.x1,
                    cy1 = cmd.y1;
                const cx2 = cmd.x2,
                    cy2 = cmd.y2;
                const ex = cmd.x,
                    ey = cmd.y;

                // Quadratic control points at 3/4 of the way toward the cubic control points
                const c0x = curX + (cx1 - curX) * 0.75,
                    c0y = curY + (cy1 - curY) * 0.75;
                const c1x = ex + (cx2 - ex) * 0.75,
                    c1y = ey + (cy2 - ey) * 0.75;
                const midx = (c0x + c1x) * 0.5,
                    midy = (c0y + c1y) * 0.5;

                curves.push({ p0x: curX, p0y: curY, p1x: c0x, p1y: c0y, p2x: midx, p2y: midy });
                curves.push({ p0x: midx, p0y: midy, p1x: c1x, p1y: c1y, p2x: ex, p2y: ey });
                curX = ex;
                curY = ey;
                break;
            }

            case "Z": {
                const cdx = startX - curX;
                const cdy = startY - curY;
                if (Math.abs(cdx) > 0.1 || Math.abs(cdy) > 0.1) {
                    const mx = (curX + startX) / 2;
                    const my = (curY + startY) / 2;
                    curves.push({ p0x: curX, p0y: curY, p1x: mx, p1y: my, p2x: startX, p2y: startY });
                }
                curX = startX;
                curY = startY;
                break;
            }
        }
    }

    return { curves, bounds: path.bounds as SlugBounds };
}

/**
 * Organize curves into horizontal and vertical bands for efficient GPU lookup.
 * @param curves - Array of quadratic Bézier curves
 * @param bounds - Glyph bounding box
 * @param bandCount - Number of bands per axis (default: auto based on curve count, max 8)
 * @returns Band organization data
 */
export function buildBands(curves: QuadCurve[], bounds: SlugBounds, bandCount?: number): GlyphBands {
    // Dynamic band count: clamp(curveCount/2, 1, 8)
    const numBands = bandCount ?? Math.max(1, Math.min(8, Math.floor(curves.length / 2)));
    const { xMin, yMin, xMax, yMax } = bounds;
    const width = xMax - xMin;
    const height = yMax - yMin;
    const bandH = height / numBands;
    const bandW = width / numBands;

    const hBands: BandEntry[] = [];
    for (let i = 0; i < numBands; i++) {
        hBands.push({ curveIndices: [] });
    }

    const vBands: BandEntry[] = [];
    for (let i = 0; i < numBands; i++) {
        vBands.push({ curveIndices: [] });
    }

    // Assign curves to bands using inclusive overlap.
    for (let ci = 0; ci < curves.length; ci++) {
        const c = curves[ci];
        const cyMin = Math.min(c.p0y, c.p1y, c.p2y);
        const cyMax = Math.max(c.p0y, c.p1y, c.p2y);
        const cxMin = Math.min(c.p0x, c.p1x, c.p2x);
        const cxMax = Math.max(c.p0x, c.p1x, c.p2x);

        // Horizontal bands: check overlap with inclusive boundaries (>= / <=)
        if (height > 0) {
            for (let b = 0; b < numBands; b++) {
                const bMinY = yMin + b * bandH;
                const bMaxY = yMin + (b + 1) * bandH;
                if (cyMax >= bMinY && cyMin <= bMaxY) {
                    hBands[b].curveIndices.push(ci);
                }
            }
        }

        // Vertical bands: check overlap with inclusive boundaries (>= / <=)
        if (width > 0) {
            for (let b = 0; b < numBands; b++) {
                const bMinX = xMin + b * bandW;
                const bMaxX = xMin + (b + 1) * bandW;
                if (cxMax >= bMinX && cxMin <= bMaxX) {
                    vBands[b].curveIndices.push(ci);
                }
            }
        }
    }

    return { hBands, vBands, hBandCount: numBands, vBandCount: numBands };
}

/**
 * Pack glyph curve and band data into GPU textures.
 * Both textures use RGBA32Float format (band integers stored as floats).
 * @param glyphs - Array of processed glyphs
 * @returns Texture data and per-glyph metadata
 */
export function packGlyphData(glyphs: SlugGlyph[]) {
    // --- Curve texture (RGBA32Float, width 4096) ---
    // Each curve = 2 texels: (p0x, p0y, p1x, p1y) and (p2x, p2y, 0, 0)
    let totalCurveTexels = 0;
    for (const g of glyphs) {
        totalCurveTexels += g.curves.length * 2;
    }

    const curveTexHeight = Math.max(1, Math.ceil(totalCurveTexels / TEX_WIDTH));
    const curveTexData = new Float32Array(TEX_WIDTH * curveTexHeight * 4);

    let curveTexelIdx = 0;
    const glyphCurveStarts: number[] = [];

    for (const g of glyphs) {
        glyphCurveStarts.push(curveTexelIdx);
        for (const c of g.curves) {
            // Prevent a single curve's 2 texels from spanning a row boundary
            const row0 = (curveTexelIdx / TEX_WIDTH) | 0;
            const row1 = ((curveTexelIdx + 1) / TEX_WIDTH) | 0;
            if (row0 !== row1) {
                curveTexelIdx = row1 * TEX_WIDTH;
            }

            // Texel 0: (p0x, p0y, p1x, p1y)
            const i0 = curveTexelIdx;
            const x0 = i0 % TEX_WIDTH,
                y0 = (i0 / TEX_WIDTH) | 0;
            const off0 = (y0 * TEX_WIDTH + x0) * 4;
            curveTexData[off0] = c.p0x;
            curveTexData[off0 + 1] = c.p0y;
            curveTexData[off0 + 2] = c.p1x;
            curveTexData[off0 + 3] = c.p1y;

            // Texel 1: (p2x, p2y, 0, 0)
            const i1 = curveTexelIdx + 1;
            const x1 = i1 % TEX_WIDTH,
                y1 = (i1 / TEX_WIDTH) | 0;
            const off1 = (y1 * TEX_WIDTH + x1) * 4;
            curveTexData[off1] = c.p2x;
            curveTexData[off1 + 1] = c.p2y;

            curveTexelIdx += 2;
        }
    }

    // --- Band texture (RGBA32Float, width 4096) ---
    // Stores integer values as floats for cross-platform compatibility.
    // Per glyph: [hBand headers...] [vBand headers...] [curve index lists...]
    // Each header texel: (curveCount, offsetFromGlyphLoc, 0, 0)
    // Each curve ref texel: (curveTexX, curveTexY, 0, 0)
    let totalBandTexels = 0;
    for (const g of glyphs) {
        const headerCount = g.bands.hBandCount + g.bands.vBandCount;
        const remaining = TEX_WIDTH - (totalBandTexels % TEX_WIDTH);
        if (remaining < headerCount && remaining < TEX_WIDTH) {
            totalBandTexels += remaining;
        }
        totalBandTexels += headerCount;
        for (const band of [...g.bands.hBands, ...g.bands.vBands]) {
            totalBandTexels += band.curveIndices.length;
        }
    }

    const bandTexHeight = Math.max(1, Math.ceil(totalBandTexels / TEX_WIDTH));
    const bandTexData = new Float32Array(TEX_WIDTH * bandTexHeight * 4);

    let bandTexelIdx = 0;
    const glyphBandInfo: { glyphLocX: number; glyphLocY: number; bandMaxX: number; bandMaxY: number }[] = [];

    for (const [gi, g] of glyphs.entries()) {
        const hBandCount = g.bands.hBandCount;
        const vBandCount = g.bands.vBandCount;
        const headerCount = hBandCount + vBandCount;

        // Ensure headers don't straddle a row boundary
        const curX = bandTexelIdx % TEX_WIDTH;
        if (curX + headerCount > TEX_WIDTH) {
            bandTexelIdx = (((bandTexelIdx / TEX_WIDTH) | 0) + 1) * TEX_WIDTH;
        }

        const glyphLocX = bandTexelIdx % TEX_WIDTH;
        const glyphLocY = (bandTexelIdx / TEX_WIDTH) | 0;
        glyphBandInfo.push({
            glyphLocX,
            glyphLocY,
            bandMaxX: vBandCount - 1,
            bandMaxY: hBandCount - 1,
        });

        const glyphStart = bandTexelIdx;
        const glyphCurveStart = glyphCurveStarts[gi];

        // Sort curves: h-bands by descending max x, v-bands by descending max y
        const sortedHBands = g.bands.hBands.map((band) => ({
            curveIndices: [...band.curveIndices].sort((a, b) => {
                const ca = g.curves[a],
                    cb = g.curves[b];
                return Math.max(cb.p0x, cb.p1x, cb.p2x) - Math.max(ca.p0x, ca.p1x, ca.p2x);
            }),
        }));
        const sortedVBands = g.bands.vBands.map((band) => ({
            curveIndices: [...band.curveIndices].sort((a, b) => {
                const ca = g.curves[a],
                    cb = g.curves[b];
                return Math.max(cb.p0y, cb.p1y, cb.p2y) - Math.max(ca.p0y, ca.p1y, ca.p2y);
            }),
        }));

        const allBands = [...sortedHBands, ...sortedVBands];

        // Calculate offsets: curve lists follow all headers
        let curveListOffset = headerCount;
        const bandOffsets: number[] = [];
        for (const band of allBands) {
            bandOffsets.push(curveListOffset);
            curveListOffset += band.curveIndices.length;
        }

        // Write band headers (integers stored as floats)
        for (let i = 0; i < allBands.length; i++) {
            const tl = glyphStart + i;
            const tx = tl % TEX_WIDTH,
                ty = (tl / TEX_WIDTH) | 0;
            const di = (ty * TEX_WIDTH + tx) * 4;
            bandTexData[di] = allBands[i].curveIndices.length;
            bandTexData[di + 1] = bandOffsets[i];
        }

        // Write curve index lists
        for (let i = 0; i < allBands.length; i++) {
            const band = allBands[i];
            const listStart = glyphStart + bandOffsets[i];
            for (let j = 0; j < band.curveIndices.length; j++) {
                const ci = band.curveIndices[j];
                const curveTexel = glyphCurveStart + ci * 2;
                const cTexX = curveTexel % TEX_WIDTH;
                const cTexY = (curveTexel / TEX_WIDTH) | 0;

                const tl = listStart + j;
                const tx = tl % TEX_WIDTH,
                    ty = (tl / TEX_WIDTH) | 0;
                const di = (ty * TEX_WIDTH + tx) * 4;
                bandTexData[di] = cTexX;
                bandTexData[di + 1] = cTexY;
            }
        }

        bandTexelIdx = glyphStart + curveListOffset;
    }

    return {
        curveTexData,
        bandTexData,
        curveTexHeight,
        bandTexHeight,
        glyphBandInfo,
        glyphCurveStarts,
    };
}

/**
 * Prepare all GPU data for rendering a text string with the Slug algorithm.
 * Supports multi-line layout with word wrapping, alignment, and line height.
 *
 * Vertex layout (5 × vec4 = 80 bytes per vertex):
 *   - slugPos: (objectX, objectY, normalX, normalY)
 *   - slugTex: (emX, emY, glyphLocX, glyphLocY)  — glyph location as integer-valued floats
 *   - slugMet: (bandMaxX, bandMaxY, invScale, flags)
 *   - slugBnd: (bandScaleX, bandScaleY, bandOffsetX, bandOffsetY)
 *   - slugCol: (r, g, b, a)
 *
 * @param font - The loaded Font instance
 * @param text - The text string to render
 * @param fontSize - Desired font size in pixels
 * @param options - Layout options (maxWidth, lineHeight, textAlign, etc.)
 * @returns Complete GPU-ready data including vertices, indices, and texture data
 */
export function prepareText(font: Font, text: string, fontSize: number, options?: SlugLayoutOptions): SlugTextData {
    const maxWidth = options?.maxWidth ?? Infinity;
    const lineHeightMult = options?.lineHeight ?? 1.2;
    const textAlign = options?.textAlign ?? "left";
    const letterSpacing = options?.letterSpacing ?? 0;
    const tabSize = options?.tabSize ?? 4;

    const scale = font.scaleForSize(fontSize);
    const lineHeightPx = fontSize * lineHeightMult;

    // Collapse whitespace and expand tabs
    const collapsed = text.replace(/\t/g, " ".repeat(tabSize)).replace(/ +/g, " ");
    const paragraphs = collapsed.split("\n");

    // Shape each paragraph and perform word-wrapping
    interface PlacedGlyph {
        glyphId: number;
        x: number; // pixel x
        y: number; // pixel y
        xAdvance: number;
        xOffset: number;
        yOffset: number;
    }

    const lines: PlacedGlyph[][] = [];
    const lineWidths: number[] = [];

    for (const para of paragraphs) {
        const trimmed = para.trim();
        if (trimmed.length === 0) {
            lines.push([]);
            lineWidths.push(0);
            continue;
        }

        const buf = new UnicodeBuffer();
        buf.addStr(trimmed);
        const glyphBuffer = shape(font, buf);

        let currentLine: PlacedGlyph[] = [];
        let lineCursorX = 0;

        // Collect all glyphs with advances
        const shaped: { glyphId: number; xAdvance: number; xOffset: number; yOffset: number; isSpace: boolean }[] = [];
        let charIdx = 0;
        for (const { info, position } of glyphBuffer) {
            const isSpace = charIdx < trimmed.length && trimmed.charCodeAt(charIdx) === 32;
            shaped.push({
                glyphId: info.glyphId,
                xAdvance: position.xAdvance + letterSpacing,
                xOffset: position.xOffset,
                yOffset: position.yOffset,
                isSpace,
            });
            charIdx++;
        }

        // Word-wrap layout
        let i = 0;
        while (i < shaped.length) {
            // Find next word boundary

            // Skip leading spaces
            while (i < shaped.length && shaped[i].isSpace) {
                lineCursorX += shaped[i].xAdvance * scale;
                currentLine.push({
                    glyphId: shaped[i].glyphId,
                    x: lineCursorX - shaped[i].xAdvance * scale,
                    y: 0,
                    xAdvance: shaped[i].xAdvance,
                    xOffset: shaped[i].xOffset,
                    yOffset: shaped[i].yOffset,
                });
                i++;
            }

            // Collect word (non-space run)
            const wordGlyphs: typeof shaped = [];
            let wordWidth = 0;
            while (i < shaped.length && !shaped[i].isSpace) {
                wordGlyphs.push(shaped[i]);
                wordWidth += shaped[i].xAdvance * scale;
                i++;
            }

            // Check if word fits
            if (lineCursorX + wordWidth > maxWidth && currentLine.length > 0) {
                // Wrap: finalize current line (trim trailing spaces)
                while (currentLine.length > 0 && currentLine[currentLine.length - 1].glyphId === font.glyphId(32)) {
                    currentLine.pop();
                }
                const lw = currentLine.length > 0 ? currentLine[currentLine.length - 1].x + currentLine[currentLine.length - 1].xAdvance * scale : 0;
                lines.push(currentLine);
                lineWidths.push(lw);
                currentLine = [];
                lineCursorX = 0;
            }

            // Place word glyphs
            for (const g of wordGlyphs) {
                currentLine.push({
                    glyphId: g.glyphId,
                    x: lineCursorX,
                    y: 0,
                    xAdvance: g.xAdvance,
                    xOffset: g.xOffset,
                    yOffset: g.yOffset,
                });
                lineCursorX += g.xAdvance * scale;
            }
        }

        // Push remaining line
        if (currentLine.length > 0) {
            const lw = lineCursorX;
            lines.push(currentLine);
            lineWidths.push(lw);
        }
    }

    // Compute total dimensions
    const totalWidth = lineWidths.length > 0 ? Math.max(...lineWidths) : 0;
    const totalHeight = lines.length * lineHeightPx;

    // Apply Y positions and alignment
    for (let li = 0; li < lines.length; li++) {
        const line = lines[li];
        const lw = lineWidths[li];

        let alignOffset = 0;
        if (textAlign === "center") {
            alignOffset = (totalWidth - lw) / 2;
        } else if (textAlign === "right") {
            alignOffset = totalWidth - lw;
        }

        const lineY = li * lineHeightPx;
        for (const g of line) {
            g.x += alignOffset;
            g.y = lineY;
        }
    }

    // Flatten to a single glyph list
    const allPlaced = lines.flat();

    // Process unique glyphs for curve extraction
    const glyphMap = new Map<number, SlugGlyph>();
    for (const pg of allPlaced) {
        if (glyphMap.has(pg.glyphId)) {
            continue;
        }
        const result = extractCurves(font, pg.glyphId);
        if (!result) {
            continue;
        }
        const bands = buildBands(result.curves, result.bounds);
        glyphMap.set(pg.glyphId, {
            glyphId: pg.glyphId,
            curves: result.curves,
            bands,
            bounds: result.bounds,
        });
    }

    const slugGlyphs = [...glyphMap.values()];
    const packed = packGlyphData(slugGlyphs);

    // Build per-glyph lookup
    const glyphDataMap = new Map<
        number,
        {
            glyph: SlugGlyph;
            glyphLocX: number;
            glyphLocY: number;
            bandMaxX: number;
            bandMaxY: number;
        }
    >();
    for (const [index, glyph] of slugGlyphs.entries()) {
        glyphDataMap.set(glyph.glyphId, {
            glyph,
            ...packed.glyphBandInfo[index],
        });
    }

    // Build vertex/index data
    const verts: number[] = [];
    const idxs: number[] = [];
    let quadIdx = 0;
    const invScale = 1 / scale;
    let maxAdvance = 0;

    for (const pg of allPlaced) {
        const data = glyphDataMap.get(pg.glyphId);
        if (!data) {
            continue;
        }

        const { glyph, glyphLocX, glyphLocY, bandMaxX, bandMaxY } = data;
        const { xMin, yMin, xMax, yMax } = glyph.bounds;
        const w = xMax - xMin;
        const h = yMax - yMin;

        // Object-space position (Y-down for line layout, flip to Y-up)
        const ox = pg.x + pg.xOffset * scale;
        const oy = -(pg.y + pg.yOffset * scale);
        const x0 = ox + xMin * scale;
        const y0 = oy + yMin * scale;
        const x1 = ox + xMax * scale;
        const y1 = oy + yMax * scale;

        maxAdvance = Math.max(maxAdvance, pg.x + pg.xAdvance * scale);

        // Band transform: maps em-space to band indices
        const bandScaleX = w > 0 ? glyph.bands.vBandCount / w : 0;
        const bandScaleY = h > 0 ? glyph.bands.hBandCount / h : 0;
        const bandOffsetX = -xMin * bandScaleX;
        const bandOffsetY = -yMin * bandScaleY;

        // 4 corners with dilation normals
        const corners = [
            [x0, y0, -1, -1, xMin, yMin],
            [x1, y0, 1, -1, xMax, yMin],
            [x1, y1, 1, 1, xMax, yMax],
            [x0, y1, -1, 1, xMin, yMax],
        ];

        for (const [px, py, nx, ny, ex, ey] of corners) {
            verts.push(
                px, py, nx, ny,
                ex, ey, glyphLocX, glyphLocY,
                bandMaxX, bandMaxY, invScale, 0,
                bandScaleX, bandScaleY, bandOffsetX, bandOffsetY,
                1, 1, 1, 1
            );
        }

        const base = quadIdx * 4;
        idxs.push(base, base + 1, base + 2, base, base + 2, base + 3);
        quadIdx++;
    }

    return {
        slugGlyphs,
        vertices: new Float32Array(verts),
        indices: new Uint32Array(idxs),
        curveTexData: packed.curveTexData,
        bandTexData: packed.bandTexData,
        curveTexHeight: packed.curveTexHeight,
        bandTexHeight: packed.bandTexHeight,
        totalAdvance: maxAdvance / scale,
        layoutWidth: totalWidth,
        layoutHeight: totalHeight,
    };
}

/**
 * A pre-positioned glyph for Slug rendering. Positions are in pixel space.
 */
export interface SlugPlacedGlyph {
    /** Character code (used to look up the glyph in the font) */
    charCode: number;
    /** X position of glyph baseline origin in pixels */
    x: number;
    /** Y position of glyph baseline origin in pixels (positive = up) */
    y: number;
}

/**
 * Prepare Slug GPU data from pre-positioned glyphs. Use this to render Slug
 * text with glyph positions computed by an external layout system (e.g. MSDF's
 * SdfTextParagraph), ensuring identical layout between renderers.
 *
 * Each unique glyph's curves and bands are extracted once (deduplicated atlas).
 *
 * @param font - The loaded Font instance
 * @param glyphs - Array of pre-positioned glyphs in pixel space
 * @param fontSize - Font size in pixels (used for glyph scaling)
 * @returns SlugTextData ready for single-draw-call rendering
 */
export function prepareTextFromGlyphs(font: Font, glyphs: SlugPlacedGlyph[], fontSize: number): SlugTextData {
    if (glyphs.length === 0) {
        return {
            slugGlyphs: [],
            vertices: new Float32Array(0),
            indices: new Uint32Array(0),
            curveTexData: new Float32Array(TEX_WIDTH * 4),
            bandTexData: new Float32Array(TEX_WIDTH * 4),
            curveTexHeight: 1,
            bandTexHeight: 1,
            totalAdvance: 0,
            layoutWidth: 0,
            layoutHeight: 0,
        };
    }

    const scale = font.scaleForSize(fontSize);
    const invScale = 1 / scale;

    // Collect unique glyphs by character code → glyph ID
    const glyphMap = new Map<number, SlugGlyph>();
    const charToGlyphId = new Map<number, number>();

    for (const pg of glyphs) {
        if (charToGlyphId.has(pg.charCode)) {
            continue;
        }
        const glyphId = font.glyphId(pg.charCode);
        charToGlyphId.set(pg.charCode, glyphId);
        if (glyphMap.has(glyphId)) {
            continue;
        }
        const result = extractCurves(font, glyphId);
        if (!result) {
            continue;
        }
        const bands = buildBands(result.curves, result.bounds);
        glyphMap.set(glyphId, {
            glyphId,
            curves: result.curves,
            bands,
            bounds: result.bounds,
        });
    }

    // Pack glyph data (shared atlas)
    const slugGlyphList = [...glyphMap.values()];
    const packed = packGlyphData(slugGlyphList);

    const glyphDataMap = new Map<
        number,
        { glyph: SlugGlyph; glyphLocX: number; glyphLocY: number; bandMaxX: number; bandMaxY: number }
    >();
    for (const [index, glyph] of slugGlyphList.entries()) {
        glyphDataMap.set(glyph.glyphId, { glyph, ...packed.glyphBandInfo[index] });
    }

    // Build vertex/index data using pre-allocated typed arrays
    const maxQuads = glyphs.length;
    const vertsBuf = new Float32Array(maxQuads * 4 * 20);
    const idxsBuf = new Uint32Array(maxQuads * 6);
    let vertW = 0;
    let idxW = 0;
    let quadIdx = 0;

    for (const pg of glyphs) {
        const glyphId = charToGlyphId.get(pg.charCode);
        if (glyphId === undefined) {
            continue;
        }
        const data = glyphDataMap.get(glyphId);
        if (!data) {
            continue;
        }
        const { glyph, glyphLocX, glyphLocY, bandMaxX, bandMaxY } = data;
        const { xMin, yMin, xMax, yMax } = glyph.bounds;
        const w = xMax - xMin;
        const h = yMax - yMin;

        // pg.x, pg.y is the glyph baseline ORIGIN in pixel space.
        // Glyph bounds (xMin..xMax, yMin..yMax) are in em-units relative to origin.
        const x0 = pg.x + xMin * scale;
        const y0 = pg.y + yMin * scale;
        const x1 = pg.x + xMax * scale;
        const y1 = pg.y + yMax * scale;

        const bandScaleX = w > 0 ? glyph.bands.vBandCount / w : 0;
        const bandScaleY = h > 0 ? glyph.bands.hBandCount / h : 0;
        const bandOffsetX = -xMin * bandScaleX;
        const bandOffsetY = -yMin * bandScaleY;

        const corners = [
            [x0, y0, -1, -1, xMin, yMin],
            [x1, y0, 1, -1, xMax, yMin],
            [x1, y1, 1, 1, xMax, yMax],
            [x0, y1, -1, 1, xMin, yMax],
        ];

        for (const [px, py, nx, ny, ex, ey] of corners) {
            vertsBuf[vertW++] = px;
            vertsBuf[vertW++] = py;
            vertsBuf[vertW++] = nx;
            vertsBuf[vertW++] = ny;
            vertsBuf[vertW++] = ex;
            vertsBuf[vertW++] = ey;
            vertsBuf[vertW++] = glyphLocX;
            vertsBuf[vertW++] = glyphLocY;
            vertsBuf[vertW++] = bandMaxX;
            vertsBuf[vertW++] = bandMaxY;
            vertsBuf[vertW++] = invScale;
            vertsBuf[vertW++] = 0;
            vertsBuf[vertW++] = bandScaleX;
            vertsBuf[vertW++] = bandScaleY;
            vertsBuf[vertW++] = bandOffsetX;
            vertsBuf[vertW++] = bandOffsetY;
            vertsBuf[vertW++] = 1;
            vertsBuf[vertW++] = 1;
            vertsBuf[vertW++] = 1;
            vertsBuf[vertW++] = 1;
        }

        const base = quadIdx * 4;
        idxsBuf[idxW++] = base;
        idxsBuf[idxW++] = base + 1;
        idxsBuf[idxW++] = base + 2;
        idxsBuf[idxW++] = base;
        idxsBuf[idxW++] = base + 2;
        idxsBuf[idxW++] = base + 3;
        quadIdx++;
    }

    return {
        slugGlyphs: slugGlyphList,
        vertices: vertsBuf.subarray(0, vertW),
        indices: idxsBuf.subarray(0, idxW),
        curveTexData: packed.curveTexData,
        bandTexData: packed.bandTexData,
        curveTexHeight: packed.curveTexHeight,
        bandTexHeight: packed.bandTexHeight,
        totalAdvance: 0,
        layoutWidth: 0,
        layoutHeight: 0,
    };
}

/**
 * Page definition for multi-page text rendering.
 */
export interface SlugPageDef {
    /** Text content for this page */
    text: string;
    /** X offset of this page in pixels */
    offsetX: number;
    /** Y offset of this page in pixels */
    offsetY: number;
}

/**
 * Prepare GPU data for multiple pages of text in a single draw call.
 * Processes all unique glyphs once and packs shared textures,
 * then generates per-page vertices with page offsets.
 *
 * @param font - The loaded Font instance
 * @param pages - Array of page definitions (text + offset)
 * @param fontSize - Font size in pixels
 * @param contentWidth - Max text width within each page (for word wrapping)
 * @returns Single SlugTextData with all pages merged
 */
export function prepareMultiPageText(
    font: Font,
    pages: SlugPageDef[],
    fontSize: number,
    contentWidth: number
): SlugTextData {
    const scale = font.scaleForSize(fontSize);
    const lineHeightPx = fontSize * 1.2;
    const invScale = 1 / scale;

    // Step 1: Collect all unique codepoints across all pages
    const allCodepoints = new Set<number>();
    for (const page of pages) {
        for (let i = 0; i < page.text.length; i++) {
            allCodepoints.add(page.text.codePointAt(i)!);
        }
    }

    // Step 2: Shape a representative string to get glyph IDs, then extract curves
    const glyphMap = new Map<number, SlugGlyph>();
    const cpToGlyphId = new Map<number, number>();

    for (const cp of allCodepoints) {
        const gid = font.glyphId(cp);
        cpToGlyphId.set(cp, gid);
        if (glyphMap.has(gid)) {
            continue;
        }
        const result = extractCurves(font, gid);
        if (!result) {
            continue;
        }
        const bands = buildBands(result.curves, result.bounds);
        glyphMap.set(gid, {
            glyphId: gid,
            curves: result.curves,
            bands,
            bounds: result.bounds,
        });
    }

    // Step 3: Pack all glyphs into shared textures ONCE
    const slugGlyphs = [...glyphMap.values()];
    const packed = packGlyphData(slugGlyphs);

    const glyphDataMap = new Map<
        number,
        {
            glyph: SlugGlyph;
            glyphLocX: number;
            glyphLocY: number;
            bandMaxX: number;
            bandMaxY: number;
        }
    >();
    for (const [index, glyph] of slugGlyphs.entries()) {
        glyphDataMap.set(glyph.glyphId, {
            glyph,
            ...packed.glyphBandInfo[index],
        });
    }

    // Step 4: For each page, shape text and generate vertices with page offset
    // Estimate total visible glyphs (non-space, non-newline) for pre-allocation
    let totalChars = 0;
    for (const page of pages) {
        totalChars += page.text.length;
    }
    // Rough upper bound: each char could become a quad (4 verts × 20 floats, 6 indices)
    const maxQuads = totalChars;
    const verts = new Float32Array(maxQuads * 4 * 20);
    const idxs = new Uint32Array(maxQuads * 6);
    let vertWriteIdx = 0;
    let idxWriteIdx = 0;
    let quadIdx = 0;

    for (const page of pages) {
        const buf = new UnicodeBuffer();
        buf.addStr(page.text);
        const glyphBuffer = shape(font, buf);

        // Simple word-wrap layout within the page
        let cursorX = 0;
        let cursorY = 0;

        // Collect shaped glyph advances for word wrapping
        interface ShapedEntry {
            glyphId: number;
            xAdvance: number;
            xOffset: number;
            yOffset: number;
            isSpace: boolean;
            charIdx: number;
        }
        const shaped: ShapedEntry[] = [];
        let charIdx = 0;
        for (const { info, position } of glyphBuffer) {
            const cp = charIdx < page.text.length ? page.text.codePointAt(charIdx)! : 32;
            shaped.push({
                glyphId: info.glyphId,
                xAdvance: position.xAdvance,
                xOffset: position.xOffset,
                yOffset: position.yOffset,
                isSpace: cp === 32 || cp === 9,
                charIdx: charIdx,
            });
            charIdx++;
        }

        // Word-wrap and emit vertices
        let si = 0;
        while (si < shaped.length) {
            // Handle newlines embedded in text
            if (shaped[si].charIdx < page.text.length && page.text.charCodeAt(shaped[si].charIdx) === 10) {
                cursorX = 0;
                cursorY -= lineHeightPx;
                si++;
                continue;
            }

            // Skip leading spaces on new line
            while (si < shaped.length && shaped[si].isSpace && cursorX === 0) {
                si++;
            }

            // Collect word
            const wordStart = si;
            let wordWidth = 0;
            while (si < shaped.length && !shaped[si].isSpace &&
                   !(shaped[si].charIdx < page.text.length && page.text.charCodeAt(shaped[si].charIdx) === 10)) {
                wordWidth += shaped[si].xAdvance * scale;
                si++;
            }

            // Wrap if needed
            if (cursorX + wordWidth > contentWidth && cursorX > 0) {
                cursorX = 0;
                cursorY -= lineHeightPx;
            }

            // Emit word glyphs
            for (let wi = wordStart; wi < si; wi++) {
                const s = shaped[wi];
                const data = glyphDataMap.get(s.glyphId);
                if (data) {
                    const { glyph, glyphLocX, glyphLocY, bandMaxX, bandMaxY } = data;
                    const { xMin, yMin, xMax, yMax } = glyph.bounds;
                    const w = xMax - xMin;
                    const h = yMax - yMin;

                    const ox = page.offsetX + cursorX + s.xOffset * scale;
                    const oy = page.offsetY + cursorY + s.yOffset * scale;
                    const x0 = ox + xMin * scale;
                    const y0 = oy + yMin * scale;
                    const x1 = ox + xMax * scale;
                    const y1 = oy + yMax * scale;

                    const bandScaleX = w > 0 ? glyph.bands.vBandCount / w : 0;
                    const bandScaleY = h > 0 ? glyph.bands.hBandCount / h : 0;
                    const bandOffsetX = -xMin * bandScaleX;
                    const bandOffsetY = -yMin * bandScaleY;

                    const corners = [
                        [x0, y0, -1, -1, xMin, yMin],
                        [x1, y0, 1, -1, xMax, yMin],
                        [x1, y1, 1, 1, xMax, yMax],
                        [x0, y1, -1, 1, xMin, yMax],
                    ];

                    for (const [px, py, nx, ny, ex, ey] of corners) {
                        verts[vertWriteIdx++] = px;
                        verts[vertWriteIdx++] = py;
                        verts[vertWriteIdx++] = nx;
                        verts[vertWriteIdx++] = ny;
                        verts[vertWriteIdx++] = ex;
                        verts[vertWriteIdx++] = ey;
                        verts[vertWriteIdx++] = glyphLocX;
                        verts[vertWriteIdx++] = glyphLocY;
                        verts[vertWriteIdx++] = bandMaxX;
                        verts[vertWriteIdx++] = bandMaxY;
                        verts[vertWriteIdx++] = invScale;
                        verts[vertWriteIdx++] = 0;
                        verts[vertWriteIdx++] = bandScaleX;
                        verts[vertWriteIdx++] = bandScaleY;
                        verts[vertWriteIdx++] = bandOffsetX;
                        verts[vertWriteIdx++] = bandOffsetY;
                        verts[vertWriteIdx++] = 1;
                        verts[vertWriteIdx++] = 1;
                        verts[vertWriteIdx++] = 1;
                        verts[vertWriteIdx++] = 1;
                    }

                    const base = quadIdx * 4;
                    idxs[idxWriteIdx++] = base;
                    idxs[idxWriteIdx++] = base + 1;
                    idxs[idxWriteIdx++] = base + 2;
                    idxs[idxWriteIdx++] = base;
                    idxs[idxWriteIdx++] = base + 2;
                    idxs[idxWriteIdx++] = base + 3;
                    quadIdx++;
                }
                cursorX += s.xAdvance * scale;
            }

            // Consume trailing spaces
            while (si < shaped.length && shaped[si].isSpace) {
                cursorX += shaped[si].xAdvance * scale;
                si++;
            }
        }
    }

    return {
        slugGlyphs,
        vertices: verts.subarray(0, vertWriteIdx),
        indices: idxs.subarray(0, idxWriteIdx),
        curveTexData: packed.curveTexData,
        bandTexData: packed.bandTexData,
        curveTexHeight: packed.curveTexHeight,
        bandTexHeight: packed.bandTexHeight,
        totalAdvance: 0,
        layoutWidth: contentWidth,
        layoutHeight: pages.length > 0 ? -pages[pages.length - 1].offsetY : 0,
    };
}
