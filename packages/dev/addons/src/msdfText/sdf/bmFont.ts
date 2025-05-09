/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Holds information on how the font was generated.
 */
export type BMFontInfo = {
    /** The name of the font */
    face: string;
    /** The size of the font */
    size: number;
    /** The font is bold */
    bold: number;
    /** The font is italic */
    italic: number;
    /** The charset of the font */
    charset: string[];
    /** The charset is unicode  */
    unicode: number;
    /** The font height stretch in percentage. 100% means no stretch. */
    stretchH: number;
    /** Set to 1 if smoothing was turned on. */
    smooth: number;
    /** The supersampling level used. 1 means no supersampling was used. */
    aa: number;
    /** The padding for each character (up, right, down, left). */
    padding: [number, number, number, number];
    /** The spacing for each character (horizontal, vertical). */
    spacing: [number, number];
    /**
     * The outline thickness for the characters.
     *
     * @remark missing in msdf-bmfont-xml
     */
    outline?: number;
};

/**
 * Holds information common to all characters.
 */
export type BMFontCommon = {
    /** Distance in pixels between each line of text */
    lineHeight: number;
    /** The number of pixels from the absolute top of the line to the base of the characters */
    base: number;
    /** The width of the texture, normally used to scale the x pos of the character image */
    scaleW: number;
    /** The height of the texture, normally used to scale the y pos of the character image */
    scaleH: number;
    /** The number of pages in the font */
    pages: number;
    /** Set to 1 if the monochrome characters have been packed into each of the texture channels. In this case alphaChnl describes what is stored in each channel. */
    packed: number;
    /** Set to 0 if the channel holds the glyph data, 1 if it holds the outline, 2 if it holds the glyph and the outline, 3 if its set to zero, and 4 if its set to one. */
    alphaChnl: number;
    /** Set to 0 if the channel holds the glyph data, 1 if it holds the outline, 2 if it holds the glyph and the outline, 3 if its set to zero, and 4 if its set to one. */
    redChnl: number;
    /** Set to 0 if the channel holds the glyph data, 1 if it holds the outline, 2 if it holds the glyph and the outline, 3 if its set to zero, and 4 if its set to one. */
    greenChnl: number;
    /** Set to 0 if the channel holds the glyph data, 1 if it holds the outline, 2 if it holds the glyph and the outline, 3 if its set to zero, and 4 if its set to one. */
    blueChnl: number;
};

/** Name of a texture file. There is one for each page in the font. */
export type BMFontPages = {
    [id: number]: string;
} & Array<string>;

/**
 * Describes a single character in the font
 */
export type BMFontChar = {
    /** Character id (charCode) */
    id: number;
    /** Left position of the character image in the texture. */
    x: number;
    /** Right position of the character image in the texture */
    y: number;
    /** Width of the chracter image in the texture */
    width: number;
    /** Height of the chracter image in the texture */
    height: number;
    /** Horizontal offset to be applied on screen */
    xoffset: number;
    /** Vertical offset to be applied on screen */
    yoffset: number;
    /** Horizontal advance after the character */
    xadvance: number;
    /** Page index where the character image is found */
    page: number;
    /** Texture channel where the chracter image is found
     * - 1 = blue
     * - 2 = green
     * - 3 = red
     * - 8 = alpha
     * - 15 = all channels
     */
    chnl: number;
} & BMFontCharExtra;

/**
 * additional context from msdf-bmfont-xml
 */
export type BMFontCharExtra = {
    /** index of opentype.js glyph */
    index: number;
    /** actual character*/
    char: string;
};

/**
 * The kerning information is used to adjust the distance between certain characters, e.g. some characters should be placed closer to each other than others.
 */
export type BMFontKerning = {
    /** The first character id. */
    first: number;
    /** The second character id. */
    second: number;
    /** How much the x position should be adjusted when drawing the second character immediately following the first. */
    amount: number;
};

/**
 * Compatible with [msdf-bmfont-xml](https://github.com/soimy/msdf-bmfont-xml)
 * @see https://www.angelcode.com/products/bmfont/doc/file_format.html
 */
export type BMFont = {
    /** {@inheritDoc BMFontInfo} */
    info: BMFontInfo;
    /** {@inheritDoc BMFontCommon} */
    common: BMFontCommon;
    /** {@inheritDoc BMFontPages} */
    pages: BMFontPages;
    /** {@inheritDoc BMFontChar} */
    chars: BMFontChar[];
    /** {@inheritDoc BMFontKerning} */
    kernings: BMFontKerning[];
};
