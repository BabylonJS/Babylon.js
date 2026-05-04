import { type IVector2Like } from "core/Maths/math.like";

import { type LottieTextCompatibilityMode } from "../animationConfiguration";
import { type RawFont, type RawTextData, type RawTextDocument, type RawTextJustify } from "./rawTypes";

/**
 * Minimal text metrics shape used by the Lottie text layout helpers.
 */
export type TextMetricsLike = {
    /**
     * Horizontal advance of the measured text.
     */
    width: number;
    /**
     * Distance from the alignment point to the left-most rendered pixel.
     */
    actualBoundingBoxLeft?: number;
    /**
     * Distance from the alignment point to the right-most rendered pixel.
     */
    actualBoundingBoxRight?: number;
    /**
     * Distance from the alphabetic baseline to the top of the measured text.
     */
    actualBoundingBoxAscent?: number;
    /**
     * Distance from the alphabetic baseline to the bottom of the measured text.
     */
    actualBoundingBoxDescent?: number;
};

/**
 * Rendering context surface required by the Lottie text layout helpers.
 */
export type TextRenderContextLike = {
    /**
     * Current font used for text measurement and rendering.
     */
    font: string;
    /**
     * Current stroke width for text outlines.
     */
    lineWidth: number;
    /**
     * Optional font kerning mode used by canvas text rendering.
     */
    fontKerning?: string;
    /**
     * Measures text using the active font.
     * @param text The text to measure.
     * @returns The measured text metrics.
     */
    measureText(text: string): TextMetricsLike;
    /**
     * Draws filled text at the provided baseline position.
     * @param text The text to draw.
     * @param x The x coordinate of the text baseline origin.
     * @param y The y coordinate of the text baseline origin.
     */
    fillText(text: string, x: number, y: number): void;
    /**
     * Draws stroked text at the provided baseline position.
     * @param text The text to draw.
     * @param x The x coordinate of the text baseline origin.
     * @param y The y coordinate of the text baseline origin.
     */
    strokeText(text: string, x: number, y: number): void;
};

/**
 * Resolved text document data needed for measurement and rendering.
 */
export type ResolvedLottieText = {
    /**
     * Original raw text document data.
     */
    textInfo: RawTextDocument;
    /**
     * Resolved font metadata.
     */
    rawFont: RawFont;
    /**
     * CSS canvas font shorthand used for measurement and rendering.
     */
    font: string;
    /**
     * Text split into Lottie lines.
     */
    lines: string[];
    /**
     * Tracking amount converted to pixels.
     */
    trackingPx: number;
    /**
     * Distance between consecutive baselines.
     */
    lineHeightPx: number;
    /**
     * Distance from the top of the text block to the first baseline.
     */
    baselineOffsetPx: number;
    /**
     * Optional paragraph box top-left position relative to the text anchor.
     */
    boxPosition?: IVector2Like;
    /**
     * Optional paragraph box size.
     */
    boxSize?: IVector2Like;
    /**
     * Resolved text justification.
     */
    justify: RawTextJustify;
    /**
     * Whether a visible stroke should be rendered.
     */
    hasStroke: boolean;
    /**
     * Whether the stroke should be rendered after the fill.
     */
    strokeOverFill: boolean;
};

/**
 * Layout information for a single text line.
 */
export type LottieTextLineLayout = {
    /**
     * Raw text for the line.
     */
    text: string;
    /**
     * Final line width including tracking.
     */
    width: number;
    /**
     * Left position of the line inside the text texture.
     */
    x: number;
    /**
     * Baseline position of the line inside the text texture.
     */
    baselineY: number;
};

/**
 * Layout information for a resolved Lottie text document.
 */
export type LottieTextLayout = {
    /**
     * Width of the text texture.
     */
    width: number;
    /**
     * Height of the text texture.
     */
    height: number;
    /**
     * X offset required to convert from the text anchor to the sprite center.
     */
    offsetX: number;
    /**
     * Y offset required to convert from the text anchor to the sprite center.
     */
    offsetY: number;
    /**
     * Distance from the top of the texture to the first baseline.
     */
    baselineOffsetY: number;
    /**
     * Distance from the last baseline to the bottom of the texture.
     */
    descent: number;
    /**
     * Per-line layout data.
     */
    lines: LottieTextLineLayout[];
};

