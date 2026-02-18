import type { IDisposable, Nullable } from "core/index";
import type { IService, ServiceDefinition } from "../modularity/serviceDefinition";
import type { ISettingsStore, SettingDescriptor } from "./settingsStore";

import { Observable } from "core/Misc/observable";
import { InterceptProperty } from "../instrumentation/propertyInstrumentation";
import { SettingsStoreIdentity } from "./settingsStore";

type InterceptSettings = {
    mode: "intercept";
};

type PollingSettings = {
    mode: "polling";
    interval: number;
};

const WatcherSettingDescriptor: SettingDescriptor<InterceptSettings | PollingSettings> = {
    key: "WatcherSettings",
    defaultValue: {
        mode: "intercept",
    },
};

export const WatcherServiceIdentity = Symbol("WatcherService");

export interface IWatcherService extends IService<typeof WatcherServiceIdentity> {
    watchProperty<T extends object, K extends keyof T>(
        target: T,
        propertyKey: string extends K ? never : number extends K ? never : symbol extends K ? never : K,
        onChanged: (value: NonNullable<T[K]>) => void
    ): IDisposable;

    watchProperty<T extends object>(target: T, propertyKey: keyof T, onChanged: (value: unknown) => void): IDisposable;
}

export const WatcherServiceDefinition: ServiceDefinition<[IWatcherService], [ISettingsStore]> = {
    friendlyName: "Watcher Service",
    produces: [WatcherServiceIdentity],
    consumes: [SettingsStoreIdentity],
    factory: (settingsStore) => {
        let pollingObservable: Nullable<Observable<void>> = null;
        let pollingHandle: Nullable<number> = null;

        const applySettings = () => {
            const settings = settingsStore.readSetting(WatcherSettingDescriptor);
            if (pollingHandle !== null) {
                clearInterval(pollingHandle);
                pollingHandle = null;
            }

            if (settings.mode === "intercept") {
                if (pollingObservable) {
                    pollingObservable.clear();
                    pollingObservable = null;
                }
            } else if (settings.mode === "polling") {
                const _pollingObservable = pollingObservable ?? (pollingObservable = new Observable<void>());
                pollingHandle = window.setInterval(() => {
                    _pollingObservable.notifyObservers();
                }, settings.interval);
            }
        };

        const settingsStoreObserver = settingsStore.onChanged.add((key: string) => {
            if (key === WatcherSettingDescriptor.key) {
                applySettings();
            }
        });

        applySettings();

        return {
            watchProperty<T extends object>(target: T, propertyKey: keyof T, onChanged: (value: unknown) => void): IDisposable {
                if (pollingObservable) {
                    let previousValue = target[propertyKey];
                    const observer = pollingObservable.add(() => {
                        const currentValue = target[propertyKey];
                        if (!Object.is(previousValue, currentValue)) {
                            previousValue = currentValue;
                            onChanged(currentValue);
                        }
                    });

                    return {
                        dispose: () => observer.remove(),
                    };
                } else {
                    return InterceptProperty(target, propertyKey, {
                        afterSet: (value) => onChanged(value),
                    });
                }
            },
            dispose: () => {
                if (pollingHandle !== null) {
                    clearInterval(pollingHandle);
                    pollingHandle = null;
                }

                pollingObservable?.clear();
                settingsStoreObserver.remove();
            },
        };
    },
};
