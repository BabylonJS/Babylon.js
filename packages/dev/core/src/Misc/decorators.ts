/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "../types";
import { GetDirectStoreFromMetadata } from "./decorators.functions";
import { _WarnImport } from "./devTools";

/**
 * TC39 decorator context types that serialization decorators can be applied to.
 * Serialization decorators can be applied to fields, getters, setters, and auto-accessors.
 */
type SerializableContext = { name: string | symbol; metadata: DecoratorMetadataObject };

function generateSerializableMember(type: number, sourceName?: string) {
    return (_value: unknown, context: SerializableContext) => {
        const propertyKey = String(context.name);
        const store = GetDirectStoreFromMetadata(context.metadata);

        if (!store[propertyKey]) {
            store[propertyKey] = { type: type, sourceName: sourceName };
        }
    };
}

function generateExpandMember(setCallback: string, targetKey: Nullable<string> = null) {
    return <This, V>(_value: ClassAccessorDecoratorTarget<This, V>, context: ClassAccessorDecoratorContext<This, V>): ClassAccessorDecoratorResult<This, V> => {
        const key = targetKey || "_" + String(context.name);
        return {
            get(this: any) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return this[key];
            },
            set(this: any, value: V) {
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

                this[setCallback]();
            },
        };
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
export function nativeOverride<This, Args extends any[], Return>(
    originalMethod: (this: This, ...args: Args) => Return,
    _context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
): (this: This, ...args: Args) => Return {
    const propertyKey = String(_context.name);
    let resolvedFunc: ((this: This, ...args: Args) => Return) | null = null;

    return function (this: This, ...params: Args): Return {
        if (resolvedFunc === null) {
            // Default to the original JS function.
            resolvedFunc = originalMethod;

            // Check if we are executing in a Babylon Native context and if so, check for a function override.
            if (typeof _native !== "undefined" && _native[propertyKey]) {
                resolvedFunc = _native[propertyKey] as (this: This, ...args: Args) => Return;
            }
        }

        return resolvedFunc.apply(this, params);
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
    return (originalMethod: (...args: any[]) => any, _context: ClassMethodDecoratorContext): ((...args: any[]) => any) => {
        const propertyKey = String(_context.name);
        let nativeFunc: ((...args: any[]) => any) | undefined;
        let resolved = false;

        return function (this: any, ...params: any[]): unknown {
            if (!resolved) {
                resolved = true;
                if (typeof _native !== "undefined" && _native[propertyKey]) {
                    nativeFunc = _native[propertyKey] as (...args: any[]) => any;
                }
            }

            if (nativeFunc && predicate(...(params as Parameters<T>))) {
                return nativeFunc(...params);
            }
            return originalMethod.apply(this, params);
        };
    };
};

/**
 * Adds accessors for a material property.
 * Applied to an auto-accessor field. Reads/writes from a private backing field named by sourceKey (default: "_" + property name).
 * The backing field is expected to have a `.value` property.
 * @param setCallback - The name of the callback function to call when the property is set.
 * @param sourceKey - The name of the private field that stores the value (defaults to "_" + accessor name).
 * @returns An accessor decorator.
 */
export function addAccessorsForMaterialProperty(setCallback: string, sourceKey: Nullable<string> = null) {
    return <This, V>(_value: ClassAccessorDecoratorTarget<This, V>, context: ClassAccessorDecoratorContext<This, V>): ClassAccessorDecoratorResult<This, V> => {
        const key = sourceKey || "_" + String(context.name);
        return {
            get(this: any) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return this[key]?.value;
            },
            set(this: any, value: V) {
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

                this[setCallback]();
            },
        };
    };
}
