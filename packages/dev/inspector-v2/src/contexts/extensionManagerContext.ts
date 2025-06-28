import type { ExtensionManager } from "../extensibility/extensionManager";

import { createContext, useContext } from "react";

export type ExtensionManagerContext = {
    readonly extensionManager: ExtensionManager;
};

export const ExtensionManagerContext = createContext<ExtensionManagerContext | undefined>(undefined);

export function useExtensionManager() {
    return useContext(ExtensionManagerContext)?.extensionManager;
}
