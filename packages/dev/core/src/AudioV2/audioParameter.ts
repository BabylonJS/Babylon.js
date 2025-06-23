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
