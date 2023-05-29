/**
 * Defines the kind of connection point for node based material
 */
export enum NodeMaterialBlockConnectionPointTypes {
    /** Float */
    Float = 0x0001,
    /** Int */
    Int = 0x0002,
    /** Vector2 */
    Vector2 = 0x0004,
    /** Vector3 */
    Vector3 = 0x0008,
    /** Vector4 */
    Vector4 = 0x0010,
    /** Color3 */
    Color3 = 0x0020,
    /** Color4 */
    Color4 = 0x0040,
    /** Matrix */
    Matrix = 0x0080,
    /** Custom object */
    Object = 0x0100,
    /** Detect type based on connection */
    AutoDetect = 0x0400,
    /** Output type that will be defined by input type */
    BasedOnInput = 0x0800,
    /** Bitmask of all types */
    All = 0x0fff,
}
