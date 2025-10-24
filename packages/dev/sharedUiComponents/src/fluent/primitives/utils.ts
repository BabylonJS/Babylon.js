import { makeStyles, tokens } from "@fluentui/react-components";
import type { GriffelStyle } from "@fluentui/react-components";

import type { KeyboardEvent, FocusEvent } from "react";

export const CustomTokens = {
    inputWidth: "150px",
    lineHeight: tokens.lineHeightHero700, // 36px
    lineHeightSmall: tokens.lineHeightBase500, // 28px
    dividerGap: tokens.fontSizeBase100, // "10px",
    dividerGapSmall: tokens.borderRadiusMedium, // 4px",
    labelMinWidth: "50px",
    sliderMinWidth: "30px",
    sliderMaxWidth: "80px",
    rightAlignOffset: `-${tokens.borderRadiusXLarge}`, // -8px
};

export const UniformWidthStyling: GriffelStyle = { width: CustomTokens.inputWidth, boxSizing: "border-box" };
export const useInputStyles = makeStyles({
    input: UniformWidthStyling,
    inputSlot: { textAlign: "right" },
    invalid: { backgroundColor: tokens.colorPaletteRedBackground2 },
    container: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center", // align items vertically
    },
});

export function HandleOnBlur(event: FocusEvent<HTMLInputElement>) {
    event.stopPropagation();
    event.preventDefault();
}

export function HandleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    event.stopPropagation(); // Prevent event propagation

    // Prevent Enter key from causing form submission or value reversion
    if (event.key === "Enter") {
        event.preventDefault();
    }
}

/**
 * Fluent's CalculatePrecision function
 * https://github.com/microsoft/fluentui/blob/dcbf775d37938eacffa37922fc0b43a3cdd5753f/packages/utilities/src/math.ts#L91C1
 *
 * Calculates a number's precision based on the number of trailing
 * zeros if the number does not have a decimal indicated by a negative
 * precision. Otherwise, it calculates the number of digits after
 * the decimal point indicated by a positive precision.
 *
 * @param value - the value to determine the precision of
 * @returns the calculated precision
 */
export function CalculatePrecision(value: number) {
    /**
     * Group 1:
     * [1-9]([0]+$) matches trailing zeros
     * Group 2:
     * \.([0-9]*) matches all digits after a decimal point.
     */ const groups = /[1-9]([0]+$)|\.([0-9]*)/.exec(String(value));
    if (!groups) {
        return 0;
    }
    if (groups[1]) {
        return -groups[1].length;
    }
    if (groups[2]) {
        return groups[2].length;
    }
    return 0;
}

const HEX_REGEX = RegExp(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{8})$/);
export function ValidateColorHex(val: string) {
    return val != "" && HEX_REGEX.test(val);
}
