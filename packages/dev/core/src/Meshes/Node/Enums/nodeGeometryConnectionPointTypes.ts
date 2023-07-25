/**
 * Defines the kind of connection point for node geometry
 */
export enum NodeGeometryBlockConnectionPointTypes {
    /** Float */
    Float = 0x0001,
    /** Vector2 */
    Vector2= 0x0002,    
    /** Vector3 */
    Vector3 = 0x0003,    
    /** Vector4 */
    Vector4 = 0x0004,    
    /** Geometry */
    Geometry = 0x0005,
    /** Detect type based on connection */
    AutoDetect = 0x0400,
    /** Output type that will be defined by input type */
    BasedOnInput = 0x0800,
    /** Undefined */
    Undefined = 0x1000,    
    /** Bitmask of all types */
    All = 0x0fff,
}
