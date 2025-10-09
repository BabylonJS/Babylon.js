import { makeStyles, tokens } from "@fluentui/react-components";
import type { GriffelStyle } from "@fluentui/react-components";

import type { KeyboardEvent, FocusEvent } from "react";

export const CustomTokens = {
    inputWidth: "150px",
    lineHeight: "32px",
    labelMinWidth: "50px",
    sliderMinWidth: "30px",
    sliderMaxWidth: "80px",
    rightAlignOffset: "-8px",
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
        gap: "4px",
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
