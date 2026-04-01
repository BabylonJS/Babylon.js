import { type IDisposable, type Nullable } from "core/index";
import { type DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";
import { type IService, type ServiceDefinition } from "../modularity/serviceDefinition";
import { type ISettingsService, SettingsServiceIdentity } from "./panes/settingsService";
import { type ISettingsStore, type SettingDescriptor, SettingsStoreIdentity } from "./settingsStore";
import { type IShellService, ShellServiceIdentity } from "./shellService";
import { type IReactContextService, type ReactContextHandle, ReactContextServiceIdentity } from "./reactContextService";

import { ArrowClockwiseRegular } from "@fluentui/react-icons";

import { Observable } from "core/Misc/observable";
import { DropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { WatcherContext } from "../contexts/watcherContext";
import { useSetting } from "../hooks/settingsHooks";
import { InterceptProperty } from "../instrumentation/propertyInstrumentation";
import { DefaultToolbarItemOrder } from "./defaultToolbarMetadata";

type InterceptSettings = {
    mode: "intercept";
};

type PollingSettings = {
    mode: "polling";
    interval: number;
};

type ManualSettings = {
    mode: "manual";
};

type WatcherSettings = InterceptSettings | PollingSettings | ManualSettings;

const WatcherSettingDescriptor: SettingDescriptor<WatcherSettings> = {
    key: "WatcherSettings",
    defaultValue: {
        mode: "intercept",
    },
};

/**
 * The unique identity symbol for the watcher service.
 */
export const WatcherServiceIdentity = Symbol("WatcherService");

/**
 * Watches for property changes on objects, using either interception, polling, or manual refresh.
 */
export interface IWatcherService extends IService<typeof WatcherServiceIdentity> {
    /**
     * Watches a property on an object and calls the callback whenever it changes.
     * @param target The object containing the property to watch.
     * @param propertyKey The key of the property to watch.
     * @param onChanged A callback that is called with the new value when the property changes.
     * @returns A disposable that stops watching when disposed.
     */
    watchProperty<T extends object, K extends keyof T>(
        target: T,
        propertyKey: string extends K ? never : number extends K ? never : symbol extends K ? never : K,
        onChanged: (value: NonNullable<T[K]>) => void
    ): IDisposable;

    /**
     * Watches a property on an object and calls the callback whenever it changes.
     * @param target The object containing the property to watch.
     * @param propertyKey The key of the property to watch.
     * @param onChanged A callback that is called with the new value when the property changes.
     * @returns A disposable that stops watching when disposed.
     */
    watchProperty<T extends object>(target: T, propertyKey: keyof T, onChanged: (value: unknown) => void): IDisposable;

    /**
     * Manually triggers a refresh of all watched properties.
     */
    refresh(): void;
}

export const WatcherServiceDefinition: ServiceDefinition<[IWatcherService], [ISettingsStore, IReactContextService]> = {
    friendlyName: "Watcher Service",
    produces: [WatcherServiceIdentity],
    consumes: [SettingsStoreIdentity, ReactContextServiceIdentity],
    factory: (settingsStore, reactContextService) => {
        let refreshObservable: Nullable<Observable<void>> = null;
        let pollingHandle: Nullable<number> = null;

        const applySettings = () => {
            const settings = settingsStore.readSetting(WatcherSettingDescriptor);

            if (pollingHandle !== null) {
                clearInterval(pollingHandle);
                pollingHandle = null;
            }

            if (settings.mode === "intercept") {
                if (refreshObservable) {
                    refreshObservable.clear();
                    refreshObservable = null;
                }
            } else {
                const pollingObservable = refreshObservable ?? (refreshObservable = new Observable<void>());

                if (settings.mode === "polling") {
                    pollingHandle = window.setInterval(() => {
                        pollingObservable.notifyObservers();
                    }, settings.interval);
                }
            }
        };

        const settingsStoreObserver = settingsStore.onChanged.add((key: string) => {
            if (key === WatcherSettingDescriptor.key) {
                applySettings();
            }
        });

        applySettings();

        const watcherService: IWatcherService & Partial<IDisposable> = {
            watchProperty<T extends object>(target: T, propertyKey: keyof T, onChanged: (value: unknown) => void): IDisposable {
                if (refreshObservable) {
                    let previousValue = target[propertyKey];
                    const observer = refreshObservable.add(() => {
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
            refresh: () => {
                refreshObservable?.notifyObservers();
            },
            dispose: () => {
                contextHandle.dispose();

                if (pollingHandle !== null) {
                    clearInterval(pollingHandle);
                    pollingHandle = null;
                }

                refreshObservable?.clear();
                refreshObservable = null;
                settingsStoreObserver.remove();
            },
        };

        // Register the WatcherContext provider so React components can access the watcher service.
        const contextHandle: ReactContextHandle<IWatcherService> = reactContextService.addContext(WatcherContext.Provider, watcherService);

        return watcherService;
    },
};

const WatchModes = [
    { label: "Interception", value: "intercept" },
    { label: "Polling", value: "polling" },
    { label: "Manual", value: "manual" },
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
                            description={`Specifies how Inspector watches entity properties for changes. "Interception" sees changes instantly, but for complex scenes can impact performance. "Polling" has less performance impact on complex scenes, but changes are only detected at the specified interval. "Manual" requires the "Refresh" button in the toolbar to be pressed.`}
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
                                unit="ms"
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

export const WatcherRefreshToolbarServiceDefinition: ServiceDefinition<[], [IWatcherService, ISettingsStore, IShellService]> = {
    friendlyName: "Watcher Refresh Toolbar Service",
    consumes: [WatcherServiceIdentity, SettingsStoreIdentity, ShellServiceIdentity],
    factory: (watcherService, settingsStore, shellService) => {
        let toolbarItemRegistration: Nullable<IDisposable> = null;

        const updateToolbar = () => {
            const settings = settingsStore.readSetting(WatcherSettingDescriptor);

            if (settings.mode === "manual") {
                if (!toolbarItemRegistration) {
                    toolbarItemRegistration = shellService.addToolbarItem({
                        key: "Watcher Refresh",
                        displayName: "Refresh Properties",
                        verticalLocation: "bottom",
                        horizontalLocation: "right",
                        order: DefaultToolbarItemOrder.RefreshProperties,
                        teachingMoment: {
                            title: "Refresh Properties",
                            description:
                                "Press this button to manually refresh all UI bound to scene state. This is only available when Property Watch Mode is set to Manual in the settings pane.",
                        },
                        component: () => {
                            return (
                                <Button
                                    appearance="subtle"
                                    icon={ArrowClockwiseRegular}
                                    title="Update all UI (e.g. Scene Explorer, Properties, etc.) bound to properties of entities (Meshes, Materials, etc.)"
                                    onClick={() => watcherService.refresh()}
                                />
                            );
                        },
                    });
                }
            } else {
                toolbarItemRegistration?.dispose();
                toolbarItemRegistration = null;
            }
        };

        updateToolbar();

        const settingsStoreObserver = settingsStore.onChanged.add((key: string) => {
            if (key === WatcherSettingDescriptor.key) {
                updateToolbar();
            }
        });

        return {
            dispose: () => {
                toolbarItemRegistration?.dispose();
                toolbarItemRegistration = null;
                settingsStoreObserver.remove();
            },
        };
    },
};
