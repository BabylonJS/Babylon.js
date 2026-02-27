import { useCallback } from "react";
import { useInterceptObservable } from "./instrumentationHooks";
import { useObservableState } from "./observableHooks";

/**
 * Return a copied array and re-render when array mutators run.
 * Intercept add/remove/change functions because the underlying APIs update internal arrays in-place.
 * @param target The target object containing the observable array, or null if the array is not applicable.
 * @param getItems A function to get the current items in the array.
 * @param addFn The name of the function to add an item to the array.
 * @param removeFn The name of the function to remove an item from the array.
 * @param changeFn The name of the function to change an item in the array.
 * @returns A copied array that re-renders when array mutators run.
 */
export function useObservableArray<TargetT extends object, ItemT>(
    target: TargetT | null,
    getItems: () => ReadonlyArray<ItemT> | null | undefined,
    addFn: keyof TargetT,
    removeFn: keyof TargetT,
    changeFn?: keyof TargetT
): ItemT[] {
    return useObservableState(
        useCallback(() => {
            const value = getItems();
            return [...(value ?? [])] as ItemT[];
        }, [getItems]),
        useInterceptObservable("function", target, addFn),
        useInterceptObservable("function", target, removeFn),
        changeFn ? useInterceptObservable("function", target, changeFn) : undefined
    );
}
