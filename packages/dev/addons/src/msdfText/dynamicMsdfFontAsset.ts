/* eslint-disable jsdoc/require-jsdoc */
import type { Scene } from "core/scene";
import { Texture } from "core/Materials/Textures/texture";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { Constants } from "core/Engines/constants";
import { buildMsdfStringAtlas, msdfAtlasToRGBA } from "text-shaper";
import { FontAsset } from "./fontAsset";
import type { SlugFontAsset } from "./slug/slugFontAsset";
import type { BMFontChar } from "./sdf/bmFont";
import type { SdfFont } from "./sdf/font";

/**
 * Options controlling on-the-fly MSDF atlas generation.
 */
export interface DynamicMsdfFontOptions {
    /** Glyph cell size in pixels (default: 32). Larger = sharper but more memory. */
    fontSize?: number;
    /** Padding between glyphs in the atlas in pixels (default: 4). */
    padding?: number;
    /** SDF spread radius in pixels (default: 4). Sets the distanceField.distanceRange too. */
    spread?: number;
    /** Maximum atlas texture width in pixels (default: 1024). */
    maxAtlasWidth?: number;
    /**
     * If true, after generating the MSDF atlas, fold the three channels into a
     * single channel by replacing each pixel's RGB with its median value. The
     * MSDF shader still computes `median(rgb)` so output is unchanged in shape,
     * but per-channel oscillations (a known issue of cheap MSDF encoders on
     * dense scripts like CJK) are smoothed away at the cost of corner
     * sharpness. Default: false.
     */
    flattenChannels?: boolean;
}

/**
 * Builds an MSDF FontAsset entirely at runtime, baking only the glyphs needed
 * by the supplied text. Unlike {@link FontAsset} loaded from a pre-baked bmFont
 * JSON + PNG, this works for any font (including CJK fonts where a full atlas
 * would be impractically large) and the atlas always matches the current text.
 *
 * The atlas bitmap is uploaded via a PNG data URL; allow one frame for the
 * texture to decode before the MSDF render reflects the new content.
 *
 * @param slugFont - Slug font asset wrapping the text-shaper Font to bake from.
 * @param text - Text whose glyphs should be present in the atlas.
 * @param scene - Optional Babylon scene used to host the generated texture.
 * @param options - Optional atlas generation parameters.
 * @returns A FontAsset whose textures contain the freshly-baked MSDF atlas.
 */
