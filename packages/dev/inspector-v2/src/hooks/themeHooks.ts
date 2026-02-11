import type { ThemeMode } from "../services/themeService";

import { useCallback } from "react";

import { useSettingsStore } from "../contexts/settingsContext";
import { ThemeModeSettingDescriptor, ThemeResolver } from "../services/themeService";
import { DarkTheme, LightTheme } from "../themes/babylonTheme";
import { useObservableState } from "./observableHooks";
import { useResource } from "./resourceHooks";

export function useThemeMode() {
    const settingsStore = useSettingsStore();
    const themeResolver = useResource(useCallback(() => (settingsStore ? new ThemeResolver(settingsStore) : undefined), [settingsStore]));

    const state = useObservableState(
        useCallback(
            () =>
                ({
                    isDarkMode: themeResolver?.isDark ?? false,
                    themeMode: themeResolver?.mode ?? ThemeModeSettingDescriptor.defaultValue,
                    setThemeMode: (mode: ThemeMode) => {
                        if (themeResolver) {
                            themeResolver.mode = mode;
                        }
                    },
                    toggleThemeMode: () => themeResolver?.toggle(),
                }) as const,
            [themeResolver]
        ),
        themeResolver?.onChanged
    );

    if (!themeResolver) {
        throw new Error("Settings store is not available in context.");
    }

    return state;
}

export function useTheme(invert = false) {
    const { isDarkMode } = useThemeMode();
    return isDarkMode !== invert ? DarkTheme : LightTheme;
}
