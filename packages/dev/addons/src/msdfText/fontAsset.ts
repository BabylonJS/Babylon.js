import type { BMFontChar } from "./sdf/bmFont";
import type { SdfFont } from "./sdf/font";
import { Texture } from "core/Materials/Textures/texture";

enum CharCode {
    SPACE = 32,
    TOFU = 0xfffc,
}

/**
 * Class representing a font asset for SDF (Signed Distance Field) rendering.
 */
export class FontAsset {
    private readonly _chars = new Map<number, BMFontChar>();
    private readonly _charsRegex: RegExp;
    private readonly _kernings = new Map<number, Map<number, number>>();

    /** @internal */
    public readonly _font: SdfFont;

    /**
     * Gets the font scale value
     */
    public readonly scale: number;

    /**
     * Gets the list of used textures
     */
    public readonly textures: Texture[];

    /**
     * Creates a new FontAsset instance.
     * @param definitionData defines the font data in JSON format.
     * @param textureUrl defines the url of the texture to use for the font.
     */
    public constructor(definitionData: string, textureUrl: string) {
        this._font = JSON.parse(definitionData) as SdfFont;
        // So far we only consider one page
        this._font.pages = [textureUrl];

        this._font.chars.forEach((char) => this._chars.set(char.id, char));
        this._font.kernings.forEach((kerning) => {
            let submap = this._kernings.get(kerning.first);
            if (!submap) {
                submap = new Map();
                this._kernings.set(kerning.first, submap);
            }
            submap.set(kerning.second, kerning.amount);
        });
        this._charsRegex = new RegExp(`[${this._font.chars.map((c) => c.char.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")).join("")}]`, "g");

        this._updateFallbacks();

        this.scale = 1 / this._font.info.size;
        this.textures = this._font.pages.map((page) => new Texture(page, undefined, { noMipmap: true, invertY: false }));
    }

    private _updateFallbacks() {
        if (!this._chars.has(CharCode.SPACE)) {
            this._chars.set(CharCode.SPACE, {
                id: CharCode.SPACE,
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                xoffset: 0,
                yoffset: 0,
                xadvance: this._font.info.size * 0.5,
                page: -1,
                chnl: -1,
                index: -1,
                char: " ",
            });
        }

        if (!this._chars.has(CharCode.TOFU)) {
            this._chars.set(CharCode.TOFU, {
                id: CharCode.TOFU,
                x: 0,
                y: 0,
                width: this._font.info.size,
                height: this._font.info.size,
                xoffset: 0,
                yoffset: 0,
                xadvance: this._font.info.size * 0.5,
                page: -1,
                chnl: -1,
                index: -1,
                char: "￿",
            });
        }
    }

    /** @internal */
    public _getChar(charCode: number) {
        return this._chars.get(charCode) || this._chars.get(CharCode.TOFU)!;
    }

    /** @internal */
    public _getKerning(first: number, second: number) {
        return this._kernings.get(first)?.get(second) || 0;
    }

    /** @internal */
    public _unsupportedChars(text: string) {
        return text.replace(this._charsRegex, "");
    }
}
