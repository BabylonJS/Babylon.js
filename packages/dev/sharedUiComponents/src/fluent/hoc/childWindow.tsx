import { type GriffelRenderer, createDOMRenderer, FluentProvider, Portal, RendererProvider } from "@fluentui/react-components";
import { type FunctionComponent, type PropsWithChildren, type Ref, useCallback, useEffect, useImperativeHandle, useState } from "react";

import { ToastProvider } from "../primitives/toast";
import { OpenPopupWindow, type PopupWindowHandle } from "./popupWindow";

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
    const [popupHandle, setPopupHandle] = useState<PopupWindowHandle>();

    // This function is just for creating the child window itself. It is a function because
    // it must be called synchronously in response to a user interaction (e.g. button click),
    // otherwise the browser will block it as a scripted popup.
    const createWindow = useCallback(
        (options: ChildWindowOptions = {}) => {
            const handle = OpenPopupWindow({
                id,
                title: options.title ?? id,
                defaultWidth: options.defaultWidth,
                defaultHeight: options.defaultHeight,
                defaultLeft: options.defaultLeft,
                defaultTop: options.defaultTop,
            });

            if (handle) {
                setPopupHandle((current) => {
                    // Close any existing child window before adopting the new one.
                    current?.dispose();
                    return handle;
                });
            }
        },
        [id]
    );

    useImperativeHandle(imperativeRef, () => {
        return {
            open: createWindow,
            close: () => {
                setPopupHandle((current) => {
                    current?.dispose();
                    return undefined;
                });
            },
        };
    }, [createWindow]);

    // This side effect runs any time the popup handle changes. It does the rest of the child window
    // setup work, including creating resources and state needed to properly render the content of the child window.
    useEffect(() => {
        if (!popupHandle) {
            return undefined;
        }

        const popupDocument = popupHandle.popupWindow.document;

        // Setup the window state, including creating a Fluent/Griffel "renderer" for managing
        // runtime styles/classes in the child window. We mount React into the popup body
        // (matching previous behaviour) — the OpenPopupWindow-supplied hostElement is unused
        // here because Portal needs a stable mount node and the body is the natural choice.
        setWindowState({ mountNode: popupDocument.body, renderer: createDOMRenderer(popupDocument) });
        onOpenChange?.(true);

        return () => {
            // Tear down the popup. The cached handle's dispose() handles bounds saving and
            // listener cleanup; React state is reset so the Portal/Provider tree unmounts.
            popupHandle.dispose();
            setWindowState(undefined);
            onOpenChange?.(false);
        };
    }, [popupHandle]);

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
