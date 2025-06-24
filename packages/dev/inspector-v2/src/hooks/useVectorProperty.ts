import type { Vector3 } from "core/Maths";
import { useInterceptObservable } from "./instrumentationHooks";
import { useObservableState } from "./observableHooks";

type Vector3Keys<T> = { [P in keyof T]: T[P] extends Vector3 ? P : never }[keyof T];

/**
 * This helper hook gets the value of a Vector3 property from a target object and causes the component
 * to re-render when the property changes or when the x/y/z components of the Vector2 change.
 * @param target
 * @param propertyKey
 * @returns
 */
export function UseVector3Property<T extends object, K extends Vector3Keys<T>>(target: T, propertyKey: K): Vector3 {
    const position = useObservableState(() => target[propertyKey] as Vector3, useInterceptObservable("property", target, propertyKey));
    useObservableState(() => position.x, useInterceptObservable("property", position, "x"));
    useObservableState(() => position.y, useInterceptObservable("property", position, "y"));
    useObservableState(() => position.z, useInterceptObservable("property", position, "z"));
    return position;
}
