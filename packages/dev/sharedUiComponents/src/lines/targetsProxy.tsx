import type { PropertyChangedEvent } from "../propertyChangedEvent";
import type { Observable } from "core/Misc/observable";

export const conflictingValuesPlaceholder = "—";

/**
 *
 * @param targets a list of selected targets
 * @param onPropertyChangedObservable
 * @param getProperty
 * @returns a proxy object that can be passed as a target into the input
 */
export function makeTargetsProxy<Type>(
    targets: Type[],
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>,
    getProperty: (target: Type, property: keyof Type) => any = (target, property) => target[property]
) {
    return new Proxy(
        {},
        {
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
                for (const target of targets) {
                    const initialValue = target[property];
                    target[property] = value;
                    if (onPropertyChangedObservable) {
                        onPropertyChangedObservable.notifyObservers({
                            object: target,
                            property: name as string,
                            value: target[property],
                            initialValue,
                        });
                    }
                }
                return true;
            },
        }
    ) as any;
}
