/**
 * Defines the kind of connection point for frame graph node
 */
export enum NodeRenderGraphBlockConnectionPointTypes {
    /** General purpose texture */
    Texture = 0x00000001,
    /** Depth stencil attachment texture */
    TextureBackBuffer = 0x00000002,
    TextureBackBufferDepthStencilAttachment = 0x00000004,
    TextureDepthStencilAttachment = 0x00000008,
    TextureDepth = 0x00000010,
    TextureNormal = 0x00000020,
    TextureAlbedo = 0x00000040,
    TextureReflectivity = 0x00000080,
    TexturePosition = 0x00000100,
    TextureVelocity = 0x00000200,
    TextureIrradiance = 0x00000400,
    TextureAlbedoSqrt = 0x00000800,
    TextureAllButBackBuffer = 0x0000fff9,
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
