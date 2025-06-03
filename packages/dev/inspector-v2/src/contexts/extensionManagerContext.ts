import type { ExtensionManager } from "../extensibility/extensionManager";

import { createContext, useContext } from "react";

export type ExtensionManagerContext = {
    readonly extensionManager: ExtensionManager;
};

export const ExtensionManagerContext = createContext<ExtensionManagerContext | undefined>(undefined);

// eslint-disable-next-line @typescript-eslint/naming-convention
export function useExtensionManager() {
    return useContext(ExtensionManagerContext)?.extensionManager;
}
