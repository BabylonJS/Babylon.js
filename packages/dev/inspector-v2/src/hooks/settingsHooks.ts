import type { ISettingsContext } from "../services/settingsContext";

import { useCallback } from "react";

import { useObservableState } from "./observableHooks";

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
