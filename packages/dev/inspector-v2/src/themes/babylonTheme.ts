import type { BrandVariants, Theme } from "@fluentui/react-components";

import { createDarkTheme, createLightTheme } from "@fluentui/react-components";

// Generated from https://react.fluentui.dev/?path=/docs/theme-theme-designer--docs
// Key color: #3A94FC
/* eslint-disable @typescript-eslint/naming-convention */
const BabylonRamp: BrandVariants = {
    10: "#020305",
    20: "#121721",
    30: "#1A263A",
    40: "#1F314F",
    50: "#243E64",
    60: "#294B7B",
    70: "#2D5892",
    80: "#3166AA",
    90: "#3473C3",
    100: "#3782DC",
    110: "#3990F6",
    120: "#5A9EFD",
    130: "#7BACFE",
    140: "#96BAFF",
    150: "#AFC9FF",
    160: "#C6D8FF",
};
/* eslint-enable @typescript-eslint/naming-convention */

const BaseLightTheme = createLightTheme(BabylonRamp);
export const LightTheme: Theme = {
    ...BaseLightTheme,
    // Reduce the max contrast between foreground and background by just replacing the most intense foreground color with the second most intense one.
    colorNeutralForeground1: BaseLightTheme.colorNeutralForeground2,
};

const BaseDarkTheme = createDarkTheme(BabylonRamp);
export const DarkTheme: Theme = {
    ...BaseDarkTheme,
    // Reduce the max contrast between foreground and background by just replacing the most intense foreground color with the second most intense one.
    colorNeutralForeground1: BaseDarkTheme.colorNeutralForeground2,
};
