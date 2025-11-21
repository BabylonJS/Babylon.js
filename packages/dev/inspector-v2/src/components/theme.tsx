import type { FluentProviderProps } from "@fluentui/react-components";
import type { FunctionComponent } from "react";

import { FluentProvider } from "@fluentui/react-components";
import { useThemeMode } from "../hooks/themeHooks";
import { DarkTheme, LightTheme } from "../themes/babylonTheme";

export const Theme: FunctionComponent<FluentProviderProps & { invert?: boolean }> = (props) => {
    const { invert = false, ...rest } = props;
    const { isDarkMode } = useThemeMode();

    return (
        <FluentProvider theme={isDarkMode !== invert ? DarkTheme : LightTheme} {...rest}>
            {props.children}
        </FluentProvider>
    );
};
