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
    /** VertexID */
    VertexID = 0x000b,
    /** FaceID */
    FaceID = 0x000c,
    /** GeometryID */
    GeometryID = 0x000d,
    /** CollectionID */
    CollectionID = 0x000e,
    /** LoopID */
    LoopID = 0x000f,
    /** InstanceID */
    InstanceID = 0x0010,
    /** LatticeID */
    LatticeID = 0x0011,
    /** LatticeControl */
    LatticeControl = 0x0012,
}
