/* eslint-disable @typescript-eslint/naming-convention */

import type { BrandVariants, Theme } from "@fluentui/react-components";

import { createDarkTheme, createLightTheme } from "@fluentui/react-components";

const babylonBrand: BrandVariants = {
    10: "#000000",
    20: "#1E0F11",
    30: "#34181B",
    40: "#4B1F24",
    50: "#63272D",
    60: "#7C2F36",
    70: "#96373E",
    80: "#AF4046",
    90: "#C44F51",
    100: "#D5625F",
    110: "#E4766E",
    120: "#F18A7F",
    130: "#FBA092",
    140: "#FFB8AA",
    150: "#FFD1C6",
    160: "#FFE8E2",
};

export const LightTheme: Theme = {
    ...createLightTheme(babylonBrand),
};

export const DarkTheme: Theme = {
    ...createDarkTheme(babylonBrand),
    colorBrandForeground1: babylonBrand[110],
    colorBrandForegroundLink: babylonBrand[110],
    colorBrandForegroundLinkPressed: babylonBrand[110],
    colorBrandForegroundLinkSelected: babylonBrand[110],
    colorCompoundBrandBackgroundHover: babylonBrand[100],
    colorCompoundBrandForeground1Pressed: babylonBrand[100],
    colorCompoundBrandStrokePressed: babylonBrand[100],
    colorNeutralForeground2BrandPressed: babylonBrand[100],
};
