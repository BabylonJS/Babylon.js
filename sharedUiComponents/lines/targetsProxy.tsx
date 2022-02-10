import { PropertyChangedEvent } from "../propertyChangedEvent";
import { Observable } from "babylonjs/Misc/observable";

export const conflictingValuesPlaceholder = "—";

/**
 * 
 * @param propertyName the property that the input changes
 * @param targets a list of selected targets
 * @param defaultValue the value that should be returned when two targets have conflicting values
 * @param setter an optional setter function to override the default setter behavior
 * @returns a proxy object that can be passed as a target into the input
 */
export function makeTargetsProxy<Type>(targets: Type[], onPropertyChangedObservable?: Observable<PropertyChangedEvent>, getProperty: (target: Type, property: keyof Type) => any = (target, property) => target[property]) {
    return new Proxy({}, {
        get(_, name) {
            const property = name as keyof Type;
            if (targets.length === 0) return conflictingValuesPlaceholder;
            const firstValue = getProperty(targets[0], property);
            for (const target of targets) {
                if (getProperty(target, property) !== firstValue) {
                    return conflictingValuesPlaceholder;
                }
            }
            return firstValue;
        },
        set(_, name, value) {
            if (value === "—") return true;
            const property = name as keyof Type;
            for(const target of targets) {
                const initialValue = target[property];
                target[property] = value;
                if (onPropertyChangedObservable) {
                    onPropertyChangedObservable.notifyObservers({
                        object: target,
                        property: name as string,
                        value: target[property],
                        initialValue
                    });
                }
            }
            return true;
        }
    })
}