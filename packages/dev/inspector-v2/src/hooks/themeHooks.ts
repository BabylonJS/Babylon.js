import type { TernaryDarkMode } from "usehooks-ts";

import { useTernaryDarkMode } from "usehooks-ts";

const ThemeModeStorageKey = `Babylon/Settings/ThemeMode`;

/**
 * Custom hook to manage the theme mode (light/dark/auto).
 * @param defaultMode An optional default theme mode if no theme mode has been configured yet.
 * @returns An object containing the theme mode state and helper functions.
 */
export function useThemeMode(defaultMode?: TernaryDarkMode) {
    const { isDarkMode, ternaryDarkMode, setTernaryDarkMode } = useTernaryDarkMode({ defaultValue: defaultMode, localStorageKey: ThemeModeStorageKey });
    // Make sure there is a stored value initially, even before changing the theme.
    // This way, other usages of this hook will get the correct initial value.
    if (!localStorage.getItem(ThemeModeStorageKey)) {
        localStorage.setItem(ThemeModeStorageKey, JSON.stringify(ternaryDarkMode));
    }
    return { isDarkMode, themeMode: ternaryDarkMode, setThemeMode: setTernaryDarkMode };
}
