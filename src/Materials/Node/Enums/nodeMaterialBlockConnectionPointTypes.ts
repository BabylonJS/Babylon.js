/**
 * Defines the kind of connection point for node based material
 */
export enum NodeMaterialBlockConnectionPointTypes {
    /** Float */
    Float = 1,
    /** Int */
    Int = 2,
    /** Vector2 */
    Vector2 = 4,
    /** Vector3 */
    Vector3 = 8,
    /** Vector4 */
    Vector4 = 16,
    /** Color3 */
    Color3 = 32,
    /** Color4 */
    Color4 = 64,
    /** Matrix */
    Matrix = 128,
    /** Custom object */
    Object = 256,
    /** Detect type based on connection */
    AutoDetect = 1024,
    /** Output type that will be defined by input type */
    BasedOnInput = 2048
}