const LineBreakRegex = /\u2028\r?|\r\n?|\n/g;
const MinimumTextBottomPaddingPx = 1;

/**
 * Resolves the text document, font, variables, and line splitting required for layout.
 * @param textData Raw Lottie text data.
 * @param rawFonts Map of font names to font metadata.
 * @param variables Variables that can replace the raw text content.
 * @returns The resolved text data, or undefined when the text cannot be rendered.
 */
export function ResolveLottieText(textData: RawTextData, rawFonts: Map<string, RawFont>, variables: Map<string, string>): ResolvedLottieText | undefined {
    const textInfo = textData.d?.k?.[0]?.s as RawTextDocument | undefined;
    if (!textInfo) {
        return undefined;
    }

    const rawFont = rawFonts.get(textInfo.f);
    if (!rawFont) {
        return undefined;
    }

    const variableText = variables.get(textInfo.t);
    const resolvedText = variableText !== undefined ? variableText : textInfo.t;
    const lines = NormalizeLottieTextLines(resolvedText);
    const font = BuildCanvasFont(rawFont, textInfo.s);
    const trackingPx = ((textInfo.tr ?? 0) * textInfo.s) / 1000;
    const lineHeightPx = textInfo.lh || textInfo.s;
    const rawAscentPx = rawFont.ascent !== undefined ? (textInfo.s * rawFont.ascent) / 100 : textInfo.s * 0.75;
    const baselineOffsetPx = rawAscentPx - (textInfo.ls ?? 0);
    const hasStroke = !!(textInfo.sc && textInfo.sc.length >= 3 && textInfo.sw !== undefined && textInfo.sw > 0);
    const boxPosition = textInfo.ps !== undefined && textInfo.ps.length >= 2 ? { x: textInfo.ps[0], y: textInfo.ps[1] } : undefined;
    const boxSize = textInfo.sz !== undefined && textInfo.sz.length >= 2 ? { x: textInfo.sz[0], y: textInfo.sz[1] } : undefined;

    return {
        textInfo,
        rawFont,
        font,
        lines,
        trackingPx,
        lineHeightPx,
        baselineOffsetPx,
        boxPosition,
        boxSize,
        justify: textInfo.j,
        hasStroke,
        strokeOverFill: textInfo.of === true,
    };
}

/**
 * Measures the final texture layout for resolved Lottie text.
 * @param resolvedText Resolved text data.
 * @param measureText Callback used to measure text with the active font.
 * @param compatibilityMode Text layout compatibility mode.
 * @returns The measured text layout.
 */
export function MeasureLottieText(
    resolvedText: ResolvedLottieText,
    measureText: (text: string) => TextMetricsLike,
    compatibilityMode: LottieTextCompatibilityMode = "spec"
): LottieTextLayout {
    return compatibilityMode === "babylon8" ? MeasureBabylon8LottieText(resolvedText, measureText) : MeasureSpecLottieText(resolvedText, measureText);
}

function MeasureSpecLottieText(resolvedText: ResolvedLottieText, measureText: (text: string) => TextMetricsLike): LottieTextLayout {
    const hasParagraphBox = resolvedText.boxPosition !== undefined && resolvedText.boxSize !== undefined;
    const lineMeasurements = CreateLineMeasurements(resolvedText, measureText, hasParagraphBox);
    const bottomPaddingPx = resolvedText.hasStroke ? Math.max(MinimumTextBottomPaddingPx, resolvedText.textInfo.sw! / 2) : MinimumTextBottomPaddingPx;

    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    let descent = 0;

    const localLineLayouts = lineMeasurements.map((line) => {
        const x = hasParagraphBox
            ? resolvedText.boxPosition!.x + GetLineX(resolvedText.justify, resolvedText.boxSize!.x, line.width)
            : GetPointTextLineX(resolvedText.justify, line.width);
        descent = Math.max(descent, line.descent);

        if (hasParagraphBox) {
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x + line.width);
        } else {
            minX = Math.min(minX, x - line.actualLeft);
            maxX = Math.max(maxX, x + line.actualRight);
        }
        minY = Math.min(minY, line.baselineY - resolvedText.baselineOffsetPx);
        maxY = Math.max(maxY, line.baselineY + line.descent + bottomPaddingPx);

        return {
            text: line.text,
            width: line.width,
            x,
            baselineY: line.baselineY,
        };
    });

    if (hasParagraphBox) {
        minX = Math.min(minX, resolvedText.boxPosition!.x);
        maxX = Math.max(maxX, resolvedText.boxPosition!.x + resolvedText.boxSize!.x);
        minY = Math.min(minY, resolvedText.boxPosition!.y);
        maxY = Math.max(maxY, resolvedText.boxPosition!.y + resolvedText.boxSize!.y);
    }

    if (!Number.isFinite(minX)) {
        minX = 0;
        maxX = 0;
        minY = 0;
        maxY = 0;
    }

    const width = maxX - minX;
    const height = maxY - minY;

    return {
        width,
        height,
        offsetX: (minX + maxX) / 2,
        offsetY: (minY + maxY) / 2,
        baselineOffsetY: localLineLayouts.length > 0 ? localLineLayouts[0].baselineY - minY : 0,
        descent,
        lines: localLineLayouts.map((line) => ({
            text: line.text,
            width: line.width,
            x: line.x - minX,
            baselineY: line.baselineY - minY,
        })),
    };
}

