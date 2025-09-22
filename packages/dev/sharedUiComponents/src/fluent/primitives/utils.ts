import type { KeyboardEvent, FocusEvent } from "react";

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
