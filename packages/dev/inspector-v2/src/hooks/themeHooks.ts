import type { TernaryDarkMode } from "usehooks-ts";

import { useTernaryDarkMode } from "usehooks-ts";

const ThemeModeStorageKey = `Babylon/Settings/ThemeMode`;

/**
 * Custom hook to manage the theme mode (system/dark/light).
 * @returns An object containing the theme mode state and helper functions.
 */
export function useThemeMode() {
    const { isDarkMode, ternaryDarkMode, setTernaryDarkMode } = useTernaryDarkMode({
        localStorageKey: ThemeModeStorageKey,
    });
    // Make sure there is a stored value initially, even before changing the theme.
    // This way, other usages of this hook will get the correct initial value.
    if (!localStorage.getItem(ThemeModeStorageKey)) {
        SetThemeMode(ternaryDarkMode);
    }
    return { isDarkMode, themeMode: ternaryDarkMode, setThemeMode: setTernaryDarkMode };
}

/**
 * Sets the theme mode.
 * @param mode The desired theme mode (system/dark/light).
 */
export function SetThemeMode(mode: TernaryDarkMode) {
    localStorage.setItem(ThemeModeStorageKey, JSON.stringify(mode));
}
