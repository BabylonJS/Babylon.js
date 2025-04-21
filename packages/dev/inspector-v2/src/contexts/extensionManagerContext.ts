import type { ExtensionManager } from "../extensibility/extensionManager";

import { useContext } from "react";
import { AppContext } from "./appContext";

export type ExtensionManagerContext = {
    readonly extensionManager: ExtensionManager;
};

declare module "./AppContext" {
    interface AppContext {
        extensionManagerContext?: ExtensionManagerContext;
    }
}

export function useExtensionManager() {
    const extensionManagerContext = useContext(AppContext)?.extensionManagerContext;
    if (!extensionManagerContext) {
        throw new Error("AppContext or ExtensionManagerContext is missing.");
    }

    return extensionManagerContext.extensionManager;
}
