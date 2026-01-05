/**
 * Defines the kind of connection point for node geometry
 */
export enum NodeParticleBlockConnectionPointTypes {
    /** Int */
    Int = 0x0001,
    /** Float */
    Float = 0x0002,
    /** Vector2 */
    Vector2 = 0x0004,
    /** Vector3 */
    Vector3 = 0x0008,
    /** Matrix */
    Matrix = 0x0010,
    /** Particle */
    Particle = 0x0020,
    /** Texture */
    Texture = 0x0040,
    /** Color4 */
    Color4 = 0x0080,
    /** FloatGradient */
    FloatGradient = 0x0100,
    /** Vector2Gradient */
    Vector2Gradient = 0x0200,
    /** Vector3Gradient */
    Vector3Gradient = 0x0400,
    /** Color4Gradient */
    Color4Gradient = 0x0800,
    /** System */
    System = 0x1000,
    /** Detect type based on connection */
    AutoDetect = 0x2000,
    /** Output type that will be defined by input type */
    BasedOnInput = 0x4000,
    /** Undefined */
    Undefined = 0x8000,
    /** Bitmask of all types */
    All = 0xffff,
}
