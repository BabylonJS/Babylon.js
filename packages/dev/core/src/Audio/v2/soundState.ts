/**
 * The state of a sound.
 */
export enum SoundState {
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
     * The sound is paused.
     */
    Paused,
}
