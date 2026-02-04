import type { GriffelRenderer } from "@fluentui/react-components";
import type { FunctionComponent, PropsWithChildren, Ref } from "react";

import { createDOMRenderer, FluentProvider, Portal, RendererProvider } from "@fluentui/react-components";
import { useCallback, useEffect, useImperativeHandle, useState } from "react";

import { Logger } from "core/Misc/logger";
import { ToastProvider } from "../primitives/toast";

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

export type ChildWindowOptions = {
    /**
     * The default width of the child window in pixels.
     * @remarks Ignored if the ChildWindow was passed an id and previous bounds were saved.
     */
    defaultWidth?: number;

    /**
     * The default height of the child window in pixels.
     * @remarks Ignored if the ChildWindow was passed an id and previous bounds were saved.
     */
    defaultHeight?: number;

    /**
     * The default left position of the child window in pixels.
     * @remarks Ignored if the ChildWindow was passed an id and previous bounds were saved.
     */
    defaultLeft?: number;

    /**
     * The default top position of the child window in pixels.
     * @remarks Ignored if the ChildWindow was passed an id and previous bounds were saved.
     */
    defaultTop?: number;

    /**
     * The title of the child window.
     * @remarks If not provided, the id will be used instead (if any).
     */
    title?: string;
};

export type ChildWindow = {
    /**
     * Opens the child window.
     * @param options Options for opening the child window.
     */
    open: (options?: ChildWindowOptions) => void;

    /**
     * Closes the child window.
     */
    close: () => void;
};

export type ChildWindowProps = {
    /**
     * An optional unique identity for the child window.
     * @remarks If provided, the child window's bounds will be saved/restored using this identity.
     */
    id?: string;

    /**
     * Called when the open state of the child window changes.
     * @param isOpen Whether the child window is open.
     */
    onOpenChange?: (isOpen: boolean) => void;

    /**
     * A ref that exposes the ChildWindow imperative API.
     */
    imperativeRef?: Ref<ChildWindow>;
};

/**
 * Allows displaying a child window that can contain child components.
 * @param props Props for the child window.
 * @returns The child window component.
 */
export const ChildWindow: FunctionComponent<PropsWithChildren<ChildWindowProps>> = (props) => {
    const { id, children, onOpenChange, imperativeRef: imperativeRef } = props;

    const [windowState, setWindowState] = useState<{ mountNode: HTMLElement; renderer: GriffelRenderer }>();
    const [childWindow, setChildWindow] = useState<Window>();

    const storageKey = id ? `Babylon/Settings/ChildWindow/${id}/Bounds` : null;

    // This function is just for creating the child window itself. It is a function because
    // it must be called synchronously in response to a user interaction (e.g. button click),
    // otherwise the browser will block it as a scripted popup.
    const createWindow = useCallback(
        (options: ChildWindowOptions = {}) => {
            if (storageKey) {
                // If we are persisting window bounds, but the window is already open, just use the existing bounds.
                // Otherwise, try to load bounds from storage.
                if (childWindow) {
                    options.defaultLeft = childWindow.screenX;
                    options.defaultTop = childWindow.screenY;
                    options.defaultWidth = childWindow.innerWidth;
                    options.defaultHeight = childWindow.innerHeight;
                } else {
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
            const newChildWindow = window.open("", "", ToFeaturesString(options));
            if (newChildWindow) {
                // Set the title if provided.
                newChildWindow.document.title = options.title ?? id ?? "";

                // Set the child window state.
                setChildWindow((current) => {
                    // But first close any existing child window.
                    current?.close();
                    return newChildWindow;
                });
            }
        },
        [childWindow, storageKey]
    );

    useImperativeHandle(imperativeRef, () => {
        return {
            open: createWindow,
            close: () => setChildWindow(undefined),
        };
    }, [createWindow]);

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
                onOpenChange?.(true);
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
                onOpenChange?.(false);
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

    if (!windowState) {
        return null;
    }

    const { mountNode, renderer } = windowState;

    return (
        // Portal targets the body of the child window.
        <Portal mountNode={mountNode}>
            {/* RenderProvider manages Fluent style/class state. */}
            <RendererProvider renderer={renderer} targetDocument={mountNode.ownerDocument}>
                {/* Fluent Provider is needed for managing other Fluent state and applying the current theme mode. */}
                <FluentProvider
                    style={{
                        display: "flex",
                        flexGrow: 1,
                        flexDirection: "column",
                        overflow: "hidden",
                    }}
                    applyStylesToPortals={false}
                    targetDocument={mountNode.ownerDocument}
                >
                    <ToastProvider>{children}</ToastProvider>
                </FluentProvider>
            </RendererProvider>
        </Portal>
    );
};
