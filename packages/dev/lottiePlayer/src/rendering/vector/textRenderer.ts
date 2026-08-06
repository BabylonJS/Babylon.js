// Text renderer — rasterizes each text layer to a texture via Canvas2D and draws it as a textured
// quad. A thin adapter over the shared textured-quad renderer: it owns the per-block rasterization
// and upload; all GL plumbing lives in texturedQuad.ts.
//
// Lottie text here has no baked glyph outlines, so we rely on the platform font (Segoe UI etc.) via
// Canvas2D `fillText`. Each text document is rasterized ONCE at a supersampled resolution; per frame
// its layer transform maps the text's local rect to a screen quad. Per-glyph text animators are not
// handled — the whole block draws at the layer opacity.

import "core/Engines/Extensions/engine.dynamicTexture";

import { Constants } from "core/Engines/constants";
import { ThinTexture } from "core/Materials/Textures/thinTexture";
import { type Nullable } from "core/types";
import { type ThinEngine } from "core/Engines/thinEngine";

import { type ILayerRenderer } from "./layerRenderer";
import { type IParsedLayer, type IParsedText } from "../../animation/parse";
import { CreateTexturedQuadRenderer, type IQuadRect } from "./texturedQuad";

const Supersample = 3; // rasterize at 3x for crisp downscaling

/** A rasterized text block: its texture and the layer-local rect the texture covers. */
interface ITextBlock {
    texture: ThinTexture;
    /** Local-space rect (content units, origin at the text anchor). */
    left: number;
    top: number;
    width: number;
    height: number;
}

type RasterCanvas = HTMLCanvasElement | OffscreenCanvas;
type RasterContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

// OffscreenCanvas keeps this working inside the worker; LocalPlayer exists for browsers without it,
// so fall back to a DOM canvas there.
function CreateRasterCanvas(): Nullable<RasterCanvas> {
    if (typeof OffscreenCanvas !== "undefined") {
        return new OffscreenCanvas(1, 1);
    }
    if (typeof document !== "undefined") {
        return document.createElement("canvas");
    }
    return null;
}

function GetCssFont(t: IParsedText): string {
    return `${t.style} ${t.weight} ${t.size}px "${t.family}"`;
}

// Greedy word-wrap of a single paragraph to fit within `maxW` (in local px). A word wider than the
// box is broken mid-word, otherwise it would overflow and be clipped.
function WrapParagraph(ctx: RasterContext, text: string, maxW: number): string[] {
    if (text.length === 0) {
        return [""];
    }
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
        const test = current ? current + " " + word : word;
        if (current && ctx.measureText(test).width > maxW) {
            lines.push(current);
            current = word;
        } else {
            current = test;
        }
        while (current.length > 1 && ctx.measureText(current).width > maxW) {
            let fit = 1;
            while (fit < current.length && ctx.measureText(current.slice(0, fit + 1)).width <= maxW) {
                fit++;
            }
            lines.push(current.slice(0, fit));
            current = current.slice(fit);
        }
    }
    if (current) {
        lines.push(current);
    }
    return lines;
}

