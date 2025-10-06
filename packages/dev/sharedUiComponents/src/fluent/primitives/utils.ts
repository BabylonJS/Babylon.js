import { makeStyles, tokens } from "@fluentui/react-components";
import type { GriffelStyle } from "@fluentui/react-components";

import type { KeyboardEvent, FocusEvent } from "react";

export const CustomTokens = {
    inputWidth: "150px",
    lineHeight: "36px",
    labelMinWidth: "50px",
    sliderMinWidth: "30px",
    sliderMaxWidth: "80px",
    rightAlignOffset: "-8px",
};

export const UniformWidthStyling: GriffelStyle = { width: CustomTokens.inputWidth, textAlign: "right", boxSizing: "border-box" };

export const useInputStyles = makeStyles({
    invalid: { backgroundColor: tokens.colorPaletteRedBackground2, ...UniformWidthStyling },
    valid: UniformWidthStyling,
    input: { textAlign: "end" },
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
