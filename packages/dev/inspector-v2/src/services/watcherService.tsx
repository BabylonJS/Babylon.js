import type { IDisposable, Nullable } from "core/index";
import type { DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";
import type { IService, ServiceDefinition } from "../modularity/serviceDefinition";
import type { ISettingsService } from "./panes/settingsService";
import type { ISettingsStore, SettingDescriptor } from "./settingsStore";

import { Observable } from "core/Misc/observable";
import { DropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { useSetting } from "../hooks/settingsHooks";
import { InterceptProperty } from "../instrumentation/propertyInstrumentation";
import { SettingsServiceIdentity } from "./panes/settingsService";
import { SettingsStoreIdentity } from "./settingsStore";

type InterceptSettings = {
    mode: "intercept";
};

type PollingSettings = {
    mode: "polling";
    interval: number;
};

type WatcherSettings = InterceptSettings | PollingSettings;

const WatcherSettingDescriptor: SettingDescriptor<WatcherSettings> = {
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

const WatchModes = [
    { label: "Interception", value: "intercept" },
    { label: "Polling", value: "polling" },
] as const satisfies DropdownOption<WatcherSettings["mode"]>[];

export const WatcherSettingsServiceDefinition: ServiceDefinition<[], [ISettingsService]> = {
    friendlyName: "Watcher Settings Service",
    consumes: [SettingsServiceIdentity],
    factory: (settingsService) => {
        const settingsRegistration = settingsService.addSectionContent({
            key: "watcherSettings",
            section: "UI",
            component: () => {
                const [watcherSettings, setWatcherSettings] = useSetting(WatcherSettingDescriptor);

                return (
                    <>
                        <DropdownPropertyLine
                            label="Property Watch Mode"
                            description={`Specifies how Inspector watches entity properties for changes. "Interception" sees changes instantly, but for complex scenes can impact performance. "Polling" has less performance impact on complex scenes, but changes are only detected at the specified interval. \n\n test`}
                            options={WatchModes}
                            value={watcherSettings.mode}
                            onChange={(value) =>
                                setWatcherSettings((prev) => {
                                    return { interval: 250, ...prev, mode: value } as WatcherSettings;
                                })
                            }
                        />
                        <Collapse visible={watcherSettings.mode === "polling"}>
                            <SyncedSliderPropertyLine
                                label="Polling Interval"
                                description="A smaller polling interval will detect changes faster but may impact performance more."
                                min={30}
                                max={1000}
                                step={10}
                                value={watcherSettings.mode === "polling" ? watcherSettings.interval : NaN}
                                onChange={(value) =>
                                    setWatcherSettings((prev) => {
                                        return { ...prev, interval: value };
                                    })
                                }
                            />
                        </Collapse>
                    </>
                );
            },
        });

        return {
            dispose: () => {
                settingsRegistration.dispose();
            },
        };
    },
};
