/**
 * Font asset for Slug GPU font rendering.
 *
 * Wraps the text-shaper library to load TTF/OTF fonts and provide
 * font metrics needed for text rendering.
 */

import { Font } from "text-shaper";
import type { IDisposable } from "core/scene";

/**
 * Class representing a font loaded for Slug GPU rendering.
 * Unlike MSDF fonts which require pre-baked atlas textures,
 * Slug fonts work directly from the TTF/OTF bezier curve data.
 */
export class SlugFontAsset implements IDisposable {
    private _font: Font;

    /**
     * Gets the underlying text-shaper Font instance.
     * @internal
     */
    public get font(): Font {
        return this._font;
    }

    /**
     * Gets the font ascender value in font units.
     */
    public get ascender(): number {
        return this._font.ascender;
    }

    /**
     * Gets the font descender value in font units (typically negative).
     */
    public get descender(): number {
        return this._font.descender;
    }

    /**
     * Computes the scale factor to render text at the given pixel size.
     * @param fontSize - Desired font size in pixels
     * @returns Scale factor to multiply font-unit coordinates by
     */
    public scaleForSize(fontSize: number): number {
        return this._font.scaleForSize(fontSize);
    }

    private constructor(font: Font) {
        this._font = font;
    }

    /**
     * Creates a new SlugFontAsset by loading a TTF or OTF font from a URL.
     * @param url - URL to the font file (.ttf or .otf)
     * @returns A promise that resolves to the created SlugFontAsset
     */
    public static async CreateAsync(url: string): Promise<SlugFontAsset> {
        const response = await fetch(url);
        const data = await response.arrayBuffer();
        const font = Font.load(data);
        return new SlugFontAsset(font);
    }

    /**
     * Creates a new SlugFontAsset from an ArrayBuffer containing font data.
     * @param data - ArrayBuffer with TTF or OTF font data
     * @returns The created SlugFontAsset
     */
    public static CreateFromBuffer(data: ArrayBuffer): SlugFontAsset {
        const font = Font.load(data);
        return new SlugFontAsset(font);
    }

    /**
     * Releases resources held by this font asset.
     */
    public dispose(): void {
        // text-shaper Font doesn't require explicit disposal,
        // but we clear our reference to allow GC.
        (this as any)._font = null;
    }
}
