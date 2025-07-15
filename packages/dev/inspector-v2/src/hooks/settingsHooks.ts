import type { ISettingsContext } from "../services/settingsContext";

import { useCallback } from "react";

import { useObservableState } from "./observableHooks";

const RadiansToDegrees = 180 / Math.PI;

/**
 * Gets functions used to convert to/from display values for angles based on the current settings.
 * @param settings The settings context to use for determining if angles should be displayed in degrees or radians.
 * @returns A tuple containing the functions to convert to and from display values.
 */
export function useAngleConverters(settings: ISettingsContext) {
    const useDegrees = useObservableState(() => settings.useDegrees, settings.settingsChangedObservable);

    const toDisplayValue = useCallback(
        (angle: number) => {
            return useDegrees ? angle * RadiansToDegrees : angle;
        },
        [useDegrees]
    );

    const fromDisplayValue = useCallback(
        (angle: number) => {
            return useDegrees ? angle / RadiansToDegrees : angle;
        },
        [useDegrees]
    );

    return [toDisplayValue, fromDisplayValue, useDegrees] as const;
}
