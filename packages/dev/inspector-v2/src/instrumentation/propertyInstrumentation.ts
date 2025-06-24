// eslint-disable-next-line import/no-internal-modules
import type { IDisposable } from "core/index";

export type PropertyHooks = {
    /**
     * This function will be called after the hooked property is set.
     */
    afterSet?: () => void;
};

const InterceptorHooksMaps = new WeakMap<object, Map<PropertyKey, PropertyHooks[]>>();

/**
 * Intercepts a property on an object and allows you to add hooks that will be called when the property is get or set.
 * @param target The object containing the property to intercept.
 * @param propertyKey The key of the property to intercept.
 * @param hooks The hooks to call when the property is get or set.
 * @returns A disposable that removes the hooks when disposed and returns the object to its original state.
 */
export function InterceptProperty<T extends object>(target: T, propertyKey: keyof T, hooks: PropertyHooks): IDisposable {
    // Find the property descriptor and note the owning object (might be inherited through the prototype chain).
    let propertyOwner: object | null = target;
    let propertyDescriptor: PropertyDescriptor | undefined;
    while (propertyOwner) {
        if ((propertyDescriptor = Reflect.getOwnPropertyDescriptor(propertyOwner, propertyKey))) {
            break;
        }
        propertyOwner = Reflect.getPrototypeOf(propertyOwner);
    }

    if (!propertyDescriptor) {
        throw new Error(`Property "${propertyKey.toString()}" not found on "${target}" or in its prototype chain.`);
    }

    // Make sure the property is configurable and writable, otherwise it is immutable and cannot be intercepted.
    if (!propertyDescriptor.configurable) {
        throw new Error(`Property "${propertyKey.toString()}" of object "${target}" is not configurable.`);
    }
    if (propertyDescriptor.writable === false || (propertyDescriptor.writable === undefined && !propertyDescriptor.set)) {
        throw new Error(`Property "${propertyKey.toString()}" of object "${target}" is readonly.`);
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

        let { get: getValue, set: setValue } = propertyDescriptor;

        // We already checked that the property is writable, so if there is no setter, then it must be a value property.
        // In this case, getValue can return the direct value, and setValue can set the direct value.
        if (!setValue) {
            getValue = () => propertyDescriptor.value;
            setValue = (value: any) => (propertyDescriptor.value = value);
        }

        if (
            // Replace the property with a new one that calls the hooks in addition to the original getter and setter.
            !Reflect.defineProperty(target, propertyKey, {
                configurable: true,
                get: getValue ? () => getValue.call(target) : undefined,
                set: (newValue: any) => {
                    setValue.call(target, newValue);
                    for (const { afterSet } of hooksForKey!) {
                        afterSet?.();
                    }
                },
            })
        ) {
            throw new Error(`Failed to define new property "${propertyKey.toString()}" on object "${target}".`);
        }
    }
    hooksForKey.push(hooks);

    // Take note of whether the property is owned by the target object or inherited from its prototype chain.
    const isOwnProperty = propertyOwner === target;

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

                    if (isOwnProperty) {
                        // If the property is owned by the target object, it means the property was defined directly on the target object,
                        // in which case we replaced it and the original property descriptor needs to be restored.
                        if (!Reflect.defineProperty(target, propertyKey, propertyDescriptor)) {
                            throw new Error(`Failed to restore original property descriptor "${propertyKey.toString()}" on object "${target}".`);
                        }
                    } else {
                        // Otherwise, the property was inherited through the prototype chain, and so we can simply delete it from
                        // the target object to allow it to fall back to the prototype chain as it did originally.
                        if (!Reflect.deleteProperty(target, propertyKey)) {
                            throw new Error(`Failed to delete transient property descriptor "${propertyKey.toString()}" on object "${target}".`);
                        }
                    }
                }

                isDisposed = true;
            }
        },
    };
}
