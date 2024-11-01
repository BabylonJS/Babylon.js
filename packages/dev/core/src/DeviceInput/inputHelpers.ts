import { IsNavigatorAvailable } from "core/Misc/domManagement";

/**
 * Returns the maximum number of touch points supported by the device.
 * @returns the maximum number of touch points supported by the device
 */
export function getMaxTouchPoints(): number {
    // If maxTouchPoints is defined, use that value.  Otherwise, allow for a minimum for supported gestures like pinch
    return (IsNavigatorAvailable() && navigator.maxTouchPoints) || 2;
}
