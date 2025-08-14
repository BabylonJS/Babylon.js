/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Defines the kind of contextual sources for node particles
 */
export enum NodeParticleContextualSources {
    /** None */
    None = 0x0000,
    /** Position */
    Position = 0x0001,
    /** Direction */
    Direction = 0x0002,
    /** Age */
    Age = 0x0003,
    /** Lifetime */
    Lifetime = 0x0004,
    /** Color */
    Color = 0x0005,
    /** ScaledDirection */
    ScaledDirection = 0x0006,
    /** Scale */
    Scale = 0x0007,
    /** AgeGradient */
    AgeGradient = 0x0008,
    /** Angle */
    Angle = 0x0009,
    /** SpriteCellIndex */
    SpriteCellIndex = 0x0010,
    /** SpriteCellStart */
    SpriteCellStart = 0x0011,
    /** SpriteCellEnd */
    SpriteCellEnd = 0x0012,
    /** Initial Color */
    InitialColor = 0x0013,
}
