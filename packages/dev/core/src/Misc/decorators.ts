/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "../types";
import { GetDirectStore } from "./decorators.functions";
import { _WarnImport } from "./devTools";

function generateSerializableMember(type: number, sourceName?: string) {
    return (target: any, propertyKey: string | symbol) => {
        const classStore = GetDirectStore(target);

        if (!classStore[propertyKey]) {
            classStore[propertyKey] = { type: type, sourceName: sourceName };
        }
    };
}

function generateExpandMember(setCallback: string, targetKey: Nullable<string> = null) {
    return (target: any, propertyKey: string) => {
        const key = targetKey || "_" + propertyKey;
        Object.defineProperty(target, propertyKey, {
            get: function (this: any) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return this[key];
            },
            set: function (this: any, value) {
                // does this object (i.e. vector3) has an equals function? use it!
                // Note - not using "with epsilon" here, it is expected te behave like the internal cache does.
                if (typeof this[key]?.equals === "function") {
                    if (this[key].equals(value)) {
                        return;
                    }
                }
                if (this[key] === value) {
                    return;
                }
                this[key] = value;

                target[setCallback].apply(this);
            },
            enumerable: true,
            configurable: true,
        });
    };
}

export function expandToProperty(callback: string, targetKey: Nullable<string> = null) {
    return generateExpandMember(callback, targetKey);
}

export function serialize(sourceName?: string) {
    return generateSerializableMember(0, sourceName); // value member
}

export function serializeAsTexture(sourceName?: string) {
    return generateSerializableMember(1, sourceName); // texture member
}

export function serializeAsColor3(sourceName?: string) {
    return generateSerializableMember(2, sourceName); // color3 member
}

export function serializeAsFresnelParameters(sourceName?: string) {
    return generateSerializableMember(3, sourceName); // fresnel parameters member
}

export function serializeAsVector2(sourceName?: string) {
    return generateSerializableMember(4, sourceName); // vector2 member
}

export function serializeAsVector3(sourceName?: string) {
    return generateSerializableMember(5, sourceName); // vector3 member
}

export function serializeAsMeshReference(sourceName?: string) {
    return generateSerializableMember(6, sourceName); // mesh reference member
}

export function serializeAsColorCurves(sourceName?: string) {
    return generateSerializableMember(7, sourceName); // color curves
}

export function serializeAsColor4(sourceName?: string) {
    return generateSerializableMember(8, sourceName); // color 4
}

export function serializeAsImageProcessingConfiguration(sourceName?: string) {
    return generateSerializableMember(9, sourceName); // image processing
}

export function serializeAsQuaternion(sourceName?: string) {
    return generateSerializableMember(10, sourceName); // quaternion member
}

export function serializeAsMatrix(sourceName?: string) {
    return generateSerializableMember(12, sourceName); // matrix member
}

/**
 * Decorator used to define property that can be serialized as reference to a camera
 * @param sourceName defines the name of the property to decorate
 * @returns Property Decorator
 */
export function serializeAsCameraReference(sourceName?: string) {
    return generateSerializableMember(11, sourceName); // camera reference member
}

/** @internal */
declare const _native: any;

/**
 * Decorator used to redirect a function to a native implementation if available.
 * @internal
 */
export function nativeOverride<T extends (...params: any[]) => boolean>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...params: Parameters<T>) => unknown>,
    predicate?: T
) {
    // Cache the original JS function for later.
    const jsFunc = descriptor.value!;

    // Override the JS function to check for a native override on first invocation. Setting descriptor.value overrides the function at the early stage of code being loaded/imported.
    descriptor.value = (...params: Parameters<T>): unknown => {
        // Assume the resolved function will be the original JS function, then we will check for the Babylon Native context.
        let func = jsFunc;

        // Check if we are executing in a Babylon Native context (e.g. check the presence of the _native global property) and if so also check if a function override is available.
        if (typeof _native !== "undefined" && _native[propertyKey]) {
            const nativeFunc = _native[propertyKey] as (...params: Parameters<T>) => unknown;
            // If a predicate was provided, then we'll need to invoke the predicate on each invocation of the underlying function to determine whether to call the native function or the JS function.
            if (predicate) {
                // The resolved function will execute the predicate and then either execute the native function or the JS function.
                func = (...params: Parameters<T>) => (predicate(...params) ? nativeFunc(...params) : jsFunc(...params));
            } else {
                // The resolved function will directly execute the native function.
                func = nativeFunc;
            }
        }

        // Override the JS function again with the final resolved target function.
        target[propertyKey] = func;

        // The JS function has now been overridden based on whether we're executing in the context of Babylon Native, but we still need to invoke that function.
        // Future invocations of the function will just directly invoke the final overridden function, not any of the decorator setup logic above.
        return func(...params);
    };
}

/**
 * Decorator factory that applies the nativeOverride decorator, but determines whether to redirect to the native implementation based on a filter function that evaluates the function arguments.
 * @param predicate
 * @example @nativeOverride.filter((...[arg1]: Parameters<typeof someClass.someMethod>) => arg1.length > 20)
 *          public someMethod(arg1: string, arg2: number): string {
 * @internal
 */
nativeOverride.filter = function <T extends (...params: any) => boolean>(predicate: T) {
    return (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<(...params: Parameters<T>) => unknown>) =>
        nativeOverride(target, propertyKey, descriptor, predicate);
};

export function addAccessorsForMaterialProperty(setCallback: string, targetKey: Nullable<string> = null) {
    return (target: any, propertyKey: string) => {
        const key = propertyKey;
        const newKey = targetKey || "";
        Object.defineProperty(target, newKey, {
            get: function (this: any) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return this[key].value;
            },
            set: function (this: any, value) {
                // does this object (i.e. vector3) has an equals function? use it!
                // Note - not using "with epsilon" here, it is expected te behave like the internal cache does.
                if (typeof this[key]?.value?.equals === "function") {
                    if (this[key].value.equals(value)) {
                        return;
                    }
                }
                if (this[key].value === value) {
                    return;
                }
                this[key].value = value;

                target[setCallback].apply(this);
            },
            enumerable: true,
            configurable: true,
        });
    };
}
