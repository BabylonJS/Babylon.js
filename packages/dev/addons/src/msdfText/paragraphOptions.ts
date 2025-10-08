/* eslint-disable jsdoc/require-jsdoc */

import type { IVector2Like } from "core/Maths/math.like";
import type { SdfTextLine } from "./sdf/line";
import type { SdfGlyph } from "./sdf/glyph";

export interface ISdfTextParagraphMetrics {
    /** @internal */
    readonly paragraph: string;
    /** @internal */
    readonly lines: SdfTextLine[];
    /** @internal */
    readonly width: number;
    /** @internal */
    readonly height: number;
    /** @internal */
    readonly glyphs: SdfGlyph[];
}

/** @internal */
export type ParagraphOptions = {
    maxWidth: number;
    lineHeight: number;
    letterSpacing: number;
    tabSize: number;
    whiteSpace: /* 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | */ "pre-line" /* | 'break-spaces'*/;
    textAlign: "left" | "right" | "center" /* | 'justify'*/;
    translate: IVector2Like | undefined;
    customLayoutEngine?: (text: string, options: ParagraphOptions) => ISdfTextParagraphMetrics;
};

/** @internal */
export const DefaultParagraphOptions: ParagraphOptions = {
    maxWidth: Infinity,
    lineHeight: 1,
    letterSpacing: 1,
    tabSize: 4,
    whiteSpace: "pre-line",
    textAlign: "center",
    translate: { x: -0.5, y: -0.5 },
};