// Rasterize one text document into a canvas plus the layer-local rect it maps to. Returns null when
// the block has no area.
function RasterizeText(t: IParsedText): Nullable<{ canvas: RasterCanvas; left: number; top: number; width: number; height: number }> {
    const canvas = CreateRasterCanvas();
    if (!canvas) {
        return null;
    }
    const ctx = canvas.getContext("2d") as Nullable<RasterContext>;
    if (!ctx) {
        return null;
    }
    const font = GetCssFont(t);
    ctx.font = font;
    // Letter spacing (Chrome 99+); harmless if unsupported.
    (ctx as unknown as { letterSpacing: string }).letterSpacing = `${t.letterSpacing}px`;

    // Explicit breaks always split; boxed/paragraph text also word-wraps to the box width.
    const boxed = t.boxW !== undefined && t.boxW > 0;
    const rawLines = t.text.split(/\r\n|\r|\n/);
    let lines: string[];
    if (boxed) {
        lines = [];
        for (const rawLine of rawLines) {
            const wrapped = WrapParagraph(ctx, rawLine, t.boxW as number);
            for (const line of wrapped) {
                lines.push(line);
            }
        }
    } else {
        lines = rawLines;
    }

    let maxW = 0;
    for (const line of lines) {
        maxW = Math.max(maxW, ctx.measureText(line).width);
    }
    const metrics = ctx.measureText("Mg");
    const ascent = metrics.fontBoundingBoxAscent || t.size * 0.8;
    const descent = metrics.fontBoundingBoxDescent || t.size * 0.25;
    const pad = Math.ceil(t.size * 0.35);
    const blockH = ascent + (lines.length - 1) * t.lineHeight + descent;
    // A boxed layer reserves the full box width so justification and the box origin map exactly;
    // point text uses the measured max line width.
    const contentW = boxed ? (t.boxW as number) : maxW;
    const localW = contentW + 2 * pad;
    const localH = blockH + 2 * pad;
    if (localW < 1 || localH < 1) {
        return null;
    }

    canvas.width = Math.ceil(localW * Supersample);
    canvas.height = Math.ceil(localH * Supersample);
    // Resizing clears the context, so re-apply state.
    ctx.scale(Supersample, Supersample);
    ctx.font = font;
    (ctx as unknown as { letterSpacing: string }).letterSpacing = `${t.letterSpacing}px`;
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = `rgb(${Math.round(t.color[0] * 255)}, ${Math.round(t.color[1] * 255)}, ${Math.round(t.color[2] * 255)})`;

    for (let i = 0; i < lines.length; i++) {
        const lineW = ctx.measureText(lines[i]).width;
        let lineX = pad; // left
        if (t.justify === 2) {
            lineX = pad + (contentW - lineW) / 2;
        } else if (t.justify === 1) {
            lineX = pad + (contentW - lineW);
        }
        ctx.fillText(lines[i], lineX, pad + ascent + i * t.lineHeight);
    }

    let localLeft: number;
    let localTop: number;
    if (boxed) {
        // Boxed text is anchored at its box top-left (`ps`); the first baseline sits one ascent
        // below the box top. The texture top-left is one `pad` up-left of the box origin.
        localLeft = (t.boxX ?? 0) - pad;
        localTop = (t.boxY ?? 0) - pad;
    } else {
        // Point text: the first-line baseline start sits at local (0,0); justify shifts the origin.
        if (t.justify === 2) {
            localLeft = -maxW / 2 - pad;
        } else if (t.justify === 1) {
            localLeft = -maxW - pad;
        } else {
            localLeft = -pad;
        }
        localTop = -(pad + ascent);
    }

    return { canvas, left: localLeft, top: localTop, width: localW, height: localH };
}

/**
 * Creates the text-layer renderer. Rasterizes every text document up front.
 * @param engine The engine to render with.
 * @param textLayers The animation's text layers.
 * @returns A layer renderer for Lottie text layers (`ty === 5`).
 */
export function CreateTextRenderer(engine: ThinEngine, textLayers: readonly IParsedLayer[]): ILayerRenderer {
    const blocks = new Map<number, ITextBlock>();
    for (const layer of textLayers) {
        if (!layer.text || layer.text.text.length === 0) {
            continue;
        }
        const raster = RasterizeText(layer.text);
        if (!raster) {
            continue;
        }
        // Straight alpha (no premultiply) — the fragment shader premultiplies.
        const internal = engine.createDynamicTexture(raster.canvas.width, raster.canvas.height, false, Constants.TEXTURE_BILINEAR_SAMPLINGMODE);
        engine.updateDynamicTexture(internal, raster.canvas, false, false);
        blocks.set(layer.ind, { texture: new ThinTexture(internal), left: raster.left, top: raster.top, width: raster.width, height: raster.height });
    }

    return CreateTexturedQuadRenderer(engine, {
        kind: 5,
        fillRect(layer: IParsedLayer, rect: IQuadRect): boolean {
            const block = blocks.get(layer.ind);
            if (!block) {
                return false;
            }
            rect.left = block.left;
            rect.top = block.top;
            rect.width = block.width;
            rect.height = block.height;
            return true;
        },
        textureFor: (layer) => blocks.get(layer.ind)?.texture ?? null,
        disposeTextures() {
            for (const block of blocks.values()) {
                block.texture.dispose();
            }
            blocks.clear();
        },
    });
}
