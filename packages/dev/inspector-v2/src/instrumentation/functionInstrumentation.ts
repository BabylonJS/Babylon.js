import type { IDisposable } from "core/index";

export type FunctionHooks<Args extends unknown[] = unknown[]> = {
    /**
     * This function will be called after the hooked function is called.
     * @param args The arguments that were passed to the original function.
     */
    afterCall?: (...args: Args) => void;
};

const InterceptorHooksMaps = new WeakMap<object, Map<PropertyKey, FunctionHooks<unknown[]>[]>>();

/**
 * Intercepts a function on an object and allows you to add hooks that will be called during function execution.
 * @param target The object containing the function to intercept.
 * @param propertyKey The key of the property that is a function (this is the function that will be intercepted).
 * @param hooks The hooks to call during the function execution.
 * @returns A disposable that removes the hooks when disposed and returns the object to its original state.
 */
// This overload only matches when K is a specific literal key (not a union like keyof T)
export function InterceptFunction<T extends object, K extends keyof T>(
    target: T,
    propertyKey: string extends K ? never : number extends K ? never : symbol extends K ? never : K,
    hooks: NonNullable<T[K]> extends (...args: infer Args) => unknown ? FunctionHooks<Args> : FunctionHooks
): IDisposable;
// Fallback overload for generic/dynamic cases where the function type cannot be inferred
export function InterceptFunction<T extends object>(target: T, propertyKey: keyof T, hooks: FunctionHooks): IDisposable;
/** @internal */
export function InterceptFunction<T extends object>(target: T, propertyKey: keyof T, hooks: FunctionHooks): IDisposable {
    if (!hooks.afterCall) {
        throw new Error("At least one hook must be provided.");
    }

    const originalFunction = Reflect.get(target, propertyKey, target) as (...args: any) => any;
    if (typeof originalFunction !== "function") {
        throw new Error(`Property "${propertyKey.toString()}" of object "${target}" is not a function.`);
    }

    // Make sure the property is configurable and writable, otherwise it is immutable and cannot be intercepted.
    const propertyDescriptor = Reflect.getOwnPropertyDescriptor(target, propertyKey);
    if (propertyDescriptor) {
        if (!propertyDescriptor.configurable) {
            throw new Error(`Property "${propertyKey.toString()}" of object "${target}" is not configurable.`);
        }

        if (propertyDescriptor.writable === false || (propertyDescriptor.writable === undefined && !propertyDescriptor.set)) {
            throw new Error(`Property "${propertyKey.toString()}" of object "${target}" is readonly.`);
        }
    }

    // Get or create the hooks map for the target object.
    let hooksMap = InterceptorHooksMaps.get(target);
    if (!hooksMap) {
        InterceptorHooksMaps.set(target, (hooksMap = new Map()));
    }

    // Get or create the hooks array for the property key.
    let hooksForKey = hooksMap.get(propertyKey);
    if (!hooksForKey) {
        hooksMap.set(propertyKey, (hooksForKey = []));
        if (
            // Replace the function with a new one that calls the hooks in addition to the original function.
            !Reflect.set(target, propertyKey, (...args: unknown[]) => {
                const result = Reflect.apply(originalFunction, target, args);
                for (const { afterCall } of hooksForKey!) {
                    afterCall?.(...args);
                }
                return result;
            })
        ) {
            throw new Error(`Failed to define new function "${propertyKey.toString()}" on object "${target}".`);
        }
    }
    hooksForKey.push(hooks as FunctionHooks<unknown[]>);

    let isDisposed = false;
    return {
        dispose: () => {
            if (!isDisposed) {
                // Remove the hooks from the hooks array for the property key.
                hooksForKey.splice(hooksForKey.indexOf(hooks), 1);

                // If there are no more hooks for the property key, remove the property from the hooks map.
                if (hooksForKey.length === 0) {
                    hooksMap.delete(propertyKey);

                    // If there are no more hooks for the target object, remove the hooks map from the WeakMap.
                    if (hooksMap.size === 0) {
                        InterceptorHooksMaps.delete(target);
                    }

                    if (propertyDescriptor) {
                        // If we have a property descriptor, it means the property was defined directly on the target object,
                        // in which case we replaced it and the original property descriptor needs to be restored.
                        if (!Reflect.defineProperty(target, propertyKey, propertyDescriptor)) {
                            throw new Error(`Failed to restore original function "${propertyKey.toString()}" on object "${target}".`);
                        }
                    } else {
                        // Otherwise, the property was inherited through the prototype chain, and so we can simply delete it from
                        // the target object to allow it to fall back to the prototype chain as it did originally.
                        if (!Reflect.deleteProperty(target, propertyKey)) {
                            throw new Error(`Failed to delete transient function "${propertyKey.toString()}" on object "${target}".`);
                        }
                    }
                }

                isDisposed = true;
            }
        },
    };
}
