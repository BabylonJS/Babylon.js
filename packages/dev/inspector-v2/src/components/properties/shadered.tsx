// eslint-disable-next-line import/no-internal-modules
import type { Vector3, Color3 } from "core/index";

import { useInterceptObservable } from "../../hooks/instrumentationHooks";
import { useObservableState } from "../../hooks/observableHooks";

type Vector3Keys<T> = { [P in keyof T]: T[P] extends Vector3 ? P : never }[keyof T];
type Color3Keys<T> = { [P in keyof T]: T[P] extends Color3 ? P : never }[keyof T];

// This helper hook gets the value of a Vector3 property from a target object and causes the component
// to re-render when the property changes or when the x/y/z components of the Vector3 change.
// eslint-disable-next-line @typescript-eslint/naming-convention
export function useVector3Property<T extends object, K extends Vector3Keys<T>>(target: T, propertyKey: K): Vector3 {
    const position = useObservableState(() => target[propertyKey] as Vector3, useInterceptObservable("property", target, propertyKey));
    useObservableState(() => position.x, useInterceptObservable("property", position, "x"));
    useObservableState(() => position.y, useInterceptObservable("property", position, "y"));
    useObservableState(() => position.z, useInterceptObservable("property", position, "z"));
    return position;
}

// This helper hook gets the value of a Vector3 property from a target object and causes the component
// to re-render when the property changes or when the x/y/z components of the Vector3 change.
// eslint-disable-next-line @typescript-eslint/naming-convention
export function useColor3Property<T extends object, K extends Color3Keys<T>>(target: T, propertyKey: K): Color3 {
    const position = useObservableState(() => target[propertyKey] as Color3, useInterceptObservable("property", target, propertyKey));
    useObservableState(() => position.r, useInterceptObservable("property", position, "r"));
    useObservableState(() => position.g, useInterceptObservable("property", position, "g"));
    useObservableState(() => position.b, useInterceptObservable("property", position, "b"));
    return position;
}
