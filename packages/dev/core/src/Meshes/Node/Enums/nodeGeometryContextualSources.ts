/**
 * Defines the kind of contextual sources for node geometry
 */
export enum NodeGeometryContextualSources {
    /** None */
    None = 0x0000,
    /** Positions */
    Positions = 0x0001,
    /** Normals */
    Normals = 0x0002,
    /** Tangents */
    Tangents = 0x0003,
    /** UV */
    UV = 0x0004,
    /** UV2 */
    UV2 = 0x0005,
    /** UV3 */
    UV3 = 0x0006,
    /** UV4 */
    UV4 = 0x0007,
    /** UV5 */
    UV5 = 0x0008,
    /** UV6 */
    UV6 = 0x0009,
    /** Colors */
    Colors = 0x000a,
    /** Bitmask of all types */
    All = 0x0fff,
}
