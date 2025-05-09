/* eslint-disable jsdoc/require-jsdoc */
import type { BMFont } from "./bmFont";

export type SdfFontDistanceField = {
    fieldType: "sdf" | "msdf";
    distanceRange: number;
};

export type SdfFont = BMFont & {
    distanceField: SdfFontDistanceField;
};
