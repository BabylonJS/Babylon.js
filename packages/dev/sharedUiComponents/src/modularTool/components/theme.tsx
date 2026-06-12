import {
    type FluentProviderProps,
    type GriffelRenderer,
    FluentProvider,
    RendererProvider,
    createDOMRenderer,
    makeStyles,
    mergeClasses,
    tokens,
    useFluent,
} from "@fluentui/react-components";
import { type FunctionComponent, useMemo } from "react";

import { useTheme } from "../hooks/themeHooks";

// Fluent doesn't apply styling to scrollbars by default, so provide our own reasonable default.
const useStyles = makeStyles({
    root: {
        scrollbarColor: `${tokens.colorNeutralForeground3} ${tokens.colorTransparentBackground}`,
    },
});

/**
 * A themed Fluent UI provider that applies the current theme mode (light or dark).
 * @param props Fluent provider props, plus an optional `invert` flag to swap the theme.
 *              When `targetDocument` is provided and differs from the inherited Fluent
 *              document (e.g. when rendering into a popup window), a Griffel renderer
 *              scoped to that document is created so styles are injected into it.
 *              When omitted, `targetDocument` is inherited from the ambient Fluent
 *              context so nested Theme components do not lose cross-window targeting.
 * @returns The themed Fluent UI provider component.
 */
export const Theme: FunctionComponent<FluentProviderProps & { invert?: boolean }> = (props) => {
    // NOTE: We do not want to applyStylesToPortals by default. It makes classes flow into portals
    // (like popovers), and if those styles do things like disable overflow, they can completely
    // break any UI within the portal. Therefore, default to false.
    const { invert = false, applyStylesToPortals = false, className, targetDocument: explicitTargetDocument, ...rest } = props;
    const theme = useTheme(invert);
    const classes = useStyles();

    // Resolve the target document from the explicit prop or fall back to the ambient Fluent context.
    // This makes nested <Theme> components automatically inherit cross-window targeting from a
    // top-level <Theme targetDocument={popupDocument}> wrapper.
    const inheritedTargetDocument = useFluent().targetDocument;
    const resolvedTargetDocument = explicitTargetDocument ?? inheritedTargetDocument;

    // Only create a new Griffel renderer when the resolved document differs from the inherited
    // one. In the common (main-window, no nesting) case, this leaves Fluent's default renderer
    // and renderer provider in place — matching the original behaviour exactly.
    const renderer = useMemo<GriffelRenderer | undefined>(() => {
        if (resolvedTargetDocument && resolvedTargetDocument !== inheritedTargetDocument) {
            return createDOMRenderer(resolvedTargetDocument);
        }
        return undefined;
    }, [resolvedTargetDocument, inheritedTargetDocument]);

    const fluent = (
        <FluentProvider
            theme={theme}
            className={mergeClasses(classes.root, className)}
            applyStylesToPortals={applyStylesToPortals}
            targetDocument={resolvedTargetDocument}
            {...rest}
        >
            {props.children}
        </FluentProvider>
    );

    if (renderer && resolvedTargetDocument) {
        return (
            <RendererProvider renderer={renderer} targetDocument={resolvedTargetDocument}>
                {fluent}
            </RendererProvider>
        );
    }

    return fluent;
};
