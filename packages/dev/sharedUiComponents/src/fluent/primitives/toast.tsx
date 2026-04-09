import { type FunctionComponent, type PropsWithChildren, type Ref, createContext, useCallback, useContext, useImperativeHandle } from "react";

import { type ToastIntent, FluentProvider, Toast, Toaster, ToastTitle, useFluent, useId, useToastController } from "@fluentui/react-components";

/**
 * Options for showing a toast notification.
 */
export type ToastOptions = {
    /**
     * The intent of the toast notification. Defaults to "info".
     */
    intent?: ToastIntent;
};

type ToastContextType = {
    showToast: (message: string, options?: ToastOptions) => void;
};

/**
 * Imperative handle exposed by {@link ToastProvider} via its `imperativeRef` prop.
 */
export type ToastHandle = {
    /**
     * Shows a toast notification with the given message.
     * @param message The message to display.
     * @param options Optional toast configuration.
     */
    showToast: (message: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export type ToastProviderProps = PropsWithChildren<{
    /**
     * A ref that exposes the {@link ToastHandle} imperative API.
     */
    imperativeRef?: Ref<ToastHandle>;
}>;

/**
 * Provides toast notification functionality to child components via context and an optional imperative ref.
 * @returns The toast provider component tree.
 */
export const ToastProvider: FunctionComponent<ToastProviderProps> = ({ children, imperativeRef }) => {
    const toasterId = useId("toaster");
    const { dispatchToast } = useToastController(toasterId);
    const { targetDocument } = useFluent();

    const showToast = useCallback(
        (message: string, options?: ToastOptions) => {
            dispatchToast(
                <Toast>
                    <ToastTitle>{message}</ToastTitle>
                </Toast>,
                { intent: options?.intent ?? "info", timeout: 2000 }
            );
        },
        [dispatchToast]
    );

    useImperativeHandle(imperativeRef, () => ({ showToast }), [showToast]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <FluentProvider applyStylesToPortals targetDocument={targetDocument}>
                <Toaster toasterId={toasterId} position="bottom" />
            </FluentProvider>
        </ToastContext.Provider>
    );
};

/**
 * Hook to show toast notifications.
 * @returns Object with showToast function that accepts a message string
 */
export function useToast() {
    return useContext(ToastContext);
}
