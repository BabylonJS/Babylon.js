import { createContext, useContext } from "react";

import { type DialogOptions } from "../services/dialogService";

type DialogContext = {
    showDialog: (options: DialogOptions) => void;
};

export const DialogContext = createContext<DialogContext>({ showDialog: (options: DialogOptions) => alert(options.title) });

/**
 * Returns the showDialog function provided by the surrounding modular tool framework.
 * If called outside of a DialogContext provider, falls back to the default context
 * value, whose showDialog implementation invokes the browser's blocking `alert` with
 * the dialog title.
 * @returns A function that displays a dialog when called.
 */
export function useDialog(): DialogContext {
    return useContext(DialogContext);
}
