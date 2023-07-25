/**
 * Defines the kind of contextual sources for node geometry
 */
export enum NodeGeometryContextualSources {
    /** None */
    None = 0x0000,    
    /** Positions */
    Positions = 0x0001,
    /** Normals */
    Normals= 0x0002,    
    /** Bitmask of all types */
    All = 0x0fff,
}
