/**
 * The shape of the audio ramp used to set an audio parameter's value, such as a sound's volume.
 */
export const enum AudioParamRampShape {
    /**
     * The ramp is instantaneous.
     */
    None,
    /**
     * The ramp is linear.
     */
    Linear,
    /**
     * The ramp is exponential.
     */
    Exponential,
    /**
     * The ramp is logarithmic.
     */
    Logarithmic,
}

/**
 * Options for ramping an audio parameter's value over time.
 */
export interface IAudioParamRampOptions {
    /**
     * The duration of the ramp in seconds. Defaults to 1 second.
     * - Ignored if `endTime` is set.
     */
    duration: number;
    /**
     * The end time of the ramp in seconds. Defaults to the current time plus `duration`.
     */
    endTime: number;
    /**
     * The shape of the ramp used to smoothly transition the parameter's value. Defaults to `AudioParamRampShape.Logarithmic`.
     * - Ignored if `shapeCurve` is set.
     */
    shape: AudioParamRampShape;
    /**
     * An array of floating-point numbers representing the value curve the audio parameter will change through along the specified duration.
     */
    shapeCurve: Array<number>;
    /**
     * The start time of the ramp in seconds. Defaults to the current time.
     */
    startTime: number;
}
