import type { FunctionComponent, PropsWithChildren } from "react";

import { FluentProvider, Toast, Toaster, ToastTitle, useFluent, useId, useToastController } from "@fluentui/react-components";
import { createContext, useCallback, useContext } from "react";

type ToastContextType = {
    showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export const ToastProvider: FunctionComponent<PropsWithChildren> = ({ children }) => {
    const toasterId = useId("toaster");
    const { dispatchToast } = useToastController(toasterId);
    const { targetDocument } = useFluent();

    const showToast = useCallback(
        (message: string) => {
            dispatchToast(
                <Toast>
                    <ToastTitle>{message}</ToastTitle>
                </Toast>,
                { intent: "info", timeout: 2000 }
            );
        },
        [dispatchToast]
    );

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <FluentProvider applyStylesToPortals targetDocument={targetDocument}>
                <Toaster toasterId={toasterId} position="bottom-end" />
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
