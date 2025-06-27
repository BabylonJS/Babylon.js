import type { Vector3, Color3, Nullable, Quaternion } from "core/index";

import { useInterceptObservable } from "./instrumentationHooks";
import { useObservableState } from "./observableHooks";

export function useProperty<T extends object, K extends keyof T>(target: T, propertyKey: K): T[K];
export function useProperty<T extends object, K extends keyof T>(target: T | null | undefined, propertyKey: K): T[K] | null;
/**
 * Translates a property value to react state, updating the state whenever the property changes.
 * @param target The object containing the property to observe.
 * @param propertyKey The key of the property to observe.
 * @returns The current value of the property, or null if the target is null or undefined.
 */
export function useProperty<T extends object, K extends keyof T>(target: T | null | undefined, propertyKey: K) {
    return useObservableState(() => (target ? target[propertyKey] : null), useInterceptObservable("property", target, propertyKey));
}

type Vector3Keys<T> = { [K in keyof T]: T[K] extends Nullable<Vector3> ? K : never }[keyof T];

export function useVector3Property<T extends object, K extends Vector3Keys<T>>(target: T, propertyKey: K): T[K];
export function useVector3Property<T extends object, K extends Vector3Keys<T>>(target: T | null | undefined, propertyKey: K): T[K] | null;
/**
 * Translates a Vector3 property value to react state, updating the state whenever the property changes or when the x/y/z components of the Vector3 change.
 * @param target The object containing the property to observe.
 * @param propertyKey The key of the property to observe.
 * @returns The current value of the property, or null if the target is null or undefined.
 */
export function useVector3Property<T extends object, K extends Vector3Keys<T>>(target: T | null | undefined, propertyKey: K) {
    const vector = useProperty(target, propertyKey);
    useProperty(vector as Vector3 | null | undefined, "x");
    useProperty(vector as Vector3 | null | undefined, "y");
    useProperty(vector as Vector3 | null | undefined, "z");
    return vector;
}

type Color3Keys<T> = { [P in keyof T]: T[P] extends Nullable<Color3> ? P : never }[keyof T];

export function useColor3Property<T extends object, K extends Color3Keys<T>>(target: T, propertyKey: K): T[K];
export function useColor3Property<T extends object, K extends Color3Keys<T>>(target: T | null | undefined, propertyKey: K): T[K] | null;
/**
 * Translates a Color3 property value to react state, updating the state whenever the property changes or when the r/g/b components of the Color3 change.
 * @param target The object containing the property to observe.
 * @param propertyKey The key of the property to observe.
 * @returns The current value of the property, or null if the target is null or undefined.
 */
export function useColor3Property<T extends object, K extends Color3Keys<T>>(target: T | null | undefined, propertyKey: K) {
    const color = useProperty(target, propertyKey);
    useProperty(color as Color3 | null | undefined, "r");
    useProperty(color as Color3 | null | undefined, "g");
    useProperty(color as Color3 | null | undefined, "b");
    return color;
}

type QuaternionKeys<T> = { [P in keyof T]: T[P] extends Nullable<Quaternion> ? P : never }[keyof T];

export function useQuaternionProperty<T extends object, K extends QuaternionKeys<T>>(target: T, propertyKey: K): T[K];
export function useQuaternionProperty<T extends object, K extends QuaternionKeys<T>>(target: T | null | undefined, propertyKey: K): T[K] | null;
/**
 * Translates a Quaternion property value to react state, updating the state whenever the property changes or when the x/y/z/w components of the Quaternion change.
 * @param target The object containing the property to observe.
 * @param propertyKey The key of the property to observe.
 * @returns The current value of the property, or null if the target is null or undefined.
 */
export function useQuaternionProperty<T extends object, K extends QuaternionKeys<T>>(target: T | null | undefined, propertyKey: K) {
    const quaternion = useProperty(target, propertyKey);
    useProperty(quaternion as Quaternion | null | undefined, "x");
    useProperty(quaternion as Quaternion | null | undefined, "y");
    useProperty(quaternion as Quaternion | null | undefined, "z");
    useProperty(quaternion as Quaternion | null | undefined, "w");

    return quaternion;
}
