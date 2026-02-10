import type { ISettingsStore } from "../services/settingsStore";

import { createContext, useContext } from "react";

export type SettingsStoreContext = {
    readonly settingsStore: ISettingsStore;
};

export const SettingsStoreContext = createContext<SettingsStoreContext | undefined>(undefined);

export function useSettingsStore() {
    return useContext(SettingsStoreContext)?.settingsStore;
}
