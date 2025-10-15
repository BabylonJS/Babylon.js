import type { FluentProviderProps } from "@fluentui/react-components";
import type { FunctionComponent } from "react";

import { useThemeMode } from "../hooks/themeHooks";
import { DarkTheme, LightTheme } from "../themes/babylonTheme";
import { FluentToolWrapper } from "shared-ui-components/fluent/hoc/fluentToolWrapper";
import type { UiSize } from "shared-ui-components/fluent/hoc/fluentToolWrapper";

export const Theme: FunctionComponent<FluentProviderProps & { invert?: boolean; size?: UiSize }> = (props) => {
    const { invert = false, ...rest } = props;
    const { isDarkMode } = useThemeMode();

    return (
        <FluentToolWrapper customTheme={isDarkMode !== invert ? DarkTheme : LightTheme} toolName="Inspector" useFluent={true} {...rest}>
            {props.children}
        </FluentToolWrapper>
    );
};