function MeasureBabylon8LottieText(resolvedText: ResolvedLottieText, measureText: (text: string) => TextMetricsLike): LottieTextLayout {
    // Babylon.js 8.x rasterized text via a single fillText call that received the raw Lottie text string,
    // including any embedded line break characters. Canvas's fillText/measureText treat \n and \r as
    // ignorable whitespace, so multi-line Lottie text rendered as a single line in Babylon.js 8.
    // Joining the lines back together here intentionally reproduces that behavior; do not split across
    // multiple LottieTextLineLayout entries or this mode will diverge from Babylon.js 8 placement.
    const text = resolvedText.lines.join("\n");
    const metrics = measureText(text);
    const width = Math.ceil(metrics.width);
    const ascent = Math.ceil(metrics.actualBoundingBoxAscent ?? resolvedText.baselineOffsetPx);
    const descent = Math.ceil(metrics.actualBoundingBoxDescent ?? 0);
    const height = ascent + descent;

    return {
        width,
        height,
        offsetX: 0,
        offsetY: 0,
        baselineOffsetY: ascent,
        descent,
        lines: [
            {
                text,
                width,
                x: 0,
                baselineY: ascent,
            },
        ],
    };
}

function CreateLineMeasurements(
    resolvedText: ResolvedLottieText,
    measureText: (text: string) => TextMetricsLike,
    hasParagraphBox: boolean
): Array<{ text: string; width: number; baselineY: number; descent: number; actualLeft: number; actualRight: number }> {
    const lines = hasParagraphBox ? resolvedText.lines.flatMap((line) => WrapParagraphTextLine(line, resolvedText, measureText)) : resolvedText.lines;

    return lines.map((line, index) => {
        const metrics = measureText(line);
        const trackingWidth = GetTrackingWidth(line, resolvedText.trackingPx);
        const trackedWidth = metrics.width + trackingWidth;
        return {
            text: line,
            width: trackedWidth,
            baselineY: GetLineBaselineY(resolvedText, hasParagraphBox, index),
            descent: metrics.actualBoundingBoxDescent ?? 0,
            actualLeft: hasParagraphBox ? 0 : (metrics.actualBoundingBoxLeft ?? 0),
            actualRight: hasParagraphBox ? trackedWidth : (metrics.actualBoundingBoxRight ?? metrics.width) + trackingWidth,
        };
    });
}

function GetLineBaselineY(resolvedText: ResolvedLottieText, hasParagraphBox: boolean, lineIndex: number): number {
    const paragraphTop = hasParagraphBox ? resolvedText.boxPosition!.y + resolvedText.baselineOffsetPx : 0;
    return paragraphTop + lineIndex * resolvedText.lineHeightPx;
}

