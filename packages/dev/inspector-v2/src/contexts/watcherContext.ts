import { type IDisposable } from "core/index";
import { Observable } from "core/Misc/observable";
import { type IWatcherService } from "../services/watcherService";

import { createContext, useContext, useEffect, useState } from "react";

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

/**
 * Reads a computed value and keeps it synchronized with Watcher refreshes.
 * @param target The object from which the value is computed.
 * @param getValue A stable function that computes the value from the target.
 * @returns The latest computed value.
 * @remarks Use this for inspected values that should honor the Preferred Watch Mode. Use
 * `useObservableState` directly when the source exposes a precise change observable, or combine
 * `usePollingObservable` with `useObservableState` for telemetry that intentionally uses a fixed
 * cadence independent of Watch Mode.
 */
export function useWatchedValue<Target, Value>(target: Target, getValue: (target: Target) => Value): Value {
    const watcher = useWatcher();
    const [value, setValue] = useState(() => getValue(target));

    useEffect(() => {
        setValue(getValue(target));
        const registration = watcher.watchValue(() => getValue(target), setValue);
        return () => registration.dispose();
    }, [watcher, target, getValue]);

    return value;
}
