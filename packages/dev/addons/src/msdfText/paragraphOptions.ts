/* eslint-disable jsdoc/require-jsdoc */

import { Vector2 } from "core/Maths/math.vector";

/** @internal */
export type ParagraphOptions = {
    maxWidth: number;
    lineHeight: number;
    letterSpacing: number;
    tabSize: number;
    whiteSpace: /* 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | */ "pre-line" /* | 'break-spaces'*/;
    textAlign: "left" | "right" | "center" /* | 'justify'*/;
    translate: Vector2 | undefined;
};

/** @internal */
export const DefaultParagraphOptions: ParagraphOptions = {
    maxWidth: Infinity,
    lineHeight: 1,
    letterSpacing: 1,
    tabSize: 4,
    whiteSpace: "pre-line",
    textAlign: "center",
    translate: new Vector2(-0.5, -0.5),
};
