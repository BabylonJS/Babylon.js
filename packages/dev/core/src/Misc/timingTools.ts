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

function _runWithCondition(condition: () => boolean, onSuccess: () => void, onError?: (e?: any) => void) {
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
    onError?: (e?: any) => void,
    step = 16,
    maxTimeout = 2000,
    checkConditionOnCall: boolean = true
) => {
    // if checkConditionOnCall is true, we check the condition immediately. If it is true, run everything synchronously
    if (checkConditionOnCall) {
        // that means that one of the two happened - either the condition is true or an exception was thrown when checking the condition
        if (_runWithCondition(condition, onSuccess, onError)) {
            // don't schedule the interval, no reason to check it again.
            return;
        }
    }
    const int = setInterval(() => {
        _runWithCondition(condition, onSuccess, onError);
        maxTimeout -= step;
        if (maxTimeout < 0) {
            clearInterval(int);
            onError?.(new Error("Operation timed out after maximum retries"));
        }
    }, step);
};
