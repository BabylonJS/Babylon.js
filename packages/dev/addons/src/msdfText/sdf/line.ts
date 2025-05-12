/* eslint-disable jsdoc/require-jsdoc */
import type { SdfGlyph } from "./glyph";

/** @internal */
export type SdfTextLine = {
    text: string;
    glyphs: SdfGlyph[];
    start: number;
    end: number;
    width: number;
};
