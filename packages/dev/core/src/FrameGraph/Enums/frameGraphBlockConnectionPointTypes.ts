/**
 * Defines the kind of connection point for frame graph node
 */
export const enum FrameGraphBlockConnectionPointTypes {
    /** General purpose texture */
    Texture = 0x00000001,
    /** Depth stencil attachment texture */
    TextureDepthStencilAttachment = 0x00000002,
    TextureBackbuffer = 0x00000004,
    TextureDepth = 0x00000008,
    TextureNormal = 0x00000010,
    TextureAlbedo = 0x00000020,
    TextureReflectivity = 0x00000040,
    TexturePosition = 0x00000080,
    TextureVelocity = 0x00000100,
    TextureIrradiance = 0x00000200,
    TextureAlbedoSqrt = 0x00000400,
    TextureAll = 0x0000ffff,

    /** Camera */
    Camera = 0x00010000,
    /** List of renderables (meshes, particle systems, sprites) */
    RenderableList = 0x00020000,

    /** Detect type based on connection */
    AutoDetect = 0x01000000,
    /** Output type that will be defined by input type */
    BasedOnInput = 0x02000000,
    /** Undefined */
    Undefined = 0x04000000,
    /** Bitmask of all types */
    All = 0x0fffffff,
}
