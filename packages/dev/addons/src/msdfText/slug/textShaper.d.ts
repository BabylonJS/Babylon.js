/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Ambient type declarations for the text-shaper library.
 * Only the types used by the Slug GPU font rendering module are declared here.
 * @see https://github.com/wiedymi/text-shaper
 */
declare module "text-shaper" {
    export type GlyphId = number;

    export interface GlyphInfo {
        glyphId: GlyphId;
        cluster: number;
        mask: number;
        codepoint: number;
    }

    export interface GlyphPosition {
        xAdvance: number;
        yAdvance: number;
        xOffset: number;
        yOffset: number;
    }

    export type PathCommand =
        | { type: "M"; x: number; y: number }
        | { type: "L"; x: number; y: number }
        | { type: "Q"; x1: number; y1: number; x: number; y: number }
        | { type: "C"; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
        | { type: "Z" };

    export interface GlyphPath {
        commands: PathCommand[];
        bounds: { xMin: number; yMin: number; xMax: number; yMax: number } | null;
    }

    export class Font {
        static load(buffer: ArrayBuffer): Font;
        static loadAsync(buffer: ArrayBuffer): Promise<Font>;
        static fromURL(url: string): Promise<Font>;
        get ascender(): number;
        get descender(): number;
        get lineGap(): number;
        get unitsPerEm(): number;
        scaleForSize(sizePx: number, mode?: "em" | "height"): number;
        glyphId(codepoint: number): GlyphId;
    }

    export class UnicodeBuffer {
        addStr(text: string, startCluster?: number): this;
        addCodepoints(codepoints: number[], startCluster?: number): this;
        clear(): this;
        get length(): number;
    }

    export class GlyphBuffer {
        infos: GlyphInfo[];
        positions: GlyphPosition[];
        get length(): number;
        [Symbol.iterator](): Iterator<{ info: GlyphInfo; position: GlyphPosition }>;
    }

    export function shape(font: Font, buffer: UnicodeBuffer): GlyphBuffer;
    export function getGlyphPath(font: Font, glyphId: GlyphId): GlyphPath | null;
}
