import type { Observable } from "core/index";

import { createContext, useContext } from "react";

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

export function usePropertyContext() {
    return useContext(PropertyContext);
}
