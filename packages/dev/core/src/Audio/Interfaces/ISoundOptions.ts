
/**
 * Interface used to define options for Sound class
 */
export interface ISoundOptions {
    /**
     * Does the sound autoplay once loaded.
     */
    autoplay?: boolean;
    /**
     * Does the sound loop after it finishes playing once.
     */
    loop?: boolean;
    /**
     * Sound's volume
     */
    volume?: number;
    /**
     * Is it a spatial sound?
     */
    spatialSound?: boolean;
    /**
     * Maximum distance to hear that sound
     */
    maxDistance?: number;
    /**
     * Uses user defined attenuation function
     */
    useCustomAttenuation?: boolean;
    /**
     * Define the roll off factor of spatial sounds.
     * @see https://doc.babylonjs.com/how_to/playing_sounds_and_music#creating-a-spatial-3d-sound
     */
    rolloffFactor?: number;
    /**
     * Define the reference distance the sound should be heard perfectly.
     * @see https://doc.babylonjs.com/how_to/playing_sounds_and_music#creating-a-spatial-3d-sound
     */
    refDistance?: number;
    /**
     * Define the distance attenuation model the sound will follow.
     * @see https://doc.babylonjs.com/how_to/playing_sounds_and_music#creating-a-spatial-3d-sound
     */
    distanceModel?: string;
    /**
     * Defines the playback speed (1 by default)
     */
    playbackRate?: number;
    /**
     * Defines if the sound is from a streaming source
     */
    streaming?: boolean;
    /**
     * Defines an optional length (in seconds) inside the sound file
     */
    length?: number;
    /**
     * Defines an optional offset (in seconds) inside the sound file
     */
    offset?: number;
    /**
     * If true, URLs will not be required to state the audio file codec to use.
     */
    skipCodecCheck?: boolean;
}