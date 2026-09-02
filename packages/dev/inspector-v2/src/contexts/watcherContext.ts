import { type IDisposable } from "core/index";
import { Observable } from "core/Misc/observable";
import { type IWatcherService } from "../services/watcherService";

import { createContext, useContext } from "react";

import { InterceptProperty } from "../instrumentation/propertyInstrumentation";

const DefaultRefreshObservable = new Observable<void>();

const DefaultWatcher: IWatcherService = {
    watchProperty<T extends object>(target: T, propertyKey: keyof T, onChanged: (value: unknown) => void): IDisposable {
        return InterceptProperty(target, propertyKey, {
            afterSet: (value) => onChanged(value),
        });
    },
    watchValue<T>(getValue: () => T, onChanged: (value: T) => void, equals: (left: T, right: T) => boolean = Object.is): IDisposable {
        let previousValue = getValue();
        const observer = DefaultRefreshObservable.add(() => {
            const currentValue = getValue();
            if (!equals(previousValue, currentValue)) {
                previousValue = currentValue;
                onChanged(currentValue);
            }
        });

        return {
            dispose: () => observer.remove(),
        };
    },
    refresh: () => DefaultRefreshObservable.notifyObservers(),
};

export const WatcherContext = createContext<IWatcherService>(DefaultWatcher);

export function useWatcher() {
    return useContext(WatcherContext);
}
