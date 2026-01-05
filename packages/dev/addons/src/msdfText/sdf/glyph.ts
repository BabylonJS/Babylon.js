/* eslint-disable jsdoc/require-jsdoc */
import type { BMFontChar } from "./bmFont";

/** @internal */
export type SdfGlyph = {
    char: BMFontChar;
    /** index of the line */
    line: number;
    /** position within the line */
    position: number;
    x: number;
    y: number;
};