function WrapParagraphTextLine(line: string, resolvedText: ResolvedLottieText, measureText: (text: string) => TextMetricsLike): string[] {
    const maxWidth = resolvedText.boxSize?.x ?? 0;
    if (line.length === 0 || maxWidth <= 0 || GetTrackedTextWidth(line, measureText, resolvedText.trackingPx) <= maxWidth) {
        return [line];
    }

    const words = line
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0);
    if (words.length === 0) {
        return [""];
    }

    const wrappedLines: string[] = [];
    let currentLine = "";

    for (let index = 0; index < words.length; index++) {
        const word = words[index];
        const candidate = currentLine.length === 0 ? word : `${currentLine} ${word}`;
        if (currentLine.length === 0 && GetTrackedTextWidth(word, measureText, resolvedText.trackingPx) > maxWidth) {
            const brokenWordLines = BreakLongWord(word, resolvedText, measureText);
            wrappedLines.push(...brokenWordLines.slice(0, -1));
            currentLine = brokenWordLines[brokenWordLines.length - 1];
            continue;
        }

        if (GetTrackedTextWidth(candidate, measureText, resolvedText.trackingPx) <= maxWidth) {
            currentLine = candidate;
            continue;
        }

        wrappedLines.push(currentLine);

        if (GetTrackedTextWidth(word, measureText, resolvedText.trackingPx) <= maxWidth) {
            currentLine = word;
            continue;
        }

        const brokenWordLines = BreakLongWord(word, resolvedText, measureText);
        wrappedLines.push(...brokenWordLines.slice(0, -1));
        currentLine = brokenWordLines[brokenWordLines.length - 1];
    }

    if (currentLine.length > 0 || wrappedLines.length === 0) {
        wrappedLines.push(currentLine);
    }

    return wrappedLines;
}

function BreakLongWord(word: string, resolvedText: ResolvedLottieText, measureText: (text: string) => TextMetricsLike): string[] {
    const maxWidth = resolvedText.boxSize?.x ?? 0;
    const characters = Array.from(word);
    const wrappedLines: string[] = [];
    let currentLine = "";

    for (let index = 0; index < characters.length; index++) {
        const candidate = currentLine + characters[index];
        if (currentLine.length > 0 && GetTrackedTextWidth(candidate, measureText, resolvedText.trackingPx) > maxWidth) {
            wrappedLines.push(currentLine);
            currentLine = characters[index];
            continue;
        }

        currentLine = candidate;
    }

    if (currentLine.length > 0) {
        wrappedLines.push(currentLine);
    }

    return wrappedLines;
}

function GetTrackedTextWidth(text: string, measureText: (text: string) => TextMetricsLike, trackingPx: number): number {
    return GetTrackedTextWidthFromMetrics(text, measureText(text), trackingPx);
}

function GetTrackedTextWidthFromMetrics(text: string, metrics: TextMetricsLike, trackingPx: number): number {
    return metrics.width + GetTrackingWidth(text, trackingPx);
}

function GetTrackingWidth(text: string, trackingPx: number): number {
    return Math.max(Array.from(text).length - 1, 0) * trackingPx;
}

function NormalizeLottieTextLines(text: string): string[] {
    const lines = text.replace(LineBreakRegex, "\n").split("\n");
    while (lines.length > 1 && lines[lines.length - 1].length === 0) {
        lines.pop();
    }

    return lines;
}

/**
 * Renders resolved text using the measured layout.
 * @param context Rendering context used to draw text.
 * @param resolvedText Resolved text data.
 * @param layout Measured text layout.
 */
export function DrawLottieText(context: TextRenderContextLike, resolvedText: ResolvedLottieText, layout: LottieTextLayout): void {
    ApplyLottieTextContext(context, resolvedText);

    for (let index = 0; index < layout.lines.length; index++) {
        const line = layout.lines[index];
        if (resolvedText.hasStroke && !resolvedText.strokeOverFill) {
            DrawTrackedText(context, line, resolvedText.trackingPx, (text, x, y) => context.strokeText(text, x, y));
        }

        DrawTrackedText(context, line, resolvedText.trackingPx, (text, x, y) => context.fillText(text, x, y));

        if (resolvedText.hasStroke && resolvedText.strokeOverFill) {
            DrawTrackedText(context, line, resolvedText.trackingPx, (text, x, y) => context.strokeText(text, x, y));
        }
    }
}

/**
 * Applies the resolved Lottie text font settings to a canvas-like text context.
 * @param context Rendering context used for text measurement and drawing.
 * @param resolvedText Resolved text data.
 */
export function ApplyLottieTextContext(context: Pick<TextRenderContextLike, "font" | "lineWidth" | "fontKerning">, resolvedText: ResolvedLottieText): void {
    context.font = resolvedText.font;
    // fontKerning is optional on the context type because some runtimes (older browsers, OffscreenCanvas
    // implementations without the CanvasTextDrawingStyles update) may not expose it. Guard before writing.
    if ("fontKerning" in context) {
        context.fontKerning = "none";
    }

    if (resolvedText.hasStroke) {
        context.lineWidth = resolvedText.textInfo.sw!;
    }
}

