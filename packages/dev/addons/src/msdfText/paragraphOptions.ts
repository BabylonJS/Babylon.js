/* eslint-disable jsdoc/require-jsdoc */

import type { IVector2Like } from "core/Maths";

/** @internal */
export type ParagraphOptions = {
    maxWidth: number;
    lineHeight: number;
    letterSpacing: number;
    tabSize: number;
    whiteSpace: /* 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | */ "pre-line" /* | 'break-spaces'*/;
    textAlign: "left" | "right" | "center" /* | 'justify'*/;
    translate: IVector2Like | undefined;
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
