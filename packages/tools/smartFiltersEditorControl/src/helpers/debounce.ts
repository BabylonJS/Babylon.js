/**
 * This function will debounce calls to functions.
 *
 * @param callback - callback to call.
 * @param time - time time to wait between calls in ms.
 * @returns a function that will call the callback after the time has passed.
 */
export function debounce(callback: (...args: any[]) => void, time: number) {
    let timerId: any;
    return function (...args: any[]) {
        clearTimeout(timerId);
        timerId = setTimeout(() => callback(...args), time);
    };
}
