import type { FluentProviderProps } from "@fluentui/react-components";
import type { FunctionComponent } from "react";

import { FluentProvider } from "@fluentui/react-components";
import { useThemeMode } from "../hooks/themeHooks";
import { DarkTheme, LightTheme } from "../themes/babylonTheme";

export function useTheme(invert = false) {
    const { isDarkMode } = useThemeMode();
    return isDarkMode !== invert ? DarkTheme : LightTheme;
}

export const Theme: FunctionComponent<FluentProviderProps & { invert?: boolean }> = (props) => {
    // NOTE: We do not want to applyStylesToPortals by default. If makes classes flow into portals
    // (like popovers), and if those styles do things like disable overflow, they can completely
    // break any UI within the portal. Therefore, default to false.
    const { invert = false, applyStylesToPortals = false, ...rest } = props;
    const theme = useTheme(invert);

    return (
        <FluentProvider theme={theme} applyStylesToPortals={applyStylesToPortals} {...rest}>
            {props.children}
        </FluentProvider>
    );
};
