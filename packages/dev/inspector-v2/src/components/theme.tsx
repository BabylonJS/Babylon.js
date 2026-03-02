import type { FluentProviderProps } from "@fluentui/react-components";
import type { FunctionComponent } from "react";

import { FluentProvider, makeStyles, mergeClasses, tokens } from "@fluentui/react-components";
import { useTheme } from "../hooks/themeHooks";

// Fluent doesn't apply styling to scrollbars by default, so provide our own reasonable default.
const useStyles = makeStyles({
    root: {
        scrollbarColor: `${tokens.colorNeutralForeground3} ${tokens.colorTransparentBackground}`,
    },
});

export const Theme: FunctionComponent<FluentProviderProps & { invert?: boolean }> = (props) => {
    // NOTE: We do not want to applyStylesToPortals by default. It makes classes flow into portals
    // (like popovers), and if those styles do things like disable overflow, they can completely
    // break any UI within the portal. Therefore, default to false.
    const { invert = false, applyStylesToPortals = false, className, ...rest } = props;
    const theme = useTheme(invert);
    const classes = useStyles();

    return (
        <FluentProvider theme={theme} className={mergeClasses(classes.root, className)} applyStylesToPortals={applyStylesToPortals} {...rest}>
            {props.children}
        </FluentProvider>
    );
};