export async function CreateDynamicMsdfFontAssetAsync(
    slugFont: SlugFontAsset,
    text: string,
    scene?: Scene,
    options?: DynamicMsdfFontOptions
): Promise<FontAsset> {
    const fontSize = options?.fontSize ?? 32;
    const padding = options?.padding ?? 4;
    const spread = options?.spread ?? 4;
    const maxWidth = options?.maxAtlasWidth ?? 1024;

    const tsFont = slugFont.font;

    // Bake just the glyphs needed by `text`.
    const atlas = buildMsdfStringAtlas(tsFont, text, {
        fontSize,
        padding,
        spread,
        maxWidth,
    });

    // Encode the atlas bitmap as raw RGBA bytes. We upload the bytes directly to
    // a RawTexture rather than round-tripping through canvas.toDataURL("image/png")
    // — the PNG encoder applies filtering/predictor passes that round-trip cleanly
    // for typical photographic content, but can subtly perturb the per-pixel MSDF
    // bytes in ways the median(rgb) shader picks up as speckle.
    const rgba = msdfAtlasToRGBA(atlas);

    if (options?.flattenChannels) {
        // Replace each pixel's RGB with its median. This converts the per-channel
        // MSDF into an effectively single-channel SDF in disguise: `median(rgb)`
        // becomes equal to the original median value, but the resulting field is
        // smoothly varying across pixels, so the shader's `fwidth(median)`
        // anti-aliasing no longer amplifies the per-channel oscillations that
        // text-shaper's MSDF encoder produces on dense scripts (e.g. CJK).
        // Trade-off: corner sharpness is reduced — MSDF's main visual advantage
        // over single-channel SDF is lost. Useful as a quality knob for fonts
        // where the noisy encoding outweighs the corner benefit.
        for (let i = 0; i < rgba.length; i += 4) {
            const r = rgba[i];
            const g = rgba[i + 1];
            const b = rgba[i + 2];
            const m = Math.max(Math.min(r, g), Math.min(Math.max(r, g), b));
            rgba[i] = m;
            rgba[i + 1] = m;
            rgba[i + 2] = m;
        }
    }

    // Build font metrics in atlas pixel space.
    const scale = tsFont.scaleForSize(fontSize);
    const ascenderPx = tsFont.ascender * scale;
    const descenderPx = tsFont.descender * scale;
    const lineGapPx = (tsFont.lineGap || 0) * scale;
    const base = Math.round(ascenderPx);
    const lineHeight = Math.max(1, Math.round(ascenderPx - descenderPx + lineGapPx));

    // Build bmFont chars. text-shaper's atlas is keyed by glyphId; map each
    // unique character in `text` back to its glyphId and emit one BMFontChar.
    // Multiple charCodes mapped to the same glyphId share the same atlas region.
    const chars: BMFontChar[] = [];
    const seenCodes = new Set<number>();
    for (const ch of text) {
        const code = ch.codePointAt(0);
        if (code === undefined || seenCodes.has(code)) {
            continue;
        }
        seenCodes.add(code);
        const gid = tsFont.glyphId(code);
        if (gid === 0) {
            continue; // missing glyph; let bmFont's TOFU fallback handle it
        }
        const m = atlas.glyphs.get(gid);
        if (!m) {
            continue;
        }
        chars.push({
            id: code,
            x: m.atlasX,
            y: m.atlasY,
            width: m.width,
            height: m.height,
            xoffset: m.bearingX,
            // bmFont yoffset = distance from line top (Y-down) to glyph top edge.
            // text-shaper bearingY = pixels above baseline to glyph top edge (Y-up).
            // Since line_top = baseline - base, yoffset = base - bearingY.
            yoffset: base - m.bearingY,
            xadvance: m.advance,
            page: 0,
            chnl: 15,
            index: gid,
            char: ch,
        });
    }

    const sdfFont: SdfFont = {
        info: {
            face: "DynamicMSDF",
            size: fontSize,
            bold: 0,
            italic: 0,
            charset: [],
            unicode: 1,
            stretchH: 100,
            smooth: 1,
            aa: 1,
            padding: [0, 0, 0, 0],
            spacing: [0, 0],
        },
        common: {
            lineHeight,
            base,
            scaleW: atlas.bitmap.width,
            scaleH: atlas.bitmap.rows,
            pages: 1,
            packed: 0,
            alphaChnl: 0,
            redChnl: 0,
            greenChnl: 0,
            blueChnl: 0,
        },
        pages: ["dynamic-msdf://atlas"],
        chars,
        kernings: [],
        distanceField: { fieldType: "msdf", distanceRange: spread },
    };

    // Upload the raw RGBA bytes to the GPU directly. Bypassing the PNG round-trip
    // avoids any color-space adjustments or alpha pre-multiplication the browser's
    // image decoder might apply, which can subtly perturb the MSDF byte pattern
    // and show up as speckle through median(rgb) in the fragment shader.
    const atlasTexture = RawTexture.CreateRGBATexture(
        rgba,
        atlas.bitmap.width,
        atlas.bitmap.rows,
        scene ?? null,
        /* generateMipMaps */ false,
        /* invertY */ false,
        /* samplingMode */ Constants.TEXTURE_LINEAR_LINEAR,
        /* type */ Constants.TEXTURETYPE_UNSIGNED_BYTE,
        /* creationFlags */ 0,
        /* useSRGBBuffer */ false
    );
    atlasTexture.anisotropicFilteringLevel = 1;
    atlasTexture.gammaSpace = false;
    atlasTexture.wrapU = Texture.CLAMP_ADDRESSMODE;
    atlasTexture.wrapV = Texture.CLAMP_ADDRESSMODE;
    atlasTexture.name = "DynamicMSDF-" + atlas.bitmap.width + "x" + atlas.bitmap.rows;

    const fontAsset = new FontAsset(JSON.stringify(sdfFont), "dynamic-msdf://atlas", scene, {
        existingTextures: [atlasTexture],
    });

    // Expose the raw atlas bytes so debug UIs can draw the atlas without having
    // to read it back from the GPU. The render path uses `atlasTexture` directly.
    (fontAsset as unknown as {
        _dynamicAtlasRgba: Uint8Array;
        _dynamicAtlasWidth: number;
        _dynamicAtlasHeight: number;
    })._dynamicAtlasRgba = rgba;
    (fontAsset as unknown as { _dynamicAtlasWidth: number })._dynamicAtlasWidth = atlas.bitmap.width;
    (fontAsset as unknown as { _dynamicAtlasHeight: number })._dynamicAtlasHeight = atlas.bitmap.rows;

    return fontAsset;
}
