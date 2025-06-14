/**
 * The shape of the audio ramp used to set an audio parameter's value, such as a sound's volume.
 */
export const enum AudioParameterCurveShape {
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
