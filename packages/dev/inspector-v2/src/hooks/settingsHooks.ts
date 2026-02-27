import type { Dispatch, SetStateAction } from "react";

import type { SettingDescriptor } from "../services/settingsStore";

import { useCallback, useEffect, useMemo } from "react";

import { Observable } from "core/Misc/observable";
import { useSettingsStore } from "../contexts/settingsContext";
import { UseDegreesSettingDescriptor } from "../services/globalSettings";
import { useObservableState } from "./observableHooks";

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

const RadiansToDegrees = 180 / Math.PI;

function WrapAngle(angle: number) {
    angle %= Math.PI * 2;
    if (angle < 0) {
        angle += Math.PI * 2;
    }
    return angle;
}

/**
 * Gets functions used to convert to/from display values for angles based on the current settings.
 * @returns A tuple containing the functions to convert to and from display values.
 */
export function useAngleConverters() {
    const [useDegrees] = useSetting(UseDegreesSettingDescriptor);

    const toDisplayValue = useCallback(
        (angle: number, wrap = false) => {
            if (wrap) {
                angle = WrapAngle(angle);
            }
            return useDegrees ? angle * RadiansToDegrees : angle;
        },
        [useDegrees]
    );

    const fromDisplayValue = useCallback(
        (angle: number, wrap = false) => {
            angle = useDegrees ? angle / RadiansToDegrees : angle;
            if (wrap) {
                angle = WrapAngle(angle);
            }
            return angle;
        },
        [useDegrees]
    );

    return [toDisplayValue, fromDisplayValue, useDegrees] as const;
}
