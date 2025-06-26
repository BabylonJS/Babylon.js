/**
 * The shape of the audio ramp used to set an audio parameter's value, such as a sound's volume.
 */
export const enum AudioParameterRampShape {
    /**
     * The ramp is linear.
     */
    Linear = "linear",
    /**
     * The ramp is exponential.
     */
    Exponential = "exponential",
    /**
     * The ramp is logarithmic.
     */
    Logarithmic = "logarithmic",
}

/**
 * Options for ramping an audio parameter's value.
 */
export interface IAudioParameterRampOptions {
    /**
     * The ramp time, in seconds. Must be greater than 0. Defaults to 0.01 seconds.
     * The audio parameter's value will reach the target value at the end of the duration.
     */
    duration: number;
    /**
     * The shape of the ramp to use for the parameter change. Defaults to {@link AudioParameterRampShape.Linear}.
     */
    shape: AudioParameterRampShape;
}
