import { FluentProvider, Toast, ToastBody, Toaster, useId, useToastController, useFluent } from "@fluentui/react-components";
import type { FunctionComponent, PropsWithChildren } from "react";
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
                    <ToastBody>{message}</ToastBody>
                </Toast>,
                { intent: "success", timeout: 1000 }
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
