/**
 * The state of a sound.
 */
export const enum SoundState {
    /**
     * The sound is waiting for its instances to stop.
     */
    Stopping,
    /**
     * The sound is stopped.
     */
    Stopped,
    /**
     * The sound is waiting for its instances to start.
     */
    Starting,
    /**
     * The sound has started playing.
     */
    Started,
    /**
     * The sound failed to start, most likely due to the user not interacting with the page, yet.
     */
    FailedToStart,
    /**
     * The sound is paused.
     */
    Paused,
}
