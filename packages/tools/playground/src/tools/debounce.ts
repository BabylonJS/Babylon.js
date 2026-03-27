/* eslint-disable @typescript-eslint/naming-convention */

type DebouncedFunction<T extends (...args: any[]) => any> = {
    (...args: Parameters<T>): void;
    cancel: () => void;
};

/**
 * Creates a debounced version of the given function.
 * @param fn - The function to debounce
 * @param delayMs - Delay in milliseconds before the function is invoked
 * @param options - Optional settings
 * @returns A debounced wrapper with a .cancel() method
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delayMs: number, options?: { maxWait?: number }): DebouncedFunction<T> {
    let timerId: ReturnType<typeof setTimeout> | undefined;
    let maxWaitTimerId: ReturnType<typeof setTimeout> | undefined;
    let lastArgs: Parameters<T> | undefined;
    const maxWait = options?.maxWait;

    const invoke = () => {
        if (timerId !== undefined) {
            clearTimeout(timerId);
            timerId = undefined;
        }
        if (maxWaitTimerId !== undefined) {
            clearTimeout(maxWaitTimerId);
            maxWaitTimerId = undefined;
        }
        if (lastArgs !== undefined) {
            const args = lastArgs;
            lastArgs = undefined;
            fn(...args);
        }
    };

    const debounced = ((...args: Parameters<T>) => {
        lastArgs = args;
        if (timerId !== undefined) {
            clearTimeout(timerId);
        }
        timerId = setTimeout(invoke, delayMs);
        if (maxWait !== undefined && maxWaitTimerId === undefined) {
            maxWaitTimerId = setTimeout(invoke, maxWait);
        }
    }) as DebouncedFunction<T>;

    debounced.cancel = () => {
        if (timerId !== undefined) {
            clearTimeout(timerId);
            timerId = undefined;
        }
        if (maxWaitTimerId !== undefined) {
            clearTimeout(maxWaitTimerId);
            maxWaitTimerId = undefined;
        }
        lastArgs = undefined;
    };

    return debounced;
}
