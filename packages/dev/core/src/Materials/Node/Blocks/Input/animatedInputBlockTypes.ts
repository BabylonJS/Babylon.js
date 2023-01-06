/**
 * Enum defining the type of animations supported by InputBlock
 */
export enum AnimatedInputBlockTypes {
    /** No animation */
    None,
    /** Time based animation (is incremented by 0.6 each second). Will only work for floats */
    Time,
    /** Time elapsed (in seconds) since the engine was initialized. Will only work for floats */
    RealTime,
}
