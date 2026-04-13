import { type ThemeMode, ThemeModeSettingDescriptor, ThemeResolver } from "../services/themeService";

import { useCallback } from "react";

import { useSettingsStore } from "../contexts/settingsContext";
import { DarkTheme, LightTheme } from "../themes/babylonTheme";
import { useObservableState } from "./observableHooks";
import { useResource } from "./resourceHooks";

/**
 * Hook that provides the current theme mode state and controls for changing it.
 * @returns An object with the current dark mode state, theme mode, and functions to set or toggle the theme.
 */
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

/**
 * Hook that returns the current Fluent UI theme based on the active theme mode.
 * @param invert If true, inverts the theme (returns light theme in dark mode and vice versa). Defaults to false.
 * @returns The current Fluent UI theme object.
 */
export function useTheme(invert = false) {
    const { isDarkMode } = useThemeMode();
    return isDarkMode !== invert ? DarkTheme : LightTheme;
}
