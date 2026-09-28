import { type IDisposable, type Nullable } from "core/index";

/**
 * Gets the property descriptor for a property on an object, including inherited properties.
 * @param target The object containing the property.
 * @param propertyKey The key of the property to get the descriptor for.
 * @returns The owner of the property (which may be different from the target in the case of inheritance) along with the property descriptor, or null if the property is not found.
 */
export function GetPropertyDescriptor<T extends object>(target: T, propertyKey: keyof T): Nullable<[owner: object, descriptor: PropertyDescriptor]> {
    let propertyOwner: object | null = target;
    let propertyDescriptor: PropertyDescriptor | undefined;
    while (propertyOwner) {
        if ((propertyDescriptor = Reflect.getOwnPropertyDescriptor(propertyOwner, propertyKey))) {
            break;
        }
        propertyOwner = Reflect.getPrototypeOf(propertyOwner);
    }

    if (propertyOwner && propertyDescriptor) {
        return [propertyOwner, propertyDescriptor];
    }

    return null;
}

/**
 * Checks if a property is readonly.
 * @param propertyDescriptor The property descriptor to check.
 * @returns True if the property is readonly, false otherwise.
 */
export function IsPropertyReadonly(propertyDescriptor: PropertyDescriptor): boolean {
    // If the property is not writable, it is readonly.
    return propertyDescriptor.writable === false || (propertyDescriptor.writable === undefined && !propertyDescriptor.set);
}

/**
 * Hooks that can be registered on a property to intercept its setter.
 */
export type PropertyHooks<T = unknown> = {
    /**
     * This function will be called after the hooked property is set.
     * @param value The new value that was set on the property.
     */
    afterSet?: (value: T) => void;
};

type PropertyInterception = {
    readonly hooks: PropertyHooks<unknown>[];
    readonly propertyOwner: object;
    readonly propertyDescriptor: PropertyDescriptor;
    readonly wasPropertyDefined: boolean;
};

const InterceptorHooksMaps = new WeakMap<object, Map<PropertyKey, PropertyInterception>>();

/**
 * Intercepts a property on an object and allows you to add hooks that will be called when the property is get or set.
 * @param target The object containing the property to intercept.
 * @param propertyKey The key of the property to intercept.
 * @param hooks The hooks to call when the property is get or set.
 * @returns A disposable that removes the hooks when disposed and returns the object to its original state.
 */
// This overload only matches when K is a specific literal key (not a union like keyof T)
export function InterceptProperty<T extends object, K extends keyof T>(
    target: T,
    propertyKey: string extends K ? never : number extends K ? never : symbol extends K ? never : K,
    hooks: PropertyHooks<NonNullable<T[K]>>
): IDisposable;
// Fallback overload for generic/dynamic cases where the property type cannot be inferred
export function InterceptProperty<T extends object>(target: T, propertyKey: keyof T, hooks: PropertyHooks): IDisposable;
/** @internal */
export function InterceptProperty<T extends object>(target: T, propertyKey: keyof T, hooks: PropertyHooks): IDisposable {
    let hooksMap = InterceptorHooksMaps.get(target);
    let interception = hooksMap?.get(propertyKey);

    if (!interception) {
        // Find the property descriptor and note the owning object (might be inherited through the prototype chain).
        const ownerAndDescriptor = GetPropertyDescriptor(target, propertyKey);

        // If the property does not exist, we'll define one transiently directly on the target object.
        const [propertyOwner, propertyDescriptor] = ownerAndDescriptor ?? [
            target,
            {
                configurable: true,
                enumerable: true,
                writable: true,
                value: undefined,
            },
        ];

        if (!ownerAndDescriptor) {
            Reflect.defineProperty(propertyOwner, propertyKey, propertyDescriptor);
        } else {
            // If the property is not configurable, it cannot be intercepted.
            if (!propertyDescriptor.configurable) {
                throw new Error(`Property "${propertyKey.toString()}" of object "${target}" is not configurable.`);
            }

            // If the property is not writable, it cannot be intercepted, but it cannot be mutated anyway so there is no need to intercept it.
            if (IsPropertyReadonly(propertyDescriptor)) {
                return {
                    dispose: () => {},
                };
            }
        }

        const hooksForKey: PropertyHooks<unknown>[] = [];
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
                get: getValue
                    ? function (this: unknown) {
                          return getValue!.call(this);
                      }
                    : undefined,
                set: function (this: unknown, newValue: unknown) {
                    setValue.call(this, newValue);
                    for (const { afterSet } of hooksForKey!) {
                        afterSet?.(newValue);
                    }
                },
            })
        ) {
            throw new Error(`Failed to define new property "${propertyKey.toString()}" on object "${target}".`);
        }

        if (!hooksMap) {
            InterceptorHooksMaps.set(target, (hooksMap = new Map()));
        }
        hooksMap.set(
            propertyKey,
            (interception = {
                hooks: hooksForKey,
                propertyOwner,
                propertyDescriptor,
                wasPropertyDefined: !!ownerAndDescriptor,
            })
        );
    }
    if (!hooksMap) {
        throw new Error(`Property "${propertyKey.toString()}" of object "${target}" was not registered for interception.`);
    }
    const { hooks: hooksForKey, propertyOwner, propertyDescriptor, wasPropertyDefined } = interception;
    hooksForKey.push(hooks as PropertyHooks<unknown>);

    let isDisposed = false;
    return {
        dispose: () => {
            if (!isDisposed) {
                // Remove the hooks from the hooks array for the property key.
                hooksForKey.splice(hooksForKey.indexOf(hooks as PropertyHooks<unknown>), 1);

                // If there are no more hooks for the property key, remove the property from the hooks map.
                if (hooksForKey.length === 0) {
                    hooksMap.delete(propertyKey);

                    // If there are no more hooks for the target object, remove the hooks map from the WeakMap.
                    if (hooksMap.size === 0) {
                        InterceptorHooksMaps.delete(target);
                    }

                    const shouldRestorePropertyDescriptor =
                        // Restore a property that was originally owned by the target,
                        // or retain a transient property when a value was assigned while it was intercepted.
                        propertyOwner === target && (wasPropertyDefined || target[propertyKey] !== undefined);

                    if (shouldRestorePropertyDescriptor) {
                        if (!Reflect.defineProperty(target, propertyKey, propertyDescriptor)) {
                            throw new Error(`Failed to restore original property descriptor "${propertyKey.toString()}" on object "${target}".`);
                        }
                    } else {
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
