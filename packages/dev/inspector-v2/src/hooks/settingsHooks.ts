// import type { HorizontalLocation, VerticalLocation } from "../services/shellService";
import type { SettingDescriptor, SettingValueType } from "../services/settingsStore";

import { useCallback } from "react";

import { useSettingsStore } from "../contexts/settingsContext";
import { UseDegreesSettingDescriptor } from "../services/panes/settingsService";
import { useObservableState } from "./observableHooks";

export function useSetting<T extends Readonly<SettingDescriptor>>(descriptor: T) {
    const settingsStore = useSettingsStore();
    const value = useObservableState(
        useCallback(() => settingsStore?.readSetting<T>(descriptor) ?? (descriptor.defaultValue as SettingValueType<T>), [settingsStore, descriptor]),
        settingsStore?.onChanged
    );
    const setValue = useCallback((newValue: SettingValueType<T>): void => settingsStore?.writeSetting<T>(descriptor, newValue), [settingsStore, descriptor]);
    const resetValue = useCallback((): void => settingsStore?.writeSetting<T>(descriptor, descriptor.defaultValue as SettingValueType<T>), [settingsStore, descriptor]);

    if (!settingsStore) {
        throw new Error("Settings store is not available in context.");
    }

    return [value, setValue, resetValue] as const;
}

// /**
//  * Gets the side pane dock overrides configuration.
//  * @returns A record mapping side pane IDs to their dock locations.
//  */
// export function useSidePaneDockOverrides() {
//     return useSetting<Record<string, Readonly<{ horizontalLocation: HorizontalLocation; verticalLocation: VerticalLocation }> | undefined>>(SidePaneDockOverridesStorageKey, {});
// }

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
