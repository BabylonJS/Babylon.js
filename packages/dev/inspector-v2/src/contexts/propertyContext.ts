import type { Observable } from "core/index";

import { createContext, useCallback, useContext } from "react";

export type PropertyChangeInfo = {
    readonly entity: unknown;
    readonly propertyKey: PropertyKey;
    readonly oldValue: unknown;
    readonly newValue: unknown;
};

export type PropertyContext = {
    readonly onPropertyChanged: Observable<PropertyChangeInfo>;
};

export const PropertyContext = createContext<PropertyContext | undefined>(undefined);

export function usePropertyChangedNotifier() {
    const propertyContext = useContext(PropertyContext);
    return useCallback(
        <ObjectT, PropertyT extends keyof ObjectT>(entity: ObjectT, propertyKey: PropertyT, oldValue: ObjectT[PropertyT], newValue: ObjectT[PropertyT]) => {
            propertyContext?.onPropertyChanged.notifyObservers({ entity, propertyKey, oldValue, newValue });
        },
        [propertyContext]
    );
}
