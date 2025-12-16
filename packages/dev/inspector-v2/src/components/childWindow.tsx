import type { GriffelRenderer } from "@fluentui/react-components";
import type { FunctionComponent, PropsWithChildren } from "react";

import { createDOMRenderer, makeStyles, Portal, RendererProvider } from "@fluentui/react-components";
// import { PortalMountNodeProvider } from "@fluentui/react-shared-contexts";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Logger } from "core/Misc/logger";
import { OverlayContext } from "shared-ui-components/fluent/hoc/fluentToolWrapper";
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
    const [windowState, setWindowState] = useState<{ mountNode: HTMLElement; renderer: GriffelRenderer }>();
    const [childWindow, setChildWindow] = useState<Window>();

    const storageKey = key ? `Babylon/Settings/ChildWindow/${key}/Bounds` : null;

    // This function is just for creating the child window itself. It is a function because
    // it must be called synchronously in response to a user interaction (e.g. button click),
    // otherwise the browser will block it as a scripted popup.
    const createWindow = useCallback(
        (options: ChildWindowOptions = {}) => {
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

            // Try to create the child window (can be null if popups are blocked).
            const childWindow = window.open("", "", ToFeaturesString(options));
            if (childWindow) {
                // Set the title if provided.
                childWindow.document.title = options.title ?? "";

                // Set the child window state.
                setChildWindow((current) => {
                    // But first close any existing child window.
                    current?.close();
                    return childWindow;
                });
            }
        },
        [storageKey]
    );

    // This side effect runs any time the child window instance changes. It does the rest of the child window
    // setup work, including creating resources and state needed to properly render the content of the child window.
    useEffect(() => {
        const disposeActions: (() => void)[] = [];

        if (childWindow) {
            const body = childWindow.document.body;
            body.style.width = "100%";
            body.style.height = "100%";
            body.style.margin = "0";
            body.style.padding = "0";
            body.style.display = "flex";
            body.style.overflow = "hidden";

            const applyWindowState = () => {
                // Setup the window state, including creating a Fluent/Griffel "renderer" for managing runtime styles/classes in the child window.
                setWindowState({ mountNode: body, renderer: createDOMRenderer(childWindow.document) });
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
            const onChildWindowUnload = () => {
                setWindowState(undefined);
                setChildWindow(undefined);
            };
            childWindow.addEventListener("unload", onChildWindowUnload, { once: true });
            disposeActions.push(() => childWindow.removeEventListener("unload", onChildWindowUnload));

            // If the main window closes, close any open child windows as well (don't leave them orphaned).
            const onParentWindowUnload = () => {
                childWindow.close();
            };
            window.addEventListener("unload", onParentWindowUnload, { once: true });
            disposeActions.push(() => window.removeEventListener("unload", onParentWindowUnload));

            // On dispose, close the child window.
            disposeActions.push(() => childWindow.close());

            // On dispose, save the window bounds.
            disposeActions.push(() => {
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
            });
        }

        return () => {
            disposeActions.reverse().forEach((dispose) => dispose());
        };
    }, [childWindow]);

    // This is the actual component that the caller can use to render React components in the child window.
    const component = useMemo<FunctionComponent<PropsWithChildren>>(() => {
        return (props: PropsWithChildren) => {
            const { children } = props;
            const classes = useStyles();
            const [portalRef, setPortalRef] = useState<HTMLDivElement | null>(null);

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
                            <OverlayContext.Provider value={{ mountNode: portalRef ?? undefined }}>{children}</OverlayContext.Provider>
                            {/* <PortalMountNodeProvider value={portalRef ?? undefined}>{children}</PortalMountNodeProvider> */}
                            <div ref={setPortalRef} style={{ zIndex: Number.MAX_SAFE_INTEGER }} />
                        </Theme>
                    </RendererProvider>
                </Portal>
            );
        };
    }, [windowState]);

    return {
        open: createWindow,
        close: () => setChildWindow(undefined),
        isOpen: !!childWindow,
        component,
    };
}
