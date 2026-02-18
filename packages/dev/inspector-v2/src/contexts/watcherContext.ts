import type { IDisposable } from "core/index";
import type { IWatcher } from "../services/watcherService";

import { createContext, useContext } from "react";

import { InterceptProperty } from "../instrumentation/propertyInstrumentation";

const DefaultWatcher: IWatcher = {
    watchProperty<T extends object>(target: T, propertyKey: keyof T, onChanged: (value: unknown) => void): IDisposable {
        return InterceptProperty(target, propertyKey, {
            afterSet: (value) => onChanged(value),
        });
    },
};

export const WatcherContext = createContext<IWatcher>(DefaultWatcher);

export function useWatcher() {
    return useContext(WatcherContext);
}
