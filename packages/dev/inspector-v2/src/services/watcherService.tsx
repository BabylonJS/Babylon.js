import { type IDisposable, type Nullable } from "core/index";
import { type DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";
import { type IService, type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type ISettingsService, SettingsServiceIdentity } from "shared-ui-components/modularTool/services/settingsService";
import { type ISettingsStore, type SettingDescriptor, SettingsStoreIdentity } from "shared-ui-components/modularTool/services/settingsStore";
import { type IShellService, ShellServiceIdentity } from "shared-ui-components/modularTool/services/shellService";
import { type IReactContextService, type ReactContextHandle, ReactContextServiceIdentity } from "shared-ui-components/modularTool/services/reactContextService";

import { ArrowClockwiseRegular } from "@fluentui/react-icons";

import { Observable } from "core/Misc/observable";
import { DropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { WatcherContext } from "../contexts/watcherContext";
import { useSetting } from "shared-ui-components/modularTool/hooks/settingsHooks";
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

type WatcherServiceOptions = {
    /**
     * The watcher settings used when no settings have been persisted.
     */
    defaultSettings?: WatcherSettings;

    /**
     * The watcher modes supported by this Inspector target.
     */
    supportedModes?: readonly WatcherSettings["mode"][];

    /**
     * The fallback interval for computed values when interception is the preferred mode.
     */
    computedValuePollingInterval?: number;
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
     * Watches a computed value and calls the callback whenever it changes. Computed values use fallback
     * polling when interception is preferred, the configured interval in polling mode, and explicit
     * refreshes in manual mode.
     * @param getValue A function that returns the current value.
     * @param onChanged A callback that is called with the new value when it changes.
     * @param equals An optional equality comparison. Defaults to {@link Object.is}.
     * @returns A disposable that stops watching when disposed.
     */
    watchValue<T>(getValue: () => T, onChanged: (value: T) => void, equals?: (left: T, right: T) => boolean): IDisposable;

    /**
     * Manually triggers a refresh of all watched properties.
     */
    refresh(): void;
}

const AllWatchModes = [
    { label: "Interception", value: "intercept" },
    { label: "Polling", value: "polling" },
    { label: "Manual", value: "manual" },
] as const satisfies DropdownOption<WatcherSettings["mode"]>[];

/**
 * Creates the watcher services for a specific Inspector target.
 * @param options Options that control the default and supported watcher modes.
 * @returns Service definitions for watching values, configuring the watcher, and manually refreshing it.
 */
export function MakeWatcherServiceDefinitions(options: WatcherServiceOptions = {}) {
    const supportedModes = options.supportedModes ?? AllWatchModes.map((option) => option.value);
    const defaultSettings = options.defaultSettings ?? WatcherSettingDescriptor.defaultValue;
    const computedValuePollingInterval = options.computedValuePollingInterval ?? 250;
    const settingDescriptor: SettingDescriptor<WatcherSettings> = {
        key: WatcherSettingDescriptor.key,
        defaultValue: defaultSettings,
    };
    const normalizeSettings = (settings: WatcherSettings) => (supportedModes.includes(settings.mode) ? settings : defaultSettings);

    const watcherServiceDefinition: ServiceDefinition<[IWatcherService], [ISettingsStore, IReactContextService]> = {
        friendlyName: "Watcher Service",
        produces: [WatcherServiceIdentity],
        consumes: [SettingsStoreIdentity, ReactContextServiceIdentity],
        factory: (settingsStore, reactContextService) => {
            const refreshObservable = new Observable<void>();
            const propertyWatchers = new Set<{ setMode: (mode: WatcherSettings["mode"]) => void; dispose: () => void }>();
            const computedValueWatchers = new Set<IDisposable>();
            let pollingHandle: Nullable<number> = null;
            let activePollingInterval: Nullable<number> = null;
            let isDisposed = false;
            let currentSettings = normalizeSettings(settingsStore.readSetting(settingDescriptor));

            const updatePolling = () => {
                let desiredPollingInterval: Nullable<number> = null;
                if (!isDisposed) {
                    if (currentSettings.mode === "polling") {
                        desiredPollingInterval = currentSettings.interval;
                    } else if (currentSettings.mode === "intercept" && computedValueWatchers.size > 0) {
                        desiredPollingInterval = computedValuePollingInterval;
                    }
                }

                if (desiredPollingInterval === activePollingInterval) {
                    return;
                }
                if (pollingHandle !== null) {
                    clearInterval(pollingHandle);
                    pollingHandle = null;
                }

                if (desiredPollingInterval !== null) {
                    pollingHandle = window.setInterval(() => {
                        refreshObservable.notifyObservers();
                    }, desiredPollingInterval);
                }
                activePollingInterval = desiredPollingInterval;
            };

            const applySettings = () => {
                currentSettings = normalizeSettings(settingsStore.readSetting(settingDescriptor));
                updatePolling();

                for (const watcher of propertyWatchers) {
                    watcher.setMode(currentSettings.mode);
                }
            };

            const settingsStoreObserver = settingsStore.onChanged.add((key: string) => {
                if (key === settingDescriptor.key) {
                    applySettings();
                }
            });

            applySettings();

            const watcherService: IWatcherService & Partial<IDisposable> = {
                watchProperty<T extends object>(target: T, propertyKey: keyof T, onChanged: (value: unknown) => void): IDisposable {
                    let previousValue: unknown = target[propertyKey];
                    let interceptToken: Nullable<IDisposable> = null;
                    let refreshObserver: Nullable<ReturnType<typeof refreshObservable.add>> = null;
                    let isIntercepting: Nullable<boolean> = null;
                    let isDisposed = false;

                    const notifyIfChanged = () => {
                        const currentValue = target[propertyKey];
                        if (!Object.is(previousValue, currentValue)) {
                            previousValue = currentValue;
                            onChanged(currentValue);
                        }
                    };

                    const propertyWatcher = {
                        setMode: (mode: WatcherSettings["mode"]) => {
                            const shouldIntercept = mode === "intercept";
                            if (shouldIntercept === isIntercepting) {
                                return;
                            }

                            interceptToken?.dispose();
                            interceptToken = null;
                            refreshObserver?.remove();
                            refreshObserver = null;

                            if (shouldIntercept) {
                                notifyIfChanged();
                                interceptToken = InterceptProperty(target, propertyKey, {
                                    afterSet: (value) => {
                                        previousValue = value;
                                        onChanged(value);
                                    },
                                });
                            } else {
                                refreshObserver = refreshObservable.add(notifyIfChanged);
                            }
                            isIntercepting = shouldIntercept;
                        },
                        dispose: () => {
                            if (!isDisposed) {
                                interceptToken?.dispose();
                                refreshObserver?.remove();
                                propertyWatchers.delete(propertyWatcher);
                                isDisposed = true;
                            }
                        },
                    };

                    propertyWatcher.setMode(currentSettings.mode);
                    propertyWatchers.add(propertyWatcher);

                    return propertyWatcher;
                },
                watchValue<T>(getValue: () => T, onChanged: (value: T) => void, equals: (left: T, right: T) => boolean = Object.is): IDisposable {
                    let previousValue = getValue();
                    const observer = refreshObservable.add(() => {
                        const currentValue = getValue();
                        if (!equals(previousValue, currentValue)) {
                            previousValue = currentValue;
                            onChanged(currentValue);
                        }
                    });
                    let isWatcherDisposed = false;
                    const computedValueWatcher = {
                        dispose: () => {
                            if (!isWatcherDisposed) {
                                observer.remove();
                                computedValueWatchers.delete(computedValueWatcher);
                                updatePolling();
                                isWatcherDisposed = true;
                            }
                        },
                    };
                    computedValueWatchers.add(computedValueWatcher);
                    updatePolling();

                    return computedValueWatcher;
                },
                refresh: () => {
                    refreshObservable.notifyObservers();
                },
                dispose: () => {
                    isDisposed = true;
                    contextHandle.dispose();

                    for (const watcher of [...propertyWatchers]) {
                        watcher.dispose();
                    }
                    for (const watcher of [...computedValueWatchers]) {
                        watcher.dispose();
                    }

                    if (pollingHandle !== null) {
                        clearInterval(pollingHandle);
                        pollingHandle = null;
                    }
                    activePollingInterval = null;

                    refreshObservable.clear();
                    settingsStoreObserver.remove();
                },
            };

            // Register the WatcherContext provider so React components can access the watcher service.
            const contextHandle: ReactContextHandle<IWatcherService> = reactContextService.addContext(WatcherContext.Provider, watcherService);

            return watcherService;
        },
    };

    const watchModes = AllWatchModes.filter((option) => supportedModes.includes(option.value));

    const watcherSettingsServiceDefinition: ServiceDefinition<[], [ISettingsService]> = {
        friendlyName: "Watcher Settings Service",
        consumes: [SettingsServiceIdentity],
        factory: (settingsService) => {
            const settingsRegistration = settingsService.addSectionContent({
                key: "watcherSettings",
                section: "UI",
                component: () => {
                    const [storedWatcherSettings, setWatcherSettings] = useSetting(settingDescriptor);
                    const watcherSettings = normalizeSettings(storedWatcherSettings);

                    return (
                        <>
                            <DropdownPropertyLine
                                label="Preferred Watch Mode"
                                description={`Specifies how Inspector prefers to watch values for changes. "Interception" sees interceptable property changes instantly and uses polling as a fallback for computed values. "Polling" has less performance impact on complex scenes, but changes are only detected at the specified interval. "Manual" requires the "Refresh" button in the toolbar to be pressed.`}
                                options={watchModes}
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

    const watcherRefreshToolbarServiceDefinition: ServiceDefinition<[], [IWatcherService, ISettingsStore, IShellService]> = {
        friendlyName: "Watcher Refresh Toolbar Service",
        consumes: [WatcherServiceIdentity, SettingsStoreIdentity, ShellServiceIdentity],
        factory: (watcherService, settingsStore, shellService) => {
            let toolbarItemRegistration: Nullable<IDisposable> = null;

            const updateToolbar = () => {
                const settings = normalizeSettings(settingsStore.readSetting(settingDescriptor));

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
                if (key === settingDescriptor.key) {
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

    return {
        watcherServiceDefinition,
        watcherSettingsServiceDefinition,
        watcherRefreshToolbarServiceDefinition,
    } as const;
}
