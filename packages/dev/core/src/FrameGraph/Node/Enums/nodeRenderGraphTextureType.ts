/**
 * Defines the type of a texture
 */
export const enum NodeRenderGraphTextureType {
    /** No specific type */
    Untyped = 0,
    /** Geometry Buffer: Position */
    Position,
    /** Geometry Buffer: Normal */
    Normal,
    /** Geometry Buffer: Depth */
    Depth,
    /** Geometry Buffer: Velocity */
    Velocity,
    /** Geometry Buffer: Reflectivity */
    Reflectivity,
    /** Geometry Buffer: Irradiance */
    Irradiance,
    /** Geometry Buffer: sqrt(Albedo) */
    SqrtAlbedo,
}
