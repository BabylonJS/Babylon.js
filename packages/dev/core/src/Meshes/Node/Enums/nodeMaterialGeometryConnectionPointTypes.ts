/**
 * Defines the kind of connection point for node based material
 */
export enum NodeGeometryBlockConnectionPointTypes {
    /** Float */
    Geometry = 0x0001,
    /** Detect type based on connection */
    AutoDetect = 0x0400,
    /** Output type that will be defined by input type */
    BasedOnInput = 0x0800,
    /** Bitmask of all types */
    All = 0x0fff,
}
