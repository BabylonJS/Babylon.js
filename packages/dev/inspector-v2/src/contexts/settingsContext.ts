import type { ISettingsStore } from "../services/settingsStore";

import { createContext, useContext } from "react";

export const SettingsStoreContext = createContext<ISettingsStore | undefined>(undefined);

export function useSettingsStore() {
    return useContext(SettingsStoreContext);
}
