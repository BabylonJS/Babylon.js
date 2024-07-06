/**
 * Defines the kind of connection point for frame graph node
 */
export const enum FrameGraphBlockConnectionPointTypes {
    /** Texture */
    Texture = 0x0001,
    /** Camera */
    Camera = 0x0002,
    /** List of renderables (meshes, particle systems, sprites) */
    RenderableList = 0x0004,
    /** Detect type based on connection */
    AutoDetect = 0x0400,
    /** Output type that will be defined by input type */
    BasedOnInput = 0x0800,
    /** Undefined */
    Undefined = 0x10000,
    /** Bitmask of all types */
    All = 0x0fff,
}
