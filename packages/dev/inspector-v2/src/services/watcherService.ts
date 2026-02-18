import type { IDisposable, IObserver, Nullable } from "core/index";
import type { IService } from "../modularity/serviceDefinition";
import type { ISettingsStore, SettingDescriptor } from "./settingsStore";

import { Observable } from "core/Misc/observable";
import { InterceptProperty } from "../instrumentation/propertyInstrumentation";

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

export interface IWatcher extends IService<typeof WatcherServiceIdentity> {
    watchProperty<T extends object, K extends keyof T>(
        target: T,
        propertyKey: string extends K ? never : number extends K ? never : symbol extends K ? never : K,
        onChanged: (value: NonNullable<T[K]>) => void
    ): IDisposable;

    watchProperty<T extends object>(target: T, propertyKey: keyof T, onChanged: (value: unknown) => void): IDisposable;
}

export class Watcher implements IWatcher, IDisposable {
    private readonly _settingsStoreObserver: IObserver;
    private _pollingObservable: Nullable<Observable<void>> = null;
    private _pollingHandle: Nullable<number> = null;

    public constructor(private readonly _settingsStore: ISettingsStore) {
        const applySettings = () => {
            const settings = this._settingsStore.readSetting(WatcherSettingDescriptor);
            if (this._pollingHandle !== null) {
                clearInterval(this._pollingHandle);
                this._pollingHandle = null;
            }

            if (settings.mode === "intercept") {
                if (this._pollingObservable) {
                    this._pollingObservable.clear();
                    this._pollingObservable = null;
                }
            } else if (settings.mode === "polling") {
                const pollingObservable = this._pollingObservable ?? (this._pollingObservable = new Observable<void>());
                this._pollingHandle = window.setInterval(() => {
                    pollingObservable.notifyObservers();
                }, settings.interval);
            }
        };

        this._settingsStoreObserver = this._settingsStore.onChanged.add((key: string) => {
            if (key === WatcherSettingDescriptor.key) {
                applySettings();
            }
        });

        applySettings();
    }

    public watchProperty<T extends object>(target: T, propertyKey: keyof T, onChanged: (value: unknown) => void): IDisposable {
        if (this._pollingObservable) {
            let previousValue = target[propertyKey];
            const observer = this._pollingObservable.add(() => {
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
    }

    public dispose(): void {
        if (this._pollingHandle !== null) {
            clearInterval(this._pollingHandle);
            this._pollingHandle = null;
        }

        this._pollingObservable?.clear();
        this._settingsStoreObserver.remove();
    }
}
