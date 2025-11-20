import type { Observable } from "core/index";

import { createContext, useContext } from "react";

export type PropertyChangeInfo = Readonly<{
    entity: unknown;
    propertyKey: PropertyKey;
    oldValue: unknown;
    newValue: unknown;
}>;

export type PropertyContext = {
    readonly onPropertyChanged: Observable<PropertyChangeInfo>;
};

export const PropertyContext = createContext<PropertyContext | undefined>(undefined);

export function usePropertyContext() {
    return useContext(PropertyContext);
}
