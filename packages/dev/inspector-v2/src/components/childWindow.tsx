import type { GriffelRenderer } from "@fluentui/react-components";
import type { FunctionComponent, PropsWithChildren } from "react";

import { createDOMRenderer, makeStyles, Portal, RendererProvider } from "@fluentui/react-components";
import { useEffect, useMemo, useState } from "react";

import { Theme } from "./theme";

const useStyles = makeStyles({
    container: {
        display: "flex",
        flexGrow: 1,
        flexDirection: "column",
        overflow: "hidden",
    },
});

export type ChildWindowOptions = {
    width?: number;
    height?: number;
    left?: number;
    top?: number;
    title?: string;
};

function ToFeaturesString(options: ChildWindowOptions) {
    const { width, height, left, top } = options;

    const features: { key: string; value: string }[] = [];

    if (width !== undefined) {
        features.push({ key: "width", value: width.toString() });
    }
    if (height !== undefined) {
        features.push({ key: "height", value: height.toString() });
    }
    if (left !== undefined) {
        features.push({ key: "left", value: left.toString() });
    }
    if (top !== undefined) {
        features.push({ key: "top", value: top.toString() });
    }
    features.push({ key: "location", value: "no" });

    return features.map((feature) => `${feature.key}=${feature.value}`).join(",");
}

/**
 * Allows displaying a child window that can contain child components.
 * @returns An object that enables opening, closing, and rendering the child window.
 */
export function useChildWindow() {
    const [windowState, setWindowState] = useState<{ window: Window; mountNode: HTMLElement; renderer: GriffelRenderer }>();
    const [options, setOptions] = useState<ChildWindowOptions>();

    // This effect runs when the options state has changed. Options are passed into the open function,
    // so non-null options means we are in an open state. Otherwise we are in a closed state.
    useEffect(() => {
        const disposeActions: (() => void)[] = [];

        if (options) {
            const childWindow = window.open("", "", ToFeaturesString(options));
            if (childWindow) {
                const body = childWindow.document.body;
                body.style.width = "100%";
                body.style.height = "100%";
                body.style.margin = "0";
                body.style.padding = "0";
                body.style.display = "flex";
                body.style.overflow = "hidden";

                childWindow.document.title = options.title ?? "";

                const applyWindowState = () => {
                    // Setup the window state, including creating a Fluent/Griffel "renderer" for managing runtime styles/classes in the child window.
                    setWindowState({ window: childWindow, mountNode: body, renderer: createDOMRenderer(childWindow.document) });
                };

                // Once the child window document is ready, setup the window state which will trigger another effect that renders into the child window.
                if (childWindow.document.readyState === "complete") {
                    applyWindowState();
                } else {
                    const onChildWindowLoad = () => {
                        applyWindowState();
                    };
                    childWindow.addEventListener("load", onChildWindowLoad, { once: true });
                    disposeActions.push(() => childWindow.removeEventListener("load", onChildWindowLoad));
                }

                // When the child window is closed for any reason, transition back to a closed state.
                childWindow.addEventListener(
                    "unload",
                    () => {
                        setWindowState(undefined);
                        setOptions(undefined);
                    },
                    { once: true }
                );

                // If the main window closes, close any open child windows as well (don't leave them orphaned).
                const onParentWindowUnload = () => childWindow.close();
                window.addEventListener("unload", onParentWindowUnload);
                disposeActions.push(() => window.removeEventListener("unload", onParentWindowUnload));
            } else {
                // If creating a child window failed (e.g. popup blocked), then just revert to closed mode.
                setOptions(undefined);
            }
            disposeActions.push(() => childWindow?.close());
        }

        return () => disposeActions.reverse().forEach((dispose) => dispose());
    }, [options]);

    const component = useMemo<FunctionComponent<PropsWithChildren>>(() => {
        return (props: PropsWithChildren) => {
            const { children } = props;
            const classes = useStyles();

            if (!windowState) {
                return null;
            }

            const { mountNode, renderer } = windowState;

            return (
                // Portal targets the body of the child window.
                <Portal mountNode={mountNode}>
                    {/* RenderProvider manages Fluent style/class state. */}
                    <RendererProvider renderer={renderer} targetDocument={mountNode.ownerDocument}>
                        {/* Theme gives us the Fluent Provider, needed for managing other Fluent state and applying the current theme mode. */}
                        <Theme className={classes.container} targetDocument={mountNode.ownerDocument}>
                            {children}
                        </Theme>
                    </RendererProvider>
                </Portal>
            );
        };
    }, [windowState]);

    return {
        open: (options?: ChildWindowOptions) => setOptions(options ?? {}),
        close: () => setOptions(undefined),
        isOpen: !!options,
        component,
    };
}
