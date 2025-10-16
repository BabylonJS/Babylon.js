import type { ISettingsContext } from "../services/settingsContext";

import { useCallback } from "react";
import { useLocalStorage } from "usehooks-ts";

import { useObservableState } from "./observableHooks";

const CompactModeStorageKey = "Babylon/Settings/IsCompactMode";

function useSetting<T>(storageKey: string, defaultValue: T): [T, (value: T) => void, () => void] {
    const [value, setValue, resetValue] = useLocalStorage<T>(storageKey, defaultValue);

    if (!localStorage.getItem(storageKey)) {
        localStorage.setItem(storageKey, JSON.stringify(value));
    }

    return [value, setValue, resetValue] as const;
}

/**
 * Gets the compact mode setting.
 * @returns A tuple containing the current compact mode value, a function to update it, and a function to reset it.
 */
export function useCompactMode() {
    return useSetting<boolean>(CompactModeStorageKey, !matchMedia("(pointer: coarse)").matches);
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
 * @param settings The settings context to use for determining if angles should be displayed in degrees or radians.
 * @returns A tuple containing the functions to convert to and from display values.
 */
export function useAngleConverters(settings: ISettingsContext) {
    const useDegrees = useObservableState(() => settings.useDegrees, settings.settingsChangedObservable);

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
