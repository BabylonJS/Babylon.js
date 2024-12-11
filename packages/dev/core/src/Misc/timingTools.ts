import { IsWindowObjectExist } from "./domManagement";

/**
 * Class used to provide helper for timing
 */
export class TimingTools {
    /**
     * Polyfill for setImmediate
     * @param action defines the action to execute after the current execution block
     */
    public static SetImmediate(action: () => void) {
        if (IsWindowObjectExist() && window.setImmediate) {
            // Note - deprecated and should not be used directly. Not supported in any browser.
            window.setImmediate(action);
        } else {
            setTimeout(action, 1);
        }
    }
}

/**
 * @internal
 */
export const _retryWithInterval = (condition: () => boolean, onSuccess: () => void, onError?: (e?: any) => void, step = 16, maxTimeout = 2000) => {
    const int = setInterval(() => {
        try {
            if (condition()) {
                clearInterval(int);
                onSuccess();
            }
        } catch (e) {
            clearInterval(int);
            onError?.(e);
        }
        maxTimeout -= step;
        if (maxTimeout < 0) {
            clearInterval(int);
            onError?.();
        }
    }, step);
};
