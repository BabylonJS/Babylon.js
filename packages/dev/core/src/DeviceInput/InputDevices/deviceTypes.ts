import type { DeviceType, PointerInput, DualShockInput, XboxInput, SwitchInput, DualSenseInput } from "./deviceEnums";

/**
 * Type to handle enforcement of inputs
 */
export type DeviceInput<T extends DeviceType> = T extends DeviceType.Keyboard | DeviceType.Generic
    ? number
    : T extends DeviceType.Mouse | DeviceType.Touch
    ? Exclude<PointerInput, PointerInput.Move | PointerInput.MouseWheelX | PointerInput.MouseWheelY | PointerInput.MouseWheelZ>
    : T extends DeviceType.DualShock
    ? DualShockInput
    : T extends DeviceType.Xbox
    ? XboxInput
    : T extends DeviceType.Switch
    ? SwitchInput
    : T extends DeviceType.DualSense
    ? DualSenseInput
    : never;
