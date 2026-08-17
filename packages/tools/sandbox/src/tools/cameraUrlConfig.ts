import { Logger } from "core/Misc/logger";

export type CameraNumericUrlParameter = "cameraMinZ" | "cameraLowerRadiusLimit";

export function ParseCameraUrlValue(parameterName: CameraNumericUrlParameter, value: string | undefined): number | undefined {
    const parsedValue = value === undefined || value.trim() === "" ? Number.NaN : Number(value);
    const isValid = Number.isFinite(parsedValue) && (parameterName === "cameraMinZ" ? parsedValue > 0 : parsedValue >= 0);

    if (!isValid) {
        const expectedRange = parameterName === "cameraMinZ" ? "a positive finite number" : "a non-negative finite number";
        Logger.Warn(`Ignoring invalid ${parameterName} URL parameter value "${value ?? ""}"; expected ${expectedRange}.`);
        return undefined;
    }

    return parsedValue;
}
