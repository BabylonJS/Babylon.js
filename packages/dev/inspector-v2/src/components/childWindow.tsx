import type { GriffelRenderer } from "@fluentui/react-components";
import type { FunctionComponent, PropsWithChildren } from "react";

import { createDOMRenderer, makeStyles, Portal, RendererProvider } from "@fluentui/react-components";
import { useEffect, useMemo, useState } from "react";

import { Logger } from "core/Misc/logger";
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
    defaultWidth?: number;
    defaultHeight?: number;
    defaultLeft?: number;
    defaultTop?: number;
    title?: string;
};

function ToFeaturesString(options: ChildWindowOptions) {
    const { defaultWidth, defaultHeight, defaultLeft, defaultTop } = options;

    const features: { key: string; value: string }[] = [];

    if (defaultWidth !== undefined) {
        features.push({ key: "width", value: defaultWidth.toString() });
    }
    if (defaultHeight !== undefined) {
        features.push({ key: "height", value: defaultHeight.toString() });
    }
    if (defaultLeft !== undefined) {
        features.push({ key: "left", value: defaultLeft.toString() });
    }
    if (defaultTop !== undefined) {
        features.push({ key: "top", value: defaultTop.toString() });
    }
    features.push({ key: "location", value: "no" });

    return features.map((feature) => `${feature.key}=${feature.value}`).join(",");
}

/**
 * Allows displaying a child window that can contain child components.
 * @param key An optional key to uniquely identify this child window (used for persisting window bounds).
 * @returns An object that enables opening, closing, and rendering the child window.
 */
export function useChildWindow(key?: string) {
    const [windowState, setWindowState] = useState<{ window: Window; mountNode: HTMLElement; renderer: GriffelRenderer }>();
    const [options, setOptions] = useState<ChildWindowOptions>();

    // This effect runs when the options state has changed. Options are passed into the open function,
    // so non-null options means we are in an open state. Otherwise we are in a closed state.
    useEffect(() => {
        const disposeActions: (() => void)[] = [];

        if (options) {
            const storageKey = key ? `Babylon/Settings/ChildWindow/${key}/Bounds` : null;
            if (storageKey) {
                const savedBounds = localStorage.getItem(storageKey);
                if (savedBounds) {
                    try {
                        const bounds = JSON.parse(savedBounds);
                        options.defaultLeft = bounds.left;
                        options.defaultTop = bounds.top;
                        options.defaultWidth = bounds.width;
                        options.defaultHeight = bounds.height;
                    } catch {
                        Logger.Warn(`Could not parse saved bounds for child window with key ${storageKey}`);
                    }
                }
            }

            // Half width by default.
            if (!options.defaultWidth) {
                options.defaultWidth = window.innerWidth * (2 / 3);
            }
            // Half height by default.
            if (!options.defaultHeight) {
                options.defaultHeight = window.innerHeight * (2 / 3);
            }
            // Horizontally centered by default.
            if (!options.defaultLeft) {
                options.defaultLeft = window.screenX + (window.innerWidth - options.defaultWidth) * (2 / 3);
            }
            // Vertically centered by default.
            if (!options.defaultTop) {
                options.defaultTop = window.screenY + (window.innerHeight - options.defaultHeight) * (2 / 3);
            }

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

                        if (storageKey) {
                            localStorage.setItem(
                                storageKey,
                                JSON.stringify({
                                    left: childWindow.screenX,
                                    top: childWindow.screenY,
                                    width: childWindow.innerWidth,
                                    height: childWindow.innerHeight,
                                })
                            );
                        }
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
