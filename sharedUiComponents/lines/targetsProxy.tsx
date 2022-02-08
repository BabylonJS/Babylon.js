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
export function makeTargetsProxy(targets: any[], onPropertyChangedObservable?: Observable<PropertyChangedEvent>) {
    return new Proxy({}, {
        get(_, name) {
            if (targets.length === 0) return conflictingValuesPlaceholder;
            const firstValue = targets[0][name];
            for (const target of targets) {
                if (target[name] !== firstValue) {
                    return conflictingValuesPlaceholder;
                }
            }
            return firstValue;
        },
        set(_, name, value) {
            if (value === "—") return true;
            for(const target of targets) {
                const initialValue = target[name];
                target[name] = value;
                if (onPropertyChangedObservable) {
                    onPropertyChangedObservable.notifyObservers({
                        object: target,
                        property: name as string,
                        value: target[name],
                        initialValue
                    });
                }
            }
            return true;
        }
    }) as any;
}