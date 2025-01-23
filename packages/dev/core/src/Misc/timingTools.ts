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

function _runWithCondition(condition: () => boolean, onSuccess: () => void, onError?: (e?: any, isTimeout?: boolean) => void) {
    try {
        if (condition()) {
            onSuccess();
            return true;
        }
    } catch (e) {
        onError?.(e);
        return true;
    }
    return false;
}

/**
 * @internal
 */
export const _retryWithInterval = (
    condition: () => boolean,
    onSuccess: () => void,
    onError?: (e?: any, isTimeout?: boolean) => void,
    step = 16,
    maxTimeout = 30000,
    checkConditionOnCall: boolean = true,
    additionalStringOnTimeout?: string
) => {
    // if checkConditionOnCall is true, we check the condition immediately. If it is true, run everything synchronously
    if (checkConditionOnCall) {
        // that means that one of the two happened - either the condition is true or an exception was thrown when checking the condition
        if (_runWithCondition(condition, onSuccess, onError)) {
            // don't schedule the interval, no reason to check it again.
            return null;
        }
    }
    const int = setInterval(() => {
        if (_runWithCondition(condition, onSuccess, onError)) {
            clearInterval(int);
        } else {
            maxTimeout -= step;
            if (maxTimeout < 0) {
                clearInterval(int);
                onError?.(new Error("Operation timed out after maximum retries. " + (additionalStringOnTimeout || "")), true);
            }
        }
    }, step);
    return () => clearInterval(int);
};
