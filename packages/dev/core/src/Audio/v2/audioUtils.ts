/**
 * Converts a pitch interval in cents to a playback rate.
 * @param cents - The pitch interval in cents.
 * @returns The playback rate.
 */
export function centsToPlaybackRate(cents: number): number {
    return Math.pow(2, cents / 1200);
}
