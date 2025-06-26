// eslint-disable-next-line import/no-internal-modules
import type { Vector3, Color3 } from "core/index";

import { useInterceptObservable } from "./instrumentationHooks";
import { useObservableState } from "./observableHooks";

type Vector3Keys<T> = { [P in keyof T]: T[P] extends Vector3 ? P : never }[keyof T];
type Color3Keys<T> = { [P in keyof T]: T[P] extends Color3 ? P : never }[keyof T];

// eslint-disable-next-line @typescript-eslint/naming-convention
export function useProperty<T extends object, K extends keyof T>(target: T, propertyKey: K): T[K] {
    return useObservableState(() => target[propertyKey], useInterceptObservable("property", target, propertyKey));
}

// This helper hook gets the value of a Vector3 property from a target object and causes the component
// to re-render when the property changes or when the x/y/z components of the Vector3 change.
// eslint-disable-next-line @typescript-eslint/naming-convention
export function useVector3Property<T extends object, K extends Vector3Keys<T>>(target: T, propertyKey: K): Vector3 {
    const vector = useProperty(target, propertyKey) as Vector3;
    useProperty(vector, "x");
    useProperty(vector, "y");
    useProperty(vector, "z");
    return vector;
}

// This helper hook gets the value of a Color3 property from a target object and causes the component
// to re-render when the property changes or when the r/g/b components of the Color3 change.
// eslint-disable-next-line @typescript-eslint/naming-convention
export function useColor3Property<T extends object, K extends Color3Keys<T>>(target: T, propertyKey: K): Color3 {
    const color = useProperty(target, propertyKey) as Color3;
    useProperty(color, "r");
    useProperty(color, "g");
    useProperty(color, "b");
    return color;
}
