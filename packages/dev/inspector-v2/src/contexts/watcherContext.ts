import type { IDisposable } from "core/index";
import type { IWatcherService } from "../services/watcherService";

import { createContext, useContext } from "react";

import { InterceptProperty } from "../instrumentation/propertyInstrumentation";

const DefaultWatcher: IWatcherService = {
    watchProperty<T extends object>(target: T, propertyKey: keyof T, onChanged: (value: unknown) => void): IDisposable {
        return InterceptProperty(target, propertyKey, {
            afterSet: (value) => onChanged(value),
        });
    },
    refresh: () => {},
};

export const WatcherContext = createContext<IWatcherService>(DefaultWatcher);

export function useWatcher() {
    return useContext(WatcherContext);
}
