/**
 * The shape of the audio ramp used to set an audio parameter's value, such as a sound's volume.
 */
export const enum AudioParameterCurveShape {
    /**
     * The ramp is linear.
     */
    LINEAR,
    /**
     * The ramp is exponential.
     */
    EXPONENTIAL,
    /**
     * The ramp is logarithmic.
     */
    LOGARITHMIC,
}
