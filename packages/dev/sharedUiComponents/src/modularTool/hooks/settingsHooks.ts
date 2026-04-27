import { type Dispatch, type SetStateAction, useCallback, useEffect, useMemo } from "react";

import { type SettingDescriptor } from "../services/settingsStore";

import { Observable } from "core/Misc/observable";
import { useSettingsStore } from "../contexts/settingsContext";
import { useObservableState } from "./observableHooks";

/**
 * Hook that reads and writes a setting from the settings store.
 * @param descriptor The setting descriptor that identifies the setting and its default value.
 * @returns A tuple of [currentValue, setValue, resetValue] similar to React's useState.
 */
export function useSetting<T>(descriptor: SettingDescriptor<T>): [T, Dispatch<SetStateAction<T>>, () => void] {
    const settingsStore = useSettingsStore();

    // Only watch for this specific setting to change. Otherwise, any time any setting changes we would
    // call readSetting again, which if it is an object, it will be a new instance, which can cause
    // unnecessary re-renders in consumers of this hook.
    const settingObservable = useMemo(() => new Observable<void>(), []);
    useEffect(() => {
        if (settingsStore) {
            const observer = settingsStore.onChanged.add((key) => {
                if (key === descriptor.key) {
                    settingObservable.notifyObservers();
                }
            });

            return () => {
                observer.remove();
            };
        }

        return undefined;
    }, [settingsStore, descriptor.key]);

    const value = useObservableState(
        useCallback(() => settingsStore?.readSetting<T>(descriptor) ?? descriptor.defaultValue, [settingsStore, descriptor.key, descriptor.defaultValue]),
        settingObservable
    );

    const setValue = useCallback(
        (newValue: SetStateAction<T>): void => {
            const value = typeof newValue === "function" ? (newValue as (prev: T) => T)(settingsStore?.readSetting<T>(descriptor) ?? descriptor.defaultValue) : newValue;
            settingsStore?.writeSetting<T>(descriptor, value);
        },
        [settingsStore, descriptor.key, descriptor.defaultValue]
    );

    const resetValue = useCallback((): void => settingsStore?.writeSetting<T>(descriptor, descriptor.defaultValue), [settingsStore, descriptor.key, descriptor.defaultValue]);

    if (!settingsStore) {
        throw new Error("Settings store is not available in context.");
    }

    return [value, setValue, resetValue] as const;
}
