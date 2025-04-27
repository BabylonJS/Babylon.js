/* eslint-disable @typescript-eslint/naming-convention */

import type { Nullable, Tuple } from "../types";

/**
 * Returns an array of the given size filled with elements built from the given constructor and the parameters.
 * @param size the number of element to construct and put in the array.
 * @param itemBuilder a callback responsible for creating new instance of item. Called once per array entry.
 * @returns a new array filled with new objects.
 */
export function BuildArray<T>(size: number, itemBuilder: () => T): Array<T> {
    const a: T[] = [];
    for (let i = 0; i < size; ++i) {
        a.push(itemBuilder());
    }
    return a;
}

/**
 * Returns a tuple of the given size filled with elements built from the given constructor and the parameters.
 * @param size he number of element to construct and put in the tuple.
 * @param itemBuilder a callback responsible for creating new instance of item. Called once per tuple entry.
 * @returns a new tuple filled with new objects.
 */
export function BuildTuple<T, N extends number>(size: N, itemBuilder: () => T): Tuple<T, N> {
    return BuildArray(size, itemBuilder) as any;
}

/**
 * Defines the callback type used when an observed array function is triggered.
 * @internal
 */
export type _ObserveCallback = (functionName: string, previousLength: number) => void;

/**
 * Observes a function and calls the given callback when it is called.
 * @param object Defines the object the function to observe belongs to.
 * @param functionName Defines the name of the function to observe.
 * @param callback Defines the callback to call when the function is called.
 * @returns A function to call to stop observing
 */
function _observeArrayfunction(object: { [key: string]: any }, functionName: string, callback: _ObserveCallback): Nullable<() => void> {
    // Finds the function to observe
    const oldFunction = object[functionName];
    if (typeof oldFunction !== "function") {
        return null;
    }

    // Creates a new function that calls the callback and the old function
    const newFunction = function () {
        const previousLength = object.length;
        const returnValue = newFunction.previous.apply(object, arguments);
        callback(functionName, previousLength);
        return returnValue;
    } as any;

    // Doublishly links the new function and the old function
    oldFunction.next = newFunction;
    newFunction.previous = oldFunction;

    // Replaces the old function with the new function
    object[functionName] = newFunction;

    // Returns a function to disable the hook
    return () => {
        // Only unhook if the function is still hooked
        const previous = newFunction.previous;
        if (!previous) {
            return;
        }

        // Finds the ref to the next function in the chain
        const next = newFunction.next;

        // If in the middle of the chain, link the previous and next functions
        if (next) {
            previous.next = next;
            next.previous = previous;
        }
        // If at the end of the chain, remove the reference to the previous function
        // and restore the previous function
        else {
            previous.next = undefined;
            object[functionName] = previous;
        }

        // Lose reference to the previous and next functions
        newFunction.next = undefined;
        newFunction.previous = undefined;
    };
}

/**
 * Defines the list of functions to proxy when observing an array.
 * The scope is currently reduced to the common functions used in the render target render list and the scene cameras.
 */
const observedArrayFunctions = ["push", "splice", "pop", "shift", "unshift"];

/**
 * Observes an array and notifies the given observer when the array is modified.
 * @param array Defines the array to observe
 * @param callback Defines the function to call when the array is modified (in the limit of the observed array functions)
 * @returns A function to call to stop observing the array
 * @internal
 */
export function _ObserveArray<T>(array: T[], callback: _ObserveCallback) {
    // Observes all the required array functions and stores the unhook functions
    const unObserveFunctions = observedArrayFunctions.map((name) => {
        return _observeArrayfunction(array, name, callback);
    });

    // Returns a function that unhook all the observed functions
    return () => {
        for (const unObserveFunction of unObserveFunctions) {
            unObserveFunction?.();
        }
    };
}
