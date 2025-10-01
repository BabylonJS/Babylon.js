import type { TernaryDarkMode } from "usehooks-ts";

import { useTernaryDarkMode } from "usehooks-ts";

const ThemeModeStorageKey = `Babylon/Settings/ThemeMode`;

/**
 * Custom hook to manage the theme mode (light/dark/auto).
 * @param modeOverride If specified, any previously stored theme mode will be replaced with this mode.
 * @returns An object containing the theme mode state and helper functions.
 */
export function useThemeMode(modeOverride?: TernaryDarkMode) {
    const { isDarkMode, ternaryDarkMode, setTernaryDarkMode } = useTernaryDarkMode({
        defaultValue: modeOverride,
        initializeWithValue: !modeOverride,
        localStorageKey: ThemeModeStorageKey,
    });
    // If a modeOverride is provided, replace any previously stored mode.
    // Also make sure there is a stored value initially, even before changing the theme.
    // This way, other usages of this hook will get the correct initial value.
    if (modeOverride || !localStorage.getItem(ThemeModeStorageKey)) {
        localStorage.setItem(ThemeModeStorageKey, JSON.stringify(ternaryDarkMode));
    }
    return { isDarkMode, themeMode: ternaryDarkMode, setThemeMode: setTernaryDarkMode };
}