/**
 * Builds the CSS canvas font string for a Lottie font entry.
 * @param rawFont Font metadata from the Lottie file.
 * @param fontSize Font size in pixels.
 * @returns The CSS canvas font shorthand.
 */
export function BuildCanvasFont(rawFont: RawFont, fontSize: number): string {
    const fontStyle = GetCanvasFontStyle(rawFont);
    const fontWeight = GetCanvasFontWeight(rawFont);
    const fontFamily = QuoteFontFamily(rawFont.fFamily);

    return fontStyle === "normal" ? `${fontWeight} ${fontSize}px ${fontFamily}` : `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
}

function DrawTrackedText(
    context: Pick<TextRenderContextLike, "measureText">,
    line: LottieTextLineLayout,
    trackingPx: number,
    drawGlyph: (text: string, x: number, y: number) => void
): void {
    if (line.text.length === 0) {
        return;
    }

    if (trackingPx === 0) {
        drawGlyph(line.text, line.x, line.baselineY);
        return;
    }

    // When tracking is non-zero, lay glyphs out one at a time and accumulate the measured advance
    // instead of re-measuring the growing prefix on each step (which would be O(n²) in measureText calls).
    const characters = Array.from(line.text);
    let advance = 0;
    for (let index = 0; index < characters.length; index++) {
        const character = characters[index];
        drawGlyph(character, line.x + advance + trackingPx * index, line.baselineY);
        advance += context.measureText(character).width;
    }
}

function GetPointTextLineX(justify: RawTextJustify, lineWidth: number): number {
    switch (GetHorizontalAlignment(justify)) {
        case "right":
            return -lineWidth;
        case "center":
            return -lineWidth / 2;
        case "left":
        default:
            return 0;
    }
}

function GetLineX(justify: RawTextJustify, maxWidth: number, lineWidth: number): number {
    switch (GetHorizontalAlignment(justify)) {
        case "right":
            return maxWidth - lineWidth;
        case "center":
            return (maxWidth - lineWidth) / 2;
        case "left":
        default:
            return 0;
    }
}

function GetHorizontalAlignment(justify: RawTextJustify): "left" | "right" | "center" {
    // 0: left, 1: right, 2: center. Codes 3–6 are full-justify variants that differ only in how the
    // last line is aligned (3: left, 4: right, 5: center, 6: full). We do not implement full-justify
    // (which would stretch non-last lines to the paragraph-box width), so approximate all four by
    // using the last-line alignment for every line. This matches the reference renderer for the
    // common case of single-line text and is the closest behavior otherwise.
    switch (justify) {
        case 1:
        case 4:
            return "right";
        case 2:
        case 5:
            return "center";
        case 0:
        case 3:
        case 6:
        default:
            return "left";
    }
}

function QuoteFontFamily(fontFamily: string): string {
    return /[\s,"']/.test(fontFamily) ? `"${fontFamily.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"` : fontFamily;
}

function GetCanvasFontStyle(rawFont: RawFont): string {
    const style = rawFont.fStyle?.toLowerCase() ?? "";
    return /\b(italic|oblique)\b/.test(style) ? "italic" : "normal";
}

function GetCanvasFontWeight(rawFont: RawFont): string {
    const explicitWeight = rawFont.fWeight?.trim();
    if (explicitWeight) {
        return explicitWeight;
    }

    const style = rawFont.fStyle?.toLowerCase() ?? "";
    if (/\b(thin|hairline)\b/.test(style)) {
        return "100";
    }
    if (/\b(extra|ultra)[ -]?light\b/.test(style)) {
        return "200";
    }
    if (/\b(light)\b/.test(style)) {
        return "300";
    }
    if (/\bsemi[ -]?bold\b/.test(style)) {
        return "700";
    }
    if (/\bdemi[ -]?bold\b/.test(style)) {
        return "600";
    }
    if (/\b(extra|ultra)[ -]?bold\b/.test(style)) {
        return "800";
    }
    if (/\b(black|heavy)\b/.test(style)) {
        return "900";
    }
    if (/\bbold\b/.test(style)) {
        return "700";
    }
    if (/\bmedium\b/.test(style)) {
        return "500";
    }

    return "400";
}
