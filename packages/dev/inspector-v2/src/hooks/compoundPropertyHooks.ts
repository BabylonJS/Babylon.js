import type { Vector3, Color3, Color4, Quaternion } from "core/index";

import { useCallback } from "react";

import { useInterceptObservable } from "./instrumentationHooks";
import { useObservableState } from "./observableHooks";

type PropertyKeys<TargetT, PropertyT> = { [PropertyKeyT in keyof TargetT]: TargetT[PropertyKeyT] extends PropertyT | null | undefined ? PropertyKeyT : never }[keyof TargetT];

export function useProperty<TargetT extends object, PropertyKeyT extends keyof TargetT>(target: TargetT, propertyKey: PropertyKeyT): TargetT[PropertyKeyT];
export function useProperty<TargetT extends object, PropertyKeyT extends keyof TargetT>(
    target: TargetT | null | undefined,
    propertyKey: PropertyKeyT
): TargetT[PropertyKeyT] | undefined;
/**
 * Translates a property value to react state, updating the state whenever the property changes.
 * @param target The object containing the property to observe.
 * @param propertyKey The key of the property to observe.
 * @returns The current value of the property, or null if the target is null or undefined.
 */
export function useProperty<TargetT extends object, PropertyKeyT extends keyof TargetT>(target: TargetT | null | undefined, propertyKey: PropertyKeyT) {
    return useObservableState(
        useCallback(() => (target ? target[propertyKey] : undefined), [target, propertyKey]),
        useInterceptObservable("property", target, propertyKey)
    );
}

export function useVector3Property<TargetT extends object, PropertyKeyT extends PropertyKeys<TargetT, Vector3>>(target: TargetT, propertyKey: PropertyKeyT): TargetT[PropertyKeyT];
export function useVector3Property<TargetT extends object, PropertyKeyT extends PropertyKeys<TargetT, Vector3>>(
    target: TargetT | null | undefined,
    propertyKey: PropertyKeyT
): TargetT[PropertyKeyT] | undefined;
/**
 * Translates a Vector3 property value to react state, updating the state whenever the property changes or when the x/y/z components of the Vector3 change.
 * @param target The object containing the property to observe.
 * @param propertyKey The key of the property to observe.
 * @returns The current value of the property, or null if the target is null or undefined.
 */
export function useVector3Property<TargetT extends object, PropertyKeyT extends PropertyKeys<TargetT, Vector3>>(target: TargetT | null | undefined, propertyKey: PropertyKeyT) {
    const vector = useProperty(target, propertyKey);
    useProperty(vector as Vector3 | null | undefined, "x");
    useProperty(vector as Vector3 | null | undefined, "y");
    useProperty(vector as Vector3 | null | undefined, "z");
    return vector;
}

export function useColor3Property<TargetT extends object, PropertyKeyT extends PropertyKeys<TargetT, Color3>>(target: TargetT, propertyKey: PropertyKeyT): TargetT[PropertyKeyT];
export function useColor3Property<TargetT extends object, PropertyKeyT extends PropertyKeys<TargetT, Color3>>(
    target: TargetT | null | undefined,
    propertyKey: PropertyKeyT
): TargetT[PropertyKeyT] | undefined;
/**
 * Translates a Color3 property value to react state, updating the state whenever the property changes or when the r/g/b components of the Color3 change.
 * @param target The object containing the property to observe.
 * @param propertyKey The key of the property to observe.
 * @returns The current value of the property, or null if the target is null or undefined.
 */
export function useColor3Property<TargetT extends object, PropertyKeyT extends PropertyKeys<TargetT, Color3>>(target: TargetT | null | undefined, propertyKey: PropertyKeyT) {
    const color = useProperty(target, propertyKey);
    useProperty(color as Color3 | null | undefined, "r");
    useProperty(color as Color3 | null | undefined, "g");
    useProperty(color as Color3 | null | undefined, "b");
    return color;
}

export function useColor4Property<TargetT extends object, PropertyKeyT extends PropertyKeys<TargetT, Color4>>(target: TargetT, propertyKey: PropertyKeyT): TargetT[PropertyKeyT];
export function useColor4Property<TargetT extends object, PropertyKeyT extends PropertyKeys<TargetT, Color4>>(
    target: TargetT | null | undefined,
    propertyKey: PropertyKeyT
): TargetT[PropertyKeyT] | null;
/**
 * Translates a Color4 property value to react state, updating the state whenever the property changes or when the r/g/b components of the Color4 change.
 * @param target The object containing the property to observe.
 * @param propertyKey The key of the property to observe.
 * @returns The current value of the property, or null if the target is null or undefined.
 */
export function useColor4Property<TargetT extends object, PropertyKeyT extends PropertyKeys<TargetT, Color4>>(target: TargetT | null | undefined, propertyKey: PropertyKeyT) {
    const color = useProperty(target, propertyKey);
    useProperty(color as Color3 | null | undefined, "r");
    useProperty(color as Color3 | null | undefined, "g");
    useProperty(color as Color3 | null | undefined, "b");
    useProperty(color as Color4 | null | undefined, "a");
    return color;
}

export function useQuaternionProperty<TargetT extends object, PropertyKeyT extends PropertyKeys<TargetT, Quaternion>>(
    target: TargetT,
    propertyKey: PropertyKeyT
): TargetT[PropertyKeyT];
export function useQuaternionProperty<TargetT extends object, PropertyKeyT extends PropertyKeys<TargetT, Quaternion>>(
    target: TargetT | null | undefined,
    propertyKey: PropertyKeyT
): TargetT[PropertyKeyT] | undefined;
/**
 * Translates a Quaternion property value to react state, updating the state whenever the property changes or when the x/y/z/w components of the Quaternion change.
 * @param target The object containing the property to observe.
 * @param propertyKey The key of the property to observe.
 * @returns The current value of the property, or null if the target is null or undefined.
 */
export function useQuaternionProperty<TargetT extends object, PropertyKeyT extends PropertyKeys<TargetT, Quaternion>>(
    target: TargetT | null | undefined,
    propertyKey: PropertyKeyT
) {
    const quaternion = useProperty(target, propertyKey);
    useProperty(quaternion as Quaternion | null | undefined, "x");
    useProperty(quaternion as Quaternion | null | undefined, "y");
    useProperty(quaternion as Quaternion | null | undefined, "z");
    useProperty(quaternion as Quaternion | null | undefined, "w");

    return quaternion;
}
