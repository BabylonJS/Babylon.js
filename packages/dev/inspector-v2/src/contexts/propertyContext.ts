import { type Observable } from "core/index";

import { createContext, useCallback, useContext } from "react";

/**
 * Describes a property change event, including the entity, the property key, and the old and new values.
 */
export type PropertyChangeInfo = {
    /** The entity whose property was changed. */
    readonly entity: unknown;
    /** The key of the property that was changed. */
    readonly propertyKey: PropertyKey;
    /** The value of the property before the change. */
    readonly oldValue: unknown;
    /** The value of the property after the change. */
    readonly newValue: unknown;
};

/**
 * Context that provides an observable for property change notifications within the inspector.
 */
export type PropertyContext = {
    /** An observable that fires whenever a property is changed through the inspector UI. */
    readonly onPropertyChanged: Observable<PropertyChangeInfo>;
};

/**
 * React context for accessing the property change observable.
 */
export const PropertyContext = createContext<PropertyContext | undefined>(undefined);

/**
 * Hook that returns a callback to notify the property context when a property has been changed.
 * @returns A function that accepts (entity, propertyKey, oldValue, newValue) and notifies observers.
 */
export function usePropertyChangedNotifier() {
    const propertyContext = useContext(PropertyContext);
    return useCallback(
        <ObjectT, PropertyT extends keyof ObjectT>(entity: ObjectT, propertyKey: PropertyT, oldValue: ObjectT[PropertyT], newValue: ObjectT[PropertyT]) => {
            propertyContext?.onPropertyChanged.notifyObservers({ entity, propertyKey, oldValue, newValue });
        },
        [propertyContext]
    );
}
